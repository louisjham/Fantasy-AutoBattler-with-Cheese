import { MagicSchool } from '../types/index';
import { PerkDefinition, SpellDefinition, UnitTemplate } from '../types/index';

// ==========================================
// CONJURER PERKS
// ==========================================
export const CONJURER_PERKS: PerkDefinition[] = [
    // ELEMENTAL MASTER (5)
    { id: 'elemental_attunement', name: 'Elemental Attunement', school: MagicSchool.Arcane, effect: 'element_damage_boost', description: 'Choose element, all summons +20% dmg. Companion gets element attack.', synergy: 'Elemental focus.', subclass: 'elemental_master' },
    { id: 'mana_cascade', name: 'Mana Cascade', school: MagicSchool.Arcane, effect: 'spell_summon_synergy', description: 'On spell cast: all summons +3 mana regen 2 ticks.', synergy: 'Spell weaving.', subclass: 'elemental_master' },
    { id: 'dual_aspect', name: 'Dual Aspect', school: MagicSchool.Arcane, effect: 'dual_element_unlock', description: 'Floor 3: second element unlocked, hybrid spells available.', synergy: 'Versatility.', subclass: 'elemental_master' },
    { id: 'elemental_swap', name: 'Elemental Swap', school: MagicSchool.Arcane, effect: 'companion_element_shift', description: 'Once per battle: swap companion element, +30% HP refresh.', synergy: 'Adaptability.', subclass: 'elemental_master' },
    { id: 'prismatic_ascension', name: 'Prismatic Ascension', school: MagicSchool.Arcane, effect: 'multi_element_crit', description: '3+ elements alive: +25% spell crit, +1 mana regen per element.', synergy: 'Rainbow elements.', subclass: 'elemental_master' },

    // BEAST CONJURER (5)
    { id: 'forest_god', name: 'Forest God', school: MagicSchool.Nature, effect: 'transform_forest_god', description: 'Hero transforms: +50/30/40% ATK/DEF/HP, spawn 3 Treants.', synergy: 'Mega transformation.', subclass: 'beast_conjurer' },
    { id: 'primal_bear', name: 'Primal Bear', school: MagicSchool.Nature, effect: 'transform_primal_bear', description: 'Hero transforms: +60% ATK, knockback, berserk <20% HP.', synergy: 'Melee bruiser.', subclass: 'beast_conjurer' },
    { id: 'maddening_howl', name: 'Maddening Howl', school: MagicSchool.Nature, effect: 'charm_attack_all', description: 'Target enemy: attacks everything 2 ticks.', synergy: 'Crowd control.', subclass: 'beast_conjurer' },
    { id: 'siphon_vitality', name: 'Siphon Vitality', school: MagicSchool.Nature, effect: 'drain_mana_heal_team', description: 'Drain all enemy mana -> heal summons, +5 HP/mana to hero.', synergy: 'Vampirism.', subclass: 'beast_conjurer' },
    { id: 'primal_dread', name: 'Primal Dread', school: MagicSchool.Death, effect: 'fear_enemy_minions', description: 'Enemy base units flee 2 ticks, -30% dmg while fleeing.', synergy: 'Fear effect.', subclass: 'beast_conjurer' },

    // BATTLEMANCER (5)
    { id: 'bound_arsenal', name: 'Bound Arsenal', school: MagicSchool.Arcane, effect: 'weapon_swap_3forms', description: 'Equip Sword/Mace/Dagger: each +6 ATK + unique passive.', synergy: 'Flexible melee.', subclass: 'battlemancer' },
    { id: 'conjured_armor', name: 'Conjured Armor', school: MagicSchool.Arcane, effect: 'defense_regen_scaling', description: '>=2 summons alive: +15 DEF, +3 HP/tick regen.', synergy: 'Tankiness.', subclass: 'battlemancer' },
    { id: 'gear_synergy', name: 'Gear Synergy', school: MagicSchool.Arcane, effect: 'equipment_synergy_boost', description: 'Per weapon form: summons +10% school synergy.', synergy: 'Scaling buff.', subclass: 'battlemancer' },
    { id: 'artifact_mastery', name: 'Artifact Mastery', school: MagicSchool.Arcane, effect: 'spell_cost_reduction', description: 'Conjure spells free recast 1x; other spells -50% mana.', synergy: 'Mana efficiency.', subclass: 'battlemancer' },
    { id: 'forge_ascension', name: 'Forge Ascension', school: MagicSchool.Fire, effect: 'companion_tier_up', description: 'Floor 5: Forge Spirit upgrades to Tier 3 (Legendary Forge Avatar).', synergy: 'Lategame companion.', subclass: 'battlemancer' }
];

