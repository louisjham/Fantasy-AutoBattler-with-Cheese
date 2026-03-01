import { create } from 'zustand';
import { RunState, Perk, Spell, Unit, PlayerArchetype, MagicSchool, Weapon, Armor, InventoryItem, Consumable, RunStats } from './types';
import { ArchetypeId, SubclassId, SubclassDefinition } from './types/index';
import { generateFloor, getFloorStatMultiplier } from './systems/ProceduralGen';
import { SUMMONS } from './data/units';
import { WARLORD_PERKS, WARLORD_SPELLS, WARLORD_UNITS } from './data/warlord';
import { CONJURER_PERKS, CONJURER_SPELLS, CONJURER_UNITS } from './data/conjurer';
import { MYSTIC_PERKS, MYSTIC_SPELLS, MYSTIC_UNITS } from './data/mystic';

export interface RuneInstance {
  type: string;
  position: number;
  ticksActive: number;
}

export interface ActionLog {
  actionType: 'attack' | 'spell' | 'move' | 'wait';
  targetId?: string;
  spellId?: string;
  position?: number;
}

interface GameState extends RunState {
  selectedArchetype: ArchetypeId | null;
  selectedSubclass: SubclassId | null;
  activeSubclassDef: SubclassDefinition | null;

  zombieSlayerCount: number;
  zombieSpawnTimer: number;
  manaOverflowActive: boolean;
  arcane_surgeStacks: number;
  runeStacks: number;
  activeRunes: RuneInstance[];
  permanentSigilRune: string | null;
  transformActive: 'forest_god' | 'primal_bear' | null;
  transformTicksRemaining: number;
  foresightData: Map<string, ActionLog>;

  selectStartingPerks: (perkIds: string[]) => void;
  selectStartingSpells: (spellIds: string[]) => void;
  setDifficulty: (difficulty: 'easy' | 'normal' | 'hard') => void;
  setArchetype: (archetypeId: ArchetypeId, subclassId: SubclassId, element?: MagicSchool) => void;

  addPerk: (perk: Perk) => void;
  addSpell: (spell: Spell) => void;
  addSummon: (summon: Unit) => void;
  advanceFloor: () => void;
  updateUnit: (unit: Unit) => void;
  endRun: (won: boolean) => void;
  updateRunStats: (partial: Partial<RunStats>) => void;
  completeNode: (nodeId: string) => void;
  setCurrentNode: (nodeId: string) => void;
  initializeRun: () => void;
  equipWeapon: (unitId: string, weapon: Weapon) => void;
  equipArmor: (unitId: string, armor: Armor) => void;
  addToInventory: (item: InventoryItem) => void;
  removeFromInventory: (itemType: string, itemId: string) => void;
  addSummonToRoster: (summon: Unit) => void;
  removeSummonFromRoster: (summonId: string) => void;
  upgradeSummon: (summonId: string) => void;
  setFormation: (slots: Record<number, string | null>) => void;
}

const initialRunState: RunState = {
  archetype: null,
  difficulty: 'normal',
  floor: 1,
  heroes: [],
  summonRoster: [],
  spellbook: [],
  perkList: [],
  gold: 0,
  metaUnlocks: [],
  inventory: [],
  equippedWeapons: {},
  equippedArmor: {},
  currentNodeMap: [],
  currentNodeIndex: 0,
  runXp: 0,
  maxHeroSlots: 3,
  maxSummonSlots: 3,
  formation: {},
  runStats: {
    enemiesDefeated: 0, damageDealt: 0, spellsCast: 0,
    summonDeployments: {}, perkHistory: [],
    floorsCleared: 0, mostUsedSchool: null, favoriteSummon: null
  }
};

