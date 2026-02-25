import React, { useState, useMemo } from 'react';
import { useGameStore } from '../store';
import { Unit, MagicSchool, PlayerArchetype } from '../types';
import { calculateSynergies } from '../systems/SynergySystem';
import { SCHOOL_COLORS } from '../constants';

interface PreBattleConjureProps {
  onStartBattle: () => void;
}

export default function PreBattleConjure({ onStartBattle }: PreBattleConjureProps) {
  const { heroes, summonRoster, floor, archetype, setFormation } = useGameStore();

  const [formation, setLocalFormation] = useState<Record<number, string | null>>({
    1: null, 2: null, 3: null,
    4: null, 5: null, 6: null,
    7: null, 8: null, 9: null
  });

  const [selectedSummonId, setSelectedSummonId] = useState<string | null>(null);

  const maxMana = useMemo(() => {
    switch (floor) {
      case 1: return 12;
      case 2: return 15;
      case 3: return 18;
      case 4: return 22;
      case 5: return 26;
      default: return 12 + (floor - 1) * 3;
    }
  }, [floor]);

  const placedSummons = useMemo(() => {
    const placed: Unit[] = [];
    Object.values(formation).forEach(id => {
      if (id) {
        const summon = summonRoster.find(s => s.id === id);
        if (summon) placed.push(summon);
      }
    });
    return placed;
  }, [formation, summonRoster]);

  const usedMana = useMemo(() => {
    return placedSummons.reduce((total, summon) => total + (summon.manaCost || 0), 0);
  }, [placedSummons]);

  const activeSynergies = useMemo(() => {
    return calculateSynergies([...heroes, ...placedSummons]);
  }, [heroes, placedSummons]);

  const handleSlotClick = (slotIndex: number) => {
    if (formation[slotIndex]) {
      // Remove summon from slot
      setLocalFormation(prev => ({ ...prev, [slotIndex]: null }));
    } else if (selectedSummonId) {
      // Place selected summon in slot
      const summon = summonRoster.find(s => s.id === selectedSummonId);
      if (summon) {
        if (usedMana + (summon.manaCost || 0) <= maxMana) {
          setLocalFormation(prev => ({ ...prev, [slotIndex]: selectedSummonId }));
          setSelectedSummonId(null);
        }
      }
    }
  };

  const handleRosterClick = (summonId: string) => {
    const isPlaced = Object.values(formation).includes(summonId);
    if (!isPlaced) {
      setSelectedSummonId(summonId === selectedSummonId ? null : summonId);
    }
  };

  const handleStart = () => {
    setFormation(formation);
    onStartBattle();
  };

  const renderStars = (tier: number) => {
    return '★'.repeat(tier) + '☆'.repeat(4 - tier);
  };

  const getHeroSlots = () => {
    if (archetype === PlayerArchetype.Conjurer) return [4, 5, 6];
    if (archetype === PlayerArchetype.Warlord) return [1, 2, 3, 4, 5, 6];
    if (archetype === PlayerArchetype.Mystic) return [4, 5, 6, 7];
    return [4, 5, 6];
  };

  const heroSlots = getHeroSlots();

  return (
    <div className="flex w-full h-full p-4 gap-4" style={{ fontFamily: "'Press Start 2P', monospace" }}>
      
      {/* LEFT PANEL: Formation Grid */}
      <div className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl p-4 flex flex-col">
        <h2 className="text-xl text-white mb-4 text-center">FORMATION</h2>
        
        {/* Heroes Row */}
        <div className="mb-6">
          <h3 className="text-xs text-zinc-500 mb-2">HEROES (Always Deployed)</h3>
          <div className="flex gap-2 flex-wrap">
            {heroes.map((hero, i) => (
              <div key={hero.id} className="bg-zinc-800 border-2 rounded p-2 flex flex-col items-center w-24" style={{ borderColor: SCHOOL_COLORS[hero.school] }}>
                <span className="text-[8px] text-white truncate w-full text-center">{hero.name}</span>
                <span className="text-[8px] text-zinc-400 mt-1">Lvl {hero.level}</span>
                <div className="w-full bg-zinc-700 h-1 mt-1">
                  <div className="bg-blue-500 h-full" style={{ width: `${(hero.xp / (hero.level * 100)) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 flex flex-col justify-center items-center gap-2">
          {[
            { label: 'FRONT', slots: [7, 8, 9] },
            { label: 'MID', slots: [4, 5, 6] },
            { label: 'BACK', slots: [1, 2, 3] }
          ].map(row => (
            <div key={row.label} className="flex items-center gap-4">
              <span className="text-[10px] text-zinc-500 w-12 text-right">{row.label}</span>
              <div className="flex gap-2">
                {row.slots.map(slot => {
                  const heroInSlot = heroes.find(h => h.position === slot);
                  const unitId = formation[slot];
                  const summonInSlot = unitId ? summonRoster.find(s => s.id === unitId) : null;
                  
                  const unit = heroInSlot || summonInSlot;
                  const isHeroSlot = !!heroInSlot;

                  return (
                    <div 
                      key={slot}
                      onClick={() => !isHeroSlot && handleSlotClick(slot)}
                      className={`w-20 h-24 border-2 rounded flex flex-col items-center justify-center transition-colors relative
                        ${unit ? 'bg-zinc-800' : 'bg-zinc-950 border-dashed border-zinc-700 hover:border-zinc-500 cursor-pointer'}
                        ${isHeroSlot ? 'cursor-not-allowed' : ''}
                      `}
                      style={{ borderColor: unit ? SCHOOL_COLORS[unit.school] : undefined }}
                    >
                      {unit ? (
                        <>
                          <span className="text-[8px] text-white text-center px-1 truncate w-full">{unit.name}</span>
                          <span className="text-[8px] text-yellow-400 mt-1">{isHeroSlot ? `Lvl ${unit.level}` : renderStars(unit.tier)}</span>
                          <div className="w-full px-2 mt-2 space-y-1">
                            <div className="flex items-center justify-between text-[6px]">
                              <span className="text-red-400">HP</span>
                              <span className="text-white">{unit.stats.hp}</span>
                            </div>
                            <div className="flex items-center justify-between text-[6px]">
                              <span className="text-orange-400">ATK</span>
                              <span className="text-white">{unit.stats.attack}</span>
                            </div>
                          </div>
                          {isHeroSlot && (
                            <span className="absolute bottom-1 text-[6px] text-zinc-400 bg-zinc-900 px-1 rounded">HERO</span>
                          )}
                        </>
                      ) : (
                        <span className="text-zinc-700 text-xl">{slot}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CENTER PANEL: Mana Budget */}
      <div className="w-64 bg-zinc-900 border border-zinc-700 rounded-xl p-4 flex flex-col">
        <h2 className="text-xl text-white mb-6 text-center">BUDGET</h2>
        
        <div className="mb-8">
          <div className="flex justify-between text-xs mb-2">
            <span className="text-zinc-400">MANA</span>
            <span className={usedMana > maxMana ? 'text-red-400' : 'text-blue-400'}>{usedMana} / {maxMana}</span>
          </div>
          <div className="w-full h-4 bg-zinc-800 rounded overflow-hidden">
            <div 
              className={`h-full transition-all ${usedMana > maxMana ? 'bg-red-500' : 'bg-blue-500'}`}
              style={{ width: `${Math.min(100, (usedMana / maxMana) * 100)}%` }}
            />
          </div>
        </div>

        <div className="flex-1">
          <h3 className="text-xs text-zinc-500 mb-4">ACTIVE SYNERGIES</h3>
          <div className="space-y-2">
            {activeSynergies.length > 0 ? activeSynergies.map((syn, i) => (
              <div key={i} className="bg-zinc-800 border rounded p-2 text-[8px]" style={{ borderColor: SCHOOL_COLORS[syn.school] }}>
                <div className="flex justify-between text-white mb-1">
                  <span>{syn.school}</span>
                  <span className="text-yellow-400">Tier {syn.tier}</span>
                </div>
                <div className="text-zinc-400">{syn.bonus}</div>
              </div>
            )) : (
              <div className="text-[8px] text-zinc-600 text-center">No active synergies</div>
            )}
          </div>
        </div>

        <div className="mt-auto pt-4">
          <button 
            onClick={handleStart}
            disabled={placedSummons.length === 0}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white rounded font-bold transition-colors"
          >
            BATTLE
          </button>
          {placedSummons.length === 0 && (
            <p className="text-[8px] text-red-400 text-center mt-2">Place at least 1 unit</p>
          )}
        </div>
      </div>

      {/* RIGHT PANEL: Summon Roster */}
      <div className="w-80 bg-zinc-900 border border-zinc-700 rounded-xl p-4 flex flex-col overflow-hidden">
        <h2 className="text-xl text-white mb-4 text-center">ROSTER</h2>
        
        <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
          {summonRoster.map(summon => {
            const isPlaced = Object.values(formation).includes(summon.id);
            const isSelected = selectedSummonId === summon.id;
            const canAfford = usedMana + (summon.manaCost || 0) <= maxMana;

            return (
              <div 
                key={summon.id}
                onClick={() => handleRosterClick(summon.id)}
                className={`border-2 rounded p-3 transition-all cursor-pointer
                  ${isPlaced ? 'opacity-30 border-zinc-700 bg-zinc-900' : 
                    isSelected ? 'bg-zinc-800 scale-[1.02]' : 'bg-zinc-900 hover:bg-zinc-800'}
                `}
                style={{ borderColor: isPlaced ? undefined : (isSelected ? 'white' : SCHOOL_COLORS[summon.school]) }}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="text-[10px] text-white">{summon.name}</div>
                    <div className="text-[8px] text-yellow-400 mt-1">{renderStars(summon.tier)}</div>
                  </div>
                  <div className={`text-[10px] ${canAfford || isPlaced ? 'text-blue-400' : 'text-red-400'}`}>
                    {summon.manaCost} MP
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-1 mb-2 text-[8px]">
                  <div className="bg-zinc-950 rounded p-1 text-center">
                    <div className="text-red-400">HP</div>
                    <div className="text-white">{summon.stats.hp}</div>
                  </div>
                  <div className="bg-zinc-950 rounded p-1 text-center">
                    <div className="text-orange-400">ATK</div>
                    <div className="text-white">{summon.stats.attack}</div>
                  </div>
                  <div className="bg-zinc-950 rounded p-1 text-center">
                    <div className="text-blue-400">DEF</div>
                    <div className="text-white">{summon.stats.defense}</div>
                  </div>
                  <div className="bg-zinc-950 rounded p-1 text-center">
                    <div className="text-green-400">SPD</div>
                    <div className="text-white">{summon.stats.speed}</div>
                  </div>
                </div>

                {summon.passives.length > 0 && (
                  <div className="text-[6px] text-zinc-400 bg-zinc-950 p-1 rounded">
                    <span className="text-indigo-400">Passive: </span>
                    {summon.passives[0].effect.replace(/_/g, ' ')}
                  </div>
                )}
              </div>
            );
          })}
          
          {summonRoster.length === 0 && (
            <div className="text-center text-zinc-500 text-[10px] mt-10">
              No summons in roster.
            </div>
          )}
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #18181b;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #3f3f46;
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
}
