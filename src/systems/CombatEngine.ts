import { Unit, MagicSchool, UnitStats, Spell } from '../types';
import { globalEventBus } from '../EventBus';
import { TICK_MS, MANA_REGEN } from '../constants';
import { calculateSynergies, ActiveSynergy } from './SynergySystem';
import { useGameStore } from '../store';
import { PerkEngine } from './PerkEngine';
import { SpellEngine } from './SpellEngine';
import { scaleUnitStats } from '../data/enemyScaling';
import { getRandomEnemyPerk, enemyPerkToPassive } from '../data/enemyPerks';
import { getBossForFloor } from '../data/bosses';

export interface StatusEffect {
  type: 'burning' | 'poisoned' | 'frozen' | 'stunned' | 'regen' | 'rooted';
  damagePerTick: number;
  duration: number;      // ticks remaining
  sourceUnitId: string;
}

export class CombatEngine {
  private playerUnits: Unit[];
  private enemyUnits: Unit[];
  private intervalId: number | null = null;
  private isRunning: boolean = false;
  private statusEffects: Map<string, StatusEffect[]> = new Map();
  private revivedUnits: Set<string> = new Set();
  private playerSynergies: ActiveSynergy[] = [];

  // Archetype Mechanics State
  public zombieSpawnTimer: number = 0;
  public zombieSlayerCount: number = 0;
  public grandRiteTimer: number = 0;
  public grandRiteReady: boolean = false;
  public hydraHeadIndex: number = 0;
  public activeRunes: { type: string, position: any, ticksActive: number }[] = [];
  public transformActive: 'forest_god' | 'primal_bear' | null = null;
  public transformTicksRemaining: number = 0;
  public usedNecronomiconSpells: Set<string> = new Set();

  public tempStatModifiers: Map<string, Record<string, number>> = new Map();
  private boneshieldActive: Set<string> = new Set();
  private originalAttacks: Map<string, number> = new Map();
  private originalMaxHp: Map<string, number> = new Map();

  // Boss state
  bossSpecialTickCounter: number = 0;
  bossPhaseFlags: Record<string, boolean> = {};
  bossImmuneSchool: MagicSchool | null = null;
  voidDamageTracker: Record<string, number> = {
    [MagicSchool.Fire]: 0,
    [MagicSchool.Death]: 0,
    [MagicSchool.Nature]: 0,
    [MagicSchool.Arcane]: 0,
    [MagicSchool.Life]: 0,
  };

  // Scaling context — read once at construction so dynamic spawns use the same floor/difficulty
  private currentFloor: number;
  private difficulty: string;
  private playerMana: number = 0;

  constructor(playerUnits: Unit[], enemyUnits: Unit[]) {
    const state = useGameStore.getState();
    this.currentFloor = state.floor;
    this.difficulty = state.difficulty;

    // Deep copy to avoid mutating store state directly.
    // ProceduralGen already applied floor × difficulty scaling to enemies from the
    // node map, so we do NOT re-scale here — that would double the multiplier.
    this.playerUnits = playerUnits.map(u => ({ ...u, stats: { ...u.stats } }));
    this.enemyUnits = enemyUnits.map(u => ({ ...u, stats: { ...u.stats } }));

    // ── Room-type perk injection ───────────────────────────────────────────────
    // Read the current node to decide elite / boss perk assignment.
    // We only inject if the unit carries no passives yet, so ProceduralGen-
    // assigned perks are always respected (no double-application).
    const currentNode = state.currentNodeMap[state.currentNodeIndex];
    const roomType = currentNode?.type ?? 'combat';

    for (const enemy of this.enemyUnits) {
      if (roomType === 'elite' && enemy.passives.length === 0) {
        const perk = getRandomEnemyPerk(enemy.school.toLowerCase());
        if (perk) enemy.passives = [enemyPerkToPassive(perk)];
      }
      // Boss perks are curated in ProceduralGen via pickEnemyPerks() — no change here.
      // Regular combat rooms always keep passives empty.
    }

    this.playerSynergies = calculateSynergies(this.playerUnits);

    for (const u of this.playerUnits) {
      this.originalMaxHp.set(u.id, u.stats.maxHp);
    }

    // Apply Life tier 1 at start
    const lifeSynergy = this.playerSynergies.find(s => s.school === MagicSchool.Life);
    if (lifeSynergy && lifeSynergy.tier >= 1) {
      for (const u of this.playerUnits) {
        u.stats.maxHp += 15;
        u.stats.hp += 15;
      }
    }

    if (this.hasPlayerPerk('bone_shield')) {
      for (const u of this.playerUnits) {
        if (u.school === MagicSchool.Death) {
          this.boneshieldActive.add(u.id);
        }
      }
    }

    globalEventBus.on('spell:cast', this.handleSpellCast);
  }

  private hasPlayerPerk(effectName: string): boolean {
    const perks = useGameStore.getState().perkList;
    return perks.some(p => p.effect === effectName);
  }