export const useGameStore = create<GameState>((set) => ({
  ...initialRunState,
  selectedArchetype: null,
  selectedSubclass: null,
  activeSubclassDef: null,
  zombieSlayerCount: 0,
  zombieSpawnTimer: 0,
  manaOverflowActive: false,
  arcane_surgeStacks: 0,
  runeStacks: 0,
  activeRunes: [],
  permanentSigilRune: null,
  transformActive: null,
  transformTicksRemaining: 0,
  foresightData: new Map(),

  setDifficulty: (difficulty) => set({ difficulty }),

  setArchetype: (archetypeId, subclassId, element) => {
    let perks: any[] = [];
    let spells: any[] = [];
    let units: any[] = [];

    if (archetypeId === 'warlord') {
      perks = WARLORD_PERKS.filter(p => p.subclass === subclassId || p.subclass === 'base');
      spells = WARLORD_SPELLS.filter(s => s.subclass === subclassId || s.subclass === 'base');
      units = WARLORD_UNITS.filter(u => u.id !== 'zombie_slayer'); // Spawned later
    } else if (archetypeId === 'conjurer') {
      perks = CONJURER_PERKS.filter(p => p.subclass === subclassId || p.subclass === 'base');
      spells = CONJURER_SPELLS.filter(s => s.subclass === subclassId || s.subclass === 'base');
      units = CONJURER_UNITS;
    } else if (archetypeId === 'mystic') {
      perks = MYSTIC_PERKS.filter(p => p.subclass === subclassId || p.subclass === 'base');
      spells = MYSTIC_SPELLS.filter(s => s.subclass === subclassId || s.subclass === 'base');
      units = MYSTIC_UNITS;
    }

    const startingSpellsList = spells.map(s => ({
      id: s.id,
      name: s.name,
      school: s.school,
      manaCost: s.manaCost,
      effect: s.effect,
      tags: [],
      description: s.description
    }));

    const startingPerkList = perks.slice(0, 2).map(p => ({
      id: p.id,
      name: p.name,
      school: p.school,
      effect: p.effect,
      description: p.description
    }));

    const companionsIds = ['giant_armored_lizard', 'greater_daemon', 'black_dragon', 'monstrous_flesh_golem', 'primal_elemental', 'three_headed_hydra', 'forge_spirit', 'astral_phoenix', 'voidwalker_shade', 'ancient_stone_sentinel'];
    const startingUnitsTpl = units.filter(u => !companionsIds.includes(u.id as string));
    const companionTpl = units.find(u => companionsIds.includes(u.id as string));

    const mapUnit = (tpl: any, i: number, isCompanion: boolean): Unit => {
      let sch = tpl.school;
      if (archetypeId === 'conjurer' && subclassId === 'elemental_master' && element) {
        if (tpl.id === 'elemental_adept' || tpl.id === 'primal_elemental') sch = element;
      }
      return {
        id: `${tpl.id}_${Date.now()}_${i}`,
        name: tpl.name,
        school: sch,
        tier: tpl.tier,
        stats: { ...tpl.stats },
        baseStats: { ...tpl.stats },
        passives: [...(tpl.passives || [])],
        position: 5 + i as any,
        isHero: false,
        isSummon: true,
        spriteColor: tpl.spriteColor,
        meshType: tpl.meshType,
        weapon: null,
        armor: null,
        level: 1,
        xp: 0,
        subclass: subclassId,
        manaCost: 0,
        ...(isCompanion ? { isCompanion: true } : {})
      } as unknown as Unit;
    };

    let summonRoster = startingUnitsTpl.map((u, i) => mapUnit(u, i, false));
    if (companionTpl) summonRoster.push(mapUnit(companionTpl, 99, true));

    let heroSchool = MagicSchool.Fire;
    if (archetypeId === 'conjurer') heroSchool = MagicSchool.Arcane;
    if (archetypeId === 'mystic') heroSchool = MagicSchool.Arcane;

    const hero: Unit = {
      id: `${archetypeId}_hero`, name: `The ${archetypeId.charAt(0).toUpperCase() + archetypeId.slice(1)}`,
      school: heroSchool, isHero: true, isSummon: false, tier: 1, level: 1, xp: 0,
      subclass: subclassId, weapon: null, armor: null, position: 5, meshType: 'octahedron',
      spriteColor: '#2244FF', stats: { hp: 100, maxHp: 100, attack: 20, defense: 10, speed: 1, mana: 50, maxMana: 100 },
      baseStats: { hp: 100, maxHp: 100, attack: 20, defense: 10, speed: 1, mana: 50, maxMana: 100 },
      passives: []
    };

    let pArchetype = PlayerArchetype.Warlord;
    if (archetypeId === 'conjurer') pArchetype = PlayerArchetype.Conjurer;
    if (archetypeId === 'mystic') pArchetype = PlayerArchetype.Mystic;

    set({
      selectedArchetype: archetypeId,
      selectedSubclass: subclassId,
      archetype: pArchetype,
      maxHeroSlots: 1,
      maxSummonSlots: 8,
      heroes: [hero],
      summonRoster,
      spellbook: startingSpellsList,
      perkList: startingPerkList,
      zombieSpawnTimer: 0,
      zombieSlayerCount: 0
    });

    // Call initializeRun to set up the map and other initial state
    useGameStore.getState().initializeRun();
  },

  selectStartingPerks: (perkIds) => set((state) => {
    let allPerks: any[] = [];
    if (state.selectedArchetype === 'warlord') allPerks = WARLORD_PERKS;
    else if (state.selectedArchetype === 'conjurer') allPerks = CONJURER_PERKS;
    else if (state.selectedArchetype === 'mystic') allPerks = MYSTIC_PERKS;

    const chosen = allPerks.filter(p => perkIds.includes(p.id)).map(p => ({
      id: p.id,
      name: p.name,
      school: p.school,
      effect: p.effect,
      description: p.description
    }));

    return { perkList: chosen };
  }),

  selectStartingSpells: (spellIds) => set((state) => {
    let allSpells: any[] = [];
    if (state.selectedArchetype === 'warlord') allSpells = WARLORD_SPELLS;
    else if (state.selectedArchetype === 'conjurer') allSpells = CONJURER_SPELLS;
    else if (state.selectedArchetype === 'mystic') allSpells = MYSTIC_SPELLS;

    const chosen = allSpells.filter(s => spellIds.includes(s.id)).map(s => ({
      id: s.id,
      name: s.name,
      school: s.school,
      manaCost: s.manaCost,
      effect: s.effect,
      tags: [],
      description: s.description
    }));

    return { spellbook: chosen };
  }),

  addPerk: (perk) => set((state) => ({
    perkList: [...state.perkList, perk]
  })),

  addSpell: (spell) => set((state) => ({
    spellbook: [...state.spellbook, spell]
  })),

  addSummon: (summon) => set((state) => ({
    summonRoster: [...state.summonRoster, summon]
  })),

  advanceFloor: () => set((state) => {
    const nextFloor = state.floor + 1;
    const map = generateFloor(nextFloor, Math.random, state.difficulty);

    const mult = getFloorStatMultiplier(nextFloor);
    const scaleUnit = (u: Unit): Unit => {
      const base = u.baseStats ?? u.stats;
      const scaled = {
        hp: Math.round(base.hp * mult),
        maxHp: Math.round(base.maxHp * mult),
        attack: Math.round(base.attack * mult),
        defense: Math.round(base.defense * mult),
        speed: base.speed,
        mana: base.mana,
        maxMana: base.maxMana,
      };
      return {
        ...u,
        baseStats: base,
        stats: {
          ...u.stats,
          ...scaled,
          hp: Math.min(u.stats.hp, scaled.maxHp)
        }
      };
    };

    return {
      floor: nextFloor,
      currentNodeMap: map,
      currentNodeIndex: 0,
      heroes: state.heroes.map(scaleUnit),
      summonRoster: state.summonRoster.map(scaleUnit)
    };
  }),

  updateUnit: (updatedUnit) => set((state) => {
    if (updatedUnit.isHero) {
      return {
        heroes: state.heroes.map(h => h.id === updatedUnit.id ? updatedUnit : h)
      };
    } else {
      return {
        summonRoster: state.summonRoster.map(s => s.id === updatedUnit.id ? updatedUnit : s)
      };
    }
  }),

  completeNode: (nodeId) => set((state) => {
    const nodeIndex = state.currentNodeMap.findIndex(n => n.id === nodeId);
    if (nodeIndex === -1) return state;

    const node = state.currentNodeMap[nodeIndex];
    const newMap = [...state.currentNodeMap];
    newMap[nodeIndex] = { ...node, completed: true };

    let newInventory = [...state.inventory];

    // Add rewards to inventory
    if (node.rewards) {
      node.rewards.forEach(reward => {
        // We need to determine the type of the reward
        let type: 'weapon' | 'armor' | 'consumable' | 'spell' | 'perk' = 'consumable';
        if ('attackBonus' in reward) type = 'weapon';
        else if ('defenseBonus' in reward) type = 'armor';
        else if ('manaCost' in reward) type = 'spell';
        else if ('school' in reward && !('manaCost' in reward) && !('attackBonus' in reward) && !('defenseBonus' in reward)) type = 'perk';

        if (type === 'weapon' || type === 'armor' || type === 'consumable') {
          const existing = newInventory.find(i => i.item.id === reward.id && i.type === type);
          if (existing) {
            newInventory = newInventory.map(i =>
              i.item.id === reward.id && i.type === type
                ? { ...i, quantity: i.quantity + 1 }
                : i
            );
          } else {
            newInventory.push({ type, item: reward as Weapon | Armor | Consumable, quantity: 1 });
          }
        }
      });
    }

    return {
      currentNodeMap: newMap,
      gold: state.gold + (node.goldReward || 0),
      inventory: newInventory
    };
  }),

  setCurrentNode: (nodeId) => set((state) => {
    const index = state.currentNodeMap.findIndex(n => n.id === nodeId);
    return { currentNodeIndex: index };
  }),

  initializeRun: () => set((state) => {
    const map = generateFloor(1, Math.random, state.difficulty);
    return {
      currentNodeMap: map,
      currentNodeIndex: 0,
      floor: 1,
      gold: 50
    };
  }),

  equipWeapon: (unitId, weapon) => set((state) => ({
    equippedWeapons: { ...state.equippedWeapons, [unitId]: weapon }
  })),

  equipArmor: (unitId, armor) => set((state) => ({
    equippedArmor: { ...state.equippedArmor, [unitId]: armor }
  })),

  addToInventory: (item) => set((state) => {
    const existing = state.inventory.find(i => i.item.id === item.item.id && i.type === item.type);
    if (existing) {
      return {
        inventory: state.inventory.map(i =>
          i.item.id === item.item.id && i.type === item.type
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        )
      };
    }
    return { inventory: [...state.inventory, item] };
  }),

  removeFromInventory: (itemType, itemId) => set((state) => {
    const existing = state.inventory.find(i => i.item.id === itemId && i.type === itemType);
    if (existing && existing.quantity > 1) {
      return {
        inventory: state.inventory.map(i =>
          i.item.id === itemId && i.type === itemType
            ? { ...i, quantity: i.quantity - 1 }
            : i
        )
      };
    }
    return {
      inventory: state.inventory.filter(i => !(i.item.id === itemId && i.type === itemType))
    };
  }),

  addSummonToRoster: (summon) => set((state) => ({
    summonRoster: [...state.summonRoster, summon]
  })),

  removeSummonFromRoster: (summonId) => set((state) => ({
    summonRoster: state.summonRoster.filter(s => s.id !== summonId)
  })),

  upgradeSummon: (summonId) => set((state) => {
    return {
      summonRoster: state.summonRoster.map(summon => {
        if (summon.id !== summonId || summon.tier >= 4) return summon;

        const newTier = (summon.tier + 1) as 1 | 2 | 3 | 4;
        const newStats = { ...summon.stats };
        let newPassives = [...summon.passives];

        if (newTier === 2) {
          Object.keys(newStats).forEach(key => {
            const k = key as keyof typeof newStats;
            if (k !== 'mana' && k !== 'maxMana') {
              newStats[k] = Math.floor(newStats[k] * 1.25);
            }
          });
          // Passive is already unlocked, but we can just say it's there.
        } else if (newTier === 3) {
          Object.keys(newStats).forEach(key => {
            const k = key as keyof typeof newStats;
            if (k !== 'mana' && k !== 'maxMana') {
              newStats[k] = Math.floor(newStats[k] * 1.25);
            }
          });
          newPassives = newPassives.map(p => ({ ...p, value: Math.floor(p.value * 1.5) }));
        } else if (newTier === 4) {
          Object.keys(newStats).forEach(key => {
            const k = key as keyof typeof newStats;
            if (k !== 'mana' && k !== 'maxMana') {
              newStats[k] = Math.floor(newStats[k] * 1.5);
            }
          });
        }

        return {
          ...summon,
          tier: newTier,
          stats: newStats,
          passives: newPassives
        };
      })
    };
  }),

  setFormation: (slots) => set({ formation: slots }),

  updateRunStats: (partial) => set((state) => ({
    runStats: { ...state.runStats, ...partial }
  })),

  endRun: (won) => set((state) => {
    // Basic meta XP calc logic (mock storage in production would handle actual saving)
    const xp = (state.runStats.floorsCleared * 50) + (state.runStats.enemiesDefeated * 5) + (state.runStats.perkHistory.length * 10) + (won ? 500 : 0);
    console.log(`Earned ${xp} Meta XP (Won: ${won})`);
    // NOTE: Keep metaUnlocks for the persistent state.
    return { ...initialRunState, metaUnlocks: state.metaUnlocks };
  })
}));
