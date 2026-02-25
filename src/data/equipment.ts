import { Weapon, Armor, MagicSchool } from '../types';

export const WEAPONS: Weapon[] = [
    // TIER 1 WEAPONS (shop floor 1-2)
    { id: 'flame_blade', name: 'Flame Blade', school: MagicSchool.Fire, attackBonus: 8, weaponEffect: 'Flaming', tier: 1, description: '20% chance to Burn on hit (4 dmg × 3 ticks)' },
    { id: 'shadow_fang', name: 'Shadow Fang', school: MagicSchool.Death, attackBonus: 6, weaponEffect: 'Shadowforged', tier: 1, description: 'Ignores 25% of target defense' },
    { id: 'poison_dagger', name: 'Venom Dagger', school: MagicSchool.Nature, attackBonus: 5, weaponEffect: 'Poisoned', tier: 1, description: 'Applies Poison on hit (3 dmg × 6 ticks, stacks)' },
    { id: 'spark_wand', name: 'Spark Wand', school: MagicSchool.Arcane, attackBonus: 10, weaponEffect: 'Thundering', tier: 1, description: '15% chance to Stun target for 1 tick' },
    { id: 'holy_mace', name: 'Holy Mace', school: MagicSchool.Life, attackBonus: 9, weaponEffect: 'Blessed', tier: 1, description: '+10 holy dmg, +25 vs Death units' },
    { id: 'cursed_blade', name: 'Cursed Blade', school: MagicSchool.Death, attackBonus: 7, weaponEffect: 'Cursed', tier: 1, description: '-15% target defense per hit, stacks 3×' },
    { id: 'frost_shard', name: 'Frost Shard', school: MagicSchool.Arcane, attackBonus: 6, weaponEffect: 'Frozen', tier: 1, description: '20% chance to Freeze target for 2 ticks' },
    { id: 'blood_axe', name: 'Blood Axe', school: MagicSchool.Fire, attackBonus: 11, weaponEffect: 'Vampiric', tier: 1, description: 'Heal for 30% of damage dealt' },

    // TIER 2 WEAPONS (shop floor 2-3, elite drops)
    { id: 'inferno_sword', name: 'Inferno Sword', school: MagicSchool.Fire, attackBonus: 16, weaponEffect: 'Flaming', tier: 2, description: 'Burn chance 35%, deals 6 dmg × 4 ticks' },
    { id: 'soul_reaper', name: 'Soul Reaper', school: MagicSchool.Death, attackBonus: 14, weaponEffect: 'Cursed', tier: 2, description: '-20% defense per hit, stacks 4×' },
    { id: 'thornwhip', name: 'Thornwhip', school: MagicSchool.Nature, attackBonus: 13, weaponEffect: 'Poisoned', tier: 2, description: 'Poison stacks deal +2 dmg each' },
    { id: 'storm_hammer', name: 'Storm Hammer', school: MagicSchool.Arcane, attackBonus: 18, weaponEffect: 'Thundering', tier: 2, description: 'Stun chance 25%, stun lasts 2 ticks' },
    { id: 'divine_sword', name: 'Divine Sword', school: MagicSchool.Life, attackBonus: 15, weaponEffect: 'Blessed', tier: 2, description: '+20 holy dmg, +50% vs Death, chance to heal self' },
    { id: 'void_blade', name: 'Void Blade', school: MagicSchool.Arcane, attackBonus: 17, weaponEffect: 'Shadowforged', tier: 2, description: 'Ignores 40% of target defense' },
    { id: 'glacial_staff', name: 'Glacial Staff', school: MagicSchool.Arcane, attackBonus: 12, weaponEffect: 'Frozen', tier: 2, description: 'Freeze chance 35%, frozen units take +25% damage' },
    { id: 'lifedrinker', name: 'Lifedrinker', school: MagicSchool.Death, attackBonus: 15, weaponEffect: 'Vampiric', tier: 2, description: 'Lifesteal 45%, overheal converts to shield' },

    // TIER 3 WEAPONS (boss drops, floor 4-5 shop)
    { id: 'world_ender', name: "World Ender", school: MagicSchool.Fire, attackBonus: 28, weaponEffect: 'Flaming', tier: 3, description: 'Burn spreads automatically, deals 10 dmg × 5 ticks' },
    { id: 'deaths_embrace', name: "Death's Embrace", school: MagicSchool.Death, attackBonus: 25, weaponEffect: 'Cursed', tier: 3, description: 'Max curse stacks 5×, cursed units take +30% damage' },
    { id: 'natures_wrath', name: "Nature's Wrath", school: MagicSchool.Nature, attackBonus: 22, weaponEffect: 'Poisoned', tier: 3, description: 'Poison applies to all adjacent enemies' },
    { id: 'thundergod_spear', name: 'Thundergod Spear', school: MagicSchool.Arcane, attackBonus: 30, weaponEffect: 'Thundering', tier: 3, description: 'Chain lightning: stun bounces to 2 additional enemies' },
    { id: 'archangel_blade', name: 'Archangel Blade', school: MagicSchool.Life, attackBonus: 26, weaponEffect: 'Blessed', tier: 3, description: '+40 holy dmg, execute Death units below 25% HP' },
    { id: 'oblivion', name: 'Oblivion', school: MagicSchool.Arcane, attackBonus: 32, weaponEffect: 'Shadowforged', tier: 3, description: 'Ignores ALL defense, 10% chance instant kill' },
    { id: 'eternal_frost', name: 'Eternal Frost', school: MagicSchool.Arcane, attackBonus: 20, weaponEffect: 'Frozen', tier: 3, description: 'Permanent slow on target, freeze chance 50%' },
    { id: 'crimson_harvest', name: 'Crimson Harvest', school: MagicSchool.Death, attackBonus: 27, weaponEffect: 'Vampiric', tier: 3, description: 'Lifesteal 60%, killing blows fully heal attacker' },
];

