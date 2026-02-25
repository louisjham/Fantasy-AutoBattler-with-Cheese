import React, { useEffect, useState } from 'react';
import { useGameStore } from '../store';
import { PlayerArchetype } from '../types';
import { SCHOOL_COLORS } from '../constants';

interface VictoryProps {
    onMenu: () => void;
}

export default function Victory({ onMenu }: VictoryProps) {
    const { archetype, runStats } = useGameStore();

    const getEpilogue = (arch: PlayerArchetype | null) => {
        switch (arch) {
            case PlayerArchetype.Conjurer:
                return "The seals are restored, but the bindings are yours. You now rule the domains you anchored.";
            case PlayerArchetype.Warlord:
                return "The Sovereign's throne is empty no longer. What you conquered, you will never surrender.";
            case PlayerArchetype.Mystic:
                return "The Codex is rewritten, its truth revealed. The world is safe, until you decide it shouldn't be.";
            default:
                return "The world breathes a sigh of relief as the seals close. The Codex slumbers once more.";
        }
    };

    const xp = (runStats.floorsCleared * 50) + (runStats.enemiesDefeated * 5) + (runStats.perkHistory.length * 10) + 500;

    return (
        <div className="w-full h-full flex items-center justify-center p-6 bg-yellow-950/20 relative" style={{ fontFamily: "'Press Start 2P', monospace" }}>
            <div className="absolute inset-0 bg-gradient-to-t from-yellow-900/40 to-transparent pointer-events-none" />

            <div className="relative z-10 w-full max-w-2xl bg-zinc-900 border-2 border-yellow-600 p-8 flex flex-col items-center rounded shadow-[0_0_80px_rgba(255,215,0,0.15)]">
                <h1 className="text-4xl text-yellow-400 mb-4 text-center">VICTORY</h1>
                <p className="text-sm text-zinc-400 mb-4">{archetype || 'The Conjurer'} has prevailed.</p>

                <p className="text-[10px] text-zinc-300 italic text-center leading-relaxed mb-8 px-8 border-l border-r border-yellow-700/50 py-2">
                    "{getEpilogue(archetype)}"
                </p>

                <div className="w-full bg-zinc-950 border border-zinc-800 p-6 rounded space-y-4 mb-8">
                    <h3 className="text-sm text-yellow-500 mb-4 border-b border-zinc-800 pb-2">Glorious Statistics</h3>

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
                            <span className="text-white">Completed</span>
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
                    <h4 className="text-[10px] text-zinc-500 mb-2">The Golden Codex Remembers</h4>
                    <p className="text-xl text-yellow-400 mb-2">+{xp} Meta XP</p>
                    <p className="text-[8px] text-zinc-400 italic">Your legend is etched into eternity.</p>
                </div>

                <button onClick={onMenu} className="w-full bg-yellow-600 hover:bg-yellow-500 text-black font-bold py-4 rounded text-xs transition-colors shadow-lg shadow-yellow-600/20">
                    RETURN TO MAIN MENU
                </button>
            </div>
        </div>
    );
}