// ==========================================
// CONJURER SPELLS
// ==========================================
export const CONJURER_SPELLS: SpellDefinition[] = [
    // BASE (4)
    { id: 'fireball', name: 'Fireball', school: MagicSchool.Fire, manaCost: 20, effect: 'c_fireball', description: '30 dmg AoE range 3.0, apply burning.', subclass: 'base' },
    { id: 'frost_nova', name: 'Frost Nova', school: MagicSchool.Arcane, manaCost: 20, effect: 'c_frost_nova', description: '25 dmg AoE, -50% speed 2 ticks.', subclass: 'base' },
    { id: 'chain_lightning', name: 'Chain Lightning', school: MagicSchool.Nature, manaCost: 25, effect: 'c_chain_lightning', description: '35 dmg primary, chain 2 (20 ea), stun if hits 3+.', subclass: 'base' },
    { id: 'summon_elemental', name: 'Summon Elemental', school: MagicSchool.Arcane, manaCost: 15, effect: 'c_summon_elemental', description: 'Summon 1 Elemental Adept (attuned element).', subclass: 'base' },

    // ELEMENTAL MASTER (4)
    { id: 'pyroclasm', name: 'Pyroclasm', school: MagicSchool.Fire, manaCost: 28, effect: 'c_pyroclasm', description: '40 dmg Fire AoE + 8 dmg/tick burning 3 ticks, spreads tick 2.', subclass: 'elemental_master' },
    { id: 'blizzard', name: 'Blizzard', school: MagicSchool.Arcane, manaCost: 30, effect: 'c_blizzard', description: '35 dmg Ice AoE, freeze 1 tick, +50% dmg vs <50% HP.', subclass: 'elemental_master' },
    { id: 'maelstrom', name: 'Maelstrom', school: MagicSchool.Nature, manaCost: 35, effect: 'c_maelstrom', description: '45 dmg primary, 30 dmg 3 secondaries, stun all hit.', subclass: 'elemental_master' },
    { id: 'prismatic_barrier', name: 'Prismatic Barrier', school: MagicSchool.Arcane, manaCost: 18, effect: 'c_prismatic_barrier', description: '15 HP shield all summons; +5 per unique element alive.', subclass: 'elemental_master' },

    // BEAST CONJURER (4)
    { id: 'hydra_strike', name: 'Hydra Strike', school: MagicSchool.Nature, manaCost: 20, effect: 'c_hydra_strike', description: '40 dmg, Hydra rotates breath (fire/acid/sonic).', subclass: 'beast_conjurer' },
    { id: 'beast_empowerment', name: 'Beast Empowerment', school: MagicSchool.Nature, manaCost: 15, effect: 'c_beast_empowerment', description: 'All summons +15 ATK, +2 speed 3 ticks.', subclass: 'beast_conjurer' },
    { id: 'summon_feral_pack', name: 'Summon Feral Pack', school: MagicSchool.Nature, manaCost: 18, effect: 'c_summon_feral_pack', description: 'Summon 2 Werewolf Soldiers (5 tick temp).', subclass: 'beast_conjurer' },
    { id: 'primal_roar', name: 'Primal Roar', school: MagicSchool.Nature, manaCost: 22, effect: 'c_primal_roar', description: 'Range 4.0: 15 dmg + silence 1 tick all enemies.', subclass: 'beast_conjurer' },

    // BATTLEMANCER (4)
    { id: 'conjure_flaming_blade', name: 'Conjure Flaming Blade', school: MagicSchool.Fire, manaCost: 12, effect: 'c_conjure_flaming_blade', description: 'Bound sword +10 ATK + burning on hit 4 ticks.', subclass: 'battlemancer' },
    { id: 'arcane_bulwark', name: 'Arcane Bulwark', school: MagicSchool.Arcane, manaCost: 15, effect: 'c_arcane_bulwark', description: 'All allies +8 DEF + 20 HP shield 3 ticks.', subclass: 'battlemancer' },
    { id: 'summon_runic_defender', name: 'Summon Runic Defender', school: MagicSchool.Arcane, manaCost: 16, effect: 'c_summon_runic_defender', description: 'Summon 1 Runic Golem (reflects spell dmg).', subclass: 'battlemancer' },
    { id: 'forge_strike', name: 'Forge Strike', school: MagicSchool.Fire, manaCost: 18, effect: 'c_forge_strike', description: '32 dmg projectile; if target dies: cooldown -> 3 ticks.', subclass: 'battlemancer' }
];

