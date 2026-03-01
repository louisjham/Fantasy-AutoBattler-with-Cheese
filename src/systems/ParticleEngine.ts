import {
    Scene,
    ParticleSystem,
    Vector3,
    Color4,
    Texture,
    MeshBuilder,
    AbstractMesh,
} from '@babylonjs/core';

// Return type for rune inscribe so the caller can stop/dispose on demand
export interface RuneEffect {
    system: ParticleSystem;
    emitterMesh: AbstractMesh;
}

export class ParticleEngine {
    private scene: Scene;

    constructor(scene: Scene) {
        this.scene = scene;
    }

    // ─── School → Color4 ────────────────────────────────────────────────────────
    private schoolColor(school: string): Color4 {
        const map: Record<string, Color4> = {
            fire: new Color4(0.95, 0.35, 0.10, 1.0),
            ice: new Color4(0.36, 0.78, 0.97, 1.0),
            lightning: new Color4(0.98, 0.92, 0.20, 1.0),
            earth: new Color4(0.60, 0.45, 0.10, 1.0),
            nature: new Color4(0.15, 0.85, 0.38, 1.0),
            death: new Color4(0.55, 0.10, 0.75, 1.0),
            arcane: new Color4(0.18, 0.52, 0.96, 1.0),
            life: new Color4(0.94, 0.80, 0.40, 1.0),
        };
        return map[school.toLowerCase()] ?? new Color4(1, 1, 1, 1);
    }

    // ─── EFFECT 1 — Spell Hit Burst ─────────────────────────────────────────────
    /** Triggered whenever a spell deals damage. Position = Vector3 of impact. */
    spellHit(position: Vector3, school: string): void {
        const system = new ParticleSystem('spellHit', 80, this.scene);
        system.particleTexture = new Texture('textures/flare.png', this.scene);

        system.emitter = position.clone();
        system.minEmitBox = new Vector3(-0.1, 0, -0.1);
        system.maxEmitBox = new Vector3(0.1, 0, 0.1);

        const c = this.schoolColor(school);
        system.color1 = c;
        system.color2 = new Color4(c.r, c.g, c.b, 0.5);
        system.colorDead = new Color4(c.r, c.g, c.b, 0);

        system.minSize = 0.1;
        system.maxSize = 0.4;
        system.minLifeTime = 0.2;
        system.maxLifeTime = 0.5;
        system.emitRate = 300;
        system.blendMode = ParticleSystem.BLENDMODE_ONEONE;
        system.gravity = new Vector3(0, 2, 0);
        system.direction1 = new Vector3(-2, 4, -2);
        system.direction2 = new Vector3(2, 4, 2);
        system.minAngularSpeed = 0;
        system.maxAngularSpeed = Math.PI;
        system.minEmitPower = 1;
        system.maxEmitPower = 3;
        system.updateSpeed = 0.02;

        system.targetStopDuration = 0.15; // burst then stop
        system.disposeOnStop = true;      // auto-cleanup
        system.start();
    }

    // ─── EFFECT 2 — Unit Death Dissolve ─────────────────────────────────────────
    /**
     * Triggered when a unit's HP hits 0, before mesh removal.
     * Returns the delay in ms the caller should wait before disposing the mesh.
     */
    unitDeath(position: Vector3, school: string): number {
        const system = new ParticleSystem('unitDeath', 150, this.scene);
        system.particleTexture = new Texture('textures/flare.png', this.scene);

        system.emitter = position.clone();
        system.minEmitBox = new Vector3(-0.3, 0, -0.3);
        system.maxEmitBox = new Vector3(0.3, 0.5, 0.3);

        const c = this.schoolColor(school);
        system.color1 = new Color4(1, 1, 1, 1);           // flash white first
        system.color2 = c;
        system.colorDead = new Color4(c.r, c.g, c.b, 0);

        system.minSize = 0.05;
        system.maxSize = 0.3;
        system.minLifeTime = 0.4;
        system.maxLifeTime = 0.9;
        system.emitRate = 400;
        system.blendMode = ParticleSystem.BLENDMODE_ONEONE;
        system.gravity = new Vector3(0, -1, 0);            // particles fall down
        system.direction1 = new Vector3(-3, 5, -3);
        system.direction2 = new Vector3(3, 5, 3);
        system.minEmitPower = 0.5;
        system.maxEmitPower = 2;
        system.updateSpeed = 0.02;

        system.targetStopDuration = 0.25;
        system.disposeOnStop = true;
        system.start();

        return 300; // caller should remove the mesh after this many ms
    }

