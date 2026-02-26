import { PlayerArchetype, Unit, MagicSchool } from '../types';
import { useGameStore } from '../store';
import { generateFloor, getFloorStatMultiplier } from '../systems/ProceduralGen';
import { CombatEngine } from '../systems/CombatEngine';
import { globalEventBus } from '../EventBus';

interface SimResult {
    wins: number;
    losses: number;
    winRate: number;
    avgFloorsCleared: number;
    avgEnemiesDefeated: number;
    avgTurnsToWin: number;
}

export function simulateRun(
    archetype: PlayerArchetype,
    difficulty: 'easy' | 'normal' | 'hard',
    iterations: number
): SimResult {
    let wins = 0;
    let losses = 0;
    let totalFloorsCleared = 0;
    let totalEnemiesDefeated = 0;
    let totalTurnsToWin = 0;

    for (let i = 0; i < iterations; i++) {
        useGameStore.getState().setDifficulty(difficulty);
        useGameStore.getState().setArchetype(archetype);

        // Clear perks and spells for baseline
        useGameStore.setState({ perkList: [], spellbook: [] });

        let state = useGameStore.getState();
        let currentFloor = 1;
        let runAlive = true;
        let localEnemiesDefeated = 0;
        let localTurns = 0;

        while (runAlive && currentFloor <= 5) {
            const map = generateFloor(currentFloor, Math.random, difficulty);
            const mult = getFloorStatMultiplier(currentFloor);

            const scaleUnit = (u: Unit): Unit => {
                const base = u.baseStats ?? u.stats;
                return {
                    ...u,
                    stats: {
                        ...u.stats,
                        hp: Math.round(base.hp * mult),
                        maxHp: Math.round(base.maxHp * mult),
                        attack: Math.round(base.attack * mult),
                        defense: Math.round(base.defense * mult)
                    }
                };
            };

            let currentHeroes = state.heroes.map((u, i) => scaleUnit({ ...u, x: -2, z: i - 2 }));
            let currentSummons = state.summonRoster.map((u, i) => scaleUnit({ ...u, x: -1, z: i - 2 }));

            for (const node of map) {
                if (['combat', 'elite', 'boss'].includes(node.type)) {
                    // Set enemy positions
                    node.enemies.forEach((e, i) => {
                        e.x = 2;
                        e.z = i - 2;
                    });
                    let battleWon = false;
                    let battleLost = false;

                    const handleWin = () => { battleWon = true; };
                    const handleLoss = () => { battleLost = true; };

                    globalEventBus.on('battle:won', handleWin);
                    globalEventBus.on('battle:lost', handleLoss);

                    // Full heal heroes and summons before each battle
                    currentHeroes.forEach(u => u.stats.hp = u.stats.maxHp);
                    currentSummons.forEach(u => u.stats.hp = u.stats.maxHp);

                    const engine = new CombatEngine(
                        [...currentHeroes, ...currentSummons],
                        node.enemies
                    );

                    engine.start();

                    // tick headless
                    let ticks = 0;
                    while (!battleWon && !battleLost && ticks < 2000) {
                        (engine as any).tick(); // call private tick method

                        // Fake player spell cast if manas full
                        if ((engine as any).playerMana >= 100) {
                            (engine as any).playerMana = 0;
                            const aliveEnemies = engine['enemyUnits'].filter((e: any) => e.stats.hp > 0);
                            if (aliveEnemies.length > 0) {
                                // Default spell hits main target for some arbitrary nuke damage (50)
                                aliveEnemies[0].stats.hp -= 50;
                                if (aliveEnemies[0].stats.hp <= 0) {
                                    (engine as any).handleUnitDeath(aliveEnemies[0], 'player_spell');
                                }
                            }
                        }

                        // Check end state manually since events might lag
                        if (engine['enemyUnits'].filter((e: any) => e.stats.hp > 0).length === 0) battleWon = true;
                        if (engine['playerUnits'].filter((p: any) => p.stats.hp > 0).length === 0) battleLost = true;

                        ticks++;
                    }

                    Object.assign(engine, { isRunning: false });
                    engine.stop();

                    globalEventBus.off('battle:won', handleWin);
                    globalEventBus.off('battle:lost', handleLoss);

                    if (battleWon) {
                        localEnemiesDefeated += node.enemies.length;
                        if (currentFloor === 1) localTurns += Math.floor(ticks / 5); // Rough ticks-to-turns approximation
                    } else {
                        console.log(`Lost at node depth ${node.depth} (type: ${node.type})! ticks: ${ticks}, enemiesLeft: ${engine['enemyUnits'].length}, playersLeft: ${engine['playerUnits'].length}`);
                        runAlive = false;
                        break;
                    }
                }
            }

            if (runAlive) {
                currentFloor++;
            }
        }

        if (runAlive) {
            wins++;
            totalFloorsCleared += 5;
        } else {
            losses++;
            totalFloorsCleared += (currentFloor - 1);
        }

        totalEnemiesDefeated += localEnemiesDefeated;
        if (runAlive || currentFloor > 1) {
            totalTurnsToWin += localTurns;
        }
    }

    return {
        wins,
        losses,
        winRate: wins / iterations,
        avgFloorsCleared: totalFloorsCleared / iterations,
        avgEnemiesDefeated: totalEnemiesDefeated / iterations,
        avgTurnsToWin: totalTurnsToWin / (wins || 1)
    };
}

if (typeof window !== 'undefined') {
    (window as any).__testWinrate = () => {
        console.log("Starting simulation for Conjurer / Normal / 100 iterations...");
        const result = simulateRun(PlayerArchetype.Conjurer, 'normal', 100);
        console.table(result);
        return result;
    };
}