// ==========================================
// CONJURER UNITS
// ==========================================
export const CONJURER_UNITS: UnitTemplate[] = [
    // ELEMENTAL MASTER BASE
    { id: 'elemental_adept', name: 'Elemental Adept', school: MagicSchool.Arcane, tier: 1, isHero: false, isSummon: true, meshType: 'torus', spriteColor: 'cyan', passives: [], stats: { hp: 75, maxHp: 75, attack: 16, defense: 4, speed: 2, mana: 0, maxMana: 0 } },
    { id: 'elemental_conduit', name: 'Elemental Conduit', school: MagicSchool.Arcane, tier: 1, isHero: false, isSummon: true, meshType: 'torus', spriteColor: 'blue', passives: [], stats: { hp: 65, maxHp: 65, attack: 18, defense: 3, speed: 2, mana: 30, maxMana: 30 } },
    { id: 'mana_nexus', name: 'Mana Nexus', school: MagicSchool.Arcane, tier: 1, isHero: false, isSummon: true, meshType: 'sphere', spriteColor: 'lightblue', passives: [], stats: { hp: 80, maxHp: 80, attack: 10, defense: 6, speed: 1, mana: 50, maxMana: 50 } },

    // EM COMPANION
    { id: 'primal_elemental', name: 'Primal Elemental', school: MagicSchool.Arcane, tier: 2, isHero: false, isSummon: true, meshType: 'torus', scale: 1.5, spriteColor: 'white', stats: { hp: 150, maxHp: 150, attack: 20, defense: 10, speed: 2, mana: 0, maxMana: 0 }, passives: [{ trigger: 'on_hit', effect: 'school_attack', value: 0 }] },

    // BEAST CONJURER BASE
    { id: 'werewolf_soldier', name: 'Werewolf Soldier', school: MagicSchool.Nature, tier: 1, isHero: false, isSummon: true, meshType: 'cylinder', spriteColor: 'brown', passives: [], stats: { hp: 85, maxHp: 85, attack: 20, defense: 4, speed: 3, mana: 0, maxMana: 0 } },
    { id: 'armored_troll', name: 'Armored Troll', school: MagicSchool.Nature, tier: 1, isHero: false, isSummon: true, meshType: 'box', spriteColor: 'darkgreen', passives: [], stats: { hp: 120, maxHp: 120, attack: 15, defense: 12, speed: 1, mana: 0, maxMana: 0 } },
    { id: 'war_gargoyle', name: 'War Gargoyle', school: MagicSchool.Fire, tier: 1, isHero: false, isSummon: true, meshType: 'cone', spriteColor: 'gray', passives: [], stats: { hp: 70, maxHp: 70, attack: 18, defense: 5, speed: 3, mana: 0, maxMana: 0 } },

    // BC COMPANION
    { id: 'three_headed_hydra', name: 'Three-Headed Hydra', school: MagicSchool.Death, tier: 3, isHero: false, isSummon: true, meshType: 'box', scale: 1.5, spriteColor: 'purple', stats: { hp: 210, maxHp: 210, attack: 25, defense: 14, speed: 2, mana: 0, maxMana: 0 }, passives: [{ trigger: 'on_attack' as any, effect: 'three_heads', value: 0 }] }, // 'on_attack' logic usually mapped closely or via specific on_tick

    // BATTLEMANCER BASE
    { id: 'sentinel_knight', name: 'Sentinel Knight', school: MagicSchool.Arcane, tier: 1, isHero: false, isSummon: true, meshType: 'box', spriteColor: 'silver', stats: { hp: 90, maxHp: 90, attack: 16, defense: 8, speed: 2, mana: 0, maxMana: 0 }, passives: [{ trigger: 'on_damaged', effect: 'counter_attack', value: 0 }] },
    { id: 'runic_golem', name: 'Runic Golem', school: MagicSchool.Arcane, tier: 1, isHero: false, isSummon: true, meshType: 'box', spriteColor: 'gold', stats: { hp: 100, maxHp: 100, attack: 18, defense: 7, speed: 1, mana: 0, maxMana: 0 }, passives: [{ trigger: 'on_damaged', effect: 'spell_reflect', value: 0 }] },
    { id: 'arcane_conduit', name: 'Arcane Conduit', school: MagicSchool.Arcane, tier: 1, isHero: false, isSummon: true, meshType: 'sphere', spriteColor: 'cyan', stats: { hp: 70, maxHp: 70, attack: 12, defense: 5, speed: 2, mana: 40, maxMana: 40 }, passives: [{ trigger: 'on_tick', effect: 'arcane_shield_aura', value: 0 }] },

    // BM COMPANION
    { id: 'forge_spirit', name: 'Forge Spirit', school: MagicSchool.Arcane, tier: 2, isHero: false, isSummon: true, meshType: 'box', scale: 1.5, spriteColor: 'orange', stats: { hp: 140, maxHp: 140, attack: 18, defense: 10, speed: 2, mana: 0, maxMana: 0 }, passives: [{ trigger: 'on_tick', effect: 'enchanted_weapon_aura', value: 0 }, { trigger: 'on_tick', effect: 'arcane_shielding_aura', value: 0 }] }
];
