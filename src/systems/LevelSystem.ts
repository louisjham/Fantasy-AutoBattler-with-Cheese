import { Unit } from '../types';

export function calculateXpGain(unit: Unit, enemiesKilled: number, damageDealt: number): number {
  return (enemiesKilled * 20) + Math.floor(damageDealt / 10);
}

export function checkLevelUp(unit: Unit): boolean {
  if (unit.level >= 5) return false;
  
  let requiredXp = 0;
  switch (unit.level) {
    case 1: requiredXp = 50; break;
    case 2: requiredXp = 120; break;
    case 3: requiredXp = 200; break;
    case 4: requiredXp = 300; break;
    default: return false;
  }
  
  return unit.xp >= requiredXp;
}

export function applyLevelUp(unit: Unit): Unit {
  if (unit.level >= 5) return unit;
  
  let requiredXp = 0;
  switch (unit.level) {
    case 1: requiredXp = 50; break;
    case 2: requiredXp = 120; break;
    case 3: requiredXp = 200; break;
    case 4: requiredXp = 300; break;
  }

  const newUnit = { ...unit };
  newUnit.level += 1;
  newUnit.xp -= requiredXp;
  
  newUnit.stats = { ...newUnit.stats };
  newUnit.stats.maxHp = Math.floor(newUnit.stats.maxHp * 1.1);
  newUnit.stats.hp = newUnit.stats.maxHp;
  newUnit.stats.attack = Math.floor(newUnit.stats.attack * 1.08);
  newUnit.stats.defense = Math.floor(newUnit.stats.defense * 1.08);

  return newUnit;
}

export function checkClassAdvancement(unit: Unit): boolean {
  return unit.level === 5 && unit.subclass === null;
}
