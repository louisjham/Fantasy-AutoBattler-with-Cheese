import React, { useEffect, useRef, useState } from 'react';
import { Engine, Scene, Vector3, HemisphericLight, MeshBuilder, StandardMaterial, Color3, Color4, PointLight, ArcRotateCamera, DefaultRenderingPipeline, SpriteManager, Sprite } from '@babylonjs/core';
import { AdvancedDynamicTexture, Rectangle, Control, TextBlock } from '@babylonjs/gui';
import { useGameStore } from '../../store';
import { CombatEngine } from '../../systems/CombatEngine';
import { globalEventBus } from '../../EventBus';
import { Unit, MagicSchool, Spell } from '../../types';
import { SCHOOL_COLORS, ENEMY_SCHOOL_COLORS, MANA_REGEN } from '../../constants';
import { createUnit } from '../../data/units';
import SynergyHUD from '../HUD/SynergyHUD';
import { ActiveSynergy } from '../../systems/SynergySystem';

interface BattleProps {
  onWin: () => void;
  onLose: () => void;
}

export default function Battle({ onWin, onLose }: BattleProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [playerMana, setPlayerMana] = useState(0);
  const [synergies, setSynergies] = useState<ActiveSynergy[]>([]);
  const maxPlayerMana = 100;
  const { heroes, summonRoster, spellbook } = useGameStore();
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
    const unitMeshes: Record<string, any> = {};
    const unitUIs: Record<string, any> = {};

    const createUnitMesh = (unit: Unit) => {
      let mesh;
      switch (unit.meshType) {
        case 'box': mesh = MeshBuilder.CreateBox(unit.id, { size: 1.5 }, scene); break;
        case 'octahedron': mesh = MeshBuilder.CreatePolyhedron(unit.id, { type: 1, size: 1 }, scene); break; // Octahedron
        case 'tetrahedron': mesh = MeshBuilder.CreatePolyhedron(unit.id, { type: 0, size: 1 }, scene); break; // Tetrahedron
        case 'cylinder': mesh = MeshBuilder.CreateCylinder(unit.id, { diameter: 1, height: 2 }, scene); break;
        case 'boss': mesh = MeshBuilder.CreateTorusKnot(unit.id, { radius: 1, tube: 0.4 }, scene); break;
        default: mesh = MeshBuilder.CreateBox(unit.id, { size: 1.5 }, scene);
      }
      
      mesh.position = new Vector3(unit.x || 0, 1, unit.z || 0);
      
      const mat = new StandardMaterial(`${unit.id}_mat`, scene);
      const hexColor = unit.isHero || unit.isSummon ? SCHOOL_COLORS[unit.school] : ENEMY_SCHOOL_COLORS[unit.school];
      mat.diffuseColor = Color3.FromHexString(hexColor);
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

    const showDamageNumber = (mesh: any, damage: number, isCrit: boolean, isEnemyDamage: boolean) => {
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

    // Setup initial units
    // For testing, let's create some dummy units if none exist
    const initialHeroes = heroes.length > 0 ? heroes : [
      createUnit('h1', 'warrior_fire', 1, true, false),
      createUnit('h2', 'mage_arcane', 2, true, false)
    ];
    
    const initialEnemies = [
      createUnit('e1', 'warrior_fire', 1, false, false),
      createUnit('e2', 'archer_life', 2, false, false),
      createUnit('e3', 'boss_death', 3, false, false)
    ];

    // Assign initial positions
    initialHeroes.forEach((h, i) => { h.x = -8; h.z = (i - 1) * 4; });
    initialEnemies.forEach((e, i) => { e.x = 8; e.z = (i - 1) * 4; });

    [...initialHeroes, ...initialEnemies].forEach(createUnitMesh);

    combatEngineRef.current = new CombatEngine(initialHeroes, initialEnemies);
    combatEngineRef.current.start();

    // Event Listeners
    const handleMoved = ({ unit, x, z }: any) => {
      if (unitMeshes[unit.id]) {
        unitMeshes[unit.id].position.x = x;
        unitMeshes[unit.id].position.z = z;
      }
    };

    const handleAttacked = ({ attacker, target, damage }: any) => {
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

    const handleDied = ({ unit }: any) => {
      if (unitMeshes[unit.id]) {
        unitMeshes[unit.id].dispose();
        delete unitMeshes[unit.id];
      }
      if (unitUIs[unit.id]) {
        advancedTexture.removeControl(unitUIs[unit.id].container);
        delete unitUIs[unit.id];
      }

      // Particle burst
      const sprite = new Sprite("death", spriteManager);
      sprite.position = new Vector3(unit.x, 1, unit.z);
      sprite.playAnimation(0, 7, false, 100, () => {
        sprite.dispose();
      });
    };

    const handleTick = (payload: any) => {
      setPlayerMana(prev => Math.min(maxPlayerMana, prev + MANA_REGEN));
      if (payload && payload.synergies) {
        setSynergies(payload.synergies);
      }
    };

    const handleSpawned = ({ unit }: any) => {
      createUnitMesh(unit);
    };

    const handleManaGain = ({ amount }: any) => {
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

  const handleSummon = (unitTemplateId: string) => {
    const cost = 30; // Example cost
    if (playerMana >= cost && combatEngineRef.current) {
      setPlayerMana(prev => prev - cost);
      const summon = createUnit(`summon_${Date.now()}`, unitTemplateId, 1, false, true);
      // Find nearest empty position near player side
      summon.x = -6 + Math.random() * 4;
      summon.z = -4 + Math.random() * 8;
      combatEngineRef.current.addSummon(summon);
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col">
      <div className="absolute top-4 left-4 z-10 font-mono text-white text-xl drop-shadow-md">
        Player Mana: {playerMana} / {maxPlayerMana}
      </div>
      
      <SynergyHUD synergies={synergies} />

      <canvas ref={canvasRef} className="w-full h-full outline-none flex-1" />

      {/* UI Overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-4 flex flex-col items-center gap-4 pointer-events-none">
        
        {/* Summon Bar */}
        <div className="flex gap-2 pointer-events-auto">
          {['summon_nature', 'summon_nature', 'summon_nature'].map((templateId, i) => (
            <button 
              key={i}
              onClick={() => handleSummon(templateId)}
              disabled={playerMana < 30}
              className="w-12 h-12 bg-zinc-800 border-2 border-zinc-600 rounded flex items-center justify-center text-xs text-white hover:border-white disabled:opacity-50 transition-colors"
              style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '8px' }}
            >
              Summon<br/>(30)
            </button>
          ))}
        </div>

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
