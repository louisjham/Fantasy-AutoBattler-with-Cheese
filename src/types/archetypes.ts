import { MagicSchool, Unit } from '../types';

export type ArchetypeId = 'warlord' | 'conjurer' | 'mystic';

export type SubclassId =
    | 'vanilla_warlord'
    | 'sorcerer_king'
    | 'ogre_magi'
    | 'deathlord'
    | 'elemental_master'
    | 'beast_conjurer'
    | 'battlemancer'
    | 'arcanist'
    | 'seer'
    | 'runelord';

export interface PerkDefinition {
    id: string;
    name: string;
    school: MagicSchool;
    effect: string; // snake_case effect key
    description: string;
    synergy: string;
    subclass: SubclassId | 'base';
}

export interface SpellDefinition {
    id: string;
    name: string;
    school: MagicSchool;
    manaCost: number;
    effect: string;
    description: string;
    subclass: SubclassId | 'base';
}

export type UnitTemplate = Omit<Unit, 'id' | 'position' | 'xp' | 'level' | 'weapon' | 'armor' | 'subclass'> & {
    id?: string;
    passives?: any[];
};

export interface SubclassDefinition {
    id: SubclassId;
    name: string;
    archetype: ArchetypeId;
    description: string;
    strengthSummary: string;
    weaknessSummary: string;
    startingPerks: PerkDefinition[]; // 2 chosen from pool
    perkPool: PerkDefinition[]; // all 5 available
    startingSpells: SpellDefinition[];
    spellPool: SpellDefinition[];
    startingUnits: UnitTemplate[];
    companion: UnitTemplate;
    perkCap: number;
    spellCap: number;
    recommendedFloors: [number, number];
}

export interface ArchetypeDefinition {
    id: ArchetypeId;
    name: string;
    subclasses: SubclassDefinition[];
    baseHP: number; // Warlord: 100, Conjurer: 90, Mystic varies
    baseUnits: UnitTemplate[];
}
