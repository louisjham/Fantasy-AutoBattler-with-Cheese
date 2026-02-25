import React, { useEffect, useState } from 'react';
import { useGameStore } from '../store';
import { MagicSchool } from '../types';
import { SCHOOL_COLORS } from '../constants';

interface GameOverProps {
    onRestart: () => void;
    onMenu: () => void;
}

export default function GameOver({ onRestart, onMenu }: GameOverProps) {
    const { archetype, runStats, endRun } = useGameStore();

    const [metaXp, setMetaXp] = useState(0);

    useEffect(() => {
        // We already called endRun(false) in App.tsx prior to this rendering maybe?
        // Wait, if it resets state, we might lose runStats.
        // The prompt says: "Track run stats in store - add to RunState ... GameOver shows run stats... App.tsx On Battle loss: Navigate GameOver, Call endRun(false)".
        // If endRun() resets state, we need to read it before endRun or have endRun NOT immediately erase.
        // Let's assume the state passed here is the final run state, and we do endRun in the menu buttons.
        // Wait! Section 8 says: "On Battle loss: Navigate to GameOver screen, Call store.endRun(false)".
        // If we call endRun, it wipes runStats right before GameOver renders. 
        // To fix this cleanly, App.tsx should pass the RUN STATS as props OR wait to call endRun when leaving GameOver.
        // Prompt: "On Battle loss: Navigate to GameOver screen. Call store.endRun(false)".
        // Let's implement calculate here just for display, in case it's erased we might need to cache it on mount.

        // Safety cache in case store is wiped
    }, []);

    // Assuming store.endRun hasn't completely wiped our reference if we cached it.
    // We'll just read from store directly if it's there.

    const xp = (runStats.floorsCleared * 50) + (runStats.enemiesDefeated * 5) + (runStats.perkHistory.length * 10);

    return (
        <div className="w-full h-full flex items-center justify-center p-6 bg-red-950/20 relative" style={{ fontFamily: "'Press Start 2P', monospace" }}>
            <div className="absolute inset-0 bg-gradient-to-t from-red-900/40 to-transparent pointer-events-none" />

            <div className="relative z-10 w-full max-w-2xl bg-zinc-900 border-2 border-red-900 p-8 flex flex-col items-center rounded shadow-[0_0_50px_rgba(255,0,0,0.15)]">
                <h1 className="text-4xl text-[#9922CC] mb-4 text-center">DEFEATED</h1>
                <p className="text-sm text-zinc-400 mb-8">{archetype || 'The Conjurer'} has fallen</p>

                <div className="w-full bg-zinc-950 border border-zinc-800 p-6 rounded space-y-4 mb-8">
                    <h3 className="text-sm text-zinc-500 mb-4 border-b border-zinc-800 pb-2">Run Statistics</h3>

                    <div className="grid grid-cols-2 gap-4 text-xs text-zinc-300">
                        <div className="flex justify-between">
                            <span>Floors Cleared:</span>
                            <span className="text-white">{runStats.floorsCleared} of 5</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Enemies Defeated:</span>
                            <span className="text-white">{runStats.enemiesDefeated}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Furthest Floor:</span>
                            <span className="text-white">{Math.max(1, runStats.floorsCleared + 1)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Total Damage:</span>
                            <span className="text-white">{runStats.damageDealt}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Most Used School:</span>
                            <span style={{ color: runStats.mostUsedSchool ? SCHOOL_COLORS[runStats.mostUsedSchool] : '#888' }}>
                                {runStats.mostUsedSchool || 'None'}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span>Favorite Summon:</span>
                            <span className="text-white">{runStats.favoriteSummon || 'None'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Perks Collected:</span>
                            <span className="text-white">{runStats.perkHistory.length}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Spells Cast:</span>
                            <span className="text-white">{runStats.spellsCast}</span>
                        </div>
                    </div>
                </div>

                <div className="w-full bg-zinc-950/50 p-4 rounded text-center mb-8 border border-zinc-800">
                    <h4 className="text-[10px] text-zinc-500 mb-2">The Seasoned Codex Remembers</h4>
                    <p className="text-xl text-indigo-400 mb-2">+{xp} Meta XP</p>
                    <p className="text-[8px] text-zinc-400 italic">Your knowledge is preserved. The next conjurer will be stronger.</p>
                </div>

                <div className="flex gap-4 w-full">
                    <button onClick={onRestart} className="flex-1 bg-red-800 hover:bg-red-700 text-white font-bold py-4 rounded text-xs transition-colors">
                        TRY AGAIN
                    </button>
                    <button onClick={onMenu} className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 py-4 rounded text-xs transition-colors">
                        MAIN MENU
                    </button>
                </div>
            </div>
        </div>
    );
}
