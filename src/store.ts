import { create } from 'zustand';
import { RunState, Perk, Spell, Unit, PlayerArchetype, MagicSchool } from './types';
import { generateFloor } from './systems/ProceduralGen';

interface GameState extends RunState {
  maxHeroSlots: number;
  maxSummonSlots: number;
  setArchetype: (archetype: PlayerArchetype) => void;
  addPerk: (perk: Perk) => void;
  addSpell: (spell: Spell) => void;
  addSummon: (summon: Unit) => void;
  advanceFloor: () => void;
  updateUnit: (unit: Unit) => void;
  endRun: () => void;
  completeNode: (nodeId: string) => void;
  setCurrentNode: (nodeId: string) => void;
  initializeRun: () => void;
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
  runXp: 0
};

export const useGameStore = create<GameState>((set) => ({
  ...initialRunState,
  maxHeroSlots: 3,
  maxSummonSlots: 3,

  setArchetype: (archetype) => set((state) => {
    let maxHeroSlots = 3;
    let maxSummonSlots = 3;
    let startingSpell: Spell | null = null;
    let startingPerk: Perk | null = null;

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
    }

    const map = generateFloor(1, Math.random);

    return {
      archetype,
      maxHeroSlots,
      maxSummonSlots,
      spellbook: startingSpell ? [startingSpell] : [],
      perkList: startingPerk ? [startingPerk] : [],
      gold: 50,
      floor: 1,
      currentNodeMap: map,
      currentNodeIndex: 0
    };
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
    
    return {
      currentNodeMap: newMap,
      gold: state.gold + (node.goldReward || 0)
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

  endRun: () => set({ ...initialRunState, maxHeroSlots: 3, maxSummonSlots: 3 })
}));
