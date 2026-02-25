import { Unit, MagicSchool } from '../types';
import { globalEventBus } from '../EventBus';
import { TICK_MS } from '../constants';
import { calculateSynergies, ActiveSynergy } from './SynergySystem';

export interface StatusEffect {
  type: 'burning' | 'poisoned' | 'frozen' | 'stunned' | 'regen';
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

  constructor(playerUnits: Unit[], enemyUnits: Unit[]) {
    // Deep copy to avoid mutating store state directly
    this.playerUnits = playerUnits.map(u => ({ ...u, stats: { ...u.stats } }));
    this.enemyUnits = enemyUnits.map(u => ({ ...u, stats: { ...u.stats } }));
    this.playerSynergies = calculateSynergies(this.playerUnits);

    // Apply Life tier 1 at start
    const lifeSynergy = this.playerSynergies.find(s => s.school === MagicSchool.Life);
    if (lifeSynergy && lifeSynergy.tier >= 1) {
      for (const u of this.playerUnits) {
        u.stats.maxHp += 15;
        u.stats.hp += 15;
      }
    }

    globalEventBus.on('spell:cast', this.handleSpellCast);
  }

  private handleSpellCast = (payload: unknown) => {
    const spellPayload = payload as { spell?: { manaCost?: number } };
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
    this.intervalId = window.setInterval(() => this.tick(), TICK_MS);
  }

  stop() {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    globalEventBus.off('spell:cast', this.handleSpellCast);
  }

  private tick() {
    if (!this.isRunning) return;

    const allUnits = [...this.playerUnits, ...this.enemyUnits];
    
    // Apply Nature Tier 1
    const natureSynergy = this.playerSynergies.find(s => s.school === MagicSchool.Nature);
    if (natureSynergy && natureSynergy.tier >= 1) {
      for (const u of this.playerUnits) {
        if (u.stats.hp > 0) {
          u.stats.hp = Math.min(u.stats.maxHp, u.stats.hp + 4);
        }
      }
    }

    // Process status effects
    for (const unit of allUnits) {
      if (unit.stats.hp <= 0) continue;
      const effects = this.statusEffects.get(unit.id) || [];
      for (let i = effects.length - 1; i >= 0; i--) {
        const effect = effects[i];
        if (effect.type === 'burning') {
          unit.stats.hp -= effect.damagePerTick;
          globalEventBus.emit('unit:damaged', { unit, damage: effect.damagePerTick, type: 'burning' });
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
    for (const unit of allUnits) {
      if (unit.stats.hp <= 0) continue;

      const isPlayer = unit.isHero || unit.isSummon;
      let manaRegen = 8;
      if (isPlayer) {
        const arcaneSynergy = this.playerSynergies.find(s => s.school === MagicSchool.Arcane);
        if (arcaneSynergy && arcaneSynergy.tier >= 2) {
          manaRegen = 12; // 8 * 1.5
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
        // Score = distance * 100 + hp (prioritize distance, then HP)
        const score = dist * 100 + enemy.stats.hp;
        if (score < bestScore) {
          bestScore = score;
          target = enemy;
        }
      }

      const distToTarget = Math.sqrt(Math.pow((unit.x || 0) - (target.x || 0), 2) + Math.pow((unit.z || 0) - (target.z || 0), 2));
      const attackRange = 2.0;

      if (distToTarget <= attackRange) {
        // Attack
        const damage = Math.max(1, unit.stats.attack - target.stats.defense);
        target.stats.hp -= damage;
        
        // Mana gains
        unit.stats.mana = Math.min(unit.stats.maxMana, unit.stats.mana + manaRegen);
        target.stats.mana = Math.min(target.stats.maxMana, target.stats.mana + 5);

        globalEventBus.emit('unit:attacked', { attacker: unit, target, damage });

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
                // Spread to adjacent enemy
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
          this.handleUnitDeath(target, unit.id);
        }
      } else {
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
        if (aliveLifeUnits.length === 0) { // this unit is the last one (already hp <= 0)
          globalEventBus.emit('synergy:trigger', { school: MagicSchool.Life });
          unit.stats.hp = 1;
          return; // Prevent death
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
        return; // Prevent death
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
          // 20 AoE damage to enemies
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
    // Find empty positions
    const occupiedPositions = new Set(this.playerUnits.map(u => u.position));
    
    // Priority: Back row (1,2,3), then Mid row (4,5,6), then Front row (7,8,9)
    const prioritySlots = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    let targetSlot = -1;
    
    for (const slot of prioritySlots) {
      if (!occupiedPositions.has(slot)) {
        targetSlot = slot;
        break;
      }
    }

    if (targetSlot === -1) return; // Field full

    // Calculate coordinates
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
