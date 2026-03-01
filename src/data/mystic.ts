import { MagicSchool } from '../types/index';
import { PerkDefinition, SpellDefinition, UnitTemplate } from '../types/index';

// ==========================================
// MYSTIC PERKS
// ==========================================
export const MYSTIC_PERKS: PerkDefinition[] = [
    // ARCANIST (5)
    { id: 'mana_mastery', name: 'Mana Mastery', school: MagicSchool.Arcane, effect: 'overflow_mana_to_damage', description: 'End-of-tick: excess mana > maxMana -> dmg on lowest-HP enemy, 1:1 ratio, cap 40.', synergy: 'Mana overflow.', subclass: 'arcanist' },
    { id: 'arcane_surge', name: 'Arcane Surge', school: MagicSchool.Arcane, effect: 'spell_damage_scales_floor', description: '+8% all spell dmg per floor completed, stacks 5x, max +40%.', synergy: 'Lategame scaling.', subclass: 'arcanist' },
    { id: 'echo_cast', name: 'Echo Cast', school: MagicSchool.Arcane, effect: 'spell_repeat_on_crit', description: 'Spell crit -> echo at 50% dmg same target, no mana cost, 1/2 ticks.', synergy: 'Spell burst.', subclass: 'arcanist' },
    { id: 'arcane_aegis', name: 'Arcane Aegis', school: MagicSchool.Arcane, effect: 'mana_absorbs_damage', description: 'Incoming dmg: 2 mana saved = 1 HP saved. Drops <30 mana: shield off.', synergy: 'Mana defense.', subclass: 'arcanist' },
    { id: 'grand_rite', name: 'Grand Rite', school: MagicSchool.Arcane, effect: 'channel_mega_spell_free', description: 'Every 5 ticks: free Grand Rite charge = any known spell at 200% dmg/effect.', synergy: 'Mega cast.', subclass: 'arcanist' },

    // SEER (5)
    { id: 'foresight', name: 'Foresight', school: MagicSchool.Arcane, effect: 'preview_enemy_next_action', description: 'Passive: every enemy intended action shown 1 tick in advance in battle log.', synergy: 'Intel.', subclass: 'seer' },
    { id: 'wyrd_sight', name: 'Wyrd Sight', school: MagicSchool.Arcane, effect: 'reveal_room_enemy_comp', description: 'Reveal full enemy comp + strongest ability before entering any unexplored room.', synergy: 'Map intel.', subclass: 'seer' },
    { id: 'temporal_shift', name: 'Temporal Shift', school: MagicSchool.Arcane, effect: 'reroll_battle_start', description: 'Once per run: reroll entire battle start — positions, perks, formation.', synergy: 'Mulligan.', subclass: 'seer' },
    { id: 'fate_mark', name: 'Fate Mark', school: MagicSchool.Arcane, effect: 'mark_double_damage', description: '+50% allied dmg vs Marked target. Mark transfers on death.', synergy: 'Focus fire.', subclass: 'seer' },
    { id: 'veil_of_fate', name: 'Veil of Fate', school: MagicSchool.Arcane, effect: 'random_fate_boon', description: 'Battle start random boon: +25% spell dmg OR +2 all summon speed OR one enemy at 70% HP.', synergy: 'Random boon.', subclass: 'seer' },

    // RUNELORD (5)
    { id: 'rune_stacking', name: 'Rune Stacking', school: MagicSchool.Arcane, effect: 'stack_3_runes_megaburst', description: 'Each Rune spell = +1 stack. At 3: all runes trigger simultaneously.', synergy: 'Rune burst.', subclass: 'runelord' },
    { id: 'permanent_sigil', name: 'Permanent Sigil', school: MagicSchool.Arcane, effect: 'rune_persist_next_battle', description: 'One designated rune carries over to next battle = 1 free stack.', synergy: 'Pre-cast.', subclass: 'runelord' },
    { id: 'warding_runes', name: 'Warding Runes', school: MagicSchool.Arcane, effect: 'rune_passive_defense', description: 'Each active rune: +4 DEF aura. Max +12 DEF at 3 runes.', synergy: 'Rune defense.', subclass: 'runelord' },
    { id: 'runebind', name: 'Runebind', school: MagicSchool.Arcane, effect: 'rune_stun_on_contact', description: 'Enemy enters range 2.0 of active rune: stun 1 tick + 12 dmg, rune consumed.', synergy: 'Trap.', subclass: 'runelord' },
    { id: 'etched_destiny', name: 'Etched Destiny', school: MagicSchool.Arcane, effect: 'mega_trigger_bonus', description: 'On 3-rune mega-burst: allies +20 ATK 2 ticks, enemies -50% speed 1 tick.', synergy: 'Combo finisher.', subclass: 'runelord' }
];

