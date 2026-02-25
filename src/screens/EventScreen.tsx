import React from 'react';
import { useGameStore } from '../store';

interface EventScreenProps {
  onComplete: () => void;
}

export default function EventScreen({ onComplete }: EventScreenProps) {
  const { currentNodeMap, currentNodeIndex, completeNode } = useGameStore();
  const node = currentNodeMap[currentNodeIndex];

  const handleComplete = () => {
    if (node) {
      completeNode(node.id);
    }
    onComplete();
  };

  return (
    <div className="text-center space-y-6 p-8">
      <h2 className="text-2xl font-bold text-indigo-400">Random Event</h2>
      <p className="text-zinc-400 max-w-md mx-auto">
        You encounter a strange glowing obelisk. Touching it fills you with ancient knowledge.
      </p>
      
      <div className="p-6 bg-zinc-800 rounded-xl inline-block text-left space-y-2">
        <p className="text-emerald-400">+ 1 Random Perk</p>
        <p className="text-yellow-400">+ 20 Gold</p>
      </div>
      
      <div>
        <button 
          onClick={handleComplete} 
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium"
        >
          Accept & Continue
        </button>
      </div>
    </div>
  );
}
