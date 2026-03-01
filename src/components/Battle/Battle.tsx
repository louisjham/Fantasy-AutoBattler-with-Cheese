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
import { ParticleEngine, RuneEffect } from '../../systems/ParticleEngine';

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
  const { heroes, summonRoster, spellbook, formation, currentNodeMap, currentNodeIndex, floor, selectedArchetype, selectedSubclass, difficulty } = useGameStore();
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

    // ─── Particle engine (visual effects, scene-owned) ─────────────────────────
    const particleEngine = new ParticleEngine(scene);
    // Active rune effects keyed by rune spell ID
    const activeRuneEffects = new Map<string, RuneEffect>();

    // Mesh Dictionary
    const unitMeshes: Record<string, AbstractMesh> = {};
    const unitUIs: Record<string, { container: Rectangle, hpBar: Rectangle }> = {};

    // School emissive color map (matches MagicSchool enum values + extras)
    const SCHOOL_EMISSIVE: Record<string, [number, number, number]> = {
      Fire: [0.75, 0.22, 0.17],
      Nature: [0.15, 0.68, 0.38],
      Death: [0.42, 0.20, 0.51],
      Arcane: [0.18, 0.52, 0.76],
      Life: [0.94, 0.70, 0.48],
      Ice: [0.36, 0.68, 0.87],
      ice: [0.36, 0.68, 0.87],
      Lightning: [0.95, 0.82, 0.25],
      lightning: [0.95, 0.82, 0.25],
      Earth: [0.49, 0.40, 0.04],
      earth: [0.49, 0.40, 0.04],
    };

    // Registry for companion pulse animation: material + base emissive RGB
    type PulseEntry = { mat: StandardMaterial; base: [number, number, number] };
    const companionPulseRegistry: PulseEntry[] = [];

    const createUnitMesh = (unit: Unit) => {
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

      // Emissive glow: companions (scale >= 1.5) get 30% base + pulsing; others get flat 10%
      const emissiveValues = SCHOOL_EMISSIVE[unit.school] ?? [0.2, 0.2, 0.2];
      const isCompanion = unitScale >= 1.5;
      const glowIntensity = isCompanion ? 0.30 : 0.10;
      mat.emissiveColor = new Color3(
        emissiveValues[0] * glowIntensity,
        emissiveValues[1] * glowIntensity,
        emissiveValues[2] * glowIntensity,
      );

      mesh.material = mat;
      mesh.convertToFlatShadedMesh();

      // Register companion for pulsing glow animation
      if (isCompanion) {
        companionPulseRegistry.push({ mat, base: emissiveValues });
      }

      // Registry for low-HP pulse (< 30%): hpBar reference + current percent
      type HpPulseEntry = { bar: Rectangle; percent: number };
      const lowHpBars: Map<string, HpPulseEntry> = new Map();

      unitMeshes[unit.id] = mesh;

      // HP Bar — 4px height, green start, linked above the mesh
      const rect = new Rectangle();
      rect.width = "44px";
      rect.height = "4px";
      rect.background = "transparent";
      rect.thickness = 0;
      advancedTexture.addControl(rect);
      rect.linkWithMesh(mesh);
      rect.linkOffsetY = -28;

      const hpBar = new Rectangle();
      hpBar.width = "100%";
      hpBar.height = "100%";
      hpBar.background = '#27AE60'; // green start
      hpBar.thickness = 0;
      hpBar.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
      rect.addControl(hpBar);

      unitUIs[unit.id] = { container: rect, hpBar };
    };

    // Low-HP pulse: flickers red bars between 100% and 70% brightness at ~1 Hz
    scene.onBeforeRenderObservable.add(() => {
      if (lowHpBars.size === 0) return;
      const t = Date.now() / 1000;
      const pulse = 0.85 + Math.sin(t * Math.PI * 2) * 0.15; // oscillates 0.7..1.0
      const r = Math.round(192 * pulse);
      const g = Math.round(57 * pulse);
      const b = Math.round(43 * pulse);
      const pulseColor = `rgb(${r},${g},${b})`;
      for (const [, entry] of lowHpBars) {
        if (entry.percent < 0.3) {
          entry.bar.background = pulseColor;
        }
      }
    });

    // Make lowHpBars accessible to the attack handler via closure ref
    const lowHpBarsRef = lowHpBars;

    // Companion glow pulse: oscillates emissive between 20% and 38% intensity
    scene.onBeforeRenderObservable.add(() => {
      if (companionPulseRegistry.length === 0) return;
      const t = Date.now() / 1000; // seconds
      // sin oscillates -1..1; map to 0.20..0.38 intensity
      const intensity = 0.29 + Math.sin(t * 2.0) * 0.09;
      for (const entry of companionPulseRegistry) {
        try { if (!entry.mat) continue; } catch (_) { continue; }
        entry.mat.emissiveColor.set(
          entry.base[0] * intensity,
          entry.base[1] * intensity,
          entry.base[2] * intensity,
        );
      }
    });

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
        // Update HP bar with dynamic color
        if (unitUIs[target.id]) {
          const percent = Math.max(0, target.stats.hp / target.stats.maxHp);
          unitUIs[target.id].hpBar.width = `${percent * 100}%`;
          // Color: green > 60%, orange 30-60%, red < 30%
          const hpColor = percent > 0.6 ? '#27AE60' : percent > 0.3 ? '#E67E22' : '#C0392B';
          unitUIs[target.id].hpBar.background = hpColor;
        }
      }
    };

    const handleDied = (payload: unknown) => {
      const { unit } = payload as { unit: Unit };

      // Effect 2 — death dissolve burst; delay actual mesh disposal so particles play
      const meshPos = unitMeshes[unit.id]?.position;
      if (meshPos) {
        const delay = particleEngine.unitDeath(meshPos.clone(), unit.school);
        setTimeout(() => {
          if (unitMeshes[unit.id]) {
            unitMeshes[unit.id].dispose();
            delete unitMeshes[unit.id];
          }
          if (unitUIs[unit.id]) {
            advancedTexture.removeControl(unitUIs[unit.id].container);
            delete unitUIs[unit.id];
          }
        }, delay);
      } else {
        // Mesh already gone — clean up immediately
        if (unitMeshes[unit.id]) {
          unitMeshes[unit.id].dispose();
          delete unitMeshes[unit.id];
        }
        if (unitUIs[unit.id]) {
          advancedTexture.removeControl(unitUIs[unit.id].container);
          delete unitUIs[unit.id];
        }
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

      // Legacy sprite burst (kept as fallback — particle engine handles visual above)
      try {
        const sprite = new Sprite("death", spriteManager);
        sprite.position = new Vector3(unit.x || 0, 1, unit.z || 0);
        sprite.playAnimation(0, 7, false, 100, () => { sprite.dispose(); });
      } catch (_) { /* spriteManager may not be ready */ }
    };

    // Effect 3 — synergy pulse: fires at the centroid of all living player units
    const handleSynergyTrigger = (payload: unknown) => {
      const { school } = payload as { school: string };
      // Compute centroid of living player meshes
      let cx = 0; let cy = 1; let cz = 0; let count = 0;
      for (const [, mesh] of Object.entries(unitMeshes)) {
        if (mesh && !mesh.isDisposed()) {
          cx += mesh.position.x;
          cy += mesh.position.y;
          cz += mesh.position.z;
          count++;
        }
      }
      if (count > 0) { cx /= count; cz /= count; }
      particleEngine.synergyPulse(new Vector3(cx, cy, cz), school);
    };

    // Effect 1 (spell hit) + Effect 4 (rune inscribe) — wired on spell:cast
    const handleSpellCastParticles = (payload: unknown) => {
      const sp = payload as { spell?: Spell };
      if (!sp.spell) return;
      const spell = sp.spell;

      // Effect 1 — target hit burst
      // Find the lowest-HP visible enemy mesh as the impact point
      let impactPos: Vector3 | null = null;
      let lowestHp = Infinity;
      for (const [meshId, mesh] of Object.entries(unitMeshes)) {
        // Enemy meshes (not hero/summon) — heuristic: ID does not contain known player prefixes
        if (mesh && !mesh.isDisposed() && !meshId.includes('_hero')) {
          if (mesh.position.x > 0) { // Enemy side is positive X
            const hp = (mesh as any)._hp ?? lowestHp;
            if (hp <= lowestHp) { lowestHp = hp; impactPos = mesh.position.clone(); }
          }
        }
      }
      // Fallback: just use the first enemy-side mesh position
      if (!impactPos) {
        for (const [, mesh] of Object.entries(unitMeshes)) {
          if (mesh && !mesh.isDisposed() && mesh.position.x > 0) {
            impactPos = mesh.position.clone();
            break;
          }
        }
      }
      if (impactPos) {
        particleEngine.spellHit(impactPos, spell.school);
      }

      // Effect 4 — rune inscribe (Runelord only rune spells)
      const runeSpellIds: Record<string, 'power' | 'warding' | 'ending'> = {
        'm_rune_of_power': 'power',
        'm_rune_of_warding': 'warding',
        'm_rune_of_ending': 'ending',
      };
      const runeType = runeSpellIds[spell.effect];
      if (runeType) {
        // Place rune at a slight random position around centre
        const runePos = new Vector3(
          (Math.random() - 0.5) * 6,
          0,
          (Math.random() - 0.5) * 6
        );
        const effect = particleEngine.runeInscribe(runePos, runeType);
        activeRuneEffects.set(spell.id, effect);
        // Auto-clean up after 8s in case of mega-burst miss
        setTimeout(() => {
          const e = activeRuneEffects.get(spell.id);
          if (e) { e.system.stop(); e.emitterMesh.dispose(); activeRuneEffects.delete(spell.id); }
        }, 8000);
      }
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
    globalEventBus.on('synergy:trigger', handleSynergyTrigger);
    globalEventBus.on('spell:cast', handleSpellCastParticles);

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
      globalEventBus.off('synergy:trigger', handleSynergyTrigger);
      globalEventBus.off('spell:cast', handleSpellCastParticles);

      // Clean up any lingering rune effects
      for (const effect of activeRuneEffects.values()) {
        try { effect.system.stop(); effect.emitterMesh.dispose(); } catch (_) { /* already disposed */ }
      }
      activeRuneEffects.clear();

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
      {/* ── Battle Info Bar (Change 5) ──────────────────────────── */}
      <div
        className="flex items-center justify-between px-4 z-20 flex-shrink-0"
        style={{
          height: '36px',
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(4px)',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          fontFamily: "'Press Start 2P', monospace",
          fontSize: '10px',
        }}
      >
        {/* Left: Floor */}
        <span className="text-white font-bold">Floor {floor}</span>

        {/* Centre: Archetype · Subclass */}
        <span className="text-zinc-300">
          {selectedArchetype ? selectedArchetype.charAt(0).toUpperCase() + selectedArchetype.slice(1) : 'Unknown'}
          {selectedSubclass && (
            <>
              {' · '}
              <span style={{ color: '#9b59b6' }}>
                {selectedSubclass.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
              </span>
            </>
          )}
        </span>

        {/* Right: Difficulty badge */}
        <span
          className="font-bold text-white rounded px-2 py-0.5"
          style={{
            backgroundColor:
              difficulty === 'hard' ? '#E67E22' :
                difficulty === 'easy' ? '#27AE60' :
                  '#2E86C1',
            borderRadius: '4px',
          }}
        >
          {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
        </span>
      </div>

      {/* ── Mana bar ──────────────────────────────────────────────── */}
      <div className="absolute top-14 left-4 z-10 font-mono text-white text-xs drop-shadow-md"
        style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '9px' }}
      >
        Mana: {playerMana} / {maxPlayerMana}
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
              className="relative bg-zinc-900 border-2 rounded text-white hover:bg-zinc-800 disabled:opacity-50 transition-colors flex flex-col items-center overflow-hidden"
              style={{
                borderColor: SCHOOL_COLORS[spell.school],
                borderLeft: `4px solid ${SCHOOL_COLORS[spell.school]}`,
                fontFamily: "'Press Start 2P', monospace",
                fontSize: '10px',
                minWidth: '70px',
                padding: '6px 8px 20px',
              }}
            >
              <span className="text-center leading-tight">{spell.name}</span>
              {/* Mana badge — bottom-left */}
              <div
                className="absolute bottom-0 left-0 right-0 flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: '#2E86C1', fontSize: '9px', padding: '2px 0' }}
              >
                {spell.manaCost} MP
              </div>
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