    // ─── EFFECT 3 — Synergy Trigger Pulse ───────────────────────────────────────
    /** Triggered on globalEventBus 'synergy:trigger'. Position = centroid of active units. */
    synergyPulse(position: Vector3, school: string): void {
        const system = new ParticleSystem('synergyPulse', 60, this.scene);
        system.particleTexture = new Texture('textures/flare.png', this.scene);

        system.emitter = position.clone();
        system.minEmitBox = new Vector3(-0.5, 0, -0.5);
        system.maxEmitBox = new Vector3(0.5, 0, 0.5);

        const c = this.schoolColor(school);
        system.color1 = new Color4(1, 1, 1, 0.8);
        system.color2 = c;
        system.colorDead = new Color4(c.r, c.g, c.b, 0);

        system.minSize = 0.15;
        system.maxSize = 0.5;
        system.minLifeTime = 0.3;
        system.maxLifeTime = 0.7;
        system.emitRate = 150;
        system.blendMode = ParticleSystem.BLENDMODE_ONEONE;
        system.gravity = new Vector3(0, 1, 0);             // particles rise upward
        system.direction1 = new Vector3(-1, 3, -1);
        system.direction2 = new Vector3(1, 3, 1);
        system.minEmitPower = 0.5;
        system.maxEmitPower = 1.5;
        system.updateSpeed = 0.025;

        system.targetStopDuration = 0.2;
        system.disposeOnStop = true;
        system.start();
    }

    // ─── EFFECT 4 — Rune Inscribe Glyph (Runelord only) ─────────────────────────
    /**
     * Triggered when Runelord casts a Rune spell.
     * Returns the system + emitter mesh so CombatEngine can stop them on mega-burst.
     */
    runeInscribe(position: Vector3, runeType: 'power' | 'warding' | 'ending'): RuneEffect {
        const runeColorMap: Record<string, Color4> = {
            power: new Color4(1.0, 0.75, 0.0, 1.0), // gold
            warding: new Color4(0.18, 0.52, 0.96, 1.0), // blue
            ending: new Color4(0.85, 0.10, 0.10, 1.0), // red
        };

        // Invisible disc emitter lying flat on the ground plane
        const emitterMesh = MeshBuilder.CreateDisc(
            'runeEmitter',
            { radius: 0.6 },
            this.scene
        );
        emitterMesh.position = position.clone();
        emitterMesh.rotation.x = Math.PI / 2; // lay flat
        emitterMesh.isVisible = false;

        const system = new ParticleSystem('runeInscribe', 100, this.scene);
        system.particleTexture = new Texture('textures/flare.png', this.scene);
        system.emitter = emitterMesh;

        const c = runeColorMap[runeType] ?? new Color4(1, 1, 1, 1);
        system.color1 = c;
        system.color2 = new Color4(c.r, c.g, c.b, 0.3);
        system.colorDead = new Color4(c.r, c.g, c.b, 0);

        system.minSize = 0.05;
        system.maxSize = 0.15;
        system.minLifeTime = 0.5;
        system.maxLifeTime = 1.2;
        system.emitRate = 80;
        system.blendMode = ParticleSystem.BLENDMODE_ONEONE;
        system.gravity = new Vector3(0, 0.5, 0); // slight rise from ground
        system.direction1 = new Vector3(-0.2, 1, -0.2);
        system.direction2 = new Vector3(0.2, 1, 0.2);
        system.minEmitPower = 0.1;
        system.maxEmitPower = 0.5;
        system.updateSpeed = 0.02;

        // Rune stays active until triggered — caller stops it on mega-burst
        system.start();

        return { system, emitterMesh };
    }
}