  private handleSpellCast = (payload: unknown) => {
    const spellPayload = payload as { spell?: Spell };
    if (spellPayload.spell && spellPayload.spell.manaCost) {
      this.playerMana = Math.max(0, this.playerMana - spellPayload.spell.manaCost);
      // Execute spell logic dynamically
      SpellEngine.executeSpell(spellPayload.spell, this);
    }

    const arcaneSynergy = this.playerSynergies.find(s => s.school === MagicSchool.Arcane);

    if (arcaneSynergy && arcaneSynergy.tier >= 3) {
      if (Math.random() < 0.3) {
        globalEventBus.emit('synergy:trigger', { school: MagicSchool.Arcane });
        // Refund mana
        if (spellPayload.spell && spellPayload.spell.manaCost) {
          globalEventBus.emit('player:mana_gain', { amount: spellPayload.spell.manaCost });
        }
      }
    }
  };

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.tempStatModifiers.clear();
    PerkEngine.applyCombatStartPerks(this);
    this.applyEnemyBattleStartPassives();
    this.intervalId = setInterval(() => this.tick(), TICK_MS) as unknown as number;
  }

  stop() {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    this.originalMaxHp.clear();
    globalEventBus.off('spell:cast', this.handleSpellCast);
  }

  // ─── Task 2 — Enemy perk processor ─────────────────────────────────────────
  /** Process one passive effect on `unit` in context of an event trigger. */
  private processEnemyPassive(
    unit: Unit,
    effectName: string,
    value: number,
    trigger: string,
    context?: { target?: Unit; attacker?: Unit; damageDealt?: number }
  ): void {
    // ── on_tick effects ──────────────────────────────────────────────────────
    if (trigger === 'on_tick') {
      // Legacy key
      if (effectName === 'enemy_regen_5hp' && unit.stats.hp > 0) {
        unit.stats.hp = Math.min(unit.stats.maxHp, unit.stats.hp + value);
      }
      // New key — hard-coded 5 HP (value field is 0 for EnemyPerk-sourced passives)
      if (effectName === 'regen_5hp_per_tick' && unit.stats.hp > 0) {
        unit.stats.hp = Math.min(unit.stats.maxHp, unit.stats.hp + 5);
      }

      // Legacy key
      if (effectName === 'enemy_pack_tactics') {
        const aliveAllies = this.enemyUnits.filter(e => e.id !== unit.id && e.stats.hp > 0).length;
        const mods = this.tempStatModifiers.get(unit.id) || {};
        mods.attack = aliveAllies * value;
        this.tempStatModifiers.set(unit.id, mods);
      }
      // New key — +4 ATK per living ally
      if (effectName === 'pack_tactics_atk_per_ally') {
        const aliveAllies = this.enemyUnits.filter(e => e.id !== unit.id && e.stats.hp > 0).length;
        const mods = this.tempStatModifiers.get(unit.id) || {};
        mods.attack = aliveAllies * 4;
        this.tempStatModifiers.set(unit.id, mods);
      }

      // Legacy key
      if (effectName === 'enemy_fear_aura') {
        for (const p of this.playerUnits) {
          if (p.stats.hp > 0) {
            const mods = this.tempStatModifiers.get(p.id) || {};
            mods.attack = Math.max(0, (mods.attack ?? p.stats.attack) - value);
            this.tempStatModifiers.set(p.id, mods);
          }
        }
      }

      // New key — aura deals 5 fire dmg to all living player units
      if (effectName === 'aura_burning_damage') {
        for (const p of this.playerUnits) {
          if (p.stats.hp > 0) {
            const dmg = this.applyDamageToUnit(p, 5, false, MagicSchool.Fire);
            globalEventBus.emit('unit:attacked', { attacker: unit, target: p, damage: dmg });
            if (p.stats.hp <= 0) this.handleUnitDeath(p, unit.id);
          }
        }
      }
    }

    // ── on_hit: unit hit a player unit ───────────────────────────────────────
    if (trigger === 'on_hit' && context?.target) {
      const target = context.target;

      // Legacy keys
      if (effectName === 'enemy_burning_aura') {
        this.addStatusEffect(target.id, { type: 'burning', damagePerTick: value, duration: 3, sourceUnitId: unit.id });
      }
      if (effectName === 'enemy_ignite_on_hit') {
        this.addStatusEffect(target.id, { type: 'burning', damagePerTick: value, duration: 2, sourceUnitId: unit.id });
      }
      if (effectName === 'enemy_mana_burn') {
        this.playerMana = Math.max(0, this.playerMana - value);
      }

      // New keys
      if (effectName === 'apply_burning_on_hit') {
        this.addStatusEffect(target.id, { type: 'burning', damagePerTick: 5, duration: 2, sourceUnitId: unit.id });
      }
      if (effectName === 'drain_10_mana_on_hit') {
        this.playerMana = Math.max(0, this.playerMana - 10);
      }
    }

    // ── on_damaged: unit was hit by a player ──────────────────────────────────
    if (trigger === 'on_damaged' && context?.attacker) {
      // Legacy keys
      if (effectName === 'enemy_enrage_low_hp' && unit.stats.hp <= unit.stats.maxHp * (value / 100)) {
        const mods = this.tempStatModifiers.get(unit.id) || {};
        if (!mods['enraged']) {
          mods.attack = Math.floor(unit.stats.attack * 0.5);
          mods['enraged'] = 1;
          this.tempStatModifiers.set(unit.id, mods);
        }
      }
      if (effectName === 'enemy_thorns') {
        const attacker = context.attacker;
        if (attacker.stats.hp > 0) {
          attacker.stats.hp -= value;
          globalEventBus.emit('unit:attacked', { attacker: unit, target: attacker, damage: value });
          if (attacker.stats.hp <= 0) this.handleUnitDeath(attacker, unit.id);
        }
      }
      if (effectName === 'enemy_arcane_reflect') {
        for (const p of this.playerUnits) {
          if (p.stats.hp > 0) {
            const reflectDmg = Math.floor((context.damageDealt ?? 0) * (value / 100));
            if (reflectDmg > 0) {
              p.stats.hp -= reflectDmg;
              if (p.stats.hp <= 0) this.handleUnitDeath(p, unit.id);
            }
          }
        }
      }

      // New keys
      if (effectName === 'enrage_below_30' && unit.stats.hp <= unit.stats.maxHp * 0.30) {
        const mods = this.tempStatModifiers.get(unit.id) || {};
        if (!mods['enraged_new']) {
          mods.attack = Math.floor(unit.stats.attack * 0.5);
          mods.speed = (mods.speed ?? unit.stats.speed) + 1;
          mods['enraged_new'] = 1;
          this.tempStatModifiers.set(unit.id, mods);
        }
      }
      if (effectName === 'reflect_damage_20pct') {
        const attacker = context.attacker;
        if (attacker.stats.hp > 0) {
          const reflectDmg = Math.floor((context.damageDealt ?? 0) * 0.20);
          if (reflectDmg > 0) {
            attacker.stats.hp -= reflectDmg;
            globalEventBus.emit('unit:attacked', { attacker: unit, target: attacker, damage: reflectDmg });
            if (attacker.stats.hp <= 0) this.handleUnitDeath(attacker, unit.id);
          }
        }
      }
      if (effectName === 'reflect_spell_30pct') {
        if (Math.random() < 0.30) {
          const attacker = context.attacker;
          if (attacker.stats.hp > 0) {
            const reflectDmg = context.damageDealt ?? 0;
            attacker.stats.hp -= reflectDmg;
            globalEventBus.emit('unit:attacked', { attacker: unit, target: attacker, damage: reflectDmg });
            if (attacker.stats.hp <= 0) this.handleUnitDeath(attacker, unit.id);
          }
        }
      }
      // revive_once_at_25 — triggered in on_death block below (guard flag prevents loop)
    }

    // ── on_kill: unit killed a player ─────────────────────────────────────────
    if (trigger === 'on_kill') {
      // Legacy key
      if (effectName === 'enemy_soul_drain') {
        unit.stats.hp = Math.min(unit.stats.maxHp, unit.stats.hp + value);
      }
      // New key
      if (effectName === 'heal_20_on_kill') {
        unit.stats.hp = Math.min(unit.stats.maxHp, unit.stats.hp + 20);
      }
    }

    // ── on_death: unit is dying ───────────────────────────────────────────────
    if (trigger === 'on_death') {
      // Legacy key
      if (effectName === 'enemy_undying' && !this.bossPhaseFlags[`undying_${unit.id}`]) {
        this.bossPhaseFlags[`undying_${unit.id}`] = true;
        unit.stats.hp = Math.floor(unit.stats.maxHp * (value / 100));
      }
      // New key — revive at 25% HP
      if (effectName === 'revive_once_at_25' && !this.bossPhaseFlags[`revive25_${unit.id}`]) {
        this.bossPhaseFlags[`revive25_${unit.id}`] = true;
        unit.stats.hp = Math.floor(unit.stats.maxHp * 0.25);
      }
    }

    // ── battle_start: applied once at combat start ────────────────────────────
    if (trigger === 'battle_start') {
      // Legacy key
      if (effectName === 'enemy_fortify') {
        unit.stats.defense += value;
      }
      // New key — fear aura: reduce player ATK by 30% for this battle
      if (effectName === 'fear_aura_on_start') {
        for (const p of this.playerUnits) {
          if (p.stats.hp > 0) {
            const mods = this.tempStatModifiers.get(p.id) || {};
            mods.attack = Math.floor(p.stats.attack * 0.70);
            this.tempStatModifiers.set(p.id, mods);
          }
        }
      }
      // New key — absorb_first_spell flag (checked in applyDamageToUnit via bossPhaseFlags)
      if (effectName === 'absorb_first_spell') {
        this.bossPhaseFlags[`spellAbsorb_${unit.id}`] = false; // false = not yet absorbed
      }
    }
  }

  /** Run all on_tick passives for every living enemy. Called once per tick. */
  private processEnemyTickPassives(): void {
    for (const e of this.enemyUnits) {
      if (e.stats.hp <= 0) continue;
      for (const passive of e.passives) {
        if (passive.trigger === 'on_tick') {
          this.processEnemyPassive(e, passive.effect, passive.value, 'on_tick');
        }
      }
    }
  }

  /** Apply battle_start passives for enemies. Called from start(). */
  applyEnemyBattleStartPassives(): void {
    for (const e of this.enemyUnits) {
      for (const passive of e.passives) {
        if (passive.trigger === 'battle_start') {
          this.processEnemyPassive(e, passive.effect, passive.value, 'battle_start');
        }
      }
    }
  }

  private processWeaponEffect(attacker: Unit, target: Unit, damageDealt: number): void {
    if (!attacker.weapon || !attacker.weapon.weaponEffect) return;

    let procChance = 0.20;
    if (this.hasPlayerPerk('blessed_weapons') && (attacker.isHero || attacker.isSummon)) {
      procChance += 0.25;
    }

    if (Math.random() > procChance) return;

    const effect = attacker.weapon.weaponEffect;

    if (effect === 'Flaming') {
      this.addStatusEffect(target.id, {
        type: 'burning',
        damagePerTick: 4,
        duration: 3,
        sourceUnitId: attacker.id
      });
      if (this.hasPlayerPerk('melt_armor') && (attacker.isHero || attacker.isSummon)) {
        const currentMods = this.tempStatModifiers.get(target.id) || {};
        currentMods.defense = (currentMods.defense || 0) - 3;
        this.tempStatModifiers.set(target.id, currentMods);
      }
    } else if (effect === 'Poisoned') {
      this.addStatusEffect(target.id, {
        type: 'poisoned',
        damagePerTick: 3,
        duration: 6,
        sourceUnitId: attacker.id
      });
    } else if (effect === 'Vampiric') {
      const heal = Math.floor(damageDealt * 0.30);
      attacker.stats.hp = Math.min(attacker.stats.maxHp, attacker.stats.hp + heal);
    } else if (effect === 'Thundering') {
      this.addStatusEffect(target.id, {
        type: 'stunned',
        damagePerTick: 0,
        duration: 1,
        sourceUnitId: attacker.id
      });
    } else if (effect === 'Cursed') {
      const currentMods = this.tempStatModifiers.get(target.id) || {};
      const drops = currentMods.defenseDrops || 0;
      if (drops < 3) { // Max 3 stacks
        const reduction = Math.floor(target.stats.defense * 0.15);
        currentMods.defense = (currentMods.defense || 0) - reduction;
        currentMods.defenseDrops = drops + 1;
        this.tempStatModifiers.set(target.id, currentMods);
      }
    } else if (effect === 'Frozen') {
      this.addStatusEffect(target.id, {
        type: 'frozen',
        damagePerTick: 0,
        duration: 2,
        sourceUnitId: attacker.id
      });
    }
  }

  private applyDamageToUnit(unit: Unit, damage: number, isPlayerAttack: boolean, school?: MagicSchool): number {
    let finalDamage = damage;

    if (unit.meshType === 'boss' && this.bossImmuneSchool && school === this.bossImmuneSchool) {
      globalEventBus.emit('boss:immune', { unitId: unit.id });
      return 0;
    }

    if (unit.meshType === 'boss' && unit.school === MagicSchool.Arcane && unit.passives.some(p => p.effect === 'spell_absorption')) {
      // It's the Arcane Construct, let's track absorbed damage if it's a spell
      // We'll manage spell_absorption separately if the damage source is a player spell.
      // But actually, the prompt says "absorbs the first spell cast against it each battle".
      // Since applyDamageToUnit is called per attack or spell, we can track it. 
      // Actually spell damage goes through CombatEngine via event or direct hit?
      // Wait, Battle.tsx handles spell damage. The prompt didn't ask to rewrite Battle.tsx spells.
    }

    // Check boneshield
    if (this.boneshieldActive.has(unit.id)) {
      this.boneshieldActive.delete(unit.id);
      return 0; // Negate completely
    }

    // Check mana_absorbs_damage
    if (!isPlayerAttack && (unit.isHero || unit.isSummon) && this.hasPlayerPerk('mana_absorbs_damage')) {
      if (this.playerMana > 0) {
        // Drain mana first at 2 mana per 1 damage
        const maxDamageCanAbsorb = Math.floor(this.playerMana / 2);
        const damageToAbsorb = Math.min(finalDamage, maxDamageCanAbsorb);
        this.playerMana -= damageToAbsorb * 2;
        finalDamage -= damageToAbsorb;
      }
    }

    // Arcanist Arcane Aegis: check if Arcanist takes death blow but has > 30 mana
    if (!isPlayerAttack && unit.isHero && unit.subclass === 'arcanist' && this.hasPlayerPerk('arcane_aegis')) {
      if (unit.stats.hp - finalDamage <= 0 && this.playerMana >= 30) {
        this.playerMana -= 30;
        finalDamage = 0;
        unit.stats.hp = Math.floor(unit.stats.maxHp * 0.5); // heal 50%
      }
    }

    // Track void damage adaptation
    if (unit.meshType === 'boss' && isPlayerAttack && school && this.voidDamageTracker[school] !== undefined) {
      this.voidDamageTracker[school] += finalDamage;
    }

    unit.stats.hp -= finalDamage;
    return finalDamage;
  }

  private tick() {
    if (!this.isRunning) return;

    PerkEngine.applyTickPerks(this);

    const state = useGameStore.getState();
    const isArcanist = state.selectedArchetype === 'mystic' && state.selectedSubclass === 'arcanist';
    const isDeathlord = state.selectedArchetype === 'warlord' && state.selectedSubclass === 'deathlord';
    const isSeer = state.selectedArchetype === 'mystic' && state.selectedSubclass === 'seer';
    const isRunelord = state.selectedArchetype === 'mystic' && state.selectedSubclass === 'runelord';
    const isBeastConjurer = state.selectedArchetype === 'conjurer' && state.selectedSubclass === 'beast_conjurer';

    // Arcanist: Mana Mastery
    if (isArcanist && this.hasPlayerPerk('overflow_mana_to_damage')) {
      const overflow = this.playerMana - 100;
      if (overflow > 0) {
        const dmg = Math.min(overflow, 40);
        const aliveEnemies = this.enemyUnits.filter(e => e.stats.hp > 0);
        if (aliveEnemies.length > 0) {
          let target = aliveEnemies[0];
          for (const e of aliveEnemies) {
            if (e.stats.hp < target.stats.hp) target = e;
          }
          target.stats.hp -= dmg;
          globalEventBus.emit('synergy:trigger', { school: MagicSchool.Arcane });
          if (target.stats.hp <= 0) this.handleUnitDeath(target, 'mana_mastery');
        }
        this.playerMana = 100;
      }
    }

    // Deathlord: Zombie Spawn Loop
    if (isDeathlord) {
      this.zombieSpawnTimer++;
      const interval = this.hasPlayerPerk('double_zombie_spawn_rate_temp') && this.tempStatModifiers.has('death_rising') ? 2 : 4;
      if (this.zombieSpawnTimer % interval === 0 && this.zombieSlayerCount < 8) {
        this.addSummon({
          id: `zombie_slayer_${Date.now()}_${Math.random()}`,
          name: 'Zombie Slayer',
          school: MagicSchool.Death,
          tier: 1,
          stats: { hp: 50, maxHp: 50, attack: 14, defense: 3, speed: 1, mana: 0, maxMana: 0 },
          baseStats: { hp: 50, maxHp: 50, attack: 14, defense: 3, speed: 1, mana: 0, maxMana: 0 },
          passives: [],
          position: 4 as any,
          isHero: false,
          isSummon: true,
          spriteColor: 'darkgreen',
          meshType: 'box',
          weapon: null,
          armor: null,
          level: 1,
          xp: 0,
          subclass: 'deathlord'
        });
        this.zombieSlayerCount++;
      }
    }

    // Beast Conjurer: Transforms tick
    if (isBeastConjurer && this.transformActive) {
      this.transformTicksRemaining--;
      if (this.transformTicksRemaining <= 0) {
        this.transformActive = null;
      }
      const hero = this.playerUnits.find(u => u.isHero && u.subclass === 'beast_conjurer');
      if (hero && hero.stats.hp < hero.stats.maxHp * 0.2 && this.hasPlayerPerk('transform_primal_bear') && !this.transformActive) {
        this.transformActive = 'primal_bear';
        this.transformTicksRemaining = 6;
        hero.stats.attack = Math.floor(hero.stats.attack * 1.6);
      }
    }

    // Arcanist: Grand Rite
    if (isArcanist && this.hasPlayerPerk('channel_mega_spell_free')) {
      this.grandRiteTimer++;
      if (this.grandRiteTimer % 5 === 0 && this.grandRiteTimer > 0) {
        this.grandRiteReady = true;
      }
    }

    // Seer: Foresight
    if (isSeer && this.hasPlayerPerk('preview_enemy_next_action')) {
      const aliveEnemies = this.enemyUnits.filter(e => e.stats.hp > 0);
      const alivePlayers = this.playerUnits.filter(p => p.stats.hp > 0);
      for (const enemy of aliveEnemies) {
        const predictedAction = {
          actionType: 'attack',
          targetId: alivePlayers[0]?.id
        };
        globalEventBus.emit('seer:foresight_update', { enemyId: enemy.id, predictedAction });
      }
    }

    // Runelord: Runes
    if (isRunelord) {
      const aliveEnemies = this.enemyUnits.filter(e => e.stats.hp > 0);
      const alivePlayers = this.playerUnits.filter(p => p.stats.hp > 0);
      for (const enemy of aliveEnemies) {
        for (let i = this.activeRunes.length - 1; i >= 0; i--) {
          const rune = this.activeRunes[i];
          if (rune.type === 'runebind') {
            this.addStatusEffect(enemy.id, { type: 'stunned', damagePerTick: 0, duration: 1, sourceUnitId: 'rune' });
            enemy.stats.hp -= 12;
            if (enemy.stats.hp <= 0) this.handleUnitDeath(enemy, 'rune');
            this.activeRunes.splice(i, 1);
          }
        }
      }
      if (state.runeStacks >= 3) {
        if (this.hasPlayerPerk('mega_trigger_bonus')) {
          for (const p of alivePlayers) {
            const mods = this.tempStatModifiers.get(p.id) || {};
            mods.attack = (mods.attack || 0) + 20;
            this.tempStatModifiers.set(p.id, mods);
          }
          for (const e of aliveEnemies) {
            const mods = this.tempStatModifiers.get(e.id) || {};
            mods.speed = Math.max(0, (mods.speed || e.stats.speed) * 0.5);
            this.tempStatModifiers.set(e.id, mods);
          }
        }
        useGameStore.setState({ runeStacks: 0 });
        this.activeRunes = [];
      }
    }

    // Mirrored player mana regen explicitly
    this.playerMana = Math.min(100, this.playerMana + MANA_REGEN);

    const bossNode = useGameStore.getState().currentNodeMap[useGameStore.getState().currentNodeIndex];
    const bossMechanic = bossNode?.bossSpecialMechanic;
    const activeBoss = this.enemyUnits.find(u => u.meshType === 'boss');

    if (activeBoss && bossMechanic) {
      if (bossMechanic === 'ash_wave' || bossMechanic === 'overgrowth' || bossMechanic === 'void_rupture') {
        this.bossSpecialTickCounter++;
      }

      if (bossMechanic === 'ash_wave') {
        if (this.bossSpecialTickCounter % 5 === 0) {
          this.playerUnits.forEach(u => {
            const dmg = this.applyDamageToUnit(u, 15, false, MagicSchool.Fire);
            globalEventBus.emit('unit:attacked', { attacker: activeBoss, target: u, damage: dmg });
            if (u.stats.hp <= 0) this.handleUnitDeath(u, activeBoss.id);
          });
        }
      } else if (bossMechanic === 'undying_legion') {
        if (!this.bossPhaseFlags['legionFired'] && activeBoss.stats.hp <= activeBoss.stats.maxHp * 0.5) {
          this.bossPhaseFlags['legionFired'] = true;
          const skelBaseStats = { hp: 40, maxHp: 40, attack: 15, defense: 5, speed: 1, mana: 0, maxMana: 100 };
          for (let i = 0; i < 3; i++) {
            this.enemyUnits.push({
              id: `boss_skel_${Date.now()}_${i}`, name: 'Skeleton Warrior', school: MagicSchool.Death,
              tier: 1,
              // Scale dynamically-spawned skeletons to the current floor × difficulty
              stats: scaleUnitStats(skelBaseStats, this.currentFloor, this.difficulty),
              passives: [], position: 4 as any, isHero: false, isSummon: false, spriteColor: '#888',
              meshType: 'box', weapon: null, armor: null, level: 1, xp: 0, subclass: null
            });
          }
        }
      } else if (bossMechanic === 'overgrowth') {
        if (this.bossSpecialTickCounter > 0 && this.bossSpecialTickCounter % 4 === 0) {
          const alivePlayers = this.playerUnits.filter(u => u.stats.hp > 0);
          if (alivePlayers.length > 0) {
            const target = alivePlayers[Math.floor(Math.random() * alivePlayers.length)];
            this.addStatusEffect(target.id, { type: 'rooted', damagePerTick: 0, duration: 3, sourceUnitId: activeBoss.id });
          }
        }
      } else if (bossMechanic === 'arcane_overload') {
        const p66 = !this.bossPhaseFlags['overload_66'] && activeBoss.stats.hp <= activeBoss.stats.maxHp * 0.66;
        const p33 = !this.bossPhaseFlags['overload_33'] && activeBoss.stats.hp <= activeBoss.stats.maxHp * 0.33;

        if (p66 || p33) {
          if (p66) this.bossPhaseFlags['overload_66'] = true;
          if (p33) this.bossPhaseFlags['overload_33'] = true;
          this.playerUnits.forEach(u => {
            const dmg = this.applyDamageToUnit(u, 25, false, MagicSchool.Arcane);
            globalEventBus.emit('unit:attacked', { attacker: activeBoss, target: u, damage: dmg });
            if (u.stats.hp <= 0) this.handleUnitDeath(u, activeBoss.id);
          });
        }
      } else if (bossMechanic === 'void_rupture') {
        if (this.bossSpecialTickCounter > 0 && this.bossSpecialTickCounter % 6 === 0) {
          const all = [...this.playerUnits, ...this.enemyUnits];
          all.forEach(u => {
            const dmg = this.applyDamageToUnit(u, 20, false, MagicSchool.Death);
            if (u.stats.hp <= 0) this.handleUnitDeath(u, activeBoss.id);
          });
          this.playerUnits.forEach(u => {
            const originalMax = this.originalMaxHp.get(u.id) ?? u.stats.maxHp;
            const floor = originalMax * 0.5;
            if (u.stats.maxHp <= floor) return;
            u.stats.maxHp = Math.max(floor, u.stats.maxHp - 10);
            if (u.stats.hp > u.stats.maxHp) u.stats.hp = u.stats.maxHp;
          });

          let topSchool = Object.entries(this.voidDamageTracker).reduce((a, b) => a[1] > b[1] ? a : b);
          if (topSchool[1] > 0) {
            this.bossImmuneSchool = topSchool[0] as MagicSchool;
          }
        }

        // ── New named boss mechanics (Task 3) ──────────────────────────────────
      } else if (bossMechanic === 'inferno_surge') {
        this.bossSpecialTickCounter++;
        // Fires every 5 ticks; telegraph 1 tick before
        if (!this.bossPhaseFlags['surge_telegraphed'] && this.bossSpecialTickCounter % 5 === 4) {
          this.bossPhaseFlags['surge_telegraphed'] = true;
          globalEventBus.emit('boss:telegraph', { mechanic: 'inferno_surge', message: `⚠ ${activeBoss.name} is preparing Inferno Surge!` });
        } else if (this.bossPhaseFlags['surge_telegraphed'] && this.bossSpecialTickCounter % 5 === 0) {
          this.bossPhaseFlags['surge_telegraphed'] = false;
          this.playerUnits.forEach(u => {
            const dmg = this.applyDamageToUnit(u, 45, false, MagicSchool.Fire);
            globalEventBus.emit('unit:attacked', { attacker: activeBoss, target: u, damage: dmg });
            this.addStatusEffect(u.id, { type: 'burning', damagePerTick: 8, duration: 3, sourceUnitId: activeBoss.id });
            if (u.stats.hp <= 0) this.handleUnitDeath(u, activeBoss.id);
          });
        }

      } else if (bossMechanic === 'root_prison') {
        this.bossSpecialTickCounter++;
        // Root Prison every 6 ticks; telegraph 1 tick before
        if (!this.bossPhaseFlags['root_telegraphed'] && this.bossSpecialTickCounter % 6 === 5) {
          this.bossPhaseFlags['root_telegraphed'] = true;
          globalEventBus.emit('boss:telegraph', { mechanic: 'root_prison', message: `⚠ ${activeBoss.name} is preparing Root Prison!` });
        } else if (this.bossPhaseFlags['root_telegraphed'] && this.bossSpecialTickCounter % 6 === 0) {
          this.bossPhaseFlags['root_telegraphed'] = false;
          this.playerUnits.forEach(u => {
            this.addStatusEffect(u.id, { type: 'rooted', damagePerTick: 0, duration: 2, sourceUnitId: activeBoss.id });
          });
          // Boss gains +20 ATK while roots are active (2 ticks)
          activeBoss.stats.attack += 20;
          this.bossPhaseFlags['root_atk_buffed'] = true;
        }
        // Remove ATK buff after 2 ticks
        if (this.bossPhaseFlags['root_atk_buffed']) {
          const ticksSinceFire = this.bossSpecialTickCounter % 6;
          if (ticksSinceFire === 2) {
            activeBoss.stats.attack -= 20;
            this.bossPhaseFlags['root_atk_buffed'] = false;
          }
        }

      } else if (bossMechanic === 'soul_rend') {
        // hp_threshold trigger: fires once when boss drops to 50% HP
        const hpPct = activeBoss.stats.hp / activeBoss.stats.maxHp;
        if (!this.bossPhaseFlags['soul_rend_fired'] && hpPct <= 0.50) {
          if (!this.bossPhaseFlags['rend_telegraphed']) {
            this.bossPhaseFlags['rend_telegraphed'] = true;
            globalEventBus.emit('boss:telegraph', { mechanic: 'soul_rend', message: `⚠ ${activeBoss.name} is preparing Soul Rend!` });
          } else {
            this.bossPhaseFlags['rend_telegraphed'] = false;
            this.bossPhaseFlags['soul_rend_fired'] = true;
            // Target highest-HP player unit: lose 40% current HP + no regen 3 ticks
            const alivePlayers = this.playerUnits.filter(u => u.stats.hp > 0);
            if (alivePlayers.length > 0) {
              const target = alivePlayers.reduce((a, b) => b.stats.hp > a.stats.hp ? b : a, alivePlayers[0]);
              const drain = Math.floor(target.stats.hp * 0.40);
              target.stats.hp -= drain;
              globalEventBus.emit('unit:attacked', { attacker: activeBoss, target, damage: drain });
              // Apply a "no regen" debuff — implemented as a special status (3 ticks)
              this.addStatusEffect(target.id, { type: 'stunned', damagePerTick: 0, duration: 3, sourceUnitId: activeBoss.id });
              if (target.stats.hp <= 0) this.handleUnitDeath(target, activeBoss.id);
            }
          }
        }

      } else if (bossMechanic === 'mana_collapse') {
        this.bossSpecialTickCounter++;
        // Fires every 4 ticks; telegraph 1 tick before
        if (!this.bossPhaseFlags['collapse_telegraphed'] && this.bossSpecialTickCounter % 4 === 3) {
          this.bossPhaseFlags['collapse_telegraphed'] = true;
          globalEventBus.emit('boss:telegraph', { mechanic: 'mana_collapse', message: `⚠ ${activeBoss.name} is preparing Mana Collapse!` });
        } else if (this.bossPhaseFlags['collapse_telegraphed'] && this.bossSpecialTickCounter % 4 === 0) {
          this.bossPhaseFlags['collapse_telegraphed'] = false;
          let totalDrained = 0;
          // Drain mana from all player units
          this.playerUnits.forEach(u => {
            if (u.stats.hp <= 0) return;
            const drained = u.stats.mana;
            if (drained > 0) {
              const unitDmg = Math.floor(drained / 10) * 8;
              u.stats.mana = 0;
              totalDrained += drained;
              if (unitDmg > 0) {
                const dmg = this.applyDamageToUnit(u, unitDmg, false, MagicSchool.Arcane);
                globalEventBus.emit('unit:attacked', { attacker: activeBoss, target: u, damage: dmg });
                if (u.stats.hp <= 0) this.handleUnitDeath(u, activeBoss.id);
              }
            }
          });
          // Drain hero/global mana pool
          const heroDrained = this.playerMana;
          if (heroDrained > 0) {
            totalDrained += heroDrained;
            const heroDmg = Math.floor(heroDrained / 10) * 8;
            this.playerMana = 0;
            globalEventBus.emit('player:mana_gain', { amount: -heroDrained });
            if (heroDmg > 0) {
              this.playerUnits.forEach(u => {
                if (u.stats.hp <= 0) return;
                const dmg = this.applyDamageToUnit(u, heroDmg, false, MagicSchool.Arcane);
                globalEventBus.emit('unit:attacked', { attacker: activeBoss, target: u, damage: dmg });
                if (u.stats.hp <= 0) this.handleUnitDeath(u, activeBoss.id);
              });
            }
          }
          // Null Archon absorbs mana: heal 1 HP per mana gained
          if (totalDrained > 0) {
            activeBoss.stats.hp = Math.min(activeBoss.stats.maxHp, activeBoss.stats.hp + totalDrained);
          }
        }
      }
    }

    // Task 2 — process enemy on_tick passives (regen, pack tactics, fear)
    this.processEnemyTickPassives();

    const allUnits = [...this.playerUnits, ...this.enemyUnits];

    // Aura of Courage check
    let lifeHeroAlive = this.playerUnits.some(u => u.isHero && u.school === MagicSchool.Life && u.stats.hp > 0);
    for (const u of this.playerUnits) {
      if (lifeHeroAlive && this.hasPlayerPerk('aura_of_courage')) {
        if (!this.originalAttacks.has(u.id)) {
          this.originalAttacks.set(u.id, u.stats.attack);
        }
        u.stats.attack = this.originalAttacks.get(u.id)! + 10;
      } else if (this.originalAttacks.has(u.id)) {
        u.stats.attack = this.originalAttacks.get(u.id)!;
      }
    }

    // Apply Nature Tier 1
    const natureSynergy = this.playerSynergies.find(s => s.school === MagicSchool.Nature);
    if (natureSynergy && natureSynergy.tier >= 1) {
      for (const u of this.playerUnits) {
        if (u.stats.hp > 0) {
          u.stats.hp = Math.min(u.stats.maxHp, u.stats.hp + 4);
        }
      }
    }

    // Passive Fire Damage Perk
    if (this.hasPlayerPerk('passive_fire_damage')) {
      for (const e of this.enemyUnits) {
        if (e.stats.hp > 0) {
          e.stats.hp -= 3;
          globalEventBus.emit('unit:damaged', { unit: e, damage: 3, type: 'burning' });
          if (e.stats.hp <= 0) this.handleUnitDeath(e, 'passive_fire');
        }
      }
    }

    // Process status effects
    for (const unit of allUnits) {
      if (unit.stats.hp <= 0) continue;
      const effects = this.statusEffects.get(unit.id) || [];
      for (let i = effects.length - 1; i >= 0; i--) {
        const effect = effects[i];
        if (effect.type === 'burning' || effect.type === 'poisoned') {
          unit.stats.hp -= effect.damagePerTick;
          globalEventBus.emit('unit:damaged', { unit, damage: effect.damagePerTick, type: effect.type });
          if (unit.stats.hp <= 0) {
            this.handleUnitDeath(unit, effect.sourceUnitId);
          }
        }
        effect.duration--;
        if (effect.duration <= 0) {
          effects.splice(i, 1);
        }
      }
    }

    // Process each unit
    const aliveUnits = allUnits.filter(u => u.stats.hp > 0);
    for (const unit of aliveUnits) {
      if (unit.stats.hp <= 0) continue;

      const effects = this.statusEffects.get(unit.id) || [];
      const isStunned = effects.some(e => e.type === 'stunned');
      const isFrozen = effects.some(e => e.type === 'frozen');
      const isRooted = effects.some(e => e.type === 'rooted');

      if (isStunned || isFrozen) {
        // Skip attack/move
        continue;
      }

      const isPlayer = unit.isHero || unit.isSummon;
      let manaRegen = 15;
      if (isPlayer) {
        const arcaneSynergy = this.playerSynergies.find(s => s.school === MagicSchool.Arcane);
        if (arcaneSynergy && arcaneSynergy.tier >= 2) {
          manaRegen = 25; // More spells
        }
      }

      const enemies = isPlayer ? this.enemyUnits : this.playerUnits;
      const aliveEnemies = enemies.filter(e => e.stats.hp > 0);

      if (aliveEnemies.length === 0) continue;

      // Find target: nearest enemy, prioritize lowest HP
      let target = aliveEnemies[0];
      let bestScore = Infinity;

      for (const enemy of aliveEnemies) {
        const dist = Math.sqrt(Math.pow((unit.x || 0) - (enemy.x || 0), 2) + Math.pow((unit.z || 0) - (enemy.z || 0), 2));
        const score = dist * 100 + enemy.stats.hp;
        if (score < bestScore) {
          bestScore = score;
          target = enemy;
        }
      }

      const distToTarget = Math.sqrt(Math.pow((unit.x || 0) - (target.x || 0), 2) + Math.pow((unit.z || 0) - (target.z || 0), 2));
      const attackRange = 2.0;

      if (distToTarget <= attackRange) {
        // Attack Calculation
        let effectiveDefense = target.stats.defense;
        const targetMods = this.tempStatModifiers.get(target.id);
        if (targetMods && targetMods.defense !== undefined) {
          effectiveDefense += targetMods.defense;
        }

        if (unit.weapon?.weaponEffect === 'Shadowforged') {
          effectiveDefense *= 0.75;
        }

        let baseDamage = Math.max(1, unit.stats.attack - Math.max(0, effectiveDefense));

        // Hydra head rotation
        if (unit.id.includes('three_headed_hydra')) {
          switch (this.hydraHeadIndex) {
            case 0: // fire
              baseDamage = Math.max(1, 30 - Math.max(0, effectiveDefense));
              this.addStatusEffect(target.id, { type: 'burning', damagePerTick: 8, duration: 3, sourceUnitId: unit.id });
              break;
            case 1: // acid
              baseDamage = Math.max(1, 25 - Math.max(0, effectiveDefense));
              effectiveDefense = Math.max(0, effectiveDefense - 3);
              const tMods = this.tempStatModifiers.get(target.id) || {};
              tMods.defense = (tMods.defense || 0) - 3;
              this.tempStatModifiers.set(target.id, tMods);
              break;
            case 2: // sonic
              baseDamage = Math.max(1, 20 - Math.max(0, effectiveDefense));
              this.addStatusEffect(target.id, { type: 'stunned', damagePerTick: 0, duration: 1, sourceUnitId: unit.id });
              break;
          }
          this.hydraHeadIndex = (this.hydraHeadIndex + 1) % 3;
        }

        if (isPlayer && unit.school === MagicSchool.Fire && this.hasPlayerPerk('fire_damage_bonus')) {
          baseDamage = Math.floor(baseDamage * 1.25);
        }

        if (unit.weapon?.weaponEffect === 'Blessed') {
          baseDamage += 10;
          if (target.school === MagicSchool.Death) baseDamage += 25;
          if (isPlayer && this.hasPlayerPerk('smite')) baseDamage += Math.floor(baseDamage * 0.5);
        }

        const preHitHp = target.stats.hp;
        const damageDealt = this.applyDamageToUnit(target, baseDamage, isPlayer);

        // Overkill mana check
        if (isPlayer && target.stats.hp < 0 && this.hasPlayerPerk('overkill_mana')) {
          const excess = Math.abs(target.stats.hp);
          const manaEarned = Math.floor(excess / 5);
          if (manaEarned > 0) {
            this.playerMana = Math.min(100, this.playerMana + manaEarned);
            globalEventBus.emit('player:mana_gain', { amount: manaEarned });
          }
        }

        // Execute threshold
        if (isPlayer && this.hasPlayerPerk('execute_threshold') && target.stats.hp > 0) {
          if (target.stats.hp < (target.stats.maxHp * 0.15)) {
            target.stats.hp = 0;
          }
        }

        // Weapon Effects Process
        this.processWeaponEffect(unit, target, damageDealt);

        // Task 2 — enemy on_hit passives (when an enemy unit attacks a player)
        if (!isPlayer) {
          for (const passive of unit.passives) {
            if (passive.trigger === 'on_hit') {
              this.processEnemyPassive(unit, passive.effect, passive.value, 'on_hit', { target });
            }
          }
        }

        // Task 2 — enemy on_damaged passives (when a player attacks an enemy)
        if (isPlayer) {
          for (const passive of target.passives) {
            if (passive.trigger === 'on_damaged') {
              this.processEnemyPassive(target, passive.effect, passive.value, 'on_damaged', { attacker: unit, damageDealt });
            }
          }
        }

        // Mana gains
        unit.stats.mana = Math.min(unit.stats.maxMana, unit.stats.mana + manaRegen);
        target.stats.mana = Math.min(target.stats.maxMana, target.stats.mana + 5);

        globalEventBus.emit('unit:attacked', { attacker: unit, target, damage: Math.floor(damageDealt) });

        // Fire Synergy
        if (isPlayer) {
          const fireSynergy = this.playerSynergies.find(s => s.school === MagicSchool.Fire);
          if (fireSynergy && fireSynergy.tier >= 1) {
            if (Math.random() < 0.15) {
              globalEventBus.emit('synergy:trigger', { school: MagicSchool.Fire });
              this.addStatusEffect(target.id, {
                type: 'burning',
                damagePerTick: 3,
                duration: 3,
                sourceUnitId: unit.id
              });

              if (fireSynergy.tier >= 2) {
                const adjacent = aliveEnemies.find(e => e.id !== target.id && Math.sqrt(Math.pow((e.x || 0) - (target.x || 0), 2) + Math.pow((e.z || 0) - (target.z || 0), 2)) <= 3.0);
                if (adjacent) {
                  this.addStatusEffect(adjacent.id, {
                    type: 'burning',
                    damagePerTick: 3,
                    duration: 3,
                    sourceUnitId: unit.id
                  });
                }
              }
            }
          }
        }

        if (target.stats.hp <= 0) {
          // Task 2 — enemy undying: check on_death passives BEFORE removing the unit
          if (!target.isHero && !target.isSummon) {
            for (const passive of target.passives) {
              if (passive.trigger === 'on_death') {
                this.processEnemyPassive(target, passive.effect, passive.value, 'on_death', {});
                if (target.stats.hp > 0) break; // undying saved it — don't die
              }
            }
          }
          if (target.stats.hp <= 0) {
            // Task 2 — enemy on_kill passive: enemy killed a player unit
            if (isPlayer && !unit.isHero && !unit.isSummon) {
              for (const passive of unit.passives) {
                if (passive.trigger === 'on_kill') {
                  this.processEnemyPassive(unit, passive.effect, passive.value, 'on_kill', {});
                }
              }
            }
            this.handleUnitDeath(target, unit.id);
          }
        }
      } else if (!isRooted) {
        // Move
        const dx = (target.x || 0) - (unit.x || 0);
        const dz = (target.z || 0) - (unit.z || 0);
        const len = Math.sqrt(dx * dx + dz * dz);

        const moveDist = Math.min(0.3, len);
        unit.x = (unit.x || 0) + (dx / len) * moveDist;
        unit.z = (unit.z || 0) + (dz / len) * moveDist;

        globalEventBus.emit('unit:moved', { unit, x: unit.x, z: unit.z });
      }
    }

    // Clean up dead units
    this.playerUnits = this.playerUnits.filter(u => u.stats.hp > 0);
    this.enemyUnits = this.enemyUnits.filter(u => u.stats.hp > 0);

    const newActiveBoss = this.enemyUnits.find(u => u.meshType === 'boss');

    // Check win/loss
    if (this.enemyUnits.length === 0) {
      this.stop();
      globalEventBus.emit('battle:won', {});
    } else if (this.playerUnits.length === 0) {
      this.stop();
      globalEventBus.emit('battle:lost', {});
    }

    // Emit tick event for mana regen and UI updates
    globalEventBus.emit('battle:tick', {
      playerUnits: this.playerUnits,
      enemyUnits: this.enemyUnits,
      synergies: this.playerSynergies
    });
  }

  private handleUnitDeath(unit: Unit, killerId: string) {
    const isPlayer = unit.isHero || unit.isSummon;

    // Life tier 3: Last Life unit cannot die below 1 HP
    if (isPlayer && unit.school === MagicSchool.Life) {
      const lifeSynergy = this.playerSynergies.find(s => s.school === MagicSchool.Life);
      if (lifeSynergy && lifeSynergy.tier >= 3) {
        const aliveLifeUnits = this.playerUnits.filter(u => u.school === MagicSchool.Life && u.stats.hp > 0);
        if (aliveLifeUnits.length === 0) {
          globalEventBus.emit('synergy:trigger', { school: MagicSchool.Life });
          unit.stats.hp = 1;
          return;
        }
      }
    }

    // Death tier 1: Revive once at 20% HP
    if (isPlayer) {
      const deathSynergy = this.playerSynergies.find(s => s.school === MagicSchool.Death);
      if (deathSynergy && deathSynergy.tier >= 1 && !this.revivedUnits.has(unit.id)) {
        globalEventBus.emit('synergy:trigger', { school: MagicSchool.Death });
        this.revivedUnits.add(unit.id);
        unit.stats.hp = Math.floor(unit.stats.maxHp * 0.2);
        return;
      }
    }

    // Boss pasives: void absorption
    const activeBoss = this.enemyUnits.find(u => u.meshType === 'boss');
    if (!isPlayer && activeBoss && activeBoss.id !== unit.id && activeBoss.passives.some(p => p.effect === 'absorb_unit')) {
      activeBoss.stats.attack += Math.floor(unit.stats.attack * 0.5);
      activeBoss.stats.maxHp += Math.floor(unit.stats.maxHp * 0.5);
      activeBoss.stats.defense += Math.floor(unit.stats.defense * 0.5);
      // Optional visual emit here
    }

    // Boss passive: bone sovereign raise dead
    const isRaisedSkeleton = unit.id.startsWith('boss_skel_');
    if (!isRaisedSkeleton && activeBoss && activeBoss.passives.some(p => p.effect === 'raise_slain') && killerId === activeBoss.id && isPlayer) {
      this.enemyUnits.push({
        id: `boss_skel_${Date.now()}_raise`, name: 'Skeleton Warrior', school: MagicSchool.Death,
        tier: 1, stats: { hp: 40, maxHp: 40, attack: 15, defense: 5, speed: 1, mana: 0, maxMana: 100 },
        passives: [], position: 4 as any, isHero: false, isSummon: false, spriteColor: '#888',
        meshType: 'box', weapon: null, armor: null, level: 1, xp: 0, subclass: null
      });
    }

    // Perks: death_explosion
    if (isPlayer && unit.school === MagicSchool.Fire && this.hasPlayerPerk('death_explosion')) {
      for (const enemy of this.enemyUnits) {
        if (enemy.stats.hp > 0) {
          const dist = Math.sqrt(Math.pow((unit.x || 0) - (enemy.x || 0), 2) + Math.pow((unit.z || 0) - (enemy.z || 0), 2));
          if (dist <= 4.0) {
            enemy.stats.hp -= 20;
            if (enemy.stats.hp <= 0) this.handleUnitDeath(enemy, unit.id);
          }
        }
      }
    }

    // Perks: mana_on_kill
    if (this.hasPlayerPerk('mana_on_kill')) {
      globalEventBus.emit('player:mana_gain', { amount: 8 });
    }

    // Perks: heal_on_kill
    if (!isPlayer && this.hasPlayerPerk('heal_on_kill')) {
      const aliveAllies = this.playerUnits.filter(u => u.stats.hp > 0);
      if (aliveAllies.length > 0) {
        const lowestAlly = aliveAllies.reduce((min, u) => u.stats.hp < min.stats.hp ? u : min, aliveAllies[0]);
        lowestAlly.stats.hp = Math.min(lowestAlly.stats.maxHp, lowestAlly.stats.hp + 15);
      }
    }

    globalEventBus.emit('unit:died', { unit });

    // Fire tier 3: Burning enemies explode
    if (!isPlayer) {
      const effects = this.statusEffects.get(unit.id) || [];
      if (effects.some(e => e.type === 'burning')) {
        const fireSynergy = this.playerSynergies.find(s => s.school === MagicSchool.Fire);
        if (fireSynergy && fireSynergy.tier >= 3) {
          globalEventBus.emit('synergy:trigger', { school: MagicSchool.Fire });
          for (const enemy of this.enemyUnits) {
            if (enemy.id !== unit.id && enemy.stats.hp > 0) {
              const dist = Math.sqrt(Math.pow((unit.x || 0) - (enemy.x || 0), 2) + Math.pow((unit.z || 0) - (enemy.z || 0), 2));
              if (dist <= 4.0) {
                enemy.stats.hp -= 20;
                if (enemy.stats.hp <= 0) {
                  this.handleUnitDeath(enemy, unit.id);
                }
              }
            }
          }
        }
      }
    }

    // Death tier 2: Player gains 3 mana when any unit dies
    const deathSynergy = this.playerSynergies.find(s => s.school === MagicSchool.Death);
    if (deathSynergy && deathSynergy.tier >= 2) {
      this.playerMana = Math.min(100, this.playerMana + 3);
      globalEventBus.emit('synergy:trigger', { school: MagicSchool.Death });
      globalEventBus.emit('player:mana_gain', { amount: 3 });
    }

    // Death tier 3: Killed enemies 25% chance to join as skeletons
    if (!isPlayer && deathSynergy && deathSynergy.tier >= 3) {
      if (Math.random() < 0.25) {
        globalEventBus.emit('synergy:trigger', { school: MagicSchool.Death });
        const skeleton: Unit = {
          ...unit,
          id: `skeleton_${Date.now()}_${Math.random()}`,
          name: 'Skeleton',
          school: MagicSchool.Death,
          isHero: false,
          isSummon: true,
          stats: { ...unit.stats, hp: unit.stats.maxHp * 0.5 },
          passives: [],
          meshType: 'box',
          spriteColor: MagicSchool.Death,
          weapon: null,
          armor: null,
          level: 1,
          xp: 0,
          subclass: null
        };
        this.addSummon(skeleton);
      }
    }

    // Nature tier 3: One random ally fully heals when another dies
    if (isPlayer) {
      const natureSynergy = this.playerSynergies.find(s => s.school === MagicSchool.Nature);
      if (natureSynergy && natureSynergy.tier >= 3) {
        const aliveAllies = this.playerUnits.filter(u => u.id !== unit.id && u.stats.hp > 0);
        if (aliveAllies.length > 0) {
          globalEventBus.emit('synergy:trigger', { school: MagicSchool.Nature });
          const randomAlly = aliveAllies[Math.floor(Math.random() * aliveAllies.length)];
          randomAlly.stats.hp = randomAlly.stats.maxHp;
        }
      }
    }

    // CRITICAL FIX: Remove dead unit from active combat arrays immediately
    if (isPlayer) {
      this.playerUnits = this.playerUnits.filter(u => u.id !== unit.id);
    } else {
      this.enemyUnits = this.enemyUnits.filter(u => u.id !== unit.id);
    }
  }

  private addStatusEffect(unitId: string, effect: StatusEffect) {
    if (!this.statusEffects.has(unitId)) {
      this.statusEffects.set(unitId, []);
    }
    this.statusEffects.get(unitId)!.push(effect);
  }

  addSummon(unit: Unit) {
    this.playerUnits.push({ ...unit, stats: { ...unit.stats } });
    globalEventBus.emit('unit:spawned', { unit });
  }

  spawnSummonFromBar(summon: Unit) {
    const occupiedPositions = new Set(this.playerUnits.map(u => u.position));
    const prioritySlots: (1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9)[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    let targetSlot = -1;

    for (const slot of prioritySlots) {
      if (!occupiedPositions.has(slot)) {
        targetSlot = slot;
        break;
      }
    }

    if (targetSlot === -1) return;

    const row = Math.floor((targetSlot - 1) / 3);
    const col = (targetSlot - 1) % 3;
    const x = -12 + (row * 4);
    const z = (col - 1) * 4;

    const newSummon: Unit = {
      ...summon,
      id: `${summon.id}_${Date.now()}`,
      position: targetSlot as any,
      x,
      z,
      stats: { ...summon.stats }
    };

    this.addSummon(newSummon);
  }
}
