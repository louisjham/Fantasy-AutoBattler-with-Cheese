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

export const SUMMONS: Partial<Unit>[] = [
  // FIRE summons
  { id:'ember_imp', name:'Ember Imp', school:MagicSchool.Fire, manaCost:2,
    stats:{hp:25,maxHp:25,attack:10,defense:2,speed:2,mana:0,maxMana:100},
    passives:[{trigger:'on_hit',effect:'apply_burning',value:1}],
    meshType:'tetrahedron' },
  { id:'fire_elemental', name:'Fire Elemental', school:MagicSchool.Fire, manaCost:4,
    stats:{hp:45,maxHp:45,attack:16,defense:4,speed:1,mana:0,maxMana:100},
    passives:[{trigger:'on_death',effect:'fire_explosion',value:15}],
    meshType:'octahedron' },
  { id:'magma_golem', name:'Magma Golem', school:MagicSchool.Fire, manaCost:6,
    stats:{hp:90,maxHp:90,attack:12,defense:10,speed:1,mana:0,maxMana:100},
    passives:[{trigger:'on_damaged',effect:'reflect_damage',value:3}],
    meshType:'box' },
  { id:'phoenix_chick', name:'Phoenix Chick', school:MagicSchool.Fire, manaCost:5,
    stats:{hp:40,maxHp:40,attack:14,defense:3,speed:2,mana:0,maxMana:100},
    passives:[{trigger:'on_death',effect:'revive_once',value:1}],
    meshType:'tetrahedron' },
  { id:'inferno_drake', name:'Inferno Drake', school:MagicSchool.Fire, manaCost:9,
    stats:{hp:120,maxHp:120,attack:24,defense:8,speed:2,mana:0,maxMana:100},
    passives:[{trigger:'on_hit',effect:'apply_burning',value:3}],
    meshType:'boss' },

  // DEATH summons
  { id:'skeleton_warrior', name:'Skeleton Warrior', school:MagicSchool.Death, manaCost:2,
    stats:{hp:30,maxHp:30,attack:9,defense:4,speed:1,mana:0,maxMana:100},
    passives:[{trigger:'on_death',effect:'spawn_skeleton',value:1}],
    meshType:'box' },
  { id:'shadow_wraith', name:'Shadow Wraith', school:MagicSchool.Death, manaCost:3,
    stats:{hp:28,maxHp:28,attack:13,defense:1,speed:3,mana:0,maxMana:100},
    passives:[{trigger:'on_hit',effect:'apply_cursed',value:1}],
    meshType:'octahedron' },
  { id:'bone_archer', name:'Bone Archer', school:MagicSchool.Death, manaCost:3,
    stats:{hp:25,maxHp:25,attack:14,defense:2,speed:2,mana:0,maxMana:100},
    passives:[{trigger:'on_kill',effect:'gain_mana',value:10}],
    meshType:'cylinder' },
  { id:'death_knight', name:'Death Knight', school:MagicSchool.Death, manaCost:6,
    stats:{hp:85,maxHp:85,attack:18,defense:9,speed:1,mana:0,maxMana:100},
    passives:[{trigger:'on_hit',effect:'lifesteal',value:4}],
    meshType:'box' },
  { id:'lich', name:'Lich', school:MagicSchool.Death, manaCost:8,
    stats:{hp:65,maxHp:65,attack:22,defense:5,speed:1,mana:50,maxMana:100},
    passives:[{trigger:'on_kill',effect:'raise_dead',value:1}],
    meshType:'octahedron' },

  // NATURE summons
  { id:'thorn_sprite', name:'Thorn Sprite', school:MagicSchool.Nature, manaCost:2,
    stats:{hp:22,maxHp:22,attack:8,defense:3,speed:3,mana:0,maxMana:100},
    passives:[{trigger:'on_damaged',effect:'reflect_damage',value:5}],
    meshType:'tetrahedron' },
  { id:'stone_lurker', name:'Stone Lurker', school:MagicSchool.Nature, manaCost:3,
    stats:{hp:70,maxHp:70,attack:8,defense:12,speed:1,mana:0,maxMana:100},
    passives:[{trigger:'battle_start',effect:'taunt',value:1}],
    meshType:'box' },
  { id:'forest_wolf', name:'Forest Wolf', school:MagicSchool.Nature, manaCost:3,
    stats:{hp:35,maxHp:35,attack:15,defense:3,speed:3,mana:0,maxMana:100},
    passives:[{trigger:'on_kill',effect:'attack_bonus',value:5}],
    meshType:'tetrahedron' },
  { id:'elder_treant', name:'Elder Treant', school:MagicSchool.Nature, manaCost:7,
    stats:{hp:130,maxHp:130,attack:10,defense:14,speed:1,mana:0,maxMana:100},
    passives:[{trigger:'on_tick',effect:'heal_allies',value:3}],
    meshType:'box' },
  { id:'verdant_hydra', name:'Verdant Hydra', school:MagicSchool.Nature, manaCost:9,
    stats:{hp:110,maxHp:110,attack:20,defense:10,speed:2,mana:0,maxMana:100},
    passives:[{trigger:'on_death',effect:'split_two',value:1}],
    meshType:'boss' },

  // ARCANE summons
  { id:'mana_familiar', name:'Mana Familiar', school:MagicSchool.Arcane, manaCost:2,
    stats:{hp:20,maxHp:20,attack:7,defense:2,speed:2,mana:30,maxMana:100},
    passives:[{trigger:'on_tick',effect:'regen_player_mana',value:2}],
    meshType:'tetrahedron' },
  { id:'iron_construct', name:'Iron Construct', school:MagicSchool.Arcane, manaCost:4,
    stats:{hp:75,maxHp:75,attack:11,defense:11,speed:1,mana:0,maxMana:100},
    passives:[{trigger:'battle_start',effect:'armor_all_allies',value:5}],
    meshType:'box' },
  { id:'arcane_turret', name:'Arcane Turret', school:MagicSchool.Arcane, manaCost:4,
    stats:{hp:30,maxHp:30,attack:18,defense:2,speed:0,mana:0,maxMana:100},
    passives:[{trigger:'on_hit',effect:'spell_damage_bonus',value:3}],
    meshType:'cylinder' },
  { id:'void_stalker', name:'Void Stalker', school:MagicSchool.Arcane, manaCost:6,
    stats:{hp:50,maxHp:50,attack:20,defense:4,speed:3,mana:0,maxMana:100},
    passives:[{trigger:'on_kill',effect:'become_invisible',value:2}],
    meshType:'octahedron' },
  { id:'chrono_golem', name:'Chrono Golem', school:MagicSchool.Arcane, manaCost:8,
    stats:{hp:95,maxHp:95,attack:15,defense:12,speed:1,mana:0,maxMana:100},
    passives:[{trigger:'battle_start',effect:'slow_all_enemies',value:1}],
    meshType:'box' },

  // LIFE summons
  { id:'acolyte', name:'Acolyte', school:MagicSchool.Life, manaCost:2,
    stats:{hp:28,maxHp:28,attack:7,defense:4,speed:1,mana:20,maxMana:100},
    passives:[{trigger:'on_tick',effect:'heal_lowest_ally',value:4}],
    meshType:'cylinder' },
  { id:'shield_bearer', name:'Shield Bearer', school:MagicSchool.Life, manaCost:3,
    stats:{hp:65,maxHp:65,attack:8,defense:13,speed:1,mana:0,maxMana:100},
    passives:[{trigger:'battle_start',effect:'shield_front_ally',value:20}],
    meshType:'box' },
  { id:'celestial_wisp', name:'Celestial Wisp', school:MagicSchool.Life, manaCost:3,
    stats:{hp:22,maxHp:22,attack:9,defense:2,speed:3,mana:40,maxMana:100},
    passives:[{trigger:'on_death',effect:'heal_all_allies',value:15}],
    meshType:'tetrahedron' },
  { id:'paladin', name:'Paladin', school:MagicSchool.Life, manaCost:6,
    stats:{hp:90,maxHp:90,attack:14,defense:12,speed:1,mana:0,maxMana:100},
    passives:[{trigger:'on_hit',effect:'holy_damage_bonus',value:5}],
    meshType:'box' },
  { id:'seraphim', name:'Seraphim', school:MagicSchool.Life, manaCost:9,
    stats:{hp:100,maxHp:100,attack:18,defense:10,speed:2,mana:60,maxMana:100},
    passives:[{trigger:'battle_start',effect:'revive_all_once',value:1}],
    meshType:'boss' }
];

export function createSummon(id: string, summonId: string, position: number): Unit {
  const template = SUMMONS.find(s => s.id === summonId);
  if (!template) throw new Error(`Summon template ${summonId} not found`);

  return {
    id,
    name: template.name!,
    school: template.school!,
    tier: (template.tier as 1 | 2 | 3 | 4) || 1,
    stats: { ...template.stats! },
    passives: [...(template.passives || [])],
    position: (position as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9),
    isHero: false,
    isSummon: true,
    spriteColor: template.school!,
    meshType: template.meshType as MeshType,
    weapon: null,
    armor: null,
    level: 1,
    xp: 0,
    subclass: null,
    manaCost: template.manaCost || 0
  };
}

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
