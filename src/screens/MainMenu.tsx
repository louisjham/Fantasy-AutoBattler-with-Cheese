import React, { useEffect, useRef } from 'react';
import { Engine, Scene, FreeCamera, Vector3, HemisphericLight, MeshBuilder, StandardMaterial, Color3, ArcRotateCamera, PointLight } from '@babylonjs/core';
import { useGameStore } from '../store';

interface MainMenuProps {
    onStart: () => void;
}

export default function MainMenu({ onStart }: MainMenuProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const metaUnlocks = useGameStore(s => s.metaUnlocks);
    const difficulty = useGameStore(s => s.difficulty);
    const setDifficulty = useGameStore(s => s.setDifficulty);

    useEffect(() => {
        if (!canvasRef.current) return;

        const engine = new Engine(canvasRef.current, true, { preserveDrawingBuffer: true, stencil: true });

        // Create slow rotating background scene
        const createScene = () => {
            const scene = new Scene(engine);
            scene.clearColor = new Color3(0.05, 0.05, 0.08) as any;

            const camera = new ArcRotateCamera("camera", 0, Math.PI / 3, 20, Vector3.Zero(), scene);

            const light = new HemisphericLight("light", new Vector3(0, 1, 0), scene);
            light.intensity = 0.5;

            const pointLight = new PointLight("pl", new Vector3(0, 0, 0), scene);
            pointLight.diffuse = new Color3(0.5, 0.2, 0.8);
            pointLight.intensity = 0.8;

            const colors = [
                new Color3(1, 0.2, 0),   // Fire
                new Color3(0.6, 0, 0.8), // Death
                new Color3(0.2, 0.8, 0.2),// Nature
                new Color3(0.2, 0.3, 1), // Arcane
                new Color3(1, 0.8, 0)    // Life
            ];

            const shapes = [];

            for (let i = 0; i < 15; i++) {
                const type = Math.floor(Math.random() * 4);
                let mesh;
                if (type === 0) mesh = MeshBuilder.CreateBox(`box${i}`, { size: 1.5 }, scene);
                else if (type === 1) mesh = MeshBuilder.CreateSphere(`sphere${i}`, { diameter: 1.5, segments: 4 }, scene);
                else if (type === 2) mesh = MeshBuilder.CreateCylinder(`cyl${i}`, { height: 2, diameter: 1, tessellation: 6 }, scene);
                else mesh = MeshBuilder.CreatePolyhedron(`poly${i}`, { type: 1, size: 1 }, scene);

                const mat = new StandardMaterial(`mat${i}`, scene);
                mat.emissiveColor = colors[Math.floor(Math.random() * colors.length)];
                mat.alpha = 0.3 + Math.random() * 0.4;
                mat.wireframe = Math.random() > 0.5;
                mesh.material = mat;

                mesh.position = new Vector3(
                    (Math.random() - 0.5) * 20,
                    (Math.random() - 0.5) * 20,
                    (Math.random() - 0.5) * 20
                );

                shapes.push({
                    mesh,
                    rotSpeed: new Vector3(Math.random() * 0.02, Math.random() * 0.02, Math.random() * 0.02)
                });
            }

            scene.onBeforeRenderObservable.add(() => {
                shapes.forEach(s => {
                    s.mesh.rotation.addInPlace(s.rotSpeed);
                    s.mesh.position.y += Math.sin(Date.now() * 0.001 + s.mesh.position.x) * 0.01;
                });
            });

            return scene;
        };

        const scene = createScene();

        engine.runRenderLoop(() => {
            scene.render();
        });

        const handleResize = () => engine.resize();
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            scene.dispose();
            engine.dispose();
        };
    }, []);

    const schoolColors = ['#FF3300', '#9900CC', '#22AA22', '#3355FF', '#FFCC00'];
    const [colorIndex, setColorIndex] = React.useState(0);

    useEffect(() => {
        const int = setInterval(() => {
            setColorIndex(prev => (prev + 1) % schoolColors.length);
        }, 2000);
        return () => clearInterval(int);
    }, []);

    return (
        <div className="relative w-full h-full flex flex-col items-center justify-center font-sans overflow-hidden bg-black">
            {/* Background Canvas */}
            <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full opacity-60"
                style={{ imageRendering: 'pixelated', filter: 'contrast(1.2)' }}
            />

            <div className="relative z-10 flex flex-col items-center flex-1 w-full justify-center">
                <h1
                    className="text-5xl md:text-6xl text-white text-center mb-4 leading-tight"
                    style={{ fontFamily: "'Press Start 2P', monospace", textShadow: '4px 4px 0px #000' }}
                >
                    THE SHATTERED<br />CODEX
                </h1>

                <p className="mb-16 text-sm tracking-widest font-bold transition-colors duration-1000" style={{ color: schoolColors[colorIndex], fontFamily: "'Press Start 2P', monospace" }}>
                    SUMMON. BIND. RECLAIM.
                </p>

                <div className="flex flex-col gap-4 w-64">
                    <button onClick={onStart} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 px-6 rounded text-lg transition-transform hover:scale-105 shadow-lg" style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '12px' }}>
                        NEW RUN
                    </button>
                    <div className="flex justify-between w-full mt-2 mb-2">
                        {['easy', 'normal', 'hard'].map(d => (
                            <button key={d} onClick={() => setDifficulty(d as any)} className={`px-2 py-1 text-[10px] rounded border ${difficulty === d ? 'bg-zinc-700 text-white border-zinc-500' : 'bg-zinc-900 text-zinc-500 border-zinc-800'}`} style={{ fontFamily: "'Press Start 2P', monospace" }}>{d.toUpperCase()}</button>
                        ))}
                    </div>
                    <button className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold py-4 px-6 rounded transition-all shadow shadow-black" style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '12px' }}>
                        CODEX
                    </button>
                    <button className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold py-4 px-6 rounded transition-all shadow shadow-black" style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '12px' }}>
                        SETTINGS
                    </button>
                </div>

                {metaUnlocks.length > 0 && (
                    <div className="mt-8 text-xs text-zinc-500 font-bold" style={{ fontFamily: "'Press Start 2P', monospace" }}>
                        Meta Unlocks: {metaUnlocks.length}
                    </div>
                )}

            </div>

            <div className="relative z-10 w-full text-center pb-8 flex flex-col items-center gap-2">
                <div className="text-[10px] text-zinc-400 italic font-serif max-w-sm leading-relaxed mb-4">
                    "Five magic schools. Five broken seals.<br />
                    One sovereign tearing reality apart.<br />
                    The Codex remembers everything.<br />
                    Do you?"
                </div>
                <div className="text-[8px] text-zinc-600" style={{ fontFamily: "'Press Start 2P', monospace" }}>v0.8.0 - A SHATTERED CODEX PRODUCTION</div>
            </div>
        </div>
    );
}
