import { Unit, MagicSchool } from '../types';

export interface BossDefinition {
    unit: Unit;
    minions: Unit[];
    specialMechanic: string;
    mechanicDescription: string;
    introText: string;
    defeatText: string;
    maxHpReductionCap?: number;
}

export const BOSSES: Record<number, BossDefinition> = {
    1: {
        unit: {
            id: 'boss_ashen_warlord', name: 'The Ashen Warlord', school: MagicSchool.Fire,
            tier: 4, level: 5, xp: 0,
            stats: { hp: 160, maxHp: 160, attack: 14, defense: 8, speed: 1, mana: 0, maxMana: 100 },
            passives: [{ trigger: 'on_damaged', effect: 'enrage', value: 5 }],
            position: 5, isHero: false, isSummon: false, spriteColor: '#FF3300', meshType: 'boss',
            weapon: null, armor: null, subclass: null
        },
        minions: [
            {
                id: 'minion_fire_grunt_1', name: 'Fire Grunt', school: MagicSchool.Fire, tier: 1, level: 1, xp: 0,
                stats: { hp: 30, maxHp: 30, attack: 8, defense: 3, speed: 1, mana: 0, maxMana: 100 },
                passives: [], position: 4, isHero: false, isSummon: false, spriteColor: '#FF6600', meshType: 'box',
                weapon: null, armor: null, subclass: null
            },
            {
                id: 'minion_fire_grunt_2', name: 'Fire Grunt', school: MagicSchool.Fire, tier: 1, level: 1, xp: 0,
                stats: { hp: 30, maxHp: 30, attack: 8, defense: 3, speed: 1, mana: 0, maxMana: 100 },
                passives: [], position: 6, isHero: false, isSummon: false, spriteColor: '#FF6600', meshType: 'box',
                weapon: null, armor: null, subclass: null
            }
        ],
        specialMechanic: 'ash_wave',
        mechanicDescription: 'Every 5 ticks: Ash Wave hits all your units for 15 damage',
        introText: 'The Ashen Warlord has crushed a thousand armies. Your summons are just more kindling.',
        defeatText: "The Warlord's flames gutter out. The First Seal cracks. One realm breathes again."
    },
    2: {
        unit: {
            id: 'boss_bone_sovereign', name: 'The Bone Sovereign', school: MagicSchool.Death,
            tier: 4, level: 10, xp: 0,
            stats: { hp: 320, maxHp: 320, attack: 24, defense: 16, speed: 1, mana: 0, maxMana: 100 },
            passives: [{ trigger: 'on_kill', effect: 'raise_slain', value: 1 }],
            position: 5, isHero: false, isSummon: false, spriteColor: '#9900CC', meshType: 'boss',
            weapon: null, armor: null, subclass: null
        },
        minions: [
            {
                id: 'minion_death_archer_1', name: 'Death Archer', school: MagicSchool.Death, tier: 2, level: 5, xp: 0,
                stats: { hp: 45, maxHp: 45, attack: 18, defense: 4, speed: 2, mana: 0, maxMana: 100 },
                passives: [], position: 4, isHero: false, isSummon: false, spriteColor: '#7700AA', meshType: 'cylinder',
                weapon: null, armor: null, subclass: null
            },
            {
                id: 'minion_death_archer_2', name: 'Death Archer', school: MagicSchool.Death, tier: 2, level: 5, xp: 0,
                stats: { hp: 45, maxHp: 45, attack: 18, defense: 4, speed: 2, mana: 0, maxMana: 100 },
                passives: [], position: 6, isHero: false, isSummon: false, spriteColor: '#7700AA', meshType: 'cylinder',
                weapon: null, armor: null, subclass: null
            }
        ],
        specialMechanic: 'undying_legion',
        mechanicDescription: 'At 50% HP: summons 3 Skeleton Warriors. Killed units may rise again.',
        introText: 'The Bone Sovereign has ruled the marshes since the Breaking. Every soldier who fell here serves it still.',
        defeatText: "The Sovereign's crown shatters. The risen dead collapse. The Second Seal is yours."
    },
    3: {
        unit: {
            id: 'boss_ancient_grove', name: 'The Ancient Grove', school: MagicSchool.Nature,
            tier: 4, level: 15, xp: 0,
            stats: { hp: 380, maxHp: 380, attack: 20, defense: 20, speed: 1, mana: 0, maxMana: 100 },
            passives: [{ trigger: 'on_tick', effect: 'regen_hp', value: 15 }],
            position: 5, isHero: false, isSummon: false, spriteColor: '#22AA22', meshType: 'boss',
            weapon: null, armor: null, subclass: null
        },
        minions: [
            {
                id: 'minion_forest_guardian_1', name: 'Forest Guardian', school: MagicSchool.Nature, tier: 3, level: 10, xp: 0,
                stats: { hp: 90, maxHp: 90, attack: 15, defense: 15, speed: 1, mana: 0, maxMana: 100 },
                passives: [], position: 4, isHero: false, isSummon: false, spriteColor: '#33CC33', meshType: 'box',
                weapon: null, armor: null, subclass: null
            },
            {
                id: 'minion_forest_guardian_2', name: 'Forest Guardian', school: MagicSchool.Nature, tier: 3, level: 10, xp: 0,
                stats: { hp: 90, maxHp: 90, attack: 15, defense: 15, speed: 1, mana: 0, maxMana: 100 },
                passives: [], position: 6, isHero: false, isSummon: false, spriteColor: '#33CC33', meshType: 'box',
                weapon: null, armor: null, subclass: null
            }
        ],
        specialMechanic: 'overgrowth',
        mechanicDescription: 'Regenerates 15 HP per tick. Every 4 ticks: roots a random ally in place.',
        introText: 'The Ancient Grove was old before humanity existed. It does not hate you. It simply cannot allow you to pass.',
        defeatText: "The Grove's heartwood cracks. Ancient roots recede. The Third Seal pulses with restored light."
    },
    4: {
        unit: {
            id: 'boss_arcane_construct', name: 'The Arcane Construct Prime', school: MagicSchool.Arcane,
            tier: 4, level: 20, xp: 0,
            stats: { hp: 350, maxHp: 350, attack: 30, defense: 18, speed: 2, mana: 0, maxMana: 100 },
            passives: [{ trigger: 'on_cast', effect: 'spell_absorption', value: 1 }],
            position: 5, isHero: false, isSummon: false, spriteColor: '#3355FF', meshType: 'boss',
            weapon: null, armor: null, subclass: null
        },
        minions: [
            {
                id: 'minion_arcane_sentinel_1', name: 'Arcane Sentinel', school: MagicSchool.Arcane, tier: 3, level: 15, xp: 0,
                stats: { hp: 70, maxHp: 70, attack: 22, defense: 10, speed: 2, mana: 0, maxMana: 100 },
                passives: [], position: 4, isHero: false, isSummon: false, spriteColor: '#5577FF', meshType: 'octahedron',
                weapon: null, armor: null, subclass: null
            },
            {
                id: 'minion_arcane_sentinel_2', name: 'Arcane Sentinel', school: MagicSchool.Arcane, tier: 3, level: 15, xp: 0,
                stats: { hp: 70, maxHp: 70, attack: 22, defense: 10, speed: 2, mana: 0, maxMana: 100 },
                passives: [], position: 6, isHero: false, isSummon: false, spriteColor: '#5577FF', meshType: 'octahedron',
                weapon: null, armor: null, subclass: null
            }
        ],
        specialMechanic: 'arcane_overload',
        mechanicDescription: 'Absorbs first spell each battle as shields. Discharges at 66% and 33% HP for 25 AoE.',
        introText: 'The Construct Prime was built to guard the Crystal Spire forever. It has never failed. Until today.',
        defeatText: "The Construct's core goes dark. Its sentinels freeze mid-motion. The Fourth Seal is broken."
    },
    5: {
        unit: {
            // Despite being all schools synergy-wise, setting to Death base for colors/logic mostly. 
            // Multi-school logic implies specific overrides when evaluating synergy, but mechanically the prompt says "Death (counts as ALL)".
            id: 'boss_void_sovereign', name: 'The Void Sovereign', school: MagicSchool.Death,
            tier: 4, level: 30, xp: 0,
            stats: { hp: 400, maxHp: 400, attack: 40, defense: 22, speed: 2, mana: 0, maxMana: 100 },
            passives: [
                { trigger: 'on_damaged', effect: 'void_adaptation', value: 1 },
                { trigger: 'on_kill', effect: 'absorb_unit', value: 1 }
            ],
            position: 5, isHero: false, isSummon: false, spriteColor: '#111111', meshType: 'boss',
            weapon: null, armor: null, subclass: null
        },
        minions: [
            {
                id: 'minion_void_shard_1', name: 'Void Shard', school: MagicSchool.Death, tier: 4, level: 20, xp: 0,
                stats: { hp: 100, maxHp: 100, attack: 25, defense: 8, speed: 1, mana: 0, maxMana: 100 },
                passives: [{ trigger: 'on_death', effect: 'deal_damage', value: 20 }],
                position: 4, isHero: false, isSummon: false, spriteColor: '#444444', meshType: 'tetrahedron',
                weapon: null, armor: null, subclass: null
            },
            {
                id: 'minion_void_shard_2', name: 'Void Shard', school: MagicSchool.Death, tier: 4, level: 20, xp: 0,
                stats: { hp: 100, maxHp: 100, attack: 25, defense: 8, speed: 1, mana: 0, maxMana: 100 },
                passives: [{ trigger: 'on_death', effect: 'deal_damage', value: 20 }],
                position: 6, isHero: false, isSummon: false, spriteColor: '#444444', meshType: 'tetrahedron',
                weapon: null, armor: null, subclass: null
            }
        ],
        specialMechanic: 'void_rupture',
        mechanicDescription: 'Every 6 ticks: Void Rupture hits ALL units for 20 dmg and reduces your max HP by 10. Adapts immunity to most-used school. Absorbs killed units.',
        introText: 'The Void Sovereign does not speak. It simply reaches into your mind and shows you every version of this moment where you fail. There are many.',
        defeatText: 'The Sovereign fractures. Five seals reform as one. The Shattered Codex rewrites itself — complete.',
        maxHpReductionCap: 0.5
    }
};
