import React, { useEffect, useRef, useState } from 'react';
import { Engine, Scene, Vector3, HemisphericLight, MeshBuilder, StandardMaterial, Color3, Color4, PointLight, ArcRotateCamera, DefaultRenderingPipeline, SpriteManager, Sprite, AbstractMesh } from '@babylonjs/core';
import { AdvancedDynamicTexture, Rectangle, Control, TextBlock } from '@babylonjs/gui';
import { useGameStore } from '../../store';
import { CombatEngine } from '../../systems/CombatEngine';
import { globalEventBus } from '../../EventBus';
import { Unit, MagicSchool, Spell } from '../../types';
import { SCHOOL_COLORS, ENEMY_SCHOOL_COLORS, MANA_REGEN } from '../../constants';
import { createUnit } from '../../data/units';
import SynergyHUD from '../HUD/SynergyHUD';
import SummonBar from '../HUD/SummonBar';
import { ActiveSynergy } from '../../systems/SynergySystem';
import { getBackground } from '../../utils/assetHelper';

interface BattleProps {
  onWin: () => void;
  onLose: () => void;
}

export function getCoordinatesForPosition(pos: number, isEnemy: boolean = false): { x: number, z: number } {
  const row = Math.floor((pos - 1) / 3); // 0 for 1,2,3 (Back), 1 for 4,5,6 (Mid), 2 for 7,8,9 (Front)
  const col = (pos - 1) % 3; // 0, 1, 2

  const x = isEnemy ? 12 - (row * 4) : -12 + (row * 4);
  const z = (col - 1) * 4;
  return { x, z };
}

