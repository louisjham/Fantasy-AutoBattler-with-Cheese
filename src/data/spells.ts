import { Spell, MagicSchool } from '../types';

export const SPELL_TEMPLATES: Record<string, Spell> = {
  // ----------------------------------------------------------------------
  // FIRE SPELLS (Focus: Direct AoE damage, burning effects)
  // ----------------------------------------------------------------------
  'fireball': {
    id: 'fireball', name: 'Fireball', school: MagicSchool.Fire, manaCost: 20,
    effect: 'deal_damage_15_aoe_2', tags: ['damage', 'aoe'],
    description: 'Deals 15 Fire damage in a small radius.'
  },
  'ignite': {
    id: 'ignite', name: 'Ignite', school: MagicSchool.Fire, manaCost: 15,
    effect: 'apply_burning_target', tags: ['status', 'debuff'],
    description: 'Sets target on fire (6 damage/tick for 3 ticks).'
  },
  'meteor_strike': {
    id: 'meteor_strike', name: 'Meteor Strike', school: MagicSchool.Fire, manaCost: 45,
    effect: 'deal_damage_40_aoe_4', tags: ['damage', 'aoe', 'ultimate'],
    description: 'Deals 40 massive Fire damage in a large radius.'
  },
  'cauterize': {
    id: 'cauterize', name: 'Cauterize', school: MagicSchool.Fire, manaCost: 25,
    effect: 'heal_30_burn_self', tags: ['heal', 'recoil'],
    description: 'Heals an ally for 30 HP, but applies Burning to them.'
  },
  'flame_wall': {
    id: 'flame_wall', name: 'Flame Wall', school: MagicSchool.Fire, manaCost: 30,
    effect: 'create_wall_fire', tags: ['utility', 'zone'],
    description: 'Creates a line of fire causing 10 damage to enemies passing through.'
  },

  // ----------------------------------------------------------------------
  // DEATH SPELLS (Focus: Sacrifice, debuffs, executing weak enemies)
  // ----------------------------------------------------------------------
  'life_drain': {
    id: 'life_drain', name: 'Life Drain', school: MagicSchool.Death, manaCost: 20,
    effect: 'deal_damage_10_heal_10', tags: ['damage', 'heal'],
    description: 'Steals 10 HP from target and heals the lowest HP ally.'
  },
  'soul_reap': {
    id: 'soul_reap', name: 'Soul Reap', school: MagicSchool.Death, manaCost: 35,
    effect: 'execute_25_percent', tags: ['damage', 'execute'],
    description: 'Instantly kills target if below 25% max HP.'
  },
  'curses_mark': {
    id: 'curses_mark', name: "Curse's Mark", school: MagicSchool.Death, manaCost: 15,
    effect: 'apply_cursed_3', tags: ['debuff'],
    description: 'Applies 3 stacks of Cursed (permanent defense reduction).'
  },
  'blood_sacrifice': {
    id: 'blood_sacrifice', name: 'Blood Sacrifice', school: MagicSchool.Death, manaCost: 10,
    effect: 'damage_ally_20_gain_mana_30', tags: ['utility', 'sacrifice'],
    description: 'Deal 20 damage to an ally to instantly gain 30 mana.'
  },
  'raise_dead': {
    id: 'raise_dead', name: 'Raise Dead', school: MagicSchool.Death, manaCost: 50,
    effect: 'summon_skeleton_melee', tags: ['summon', 'ultimate'],
    description: 'Summons a temporary Skeleton warrior.'
  },

  // ----------------------------------------------------------------------
  // NATURE SPELLS (Focus: Healing over time, buffs, stalling)
  // ----------------------------------------------------------------------
  'entangling_roots': {
    id: 'entangling_roots', name: 'Entangling Roots', school: MagicSchool.Nature, manaCost: 25,
    effect: 'apply_rooted_aoe', tags: ['cc', 'aoe'],
    description: 'Roots enemies in an area for 3 ticks (cannot move).'
  },
  'poison_spore': {
    id: 'poison_spore', name: 'Poison Spore', school: MagicSchool.Nature, manaCost: 15,
    effect: 'apply_poison_2_stacks', tags: ['debuff', 'dot'],
    description: 'Applies 2 stacks of Poison to target.'
  },
  'healing_breeze': {
    id: 'healing_breeze', name: 'Healing Breeze', school: MagicSchool.Nature, manaCost: 30,
    effect: 'apply_regen_all_allies', tags: ['heal', 'buff', 'aoe'],
    description: 'All allies gain Regen (4 HP/tick for 5 ticks).'
  },
  'barkskin': {
    id: 'barkskin', name: 'Barkskin', school: MagicSchool.Nature, manaCost: 20,
    effect: 'buff_defense_15', tags: ['buff'],
    description: 'Target ally gains +15 defense for 4 ticks.'
  },
  'summon_treant': {
    id: 'summon_treant', name: 'Summon Treant', school: MagicSchool.Nature, manaCost: 45,
    effect: 'summon_treant_tank', tags: ['summon', 'ultimate'],
    description: 'Summons a high-HP Treant with Taunt.'
  },

  // ----------------------------------------------------------------------
  // ARCANE SPELLS (Focus: Mana manipulation, stun, absolute damage)
  // ----------------------------------------------------------------------
  'arcane_missile': {
    id: 'arcane_missile', name: 'Arcane Missile', school: MagicSchool.Arcane, manaCost: 10,
    effect: 'deal_damage_absolute_8', tags: ['damage', 'projectile'],
    description: 'Deals 8 Arcane damage (ignores all defense).'
  },
  'time_warp': {
    id: 'time_warp', name: 'Time Warp', school: MagicSchool.Arcane, manaCost: 30,
    effect: 'buff_speed_allies', tags: ['buff', 'aoe'],
    description: 'All allies attack and move 50% faster for 3 ticks.'
  },
  'mana_shield': {
    id: 'mana_shield', name: 'Mana Shield', school: MagicSchool.Arcane, manaCost: 25,
    effect: 'apply_shield_30', tags: ['shield', 'buff'],
    description: 'Applies a 30 HP barrier to target ally.'
  },
  'chain_lightning': {
    id: 'chain_lightning', name: 'Chain Lightning', school: MagicSchool.Arcane, manaCost: 35,
    effect: 'deal_damage_15_bounce_3', tags: ['damage', 'bounce', 'stun'],
    description: 'Deals 15 damage, bounces to 3 enemies, 30% stun chance.'
  },
  'black_hole': {
    id: 'black_hole', name: 'Black Hole', school: MagicSchool.Arcane, manaCost: 55,
    effect: 'pull_enemies_aoe_damage', tags: ['cc', 'aoe', 'ultimate'],
    description: 'Pulls all enemies to center and deals 25 damage.'
  },

  // ----------------------------------------------------------------------
  // LIFE SPELLS (Focus: Direct healing, holy damage, resurrection)
  // ----------------------------------------------------------------------
  'heal': {
    id: 'heal', name: 'Healing Touch', school: MagicSchool.Life, manaCost: 15,
    effect: 'heal_25', tags: ['heal'],
    description: 'Heals an ally for 25 HP.'
  },
  'smite': {
    id: 'smite', name: 'Smite', school: MagicSchool.Life, manaCost: 20,
    effect: 'deal_holy_damage_15', tags: ['damage'],
    description: 'Deals 15 Holy damage (Double against Death units).'
  },
  'holy_nova': {
    id: 'holy_nova', name: 'Holy Nova', school: MagicSchool.Life, manaCost: 40,
    effect: 'heal_all_20_damage_all_10', tags: ['heal', 'damage', 'aoe'],
    description: 'Heals all allies for 20, deals 10 damage to all enemies.'
  },
  'divine_shield': {
    id: 'divine_shield', name: 'Divine Shield', school: MagicSchool.Life, manaCost: 35,
    effect: 'apply_invulnerable_1_tick', tags: ['buff', 'immunity'],
    description: 'Target ally is completely immune to damage for 1 tick.'
  },
  'resurrection': {
    id: 'resurrection', name: 'Resurrection', school: MagicSchool.Life, manaCost: 60,
    effect: 'revive_dead_ally_half_hp', tags: ['heal', 'ultimate'],
    description: 'Revives the last fallen ally with 50% HP.'
  }
};
