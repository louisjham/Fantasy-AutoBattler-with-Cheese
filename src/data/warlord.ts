import { MagicSchool } from '../types/index';
import { PerkDefinition, SpellDefinition, UnitTemplate, ArchetypeDefinition } from '../types/index';

// ==========================================
// WARLORD PERKS
// ==========================================
export const WARLORD_PERKS: PerkDefinition[] = [
    // VANILLA (5)
    { id: 'well_equipped', name: 'Well Equipped', school: MagicSchool.Fire, effect: 'start_with_weapon_armor', description: 'Start the run with a weapon and armor.', synergy: 'General equipment synergy.', subclass: 'vanilla_warlord' },
    { id: 'psychic_whip', name: 'Psychic Whip', school: MagicSchool.Arcane, effect: 'fanatic_attack_buff_health_cost', description: 'Fanatics gain +30% ATK for 2 ticks, hero takes 10 dmg.', synergy: 'Fanatic aggression.', subclass: 'vanilla_warlord' },
    { id: 'poisonous', name: 'Poisonous', school: MagicSchool.Nature, effect: 'lizard_poison_attacks_spit', description: 'Lizard attacks apply poison and unlock AoE spit.', synergy: 'Companion augmentation.', subclass: 'vanilla_warlord' },
    { id: 'hire_shadow_clerics', name: 'Hire Shadow Clerics', school: MagicSchool.Death, effect: 'spawn_shadow_clerics_over_time', description: 'Spawn a Shadow Cleric every 3 ticks (max 3).', synergy: 'Sustained healing.', subclass: 'vanilla_warlord' },
    { id: 'titan_form', name: 'Titan Form', school: MagicSchool.Life, effect: 'transform_titan_lord_once', description: 'Once per battle, transform into Titan Lord. No summons/spells.', synergy: 'Solo hero power.', subclass: 'vanilla_warlord' },

    // SORCERER KING (5)
    { id: 'demon_forged', name: 'Demon Forged', school: MagicSchool.Fire, effect: 'start_demon_forged_weapon', description: 'Equip Tier 2 weapon at run start.', synergy: 'Hero scaling.', subclass: 'sorcerer_king' },
    { id: 'blood_rite', name: 'Blood Rite', school: MagicSchool.Death, effect: 'sacrifice_minions_create_mind_flayer', description: 'Consume 3 Demonic Minions to spawn a Mind Flayer.', synergy: 'Sacrifice.', subclass: 'sorcerer_king' },
    { id: 'daemonic_gate', name: 'Daemonic Gate', school: MagicSchool.Death, effect: 'teleport_hero_allies', description: 'Teleport hero and nearby allies to target location.', synergy: 'Mobility.', subclass: 'sorcerer_king' },
    { id: 'eldritch_marks', name: 'Eldritch Marks', school: MagicSchool.Arcane, effect: 'add_transformation_tattoos', description: 'Unlock FireLord, StormLord, or ShadowLord forms.', synergy: 'Elemental transformation.', subclass: 'sorcerer_king' },
    { id: 'necronomicon', name: 'Necronomicon', school: MagicSchool.Death, effect: 'grants_5_single_use_tome_spells', description: 'Add 5 single-use Necronomicon spells to spell pool.', synergy: 'Utility versatility.', subclass: 'sorcerer_king' },

    // OGRE MAGI (5)
    { id: 'dragon_master', name: 'Dragon Master', school: MagicSchool.Nature, effect: 'dragon_breath_attack_hp_boost', description: 'Black Dragon +50 HP and gains random breath attack.', synergy: 'Companion augmentation.', subclass: 'ogre_magi' },
    { id: 'commander', name: 'Commander', school: MagicSchool.Life, effect: 'increase_unit_cap', description: '+2 summon slots permanently.', synergy: 'Swarm size.', subclass: 'ogre_magi' },
    { id: 'magic_eye', name: 'Magic Eye', school: MagicSchool.Arcane, effect: 'reveal_unexplored_room_enemies', description: 'Reveal enemy comp and ability on room approach.', synergy: 'Map knowledge.', subclass: 'ogre_magi' },
    { id: 'fire_elemental', name: 'Fire Elemental', school: MagicSchool.Fire, effect: 'summon_med_fire_elemental', description: 'Spawn Fire Elemental at battle start.', synergy: 'Free summon.', subclass: 'ogre_magi' },
    { id: 'totem_caller', name: 'Totem Caller', school: MagicSchool.Nature, effect: 'stationary_heal_totem', description: 'Place a stationary totem that heals 8 HP/tick in range 2.0.', synergy: 'Sustained healing.', subclass: 'ogre_magi' },

    // DEATHLORD (5)
    { id: 'undying', name: 'Undying', school: MagicSchool.Death, effect: 'resurrection_timer_on_death', description: 'Revive at 40% HP 5 ticks after death.', synergy: 'Hero survival.', subclass: 'deathlord' },
    { id: 'death_rising', name: 'Death Rising', school: MagicSchool.Death, effect: 'double_zombie_spawn_rate_temp', description: 'Double zombie spawn rate for 6 ticks.', synergy: 'Swarm burst.', subclass: 'deathlord' },
    { id: 'golem_army', name: 'Golem Army', school: MagicSchool.Death, effect: 'flesh_golem_splits_5_husks', description: 'Flesh Golem is replaced by 5 Flesh Husks.', synergy: 'Swarm size.', subclass: 'deathlord' },
    { id: 'death_servant', name: 'Death Servant', school: MagicSchool.Death, effect: 'raise_one_slain_enemy', description: '30% chance to raise a slain enemy as an undead ally.', synergy: 'Snowball.', subclass: 'deathlord' },
    { id: 'death_dawning', name: 'Death Dawning', school: MagicSchool.Death, effect: 'drain_mana_buff_base_units', description: 'Drain mana to heavily buff zombies. Hero cannot attack.', synergy: 'Minion enrage.', subclass: 'deathlord' }
];

