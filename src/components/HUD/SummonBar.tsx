import React, { useMemo } from 'react';
import { useGameStore } from '../../store';
import { SCHOOL_COLORS } from '../../constants';

interface SummonBarProps {
  playerMana: number;
  onSummon: (summonId: string) => void;
  activeUnitCount: number;
  onFieldIds: Set<string>;
}

export default function SummonBar({ playerMana, onSummon, activeUnitCount, onFieldIds }: SummonBarProps) {
  const { summonRoster } = useGameStore();

  // Find cheapest available summons not already on field
  const availableSummons = useMemo(() => {
    const available = summonRoster.filter(s => !onFieldIds.has(s.id));
    
    // Sort by mana cost ascending
    available.sort((a, b) => (a.manaCost || 0) - (b.manaCost || 0));
    
    // Return top 3
    return available.slice(0, 3);
  }, [summonRoster, onFieldIds]);

  const isFieldFull = activeUnitCount >= 9;

  return (
    <div className="flex gap-2 pointer-events-auto">
      {isFieldFull ? (
        <div className="h-12 px-4 bg-zinc-900 border-2 border-red-900 rounded flex items-center justify-center text-red-500" style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '10px' }}>
          FIELD FULL
        </div>
      ) : availableSummons.length > 0 ? (
        availableSummons.map((summon) => {
          const cost = summon.manaCost || 0;
          const canAfford = playerMana >= cost;
          
          return (
            <button 
              key={summon.id}
              onClick={() => onSummon(summon.id)}
              disabled={!canAfford}
              className="w-24 h-12 bg-zinc-900 border-2 rounded flex flex-col items-center justify-center text-white hover:bg-zinc-800 disabled:opacity-50 transition-colors"
              style={{ borderColor: SCHOOL_COLORS[summon.school], fontFamily: "'Press Start 2P', monospace", fontSize: '8px' }}
            >
              <span className="truncate w-full text-center px-1">{summon.name}</span>
              <span className={canAfford ? 'text-blue-400 mt-1' : 'text-red-400 mt-1'}>{cost} MP</span>
            </button>
          );
        })
      ) : (
        <div className="h-12 px-4 bg-zinc-900 border-2 border-zinc-700 rounded flex items-center justify-center text-zinc-500" style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '8px' }}>
          No Summons
        </div>
      )}
    </div>
  );
}