// ==========================================
// MYSTIC SPELLS
// ==========================================
export const MYSTIC_SPELLS: SpellDefinition[] = [
    // BASE (4)
    { id: 'arcane_bolt', name: 'Arcane Bolt', school: MagicSchool.Arcane, manaCost: 12, effect: 'm_arcane_bolt', description: '28 dmg single target, fast cast, no secondary.', subclass: 'base' },
    { id: 'blink', name: 'Blink', school: MagicSchool.Arcane, manaCost: 10, effect: 'm_blink', description: 'Teleport Mystic to any ally position; next spell -5 mana cost.', subclass: 'base' },
    { id: 'arcane_shield', name: 'Arcane Shield', school: MagicSchool.Arcane, manaCost: 14, effect: 'm_arcane_shield', description: '30 HP absorption shield one ally for 3 ticks.', subclass: 'base' },
    { id: 'mind_spike', name: 'Mind Spike', school: MagicSchool.Arcane, manaCost: 15, effect: 'm_mind_spike', description: 'Drain 20 enemy mana + 20 dmg; no enemy mana = 30 dmg.', subclass: 'base' },

    // ARCANIST (5)
    { id: 'meteor_storm', name: 'Meteor Storm', school: MagicSchool.Arcane, manaCost: 35, effect: 'm_meteor_storm', description: '3 meteors over 3 ticks, 40 dmg AoE ea, stun 1 tick.', subclass: 'arcanist' },
    { id: 'temporal_stasis', name: 'Temporal Stasis', school: MagicSchool.Arcane, manaCost: 45, effect: 'm_temporal_stasis', description: 'Freeze ALL enemies 2 ticks; once per battle.', subclass: 'arcanist' },
    { id: 'cascade_bolt', name: 'Cascade Bolt', school: MagicSchool.Arcane, manaCost: 22, effect: 'm_cascade_bolt', description: 'Chain to 5 enemies, 20 dmg each (-10% per chain).', subclass: 'arcanist' },
    { id: 'singularity', name: 'Singularity', school: MagicSchool.Arcane, manaCost: 50, effect: 'm_singularity', description: 'Gravity pull all enemies range 6.0, 15 dmg/tick 2t, -50% DEF.', subclass: 'arcanist' },
    { id: 'mana_void', name: 'Mana Void', school: MagicSchool.Arcane, manaCost: 18, effect: 'm_mana_void', description: 'Drain 30 mana from ALL enemies; Arcanist gains +1 mana per drained.', subclass: 'arcanist' },

    // SEER (4)
    { id: 'prophecy', name: 'Prophecy', school: MagicSchool.Arcane, manaCost: 20, effect: 'm_prophecy', description: 'Reveal all enemy stats 3 ticks; allies +20% dmg vs revealed.', subclass: 'seer' },
    { id: 'hex_of_misfortune', name: 'Hex of Misfortune', school: MagicSchool.Arcane, manaCost: 18, effect: 'm_hex_misfortune', description: 'Target enemy: 40% chance action fails/tick 3 ticks.', subclass: 'seer' },
    { id: 'astral_vision', name: 'Astral Vision', school: MagicSchool.Arcane, manaCost: 15, effect: 'm_astral_vision', description: 'All allies gain Foresight 1 tick; each ally +10% dmg.', subclass: 'seer' },
    { id: 'fate_weave', name: 'Fate Weave', school: MagicSchool.Arcane, manaCost: 30, effect: 'm_fate_weave', description: 'Swap 2 enemy positions; both -30% dmg 1 tick (disoriented).', subclass: 'seer' },

    // RUNELORD (3)
    { id: 'rune_of_power', name: 'Rune of Power', school: MagicSchool.Arcane, manaCost: 16, effect: 'm_rune_of_power', description: 'Inscribe Power Rune; allies through it +12 ATK 2 ticks; +1 stack.', subclass: 'runelord' },
    { id: 'rune_of_warding', name: 'Rune of Warding', school: MagicSchool.Arcane, manaCost: 14, effect: 'm_rune_of_warding', description: 'Inscribe Ward Rune; +10 DEF aura range 2.0; stun+dmg on contact; +1 stack.', subclass: 'runelord' },
    { id: 'rune_of_ending', name: 'Rune of Ending', school: MagicSchool.Arcane, manaCost: 20, effect: 'm_rune_of_ending', description: 'Inscribe Death Rune; explodes on enemy contact 50 dmg AoE + burning; +1 stack.', subclass: 'runelord' }
];

