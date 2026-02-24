import { Perk, MagicSchool } from '../types';

export const PERK_TEMPLATES: Record<string, Perk> = {
  'fire_mastery': {
    id: 'fire_mastery',
    name: 'Fire Mastery',
    description: '+10% Fire Damage',
    school: MagicSchool.Fire,
    effect: 'increase_fire_damage_10'
  }
};
