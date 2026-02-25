// ============================================================
// ENUMS
// ============================================================

export enum MagicSchool {
  Fire = 'Fire',
  Death = 'Death',
  Nature = 'Nature',
  Arcane = 'Arcane',
  Life = 'Life'
}

export enum PlayerArchetype {
  Conjurer = 'Conjurer',
  Warlord = 'Warlord',
  Mystic = 'Mystic'
}

export type WeaponEffect =
  | 'Flaming' | 'Poisoned' | 'Vampiric' | 'Thundering'
  | 'Cursed' | 'Frozen' | 'Shadowforged' | 'Blessed';

export type MeshType = 'box' | 'octahedron' | 'tetrahedron' | 'cylinder' | 'boss';

export type PassiveTrigger =
  | 'on_hit' | 'on_kill' | 'on_death' | 'on_spawn'
  | 'on_damaged' | 'on_tick' | 'on_cast' | 'battle_start';

export type NodeType = 'combat' | 'elite' | 'shop' | 'event' | 'rest' | 'boss';

// ============================================================
// BUILDING BLOCKS
// ============================================================

export interface UnitStats {
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
  mana: number;
  maxMana: number;
}

export interface PassiveEffect {
  trigger: PassiveTrigger;
  effect: string;
  value: number;
  school?: MagicSchool;
  processed?: boolean;  // loop guard flag for EventBus
}

// ============================================================
// EQUIPMENT
// ============================================================

export interface Weapon {
  id: string;
  name: string;
  school: MagicSchool | null;
  attackBonus: number;
  weaponEffect: WeaponEffect | null;
  tier: 1 | 2 | 3;
  description: string;
}

export interface Armor {
  id: string;
  name: string;
  school: MagicSchool | null;
  defenseBonus: number;
  hpBonus: number;
  passive: PassiveEffect | null;
  tier: 1 | 2 | 3;
  description: string;
}

export interface Consumable {
  id: string;
  name: string;
  effect: string;        // e.g. "heal_all_30" — parsed by CombatEngine
  value: number;
  useTiming: 'prebattle' | 'combat' | 'anytime';
  description: string;
}

export interface InventoryItem {
  type: 'weapon' | 'armor' | 'consumable';
  item: Weapon | Armor | Consumable;
  quantity: number;
}

// ============================================================
// CORE ENTITIES
// ============================================================

export interface Unit {
  id: string;
  name: string;
  school: MagicSchool;
  tier: 1 | 2 | 3 | 4;
  stats: UnitStats;
  passives: PassiveEffect[];
  position: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
  isHero: boolean;
  isSummon: boolean;
  spriteColor: string;
  meshType: MeshType;
  x?: number;            // runtime position in Babylon scene
  z?: number;            // runtime position in Babylon scene
  weapon: Weapon | null;
  armor: Armor | null;
  level: number;
  xp: number;
  subclass: string | null;
  manaCost?: number;
}

export interface Spell {
  id: string;
  name: string;
  school: MagicSchool;
  manaCost: number;
  effect: string;
  tags: string[];
  description: string;
}

export interface Perk {
  id: string;
  name: string;
  description: string;
  school?: MagicSchool;
  effect: string;
}

export interface FloorNode {
  type: NodeType;
  depth: number;
  enemies: Unit[];
  rewards: (Weapon | Armor | Spell | Perk | Consumable)[];
  completed: boolean;
  id: string;
  biome?: string;
  nextNodes?: string[];
  goldReward?: number;
}

// ============================================================
// RUN STATE
// ============================================================

export interface RunState {
  archetype: PlayerArchetype | null;
  floor: number;
  heroes: Unit[];
  summonRoster: Unit[];
  spellbook: Spell[];
  perkList: Perk[];
  gold: number;
  metaUnlocks: string[];
  inventory: InventoryItem[];
  equippedWeapons: Record<string, Weapon>;   // unitId → Weapon
  equippedArmor: Record<string, Armor>;      // unitId → Armor
  currentNodeMap: FloorNode[];
  currentNodeIndex: number;
  runXp: number;
  maxHeroSlots: number;
  maxSummonSlots: number;
  formation: Record<number, string | null>;
}

