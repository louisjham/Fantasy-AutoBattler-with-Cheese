import { Unit, MagicSchool, MeshType } from '../types';

export const UNIT_TEMPLATES: Record<string, Partial<Unit>> = {
  'warrior_fire': {
    name: 'Fire Warrior',
    school: MagicSchool.Fire,
    tier: 1,
    stats: { hp: 100, maxHp: 100, attack: 15, defense: 5, speed: 1, mana: 0, maxMana: 50 },
    passives: [],
    meshType: 'box'
  },
  'mage_arcane': {
    name: 'Arcane Mage',
    school: MagicSchool.Arcane,
    tier: 1,
    stats: { hp: 60, maxHp: 60, attack: 25, defense: 2, speed: 1, mana: 0, maxMana: 100 },
    passives: [],
    meshType: 'octahedron'
  },
  'summon_nature': {
    name: 'Nature Wisp',
    school: MagicSchool.Nature,
    tier: 1,
    stats: { hp: 40, maxHp: 40, attack: 10, defense: 1, speed: 2, mana: 0, maxMana: 30 },
    passives: [],
    meshType: 'tetrahedron'
  },
  'archer_life': {
    name: 'Life Archer',
    school: MagicSchool.Life,
    tier: 1,
    stats: { hp: 70, maxHp: 70, attack: 18, defense: 3, speed: 1, mana: 0, maxMana: 40 },
    passives: [],
    meshType: 'cylinder'
  },
  'boss_death': {
    name: 'Death Lord',
    school: MagicSchool.Death,
    tier: 3,
    stats: { hp: 500, maxHp: 500, attack: 40, defense: 15, speed: 1, mana: 0, maxMana: 200 },
    passives: [],
    meshType: 'boss'
  }
};

export function createUnit(id: string, templateId: string, position: number, isHero: boolean, isSummon: boolean): Unit {
  const template = UNIT_TEMPLATES[templateId];
  if (!template) throw new Error(`Unit template ${templateId} not found`);

  return {
    id,
    name: template.name!,
    school: template.school!,
    tier: (template.tier as 1 | 2 | 3 | 4) || 1,
    stats: { ...template.stats! },
    passives: [...(template.passives || [])],
    position: (position as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9),
    isHero,
    isSummon,
    spriteColor: template.school!,
    meshType: template.meshType as MeshType,
    weapon: null,
    armor: null,
    level: 1,
    xp: 0,
    subclass: null
  };
}
