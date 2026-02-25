import { create } from 'zustand';
import { RunState, Perk, Spell, Unit, PlayerArchetype, MagicSchool, Weapon, Armor, InventoryItem, Consumable, RunStats } from './types';
import { generateFloor } from './systems/ProceduralGen';
import { SUMMONS } from './data/units';

interface GameState extends RunState {
  setArchetype: (archetype: PlayerArchetype) => void;
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

  setArchetype: (archetype) => {
    let maxHeroSlots = 3;
    let maxSummonSlots = 3;
    let startingSpell: Spell | null = null;
    let startingPerk: Perk | null = null;
    let heroes: Unit[] = [];
    let summonRoster: Unit[] = [];

    const getSummon = (id: string, suffix: string = '') => {
      const base = SUMMONS.find(s => s.id === id);
      if (!base) return null;
      return { ...base, id: `${id}_${Date.now()}${suffix}` };
    };

    if (archetype === PlayerArchetype.Conjurer) {
      maxHeroSlots = 3;
      maxSummonSlots = 6;
      startingSpell = {
        id: 'conjure_familiar',
        name: 'Conjure Familiar',
        school: MagicSchool.Arcane,
        manaCost: 2,
        effect: 'summon_arcane_imp',
        tags: ['summon'],
        description: 'Summon an Arcane imp.'
      };
      startingPerk = {
        id: 'blood_pact',
        name: 'Blood Pact',
        description: 'Gain 5 mana when a summon dies.',
        school: MagicSchool.Death,
        effect: 'mana_on_summon_death_5'
      };
      heroes = [{
        id: 'conjurer_hero', name: 'The Conjurer', school: MagicSchool.Arcane, isHero: true, isSummon: false,
        tier: 1, level: 1, xp: 0, subclass: null, weapon: null, armor: null, position: 5, meshType: 'octahedron', spriteColor: '#2244FF',
        stats: { hp: 80, maxHp: 80, attack: 12, defense: 6, speed: 1, mana: 30, maxMana: 100 }, passives: []
      }];
      summonRoster = [
        getSummon('skeleton_warrior', '_1'),
        getSummon('skeleton_warrior', '_2'),
        getSummon('ember_imp'),
        getSummon('thorn_sprite'),
        getSummon('mana_familiar')
      ].filter(Boolean) as Unit[];

    } else if (archetype === PlayerArchetype.Warlord) {
      maxHeroSlots = 6;
      maxSummonSlots = 3;
      startingSpell = {
        id: 'war_cry',
        name: 'War Cry',
        school: MagicSchool.Fire,
        manaCost: 3,
        effect: 'buff_attack_allies_30_3',
        tags: ['buff'],
        description: 'All allies +30% attack for 3 ticks.'
      };
      startingPerk = {
        id: 'bloodthirst',
        name: 'Bloodthirst',
        description: 'Heroes gain 5 HP on kill.',
        school: MagicSchool.Fire,
        effect: 'heal_on_kill_5'
      };
      heroes = [
        {
          id: 'warlord_hero_1', name: 'Iron Guard', school: MagicSchool.Fire, isHero: true, isSummon: false,
          tier: 1, level: 1, xp: 0, subclass: null, weapon: null, armor: null, position: 7, meshType: 'box', spriteColor: '#FF4422',
          stats: { hp: 120, maxHp: 120, attack: 18, defense: 10, speed: 1, mana: 0, maxMana: 100 }, passives: []
        },
        {
          id: 'warlord_hero_2', name: 'Battle Mage', school: MagicSchool.Arcane, isHero: true, isSummon: false,
          tier: 1, level: 1, xp: 0, subclass: null, weapon: null, armor: null, position: 8, meshType: 'octahedron', spriteColor: '#2244FF',
          stats: { hp: 85, maxHp: 85, attack: 15, defense: 6, speed: 2, mana: 40, maxMana: 100 }, passives: []
        },
        {
          id: 'warlord_hero_3', name: 'Scout', school: MagicSchool.Nature, isHero: true, isSummon: false,
          tier: 1, level: 1, xp: 0, subclass: null, weapon: null, armor: null, position: 9, meshType: 'cylinder', spriteColor: '#33AA44',
          stats: { hp: 70, maxHp: 70, attack: 16, defense: 5, speed: 3, mana: 0, maxMana: 100 }, passives: []
        }
      ];
      summonRoster = [
        getSummon('forest_wolf'),
        getSummon('shield_bearer'),
        getSummon('ember_imp')
      ].filter(Boolean) as Unit[];

    } else if (archetype === PlayerArchetype.Mystic) {
      maxHeroSlots = 4;
      maxSummonSlots = 5;
      startingSpell = {
        id: 'arcane_surge',
        name: 'Arcane Surge',
        school: MagicSchool.Arcane,
        manaCost: 0,
        effect: 'gain_mana_15',
        tags: ['mana'],
        description: 'Gain 15 mana instantly.'
      };
      startingPerk = {
        id: 'spell_echo',
        name: 'Spell Echo',
        description: '20% chance any spell fires twice.',
        school: MagicSchool.Arcane,
        effect: 'spell_echo_20'
      };
      heroes = [
        {
          id: 'mystic_hero_1', name: 'The Mystic', school: MagicSchool.Arcane, isHero: true, isSummon: false,
          tier: 1, level: 1, xp: 0, subclass: null, weapon: null, armor: null, position: 5, meshType: 'octahedron', spriteColor: '#2244FF',
          stats: { hp: 75, maxHp: 75, attack: 10, defense: 5, speed: 1, mana: 60, maxMana: 100 }, passives: []
        },
        {
          id: 'mystic_hero_2', name: 'Apprentice', school: MagicSchool.Life, isHero: true, isSummon: false,
          tier: 1, level: 1, xp: 0, subclass: null, weapon: null, armor: null, position: 6, meshType: 'cylinder', spriteColor: '#FFCC00',
          stats: { hp: 65, maxHp: 65, attack: 9, defense: 6, speed: 2, mana: 40, maxMana: 100 }, passives: []
        }
      ];
      summonRoster = [
        getSummon('mana_familiar'),
        getSummon('arcane_turret'),
        getSummon('acolyte'),
        getSummon('celestial_wisp'),
        getSummon('thorn_sprite')
      ].filter(Boolean) as Unit[];
    }

    set({
      archetype,
      maxHeroSlots,
      maxSummonSlots,
      heroes,
      summonRoster,
      spellbook: startingSpell ? [startingSpell] : [],
      perkList: startingPerk ? [startingPerk] : []
    });

    // Call initializeRun to set up the map and other initial state
    useGameStore.getState().initializeRun();
  },

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
    const map = generateFloor(nextFloor, Math.random);
    return {
      floor: nextFloor,
      currentNodeMap: map,
      currentNodeIndex: 0
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
    const map = generateFloor(1, Math.random);
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
