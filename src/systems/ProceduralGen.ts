import { FloorNode, MagicSchool, NodeType, Unit } from '../types';

const BIOMES = [
  { name: "The Ashen Wastes", school: MagicSchool.Fire },
  { name: "The Bone Marshes", school: MagicSchool.Death },
  { name: "The Verdant Labyrinth", school: MagicSchool.Nature },
  { name: "The Crystal Spire", school: MagicSchool.Arcane },
  { name: "The Celestial Gate", school: MagicSchool.Life }
];

export function generateFloor(floor: number, rng: () => number): FloorNode[] {
  const maxDepth = 12 + Math.floor(rng() * 5); // 12 to 16
  const biomeIdx = Math.min(floor - 1, 4);
  const biome = BIOMES[biomeIdx];

  const nodesByDepth: FloorNode[][] = [];

  for (let d = 0; d < maxDepth; d++) {
    const numNodes = (d === 0 || d === maxDepth - 1) ? 1 : 2 + Math.floor(rng() * 2); // 1 node at start/end, 2-3 otherwise
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
      
      // Enemies
      const enemies: Unit[] = [];
      let goldReward = 0;
      
      if (type === 'combat' || type === 'elite' || type === 'boss') {
        const school = rng() < 0.7 ? biome.school : Object.values(MagicSchool)[Math.floor(rng() * 5)];
        const baseCount = 2 + Math.floor(d / 4);
        const count = type === 'elite' ? baseCount + 1 : (type === 'boss' ? 3 : baseCount);
        
        for (let e = 0; e < count; e++) {
          const isBoss = type === 'boss' && e === 0;
          const isMinion = type === 'boss' && e > 0;
          
          let statMult = (1 + (floor - 1) * 0.3) * (1 + d * 0.08);
          if (type === 'elite') statMult *= 1.4;
          if (isBoss) statMult *= 2.5;
          if (isMinion) statMult *= 1.2;

          const baseStats = { hp: 50, maxHp: 50, attack: 10, defense: 2, speed: 1, mana: 0, maxMana: 50 };
          
          enemies.push({
            id: `${id}_enemy${e}`,
            name: isBoss ? `${school} Boss` : `${school} Grunt`,
            school: school,
            tier: isBoss ? 3 : (type === 'elite' ? 2 : 1),
            stats: {
              hp: Math.floor(baseStats.hp * statMult),
              maxHp: Math.floor(baseStats.maxHp * statMult),
              attack: Math.floor(baseStats.attack * statMult),
              defense: Math.floor(baseStats.defense * statMult),
              speed: baseStats.speed,
              mana: baseStats.mana,
              maxMana: baseStats.maxMana
            },
            passives: [],
            position: (e + 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9,
            isHero: false,
            isSummon: false,
            spriteColor: school,
            meshType: isBoss ? 'boss' : 'box',
            weapon: null,
            armor: null,
            level: floor,
            xp: 0,
            subclass: null
          });
        }

        if (type === 'combat') goldReward = 10 + Math.floor(rng() * 16);
        else if (type === 'elite') goldReward = 25 + Math.floor(rng() * 26);
        else if (type === 'boss') goldReward = 75 + Math.floor(rng() * 76);
      }

      layerNodes.push({
        id,
        type,
        depth: d,
        enemies,
        rewards: [], // We'll populate this later or leave empty
        completed: false,
        biome: biome.name,
        goldReward,
        nextNodes: []
      });
    }
    nodesByDepth.push(layerNodes);
  }

  // Connect nodes
  for (let d = 0; d < maxDepth - 1; d++) {
    const currentLayer = nodesByDepth[d];
    const nextLayer = nodesByDepth[d + 1];

    // Ensure every node in currentLayer connects to at least one in nextLayer
    for (let i = 0; i < currentLayer.length; i++) {
      const targetIdx = Math.min(i, nextLayer.length - 1);
      currentLayer[i].nextNodes!.push(nextLayer[targetIdx].id);
      
      // Random extra connections
      if (nextLayer.length > 1 && rng() < 0.3) {
        const extraIdx = (targetIdx + 1) % nextLayer.length;
        if (!currentLayer[i].nextNodes!.includes(nextLayer[extraIdx].id)) {
          currentLayer[i].nextNodes!.push(nextLayer[extraIdx].id);
        }
      }
    }

    // Ensure every node in nextLayer has at least one incoming connection
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