export default function Battle({ onWin, onLose }: BattleProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [playerMana, setPlayerMana] = useState(0);
  const [synergies, setSynergies] = useState<ActiveSynergy[]>([]);
  const [activeUnitCount, setActiveUnitCount] = useState(0);
  const [onFieldIds, setOnFieldIds] = useState<Set<string>>(new Set());
  const maxPlayerMana = 100;
  const { heroes, summonRoster, spellbook, formation, currentNodeMap, currentNodeIndex } = useGameStore();
  const combatEngineRef = useRef<CombatEngine | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new Engine(canvasRef.current, true);
    const scene = new Scene(engine);
    scene.clearColor = new Color4(0.05, 0.05, 0.05, 1);

    // Camera: Partial top-down, 55° angle, fixed rotation
    const camera = new ArcRotateCamera('camera', Math.PI / 2, Math.PI / 3.27, 25, Vector3.Zero(), scene);
    camera.attachControl(canvasRef.current, true);
    camera.lowerRadiusLimit = 10;
    camera.upperRadiusLimit = 40;
    camera.lowerBetaLimit = Math.PI / 4;
    camera.upperBetaLimit = Math.PI / 2.5;

    // Lighting
    const hemiLight = new HemisphericLight('hemiLight', new Vector3(0, 1, 0), scene);
    hemiLight.intensity = 0.3;

    // Warm torch point lights at arena corners
    const corners = [
      new Vector3(10, 2, 10),
      new Vector3(-10, 2, 10),
      new Vector3(10, 2, -10),
      new Vector3(-10, 2, -10),
    ];
    corners.forEach((pos, i) => {
      const light = new PointLight(`torch${i}`, pos, scene);
      light.diffuse = new Color3(1, 0.5, 0.2);
      light.intensity = 0.8;
    });

    // Arena: Hexagonal stone platform
    const arena = MeshBuilder.CreateCylinder('arena', { diameter: 30, height: 1, tessellation: 6 }, scene);
    arena.position.y = -0.5;
    const arenaMat = new StandardMaterial('arenaMat', scene);
    arenaMat.diffuseColor = new Color3(0.1, 0.1, 0.1);
    arena.material = arenaMat;
    arena.convertToFlatShadedMesh();

    // Post-process: Pixelation and Vignette
    const pipeline = new DefaultRenderingPipeline('default', true, scene, [camera]);
    pipeline.imageProcessingEnabled = true;
    pipeline.imageProcessing.vignetteEnabled = true;
    pipeline.imageProcessing.vignetteWeight = 2;
    pipeline.imageProcessing.vignetteColor = new Color4(0, 0, 0, 1);

    // Pixelation (render at 35% res)
    engine.setHardwareScalingLevel(1 / 0.35);

    // GUI for HP bars and Damage Numbers
    const advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI('UI');

    // Sprite Manager for particles
    const spriteManager = new SpriteManager('particleManager', 'https://playground.babylonjs.com/textures/player.png', 100, { width: 64, height: 64 }, scene);

    // Mesh Dictionary
    const unitMeshes: Record<string, AbstractMesh> = {};
    const unitUIs: Record<string, { container: Rectangle, hpBar: Rectangle }> = {};

    const createUnitMesh = (unit: Unit) => {
      // School emissive color map
      const SCHOOL_EMISSIVE: Record<string, [number, number, number]> = {
        Fire: [0.75, 0.22, 0.17],
        Nature: [0.15, 0.68, 0.38],
        Death: [0.42, 0.20, 0.51],
        Arcane: [0.18, 0.52, 0.76],
        Life: [0.94, 0.70, 0.48],
        ice: [0.36, 0.68, 0.87],
        lightning: [0.95, 0.82, 0.25],
        earth: [0.49, 0.40, 0.04],
      };

      let mesh;
      const baseSize = 1.5;
      const unitScale = unit.scale ?? 1.0;

      switch (unit.meshType) {
        case 'box':
          mesh = MeshBuilder.CreateBox(unit.id, { size: baseSize }, scene); break;
        case 'cone':
          mesh = MeshBuilder.CreateCylinder(unit.id, { diameterTop: 0, diameterBottom: baseSize, height: baseSize * 1.4, tessellation: 12 }, scene); break;
        case 'sphere':
          mesh = MeshBuilder.CreateSphere(unit.id, { diameter: baseSize, segments: 10 }, scene); break;
        case 'torus':
          mesh = MeshBuilder.CreateTorus(unit.id, { diameter: baseSize, thickness: 0.45, tessellation: 16 }, scene); break;
        case 'cylinder':
          mesh = MeshBuilder.CreateCylinder(unit.id, { diameter: 1, height: 2 }, scene); break;
        case 'octahedron':
          mesh = MeshBuilder.CreatePolyhedron(unit.id, { type: 1, size: 1 }, scene); break;
        case 'tetrahedron':
          mesh = MeshBuilder.CreatePolyhedron(unit.id, { type: 0, size: 1 }, scene); break;
        case 'boss':
          mesh = MeshBuilder.CreateTorusKnot(unit.id, { radius: 1, tube: 0.4 }, scene); break;
        default:
          mesh = MeshBuilder.CreateBox(unit.id, { size: baseSize }, scene);
      }

      // Apply companion scale
      if (unitScale !== 1.0) {
        mesh.scaling.setAll(unitScale);
      }

      mesh.position = new Vector3(unit.x || 0, 1, unit.z || 0);

      const mat = new StandardMaterial(`${unit.id}_mat`, scene);
      const hexColor = unit.isHero || unit.isSummon ? SCHOOL_COLORS[unit.school] : ENEMY_SCHOOL_COLORS[unit.school];
      mat.diffuseColor = Color3.FromHexString(hexColor);

      // Emissive glow: 30% for companions (scale >= 1.5), 10% for standard units
      const emissiveValues = SCHOOL_EMISSIVE[unit.school] ?? [0.2, 0.2, 0.2];
      const glowIntensity = unitScale >= 1.5 ? 0.30 : 0.10;
      mat.emissiveColor = new Color3(
        emissiveValues[0] * glowIntensity,
        emissiveValues[1] * glowIntensity,
        emissiveValues[2] * glowIntensity,
      );

      mesh.material = mat;
      mesh.convertToFlatShadedMesh();

      unitMeshes[unit.id] = mesh;

      // HP Bar
      const rect = new Rectangle();
      rect.width = "40px";
      rect.height = "8px";
      rect.background = "red";
      rect.thickness = 1;
      rect.color = "black";
      advancedTexture.addControl(rect);
      rect.linkWithMesh(mesh);
      rect.linkOffsetY = -30;

      const hpBar = new Rectangle();
      hpBar.width = "100%";
      hpBar.height = "100%";
      hpBar.background = "green";
      hpBar.thickness = 0;
      hpBar.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
      rect.addControl(hpBar);

      unitUIs[unit.id] = { container: rect, hpBar };
    };

    const showDamageNumber = (mesh: AbstractMesh, damage: number, isCrit: boolean, isEnemyDamage: boolean) => {
      const text = new TextBlock();
      text.text = damage.toString();
      text.color = isEnemyDamage ? "red" : (isCrit ? "yellow" : "white");
      text.fontSize = 24;
      text.fontFamily = "'Press Start 2P', monospace";
      text.outlineWidth = 4;
      text.outlineColor = "black";
      advancedTexture.addControl(text);
      text.linkWithMesh(mesh);
      text.linkOffsetY = -50;

      let alpha = 1;
      let offsetY = -50;
      const anim = scene.onBeforeRenderObservable.add(() => {
        alpha -= 0.02;
        offsetY -= 1;
        text.alpha = alpha;
        text.linkOffsetY = offsetY;
        if (alpha <= 0) {
          advancedTexture.removeControl(text);
          scene.onBeforeRenderObservable.remove(anim);
        }
      });
    };

    // Setup initial units based on formation and heroes
    const initialHeroes = heroes.map(h => {
      const coords = getCoordinatesForPosition(h.position);
      return { ...h, x: coords.x, z: coords.z };
    });

    const initialSummons: Unit[] = [];
    Object.entries(formation).forEach(([slotStr, unitId]) => {
      if (unitId) {
        const summon = summonRoster.find(s => s.id === unitId);
        if (summon) {
          const coords = getCoordinatesForPosition(parseInt(slotStr));
          initialSummons.push({ ...summon, position: parseInt(slotStr) as any, x: coords.x, z: coords.z });
        }
      }
    });

    const playerUnits = [...initialHeroes, ...initialSummons];
    setActiveUnitCount(playerUnits.length);
    setOnFieldIds(new Set(initialSummons.map(s => s.id)));

    const currentMapNode = currentNodeMap && currentNodeIndex !== null ? currentNodeMap[currentNodeIndex] : null;

    const initialEnemies = currentMapNode && currentMapNode.enemies ? currentMapNode.enemies.map((e, i) => {
      const coords = getCoordinatesForPosition(e.position || (i + 1), true);
      return { ...e, x: coords.x, z: coords.z };
    }) : [];

    [...playerUnits, ...initialEnemies].forEach(createUnitMesh);

    combatEngineRef.current = new CombatEngine(playerUnits, initialEnemies);
    combatEngineRef.current.start();

    // Event Listeners
    const handleMoved = (payload: unknown) => {
      const { unit, x, z } = payload as { unit: Unit, x: number, z: number };
      if (unitMeshes[unit.id]) {
        unitMeshes[unit.id].position.x = x;
        unitMeshes[unit.id].position.z = z;
      }
    };

    const handleAttacked = (payload: unknown) => {
      const { attacker, target, damage } = payload as { attacker: Unit, target: Unit, damage: number };
      const attackerMesh = unitMeshes[attacker.id];
      const targetMesh = unitMeshes[target.id];

      if (attackerMesh) {
        // Attack animation: quick scale pulse
        const originalScale = attackerMesh.scaling.clone();
        attackerMesh.scaling = originalScale.scale(1.3);
        setTimeout(() => {
          if (unitMeshes[attacker.id]) {
            unitMeshes[attacker.id].scaling = originalScale;
          }
        }, 150);
      }

      if (targetMesh) {
        showDamageNumber(targetMesh, damage, false, target.isHero || target.isSummon);
        // Update HP bar
        if (unitUIs[target.id]) {
          const percent = Math.max(0, target.stats.hp / target.stats.maxHp);
          unitUIs[target.id].hpBar.width = `${percent * 100}%`;
        }
      }
    };

    const handleDied = (payload: unknown) => {
      const { unit } = payload as { unit: Unit };
      if (unitMeshes[unit.id]) {
        unitMeshes[unit.id].dispose();
        delete unitMeshes[unit.id];
      }
      if (unitUIs[unit.id]) {
        advancedTexture.removeControl(unitUIs[unit.id].container);
        delete unitUIs[unit.id];
      }

      if (unit.isHero || unit.isSummon) {
        setActiveUnitCount(prev => prev - 1);
        if (unit.isSummon) {
          // The unit.id might have a timestamp appended if spawned from bar,
          // but we need to remove the base ID from onFieldIds.
          // Let's just remove the base ID.
          const baseId = unit.id.split('_')[0] + '_' + unit.id.split('_')[1]; // e.g., summon_fire
          setOnFieldIds(prev => {
            const next = new Set(prev);
            // We need to find the original summon ID.
            // If the unit was in initialSummons, its ID is the original ID.
            // If spawned from bar, it's originalId_timestamp.
            // Let's just remove any ID that matches the prefix.
            for (const idValue of next) {
              const id = idValue as string;
              if (unit.id.startsWith(id)) {
                next.delete(id);
                break;
              }
            }
            return next;
          });
        }
      }

      // Particle burst
      const sprite = new Sprite("death", spriteManager);
      sprite.position = new Vector3(unit.x || 0, 1, unit.z || 0);
      sprite.playAnimation(0, 7, false, 100, () => {
        sprite.dispose();
      });
    };

    const handleTick = (payload: unknown) => {
      const tickPayload = payload as { synergies?: ActiveSynergy[] };
      setPlayerMana(prev => Math.min(maxPlayerMana, prev + MANA_REGEN));
      if (tickPayload && tickPayload.synergies) {
        setSynergies(tickPayload.synergies);
      }
    };

    const handleSpawned = (payload: unknown) => {
      const { unit } = payload as { unit: Unit };
      createUnitMesh(unit);
      if (unit.isHero || unit.isSummon) {
        setActiveUnitCount(prev => prev + 1);
        if (unit.isSummon) {
          setOnFieldIds(prev => {
            const next = new Set(prev);
            // Extract base ID if it has a timestamp
            const parts = unit.id.split('_');
            if (parts.length >= 3 && !isNaN(Number(parts[parts.length - 1]))) {
              parts.pop();
              next.add(parts.join('_'));
            } else {
              next.add(unit.id);
            }
            return next;
          });
        }
      }
    };

    const handleManaGain = (payload: unknown) => {
      const { amount } = payload as { amount: number };
      setPlayerMana(prev => Math.min(maxPlayerMana, prev + amount));
    };

    globalEventBus.on('unit:moved', handleMoved);
    globalEventBus.on('unit:attacked', handleAttacked);
    globalEventBus.on('unit:died', handleDied);
    globalEventBus.on('battle:tick', handleTick);
    globalEventBus.on('unit:spawned', handleSpawned);
    globalEventBus.on('player:mana_gain', handleManaGain);
    globalEventBus.on('battle:won', onWin);
    globalEventBus.on('battle:lost', onLose);

    engine.runRenderLoop(() => {
      scene.render();
    });

    const handleResize = () => engine.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      globalEventBus.off('unit:moved', handleMoved);
      globalEventBus.off('unit:attacked', handleAttacked);
      globalEventBus.off('unit:died', handleDied);
      globalEventBus.off('battle:tick', handleTick);
      globalEventBus.off('unit:spawned', handleSpawned);
      globalEventBus.off('player:mana_gain', handleManaGain);
      globalEventBus.off('battle:won', onWin);
      globalEventBus.off('battle:lost', onLose);

      if (combatEngineRef.current) {
        combatEngineRef.current.stop();
      }
      scene.dispose();
      engine.dispose();
    };
  }, [heroes, onWin, onLose]);

  const handleCastSpell = (spell: Spell) => {
    if (playerMana >= spell.manaCost) {
      setPlayerMana(prev => prev - spell.manaCost);
      globalEventBus.emit('spell:cast', { spell });
      console.log(`Casted ${spell.name}`);
    }
  };

  const handleSummon = (summonId: string) => {
    const summon = summonRoster.find(s => s.id === summonId);
    if (!summon || !combatEngineRef.current) return;

    const cost = summon.manaCost || 0;
    if (playerMana >= cost && activeUnitCount < 9) {
      setPlayerMana(prev => prev - cost);
      combatEngineRef.current.spawnSummonFromBar(summon);
    }
  };

  return (
    <div
      className="relative w-full h-full flex flex-col"
      style={{
        backgroundImage: `url('${getBackground('battleArena')}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="absolute top-4 left-4 z-10 font-mono text-white text-xl drop-shadow-md">
        Player Mana: {playerMana} / {maxPlayerMana}
      </div>

      <SynergyHUD synergies={synergies} />

      <canvas ref={canvasRef} className="w-full h-full outline-none flex-1" />

      {/* UI Overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-4 flex flex-col items-center gap-4 pointer-events-none">

        <SummonBar
          playerMana={playerMana}
          onSummon={handleSummon}
          activeUnitCount={activeUnitCount}
          onFieldIds={onFieldIds}
        />

        {/* Spell Bar */}
        <div className="flex gap-2 pointer-events-auto">
          {spellbook.length > 0 ? spellbook.map((spell, i) => (
            <button
              key={i}
              onClick={() => handleCastSpell(spell)}
              disabled={playerMana < spell.manaCost}
              className="px-4 py-2 bg-zinc-900 border-2 rounded text-white hover:bg-zinc-800 disabled:opacity-50 transition-colors flex flex-col items-center"
              style={{ borderColor: SCHOOL_COLORS[spell.school], fontFamily: "'Press Start 2P', monospace", fontSize: '10px' }}
            >
              <span>{spell.name}</span>
              <span className="text-zinc-400 mt-1">{spell.manaCost} MP</span>
            </button>
          )) : (
            <div className="px-4 py-2 bg-zinc-900/80 border-2 border-zinc-700 rounded text-zinc-500" style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '10px' }}>
              No Spells Learned
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