// ==========================================
// WARLORD SPELLS
// ==========================================
export const WARLORD_SPELLS: SpellDefinition[] = [
    // VANILLA (3)
    { id: 'fortify', name: 'Fortify', school: MagicSchool.Life, manaCost: 20, effect: 'w_fortify', description: 'All allies +5 DEF + 10 HP shield 3 ticks.', subclass: 'vanilla_warlord' },
    { id: 'rallying_cry', name: 'Rallying Cry', school: MagicSchool.Life, manaCost: 15, effect: 'w_rallying_cry', description: 'All allies +8 ATK 2 ticks; below 30% HP also +2 speed.', subclass: 'vanilla_warlord' },
    { id: 'war_stomp', name: 'War Stomp', school: MagicSchool.Nature, manaCost: 25, effect: 'w_war_stomp', description: 'AoE stun range 3.0, 10 dmg, stun 1 tick.', subclass: 'vanilla_warlord' },

    // SORCERER KING (4)
    { id: 'hellfire', name: 'Hellfire', school: MagicSchool.Fire, manaCost: 30, effect: 'w_hellfire', description: '30 dmg AoE cone, apply burning.', subclass: 'sorcerer_king' },
    { id: 'drain_life', name: 'Drain Life', school: MagicSchool.Death, manaCost: 25, effect: 'w_drain_life', description: 'Siphon 20 HP from enemies range 2.0, heal SK for total.', subclass: 'sorcerer_king' },
    { id: 'demonic_possession', name: 'Demonic Possession', school: MagicSchool.Death, manaCost: 35, effect: 'w_demonic_possession', description: 'Control one enemy 2 ticks.', subclass: 'sorcerer_king' },
    { id: 'dark_ritual', name: 'Dark Ritual', school: MagicSchool.Death, manaCost: 40, effect: 'w_dark_ritual', description: 'Sacrifice 25 HP, Minions + Daemon +50% ATK + regen 3 ticks.', subclass: 'sorcerer_king' },

    // OGRE MAGI (3)
    { id: 'tribal_war_cry', name: 'Tribal War Cry', school: MagicSchool.Nature, manaCost: 18, effect: 'w_tribal_war_cry', description: 'Gnolls + War Dogs +10 ATK, +2 speed 3 ticks.', subclass: 'ogre_magi' },
    { id: 'beast_call', name: 'Beast Call', school: MagicSchool.Nature, manaCost: 22, effect: 'w_beast_call', description: 'Summon 2 War Dogs (temp, despawn at battle end).', subclass: 'ogre_magi' },
    { id: 'primal_fury', name: 'Primal Fury', school: MagicSchool.Nature, manaCost: 28, effect: 'w_primal_fury', description: 'Hero berserk 3 ticks, 2x ATK, -DEF, AoE melee.', subclass: 'ogre_magi' },

    // DEATHLORD (4)
    { id: 'unholy_resurrection', name: 'Unholy Resurrection', school: MagicSchool.Death, manaCost: 25, effect: 'w_unholy_resurrection', description: 'Revive last fallen friendly at 50% HP.', subclass: 'deathlord' },
    { id: 'death_coil', name: 'Death Coil', school: MagicSchool.Death, manaCost: 20, effect: 'w_death_coil', description: '30 dmg homing projectile, heal DL 15 HP.', subclass: 'deathlord' },
    { id: 'plague', name: 'Plague', school: MagicSchool.Death, manaCost: 30, effect: 'w_plague', description: 'Poison all enemies 8 dmg/tick 4 ticks, spreads on kill.', subclass: 'deathlord' },
    { id: 'soul_harvest', name: 'Soul Harvest', school: MagicSchool.Death, manaCost: 35, effect: 'w_soul_harvest', description: 'Drain all enemy mana, triggers Death Dawning if >=50 mana.', subclass: 'deathlord' },
];

