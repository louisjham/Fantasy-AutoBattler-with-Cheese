import { Unit, MagicSchool } from '../types';

export interface ActiveSynergy {
  school: MagicSchool;
  unitCount: number;
  tier: 1 | 2 | 3;
  bonus: string;
  effect: string;
  value: number;
}

export function calculateSynergies(units: Unit[]): ActiveSynergy[] {
  const counts: Record<MagicSchool, number> = {
    [MagicSchool.Fire]: 0,
    [MagicSchool.Death]: 0,
    [MagicSchool.Nature]: 0,
    [MagicSchool.Arcane]: 0,
    [MagicSchool.Life]: 0,
  };

  for (const unit of units) {
    counts[unit.school]++;
  }

  const synergies: ActiveSynergy[] = [];

  // FIRE
  if (counts[MagicSchool.Fire] >= 6) {
    synergies.push({ school: MagicSchool.Fire, unitCount: counts[MagicSchool.Fire], tier: 3, bonus: 'Burning enemies explode on death, 20 AoE dmg', effect: 'fire_3', value: 20 });
  } else if (counts[MagicSchool.Fire] >= 4) {
    synergies.push({ school: MagicSchool.Fire, unitCount: counts[MagicSchool.Fire], tier: 2, bonus: 'Burning spreads to adjacent enemy on proc', effect: 'fire_2', value: 0 });
  } else if (counts[MagicSchool.Fire] >= 2) {
    synergies.push({ school: MagicSchool.Fire, unitCount: counts[MagicSchool.Fire], tier: 1, bonus: '15% chance to apply Burning on attack', effect: 'fire_1', value: 15 });
  }

  // DEATH
  if (counts[MagicSchool.Death] >= 6) {
    synergies.push({ school: MagicSchool.Death, unitCount: counts[MagicSchool.Death], tier: 3, bonus: 'Killed enemies 25% chance to join as skeletons', effect: 'death_3', value: 25 });
  } else if (counts[MagicSchool.Death] >= 4) {
    synergies.push({ school: MagicSchool.Death, unitCount: counts[MagicSchool.Death], tier: 2, bonus: 'Player gains 3 mana when any unit dies', effect: 'death_2', value: 3 });
  } else if (counts[MagicSchool.Death] >= 2) {
    synergies.push({ school: MagicSchool.Death, unitCount: counts[MagicSchool.Death], tier: 1, bonus: 'Units revive once at 20% HP when killed', effect: 'death_1', value: 20 });
  }

  // NATURE
  if (counts[MagicSchool.Nature] >= 6) {
    synergies.push({ school: MagicSchool.Nature, unitCount: counts[MagicSchool.Nature], tier: 3, bonus: 'One random ally fully heals when another dies', effect: 'nature_3', value: 100 });
  } else if (counts[MagicSchool.Nature] >= 4) {
    synergies.push({ school: MagicSchool.Nature, unitCount: counts[MagicSchool.Nature], tier: 2, bonus: 'Summon mana cost -2', effect: 'nature_2', value: 2 });
  } else if (counts[MagicSchool.Nature] >= 2) {
    synergies.push({ school: MagicSchool.Nature, unitCount: counts[MagicSchool.Nature], tier: 1, bonus: 'All allies regen 4 HP per tick', effect: 'nature_1', value: 4 });
  }

  // ARCANE
  if (counts[MagicSchool.Arcane] >= 6) {
    synergies.push({ school: MagicSchool.Arcane, unitCount: counts[MagicSchool.Arcane], tier: 3, bonus: '30% chance spell refunds its mana cost', effect: 'arcane_3', value: 30 });
  } else if (counts[MagicSchool.Arcane] >= 4) {
    synergies.push({ school: MagicSchool.Arcane, unitCount: counts[MagicSchool.Arcane], tier: 2, bonus: 'Player mana regen +50%', effect: 'arcane_2', value: 50 });
  } else if (counts[MagicSchool.Arcane] >= 2) {
    synergies.push({ school: MagicSchool.Arcane, unitCount: counts[MagicSchool.Arcane], tier: 1, bonus: 'Spells deal +20% damage', effect: 'arcane_1', value: 20 });
  }

  // LIFE
  if (counts[MagicSchool.Life] >= 6) {
    synergies.push({ school: MagicSchool.Life, unitCount: counts[MagicSchool.Life], tier: 3, bonus: 'Last Life unit cannot die below 1 HP', effect: 'life_3', value: 1 });
  } else if (counts[MagicSchool.Life] >= 4) {
    synergies.push({ school: MagicSchool.Life, unitCount: counts[MagicSchool.Life], tier: 2, bonus: 'One free 50 HP heal spell per battle unlocked', effect: 'life_2', value: 50 });
  } else if (counts[MagicSchool.Life] >= 2) {
    synergies.push({ school: MagicSchool.Life, unitCount: counts[MagicSchool.Life], tier: 1, bonus: 'All allies gain +15 max HP at battle start', effect: 'life_1', value: 15 });
  }

  return synergies;
}
