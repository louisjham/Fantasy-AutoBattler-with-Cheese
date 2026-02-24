import { create } from 'zustand';
import { RunState, Perk, Spell, Unit, PlayerArchetype, MagicSchool } from './types';

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

    return {
      archetype,
      maxHeroSlots,
      maxSummonSlots,
      spellbook: startingSpell ? [startingSpell] : [],
      perkList: startingPerk ? [startingPerk] : [],
      gold: 50,
      floor: 1
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

  advanceFloor: () => set((state) => ({
    floor: state.floor + 1
  })),

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

  endRun: () => set({ ...initialRunState, maxHeroSlots: 3, maxSummonSlots: 3 })
}));
