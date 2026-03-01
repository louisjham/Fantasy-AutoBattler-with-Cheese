import { FloorNode, MagicSchool, NodeType, PassiveEffect, Unit } from '../types';
import { BOSSES } from '../data/bosses';
import { FLOOR_MULTIPLIERS, DIFFICULTY_MULTIPLIERS } from '../data/enemyScaling';

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const BIOMES = [
  { name: "The Ashen Wastes", school: MagicSchool.Fire },
  { name: "The Bone Marshes", school: MagicSchool.Death },
  { name: "The Verdant Labyrinth", school: MagicSchool.Nature },
  { name: "The Crystal Spire", school: MagicSchool.Arcane },
  { name: "The Celestial Gate", school: MagicSchool.Life },
];


// ─────────────────────────────────────────────────────────────────────────────
// Task 2 — Enemy perk pools by school
// ─────────────────────────────────────────────────────────────────────────────

const ENEMY_PERKS: Record<MagicSchool, PassiveEffect[][]> = {
  [MagicSchool.Fire]: [
    [{ trigger: 'on_hit', effect: 'enemy_burning_aura', value: 4 }],  // Burning Aura: apply Burning on every hit
    [{ trigger: 'on_hit', effect: 'enemy_ignite_on_hit', value: 5 }],  // Ignite on Hit
    [{ trigger: 'on_damaged', effect: 'enemy_enrage_low_hp', value: 30 }], // Enrage below 30% HP
  ],
  [MagicSchool.Nature]: [
    [{ trigger: 'on_tick', effect: 'enemy_regen_5hp', value: 5 }],  // Regen 5 HP/tick
    [{ trigger: 'on_tick', effect: 'enemy_pack_tactics', value: 5 }],  // Pack Tactics: +atk per ally alive
    [{ trigger: 'on_damaged', effect: 'enemy_thorns', value: 3 }],  // Thorns: return 3 dmg on hit
  ],
  [MagicSchool.Death]: [
    [{ trigger: 'on_death', effect: 'enemy_undying', value: 20 }], // Undying: revive once at 20% HP
    [{ trigger: 'on_tick', effect: 'enemy_fear_aura', value: 2 }],  // Fear Aura: reduce enemy atk
    [{ trigger: 'on_kill', effect: 'enemy_soul_drain', value: 15 }], // Soul Drain: heal on kill
  ],
  [MagicSchool.Arcane]: [
    [{ trigger: 'on_cast', effect: 'enemy_spell_shield', value: 1 }],  // Spell Shield: absorb one spell
    [{ trigger: 'on_hit', effect: 'enemy_mana_burn', value: 8 }],  // Mana Burn: drain player mana
    [{ trigger: 'on_damaged', effect: 'enemy_arcane_reflect', value: 5 }],  // Arcane Reflect: mirror damage
  ],
  [MagicSchool.Life]: [
    [{ trigger: 'on_tick', effect: 'enemy_regen_5hp', value: 5 }],  // Regen
    [{ trigger: 'on_damaged', effect: 'enemy_thorns', value: 2 }],  // Thorns (lighter)
    [{ trigger: 'battle_start', effect: 'enemy_fortify', value: 10 }], // Fortify: +10 defense at start
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/** Task 1 — exact per-floor multiplier */
export function getFloorStatMultiplier(floor: number): number {
  return FLOOR_MULTIPLIERS[floor] ?? 1 + (floor - 1) * 0.4;
}

/** Pick N distinct random perks from the school pool */
function pickEnemyPerks(
  school: MagicSchool,
  count: number,
  rng: () => number
): PassiveEffect[] {
  const pool = ENEMY_PERKS[school] ?? ENEMY_PERKS[MagicSchool.Fire];
  const shuffled = [...pool].sort(() => rng() - 0.5);
  const picked = shuffled.slice(0, count);
  return picked.flat();
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN GENERATOR
// ─────────────────────────────────────────────────────────────────────────────

export function generateFloor(
  floor: number,
  rng: () => number,
  difficulty: string = 'normal'
): FloorNode[] {
  const maxDepth = 12 + Math.floor(rng() * 5); // 12–16 nodes deep
  const biomeIdx = Math.min(floor - 1, 4);
  const biome = BIOMES[biomeIdx];

  // Task 1 — combined stat multiplier
  const floorMult = getFloorStatMultiplier(floor);
  const diffMult = DIFFICULTY_MULTIPLIERS[difficulty] ?? 1.0;
  const statMult = floorMult * diffMult;

  const nodesByDepth: FloorNode[][] = [];

  for (let d = 0; d < maxDepth; d++) {
    const numNodes = (d === 0 || d === maxDepth - 1)
      ? 1
      : 2 + Math.floor(rng() * 2); // 2–3 intermediate nodes

    const layerNodes: FloorNode[] = [];

    for (let i = 0; i < numNodes; i++) {
      let type: NodeType = 'combat';
      if (d === maxDepth - 1) {
        type = 'boss';
      } else if (d > 0) {
        const r = rng();
        if (r < 0.45) type = 'combat';
        else if (r < 0.65) type = 'event';
        else if (r < 0.80) type = 'shop';
        else if (r < 0.90) type = 'elite';
        else type = 'rest';
      }

      const id = `floor${floor}_node${d}_${i}`;
      const enemies: Unit[] = [];
      let goldReward = 0;
      let bossSpecialMechanic: string | undefined;

      if (type === 'combat' || type === 'elite' || type === 'boss') {

        if (type === 'boss') {
          // ── Task 3 — named bosses on even floors, legacy BOSSES on odd ──────
          const bossDef = BOSSES[floor] || BOSSES[5];

          // Apply floor+difficulty scaling to boss stats too
          const bossScaled: Unit = {
            ...bossDef.unit,
            id: `${id}_boss`,
            stats: {
              hp: Math.round(bossDef.unit.stats.hp * statMult),
              maxHp: Math.round(bossDef.unit.stats.maxHp * statMult),
              attack: Math.round(bossDef.unit.stats.attack * statMult),
              defense: Math.round(bossDef.unit.stats.defense * statMult),
              speed: bossDef.unit.stats.speed,
              mana: bossDef.unit.stats.mana,
              maxMana: bossDef.unit.stats.maxMana,
            },
            // Task 2 — boss gets 2–3 perks from its school
            passives: [
              ...bossDef.unit.passives,
              ...pickEnemyPerks(bossDef.unit.school, 2 + (rng() < 0.5 ? 1 : 0), rng),
            ],
          };
          enemies.push(bossScaled);

          bossDef.minions.forEach((m, idx) => {
            enemies.push({
              ...m,
              id: `${id}_minion_${idx}`,
              stats: {
                hp: Math.round(m.stats.hp * statMult),
                maxHp: Math.round(m.stats.maxHp * statMult),
                attack: Math.round(m.stats.attack * statMult),
                defense: Math.round(m.stats.defense * statMult),
                speed: m.stats.speed,
                mana: m.stats.mana,
                maxMana: m.stats.maxMana,
              },
              passives: [...m.passives],
            });
          });

          goldReward = 75 + Math.floor(rng() * 76);
          bossSpecialMechanic = bossDef.specialMechanic;

        } else {
          // ── Regular combat / elite rooms ───────────────────────────────────
          const school = rng() < 0.7
            ? biome.school
            : Object.values(MagicSchool)[Math.floor(rng() * 5)];

          const baseCount = floor === 1
            ? 1
            : Math.min(4, 1 + Math.floor((floor + d) / 5));
          const count = type === 'elite' ? baseCount + 1 : baseCount;

          // Depth bonus: deeper nodes in a floor are slightly harder
          const depthBonus = 1 + d * 0.05;
          // Elite rooms: +30% on top
          const eliteBonus = type === 'elite' ? 1.30 : 1.0;
          const finalMult = statMult * depthBonus * eliteBonus;

          const baseStats = { hp: 25, maxHp: 25, attack: 6, defense: 2, speed: 1, mana: 0, maxMana: 50 };

          for (let e = 0; e < count; e++) {
            // Task 2 — elite rooms grant 1 random perk; combat rooms grant 0
            const enemyPerks: PassiveEffect[] = type === 'elite'
              ? pickEnemyPerks(school, 1, rng)
              : [];

            enemies.push({
              id: `${id}_enemy${e}`,
              name: type === 'elite' ? `Elite ${school} Warrior` : `${school} Grunt`,
              school,
              tier: type === 'elite' ? 2 : 1,
              stats: {
                hp: Math.floor(baseStats.hp * finalMult),
                maxHp: Math.floor(baseStats.maxHp * finalMult),
                attack: Math.floor(baseStats.attack * finalMult),
                defense: Math.floor(baseStats.defense * finalMult),
                speed: baseStats.speed,
                mana: baseStats.mana,
                maxMana: baseStats.maxMana,
              },
              passives: enemyPerks,
              position: (e + 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9,
              isHero: false,
              isSummon: false,
              spriteColor: school,
              meshType: type === 'elite' ? 'cylinder' : 'box',
              weapon: null,
              armor: null,
              level: floor,
              xp: 0,
              subclass: null,
            });
          }

          goldReward = type === 'combat'
            ? 10 + Math.floor(rng() * 16)
            : 25 + Math.floor(rng() * 26);
        }
      }

      layerNodes.push({
        id,
        type,
        depth: d,
        enemies,
        rewards: [],
        completed: false,
        biome: biome.name,
        goldReward,
        bossSpecialMechanic,
        nextNodes: [],
      });
    }

    nodesByDepth.push(layerNodes);
  }

  // ── Connect nodes ──────────────────────────────────────────────────────────
  for (let d = 0; d < maxDepth - 1; d++) {
    const currentLayer = nodesByDepth[d];
    const nextLayer = nodesByDepth[d + 1];

    for (let i = 0; i < currentLayer.length; i++) {
      const targetIdx = Math.min(i, nextLayer.length - 1);
      currentLayer[i].nextNodes!.push(nextLayer[targetIdx].id);

      // Optional extra connection
      if (nextLayer.length > 1 && rng() < 0.3) {
        const extraIdx = (targetIdx + 1) % nextLayer.length;
        if (!currentLayer[i].nextNodes!.includes(nextLayer[extraIdx].id)) {
          currentLayer[i].nextNodes!.push(nextLayer[extraIdx].id);
        }
      }
    }

    // Ensure every next-layer node has at least one incoming edge
    for (let j = 0; j < nextLayer.length; j++) {
      const hasIncoming = currentLayer.some(n => n.nextNodes!.includes(nextLayer[j].id));
      if (!hasIncoming) {
        const sourceIdx = Math.min(j, currentLayer.length - 1);
        if (!currentLayer[sourceIdx].nextNodes!.includes(nextLayer[j].id)) {
          currentLayer[sourceIdx].nextNodes!.push(nextLayer[j].id);
        }
      }
    }
  }

  return nodesByDepth.flat();
}