// ==========================================
// WARLORD UNITS
// ==========================================
export const WARLORD_UNITS: UnitTemplate[] = [
    // VANILLA BASE
    { id: 'fanatic', name: 'Fanatic', school: MagicSchool.Fire, tier: 1, isHero: false, isSummon: true, meshType: 'cylinder', spriteColor: 'orange', passives: [], stats: { hp: 80, maxHp: 80, attack: 18, defense: 4, speed: 2, mana: 0, maxMana: 0 } },
    { id: 'archer', name: 'Archer', school: MagicSchool.Nature, tier: 1, isHero: false, isSummon: true, meshType: 'cone', spriteColor: 'green', passives: [], stats: { hp: 60, maxHp: 60, attack: 15, defense: 3, speed: 2, mana: 0, maxMana: 0 } },
    { id: 'shield_bearer', name: 'Shield Bearer', school: MagicSchool.Life, tier: 1, isHero: false, isSummon: true, meshType: 'box', spriteColor: 'white', passives: [], stats: { hp: 100, maxHp: 100, attack: 10, defense: 10, speed: 1, mana: 0, maxMana: 0 } },

    // VANILLA COMPANION
    { id: 'giant_armored_lizard', name: 'Giant Armored Lizard', school: MagicSchool.Fire, tier: 2, isHero: false, isSummon: true, meshType: 'box', scale: 1.5, spriteColor: 'darkred', stats: { hp: 160, maxHp: 160, attack: 22, defense: 12, speed: 2, mana: 0, maxMana: 0 }, passives: [{ trigger: 'on_hit', effect: 'poison_attacks', value: 0 }] },

    // SORCERER KING BASE
    { id: 'demonic_minion', name: 'Demonic Minion', school: MagicSchool.Death, tier: 1, isHero: false, isSummon: true, meshType: 'cylinder', spriteColor: 'darkgray', stats: { hp: 70, maxHp: 70, attack: 16, defense: 4, speed: 2, mana: 0, maxMana: 0 }, passives: [{ trigger: 'on_hit', effect: 'sacrifice_candidate', value: 0 }] },
    { id: 'shadow_cleric', name: 'Shadow Cleric', school: MagicSchool.Death, tier: 1, isHero: false, isSummon: true, meshType: 'torus', spriteColor: 'purple', stats: { hp: 55, maxHp: 55, attack: 10, defense: 4, speed: 2, mana: 0, maxMana: 0 }, passives: [{ trigger: 'on_tick', effect: 'heal_allies', value: 0 }] },
    { id: 'mind_flayer', name: 'Mind Flayer', school: MagicSchool.Arcane, tier: 1, isHero: false, isSummon: true, meshType: 'torus', spriteColor: 'indigo', stats: { hp: 60, maxHp: 60, attack: 18, defense: 3, speed: 2, mana: 0, maxMana: 0 }, passives: [{ trigger: 'on_hit', effect: 'mind_control', value: 0 }] },

    // SORCERER KING COMPANION
    { id: 'greater_daemon', name: 'Greater Daemon', school: MagicSchool.Death, tier: 3, isHero: false, isSummon: true, meshType: 'box', scale: 1.5, spriteColor: 'black', stats: { hp: 200, maxHp: 200, attack: 28, defense: 15, speed: 2, mana: 0, maxMana: 0 }, passives: [{ trigger: 'on_tick', effect: 'demonic_aura', value: 0 }] },

    // OGRE MAGI BASE
    { id: 'gnoll_warrior', name: 'Gnoll Warrior', school: MagicSchool.Nature, tier: 1, isHero: false, isSummon: true, meshType: 'box', spriteColor: 'brown', passives: [], stats: { hp: 85, maxHp: 85, attack: 18, defense: 5, speed: 2, mana: 0, maxMana: 0 } },
    { id: 'war_dog', name: 'War Dog', school: MagicSchool.Nature, tier: 1, isHero: false, isSummon: true, meshType: 'cylinder', spriteColor: 'brown', passives: [], stats: { hp: 60, maxHp: 60, attack: 20, defense: 3, speed: 3, mana: 0, maxMana: 0 } },
    { id: 'archer_fire', name: 'Archer', school: MagicSchool.Fire, tier: 1, isHero: false, isSummon: true, meshType: 'cone', spriteColor: 'red', passives: [], stats: { hp: 60, maxHp: 60, attack: 15, defense: 3, speed: 2, mana: 0, maxMana: 0 } },
    { id: 'fire_elemental_unit', name: 'Fire Elemental', school: MagicSchool.Fire, tier: 1, isHero: false, isSummon: true, meshType: 'torus', spriteColor: 'red', passives: [], stats: { hp: 70, maxHp: 70, attack: 16, defense: 3, speed: 2, mana: 0, maxMana: 0 } },

    // OGRE MAGI COMPANION
    { id: 'black_dragon', name: 'Black Dragon', school: MagicSchool.Fire, tier: 3, isHero: false, isSummon: true, meshType: 'box', scale: 1.5, spriteColor: 'black', stats: { hp: 220, maxHp: 220, attack: 30, defense: 18, speed: 2, mana: 0, maxMana: 0 }, passives: [{ trigger: 'battle_start', effect: 'fire_breath_random', value: 0 }] },

    // DEATHLORD SPAWNED
    { id: 'zombie_slayer', name: 'Zombie Slayer', school: MagicSchool.Death, tier: 1, isHero: false, isSummon: true, meshType: 'box', spriteColor: 'darkgreen', passives: [], stats: { hp: 50, maxHp: 50, attack: 14, defense: 3, speed: 1, mana: 0, maxMana: 0 } },

    // DEATHLORD COMPANION
    { id: 'monstrous_flesh_golem', name: 'Monstrous Flesh Golem', school: MagicSchool.Death, tier: 3, isHero: false, isSummon: true, meshType: 'box', scale: 1.5, spriteColor: 'purple', stats: { hp: 240, maxHp: 240, attack: 26, defense: 20, speed: 1, mana: 0, maxMana: 0 }, passives: [{ trigger: 'on_death', effect: 'absorb_dead', value: 0 }] } // Note: "nearby enemy drops" typically trigger on some event. I use on_death to signify event trigger.
];
