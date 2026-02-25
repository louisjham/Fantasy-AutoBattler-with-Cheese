import React from 'react';
import { useGameStore } from '../store';

interface PostBattleProps {
    onContinue: () => void;
}

export default function PostBattle({ onContinue }: PostBattleProps) {
    const { floor, currentNodeMap, currentNodeIndex, updateRunStats } = useGameStore();
    const currentNode = currentNodeMap[currentNodeIndex];

    const isBossNode = currentNode?.type === 'boss';

    const handleContinue = () => {
        // If it was a boss, the floor advance is already handled when we trigger advanceFloor in the parent or store?
        // The prompt says "Modify existing logic to detect if the node just completed was a Boss node. If Boss Node AND current floor < 5: show Seal Broken message + advance floor button."
        // Let's just pass up to parent. The App can handle store logic or we can do it here. 
        // Actually, App.tsx's handleContinue just calls setCurrentScreen('NodeMap').
        // We should call advanceFloor() if it's a boss.
        if (isBossNode && floor < 5) {
            useGameStore.getState().advanceFloor();
            updateRunStats({ floorsCleared: floor }); // just finished floor
        }
        useGameStore.getState().completeNode(currentNode.id);
        onContinue();
    };

    return (
        <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-zinc-950 font-sans" style={{ fontFamily: "'Press Start 2P', monospace" }}>
            <div className="bg-zinc-900 border border-zinc-700 p-8 rounded-xl max-w-lg w-full text-center shadow-2xl">
                <h2 className="text-2xl font-bold mb-6 text-emerald-400">
                    {isBossNode ? 'SEAL BROKEN' : 'BATTLE WON'}
                </h2>

                {isBossNode ? (
                    <div className="mb-8 p-4 bg-emerald-900/20 border border-emerald-800 rounded">
                        <p className="text-emerald-400 text-sm mb-2">You have vanquished the realm's warden.</p>
                        <p className="text-zinc-400 text-[10px] leading-relaxed">
                            The air grows heavier as another seal shatters. The path forward reveals itself...
                        </p>
                    </div>
                ) : (
                    <div className="mb-8 p-4 bg-zinc-800 rounded-xl text-left space-y-2 text-xs text-zinc-300 mx-auto w-48">
                        <p className="flex justify-between"><span>Gold:</span> <span className="text-yellow-400">+{currentNode?.goldReward || 0}</span></p>
                        <p className="flex justify-between"><span>Drafts:</span> <span className="text-blue-400">+1 Spell</span></p>
                        <p className="flex justify-between"><span>Drafts:</span> <span className="text-indigo-400">+1 Summon</span></p>
                    </div>
                )}

                {isBossNode ? (
                    <button
                        onClick={handleContinue}
                        className="w-full px-6 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold text-xs"
                    >
                        DESCEND TO THE NEXT FLOOR
                    </button>
                ) : (
                    <button
                        onClick={handleContinue}
                        className="w-full px-6 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-bold text-xs"
                    >
                        CONTINUE
                    </button>
                )}
            </div>
        </div>
    );
}