// ==========================================
// MYSTIC UNITS
// ==========================================
export const MYSTIC_UNITS: UnitTemplate[] = [
    // ARCANIST BASE
    { id: 'arcane_scholar', name: 'Arcane Scholar', school: MagicSchool.Arcane, tier: 1, isHero: false, isSummon: true, meshType: 'torus', spriteColor: 'lightblue', passives: [], stats: { hp: 60, maxHp: 60, attack: 16, defense: 3, speed: 2, mana: 50, maxMana: 50 } },
    { id: 'mana_construct', name: 'Mana Construct', school: MagicSchool.Arcane, tier: 1, isHero: false, isSummon: true, meshType: 'box', spriteColor: 'cyan', stats: { hp: 110, maxHp: 110, attack: 12, defense: 8, speed: 1, mana: 0, maxMana: 0 }, passives: [{ trigger: 'on_tick', effect: 'mana_transfer', value: 0 }] },

    // ARCANIST COMPANION
    { id: 'astral_phoenix', name: 'Astral Phoenix', school: MagicSchool.Fire, tier: 3, isHero: false, isSummon: true, meshType: 'cone', scale: 1.5, spriteColor: 'yellow', stats: { hp: 180, maxHp: 180, attack: 24, defense: 12, speed: 3, mana: 0, maxMana: 0 }, passives: [{ trigger: 'on_death', effect: 'rebirth', value: 0 }, { trigger: 'on_tick', effect: 'mana_aura', value: 0 }] },

    // SEER BASE
    { id: 'phantom_spy', name: 'Phantom Spy', school: MagicSchool.Arcane, tier: 1, isHero: false, isSummon: true, meshType: 'cylinder', spriteColor: 'lightgray', stats: { hp: 70, maxHp: 70, attack: 15, defense: 4, speed: 3, mana: 0, maxMana: 0 }, passives: [{ trigger: 'on_damaged', effect: 'invisible_until_attack', value: 0 }, { trigger: 'on_hit', effect: 'foresight_debuff', value: 0 }] },
    { id: 'oracle_wraith', name: 'Oracle Wraith', school: MagicSchool.Death, tier: 1, isHero: false, isSummon: true, meshType: 'sphere', spriteColor: 'purple', stats: { hp: 65, maxHp: 65, attack: 12, defense: 3, speed: 2, mana: 0, maxMana: 0 }, passives: [{ trigger: 'on_tick', effect: 'enemy_reveal', value: 0 }] },
    { id: 'fate_wisp', name: 'Fate Wisp', school: MagicSchool.Arcane, tier: 1, isHero: false, isSummon: true, meshType: 'sphere', spriteColor: 'white', stats: { hp: 40, maxHp: 40, attack: 0, defense: 2, speed: 4, mana: 0, maxMana: 0 }, passives: [{ trigger: 'on_damaged', effect: 'sacrifice_absorb', value: 0 }] },

    // SEER COMPANION
    { id: 'voidwalker_shade', name: 'Voidwalker Shade', school: MagicSchool.Arcane, tier: 2, isHero: false, isSummon: true, meshType: 'cylinder', scale: 1.5, spriteColor: 'black', stats: { hp: 130, maxHp: 130, attack: 20, defense: 8, speed: 3, mana: 0, maxMana: 0 }, passives: [{ trigger: 'on_tick', effect: 'phase_shift', value: 0 }, { trigger: 'on_kill', effect: 'mana_steal', value: 0 }] },

    // RUNELORD BASE
    { id: 'runic_automaton', name: 'Runic Automaton', school: MagicSchool.Arcane, tier: 1, isHero: false, isSummon: true, meshType: 'box', spriteColor: 'gold', stats: { hp: 90, maxHp: 90, attack: 16, defense: 7, speed: 2, mana: 0, maxMana: 0 }, passives: [{ trigger: 'on_tick', effect: 'rune_synergy', value: 0 }] },
    { id: 'inscription_golem', name: 'Inscription Golem', school: MagicSchool.Arcane, tier: 2, isHero: false, isSummon: true, meshType: 'box', spriteColor: 'gold', stats: { hp: 130, maxHp: 130, attack: 14, defense: 14, speed: 1, mana: 0, maxMana: 0 }, passives: [{ trigger: 'on_damaged', effect: 'damage_immunity_first_30', value: 0 }] }, // active: deposit_ward_rune
    { id: 'runic_familiar', name: 'Runic Familiar', school: MagicSchool.Arcane, tier: 1, isHero: false, isSummon: true, meshType: 'torus', spriteColor: 'cyan', stats: { hp: 45, maxHp: 45, attack: 8, defense: 3, speed: 2, mana: 0, maxMana: 0 }, passives: [{ trigger: 'on_tick', effect: 'rune_generator', value: 0 }] },

    // RUNELORD COMPANION
    { id: 'ancient_stone_sentinel', name: 'Ancient Stone Sentinel', school: MagicSchool.Arcane, tier: 2, isHero: false, isSummon: true, meshType: 'box', scale: 1.5, spriteColor: 'gray', stats: { hp: 160, maxHp: 160, attack: 18, defense: 16, speed: 1, mana: 0, maxMana: 0 }, passives: [{ trigger: 'on_damaged', effect: 'status_immune', value: 0 }, { trigger: 'on_tick', effect: 'rune_armor', value: 0 }] } // active: stomp_aoe
];
