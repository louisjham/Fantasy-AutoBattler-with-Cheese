import { Spell, MagicSchool } from '../types';

export const SPELL_TEMPLATES: Record<string, Spell> = {
  'fireball': {
    id: 'fireball',
    name: 'Fireball',
    school: MagicSchool.Fire,
    manaCost: 20,
    effect: 'deal_damage_10',
    tags: ['damage', 'projectile'],
    description: 'Deals 10 Fire damage.'
  },
  'heal': {
    id: 'heal',
    name: 'Healing Touch',
    school: MagicSchool.Life,
    manaCost: 15,
    effect: 'heal_20',
    tags: ['heal', 'buff'],
    description: 'Heals 20 HP.'
  },
  'arcane_missile': {
    id: 'arcane_missile',
    name: 'Arcane Missile',
    school: MagicSchool.Arcane,
    manaCost: 10,
    effect: 'deal_damage_5',
    tags: ['damage', 'projectile'],
    description: 'Deals 5 Arcane damage.'
  }
};