export const ARMORS: Armor[] = [
    // TIER 1 ARMOR
    { id: 'bone_plate', name: 'Bone Plate', school: MagicSchool.Death, defenseBonus: 8, hpBonus: 20, tier: 1, passive: { trigger: 'on_damaged', effect: 'reflect_damage', value: 5 }, description: '+8 DEF, +20 HP, reflect 5 dmg to attacker' },
    { id: 'ember_shield', name: 'Ember Shield', school: MagicSchool.Fire, defenseBonus: 6, hpBonus: 15, tier: 1, passive: null, description: '+6 DEF, +15 HP' },
    { id: 'bark_armor', name: 'Bark Armor', school: MagicSchool.Nature, defenseBonus: 5, hpBonus: 25, tier: 1, passive: { trigger: 'on_tick', effect: 'regen_hp', value: 3 }, description: '+5 DEF, +25 HP, regen 3 HP per tick' },
    { id: 'mana_weave', name: 'Mana Weave', school: MagicSchool.Arcane, defenseBonus: 4, hpBonus: 10, tier: 1, passive: { trigger: 'battle_start', effect: 'bonus_mana', value: 25 }, description: '+4 DEF, +10 HP, start battle with 25 extra mana' },
    { id: 'holy_vestments', name: 'Holy Vestments', school: MagicSchool.Life, defenseBonus: 7, hpBonus: 20, tier: 1, passive: { trigger: 'on_cast', effect: 'heal_bonus', value: 5 }, description: '+7 DEF, +20 HP, all heals +5' },

    // TIER 2 ARMOR
    { id: 'shadow_cloak', name: 'Shadow Cloak', school: MagicSchool.Death, defenseBonus: 12, hpBonus: 35, tier: 2, passive: { trigger: 'battle_start', effect: 'first_hit_block', value: 1 }, description: '+12 DEF, +35 HP, block first hit' },
    { id: 'dragon_scale', name: 'Dragon Scale', school: MagicSchool.Fire, defenseBonus: 14, hpBonus: 30, tier: 2, passive: { trigger: 'on_damaged', effect: 'fire_retaliation', value: 8 }, description: '+14 DEF, +30 HP, deal 8 fire dmg when hit' },
    { id: 'ironbark', name: 'Ironbark', school: MagicSchool.Nature, defenseBonus: 16, hpBonus: 40, tier: 2, passive: { trigger: 'on_tick', effect: 'regen_hp', value: 6 }, description: '+16 DEF, +40 HP, regen 6 HP per tick' },
    { id: 'arcane_lattice', name: 'Arcane Lattice', school: MagicSchool.Arcane, defenseBonus: 10, hpBonus: 25, tier: 2, passive: { trigger: 'on_cast', effect: 'damage_shield', value: 15 }, description: '+10 DEF, +25 HP, gain 15 shield on spell cast' },
    { id: 'radiant_plate', name: 'Radiant Plate', school: MagicSchool.Life, defenseBonus: 15, hpBonus: 45, tier: 2, passive: { trigger: 'on_cast', effect: 'attack_bonus_temp', value: 8 }, description: '+15 DEF, +45 HP, gain +8 ATK when healed' },

    // TIER 3 ARMOR
    { id: 'void_carapace', name: 'Void Carapace', school: MagicSchool.Arcane, defenseBonus: 22, hpBonus: 60, tier: 3, passive: { trigger: 'on_damaged', effect: 'mana_gain', value: 5 }, description: '+22 DEF, +60 HP, gain 5 mana when hit' },
    { id: 'lich_shroud', name: 'Lich Shroud', school: MagicSchool.Death, defenseBonus: 18, hpBonus: 70, tier: 3, passive: { trigger: 'on_death', effect: 'death_explosion_armor', value: 40 }, description: '+18 DEF, +70 HP, explode for 40 AoE on death' },
    { id: 'world_tree_bark', name: 'World Tree Bark', school: MagicSchool.Nature, defenseBonus: 20, hpBonus: 80, tier: 3, passive: { trigger: 'on_tick', effect: 'regen_hp', value: 12 }, description: '+20 DEF, +80 HP, regen 12 HP per tick' },
    { id: 'seraphs_aegis', name: "Seraph's Aegis", school: MagicSchool.Life, defenseBonus: 24, hpBonus: 65, tier: 3, passive: { trigger: 'battle_start', effect: 'revive_shield', value: 1 }, description: '+24 DEF, +65 HP, revive once with full HP shield' },
    { id: 'inferno_mantle', name: 'Inferno Mantle', school: MagicSchool.Fire, defenseBonus: 16, hpBonus: 55, tier: 3, passive: { trigger: 'on_damaged', effect: 'burning_retaliation', value: 1 }, description: '+16 DEF, +55 HP, apply burning to attacker when hit' },
];
