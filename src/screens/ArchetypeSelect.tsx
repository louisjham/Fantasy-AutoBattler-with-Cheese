import React, { useState, useMemo } from 'react';
import { useGameStore } from '../store';
import { ArchetypeId, SubclassId, PerkDefinition, SpellDefinition, UnitTemplate } from '../types/index';
import { MagicSchool } from '../types';
import { WARLORD_PERKS, WARLORD_SPELLS, WARLORD_UNITS } from '../data/warlord';
import { CONJURER_PERKS, CONJURER_SPELLS, CONJURER_UNITS } from '../data/conjurer';
import { MYSTIC_PERKS, MYSTIC_SPELLS, MYSTIC_UNITS } from '../data/mystic';
import {
  getArchetypePortrait,
  getSubclassPortrait,
  getCompanionImage,
  getPerkIcon,
  makeImgFallback,
  SCHOOL_COLORS,
} from '../utils/assetHelper';

interface ArchetypeSelectProps {
  onSelect: () => void;
}

const ARCHETYPES = [
  { id: 'warlord' as ArchetypeId, name: 'WARLORD', tagline: 'The Unyielding Commander', color: '#FF4422', hp: 100, spellCap: 3, summonCap: 3, companion: 'Giant Armored Lizard' },
  { id: 'conjurer' as ArchetypeId, name: 'CONJURER', tagline: 'Master of Beasts and Elements', color: '#2244FF', hp: 90, spellCap: 4, summonCap: 4, companion: 'Primal Elemental' },
  { id: 'mystic' as ArchetypeId, name: 'MYSTIC', tagline: 'Weaver of Arcane and Fate', color: '#9922CC', hp: 80, spellCap: 5, summonCap: 2, companion: 'Astral Phoenix' }
];

const getDesc = (sub: string) => {
  switch (sub) {
    case 'vanilla_warlord': return 'Standard troops and equipment.';
    case 'sorcerer_king': return 'Demonic pacts and sacrificial rites.';
    case 'ogre_magi': return 'Beasts, totems, and pure rage.';
    case 'deathlord': return 'Undead swarms and dark magic.';
    case 'elemental_master': return 'Attune to an element for specialized summons.';
    case 'beast_conjurer': return 'Transformations and feral companions.';
    case 'battlemancer': return 'Conjured weapons, armor, and forge spirits.';
    case 'arcanist': return 'Raw arcane power, mana manipulation.';
    case 'seer': return 'Foresight and battlefield manipulation.';
    case 'runelord': return 'Trap placement and rune-stacking burst combos.';
    default: return '';
  }
};

const SUBCLASSES: Record<ArchetypeId, { id: SubclassId, name: string, desc: string }[]> = {
  warlord: [
    { id: 'vanilla_warlord', name: 'Vanilla Warlord', desc: getDesc('vanilla_warlord') },
    { id: 'sorcerer_king', name: 'Sorcerer King', desc: getDesc('sorcerer_king') },
    { id: 'ogre_magi', name: 'Ogre Magi', desc: getDesc('ogre_magi') },
    { id: 'deathlord', name: 'Deathlord', desc: getDesc('deathlord') }
  ],
  conjurer: [
    { id: 'elemental_master', name: 'Elemental Master', desc: getDesc('elemental_master') },
    { id: 'beast_conjurer', name: 'Beast Conjurer', desc: getDesc('beast_conjurer') },
    { id: 'battlemancer', name: 'Battlemancer', desc: getDesc('battlemancer') }
  ],
  mystic: [
    { id: 'arcanist', name: 'Arcanist', desc: getDesc('arcanist') },
    { id: 'seer', name: 'Seer', desc: getDesc('seer') },
    { id: 'runelord', name: 'Runelord', desc: getDesc('runelord') }
  ]
};

export default function ArchetypeSelect({ onSelect }: ArchetypeSelectProps) {
  const { setArchetype, selectStartingPerks } = useGameStore();

  const [step, setStep] = useState<'archetype' | 'subclass' | 'element' | 'perks' | 'spells'>('archetype');
  const [selectedArch, setSelectedArch] = useState<ArchetypeId | null>(null);
  const [selectedSub, setSelectedSub] = useState<SubclassId | null>(null);
  const [selectedElement, setSelectedElement] = useState<MagicSchool | null>(null);

  const [selectedPerks, setSelectedPerks] = useState<string[]>([]);
  const [hoveredSub, setHoveredSub] = useState<SubclassId | null>(null);

  const perkPool = useMemo(() => {
    if (!selectedArch || !selectedSub) return [];
    const pool = selectedArch === 'warlord' ? WARLORD_PERKS : selectedArch === 'conjurer' ? CONJURER_PERKS : MYSTIC_PERKS;
    return pool.filter(p => p.subclass === selectedSub || p.subclass === 'base');
  }, [selectedArch, selectedSub]);

  const spellPool = useMemo(() => {
    if (!selectedArch || !selectedSub) return [];
    const pool = selectedArch === 'warlord' ? WARLORD_SPELLS : selectedArch === 'conjurer' ? CONJURER_SPELLS : MYSTIC_SPELLS;
    return pool.filter(s => s.subclass === selectedSub || s.subclass === 'base');
  }, [selectedArch, selectedSub]);

  const unitsPool = useMemo(() => {
    if (!selectedArch || !selectedSub) return [];
    const pool = selectedArch === 'warlord' ? WARLORD_UNITS : selectedArch === 'conjurer' ? CONJURER_UNITS : MYSTIC_UNITS;
    // Heuristic: Companions are T2/T3
    const baseUnits = pool.filter(u => u.tier === 1 && (u as any).subclass !== 'deathlord');
    const companion = pool.find(u => u.tier > 1) || pool[0];
    return { baseUnits, companion };
  }, [selectedArch, selectedSub]);

  const handleSubclassSelect = (sub: SubclassId) => {
    setSelectedSub(sub);
    setSelectedPerks([]);
    if (sub === 'elemental_master') {
      setStep('element');
    } else {
      setStep('perks');
    }
  };

  const handlePerkToggle = (id: string) => {
    if (selectedPerks.includes(id)) setSelectedPerks(prev => prev.filter(p => p !== id));
    else if (selectedPerks.length < 2) setSelectedPerks(prev => [...prev, id]);
  };

  const confirmRun = () => {
    if (selectedArch && selectedSub) {
      setArchetype(selectedArch, selectedSub, selectedElement || undefined);
      if (selectedPerks.length > 0) {
        selectStartingPerks(selectedPerks);
      }
      onSelect();
    }
  };

  return (
    <div className="w-full h-full min-h-[600px] flex flex-col items-center justify-start bg-[#0D0D0D] text-white font-sans p-8 relative overflow-y-auto">
      <h2 className="text-3xl tracking-widest mb-8 text-center uppercase border-b border-zinc-700 pb-2">
        {step === 'archetype' && 'SELECT ARCHETYPE'}
        {step === 'subclass' && `SELECT ${selectedArch?.toUpperCase()} SUBCLASS`}
        {step === 'element' && 'SELECT ELEMENTAL MASTERY'}
        {step === 'perks' && 'SELECT 2 STARTING PERKS'}
        {step === 'spells' && 'REVIEW SPELL POOL'}
      </h2>

      {step === 'archetype' && (
        <div className="flex gap-8 justify-center flex-wrap">
          {ARCHETYPES.map(arch => (
            <div
              key={arch.id}
              onClick={() => { setSelectedArch(arch.id); setStep('subclass'); }}
              className="w-72 h-96 border flex flex-col items-center justify-between cursor-pointer transition transform hover:-translate-y-2 p-6 bg-zinc-900"
              style={{ borderColor: arch.color, boxShadow: `0 8px 30px ${arch.color}30` }}
            >
              {/* Archetype Portrait */}
              <div className="relative w-full h-36 overflow-hidden rounded-sm mb-2">
                <img
                  src={getArchetypePortrait(arch.id)}
                  onError={makeImgFallback('arcane', arch.name)}
                  alt={arch.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="text-center">
                <span className="block text-2xl tracking-wider font-bold mb-2" style={{ color: arch.color }}>{arch.name}</span>
                <span className="block text-sm text-zinc-400 italic mb-4">{arch.tagline}</span>
              </div>
              <div className="w-full text-sm text-zinc-300 space-y-2">
                <div className="flex justify-between border-b border-zinc-800 pb-1"><span>Base HP:</span> <span className="text-green-400">{arch.hp}</span></div>
                <div className="flex justify-between border-b border-zinc-800 pb-1"><span>Spell Cap:</span> <span className="text-blue-400">{arch.spellCap}</span></div>
                <div className="flex justify-between border-b border-zinc-800 pb-1"><span>Summon Cap:</span> <span className="text-yellow-400">{arch.summonCap}</span></div>
              </div>
              <div className="mt-4 w-full h-24 bg-zinc-950 flex flex-col items-center justify-center border border-zinc-800 relative overflow-hidden">
                <img
                  src={getCompanionImage(arch.id)}
                  onError={makeImgFallback('arcane', arch.companion)}
                  alt={arch.companion}
                  className="absolute inset-0 w-full h-full object-cover opacity-40"
                />
                <span className="relative z-10 text-xs text-zinc-400 mb-1">COMPANION PREVIEW</span>
                <span className="relative z-10 text-sm font-semibold">{arch.companion}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {step === 'subclass' && selectedArch && (
        <div className="flex w-full max-w-5xl justify-center gap-8 relative">
          <div className="flex flex-col gap-4 w-1/2">
            {SUBCLASSES[selectedArch].map(sub => (
              <div
                key={sub.id}
                onMouseEnter={() => setHoveredSub(sub.id)}
                onMouseLeave={() => setHoveredSub(null)}
                onClick={() => handleSubclassSelect(sub.id)}
                className="w-full p-4 border border-zinc-700 bg-zinc-900 cursor-pointer hover:border-white transition flex flex-col group"
              >
                <span className="text-xl font-bold group-hover:text-indigo-400">{sub.name}</span>
                <span className="text-sm text-zinc-400">{sub.desc}</span>
              </div>
            ))}
            <button onClick={() => setStep('archetype')} className="mt-4 px-6 py-2 border border-zinc-600 hover:bg-zinc-800 uppercase tracking-widest text-sm self-start">Back</button>
          </div>

          {/* Hover Tooltip Panel */}
          <div className="w-1/2 p-6 bg-zinc-950 border border-zinc-800 shadow-2xl relative">
            {hoveredSub ? (() => {
              const localPool = selectedArch === 'warlord' ? WARLORD_PERKS : selectedArch === 'conjurer' ? CONJURER_PERKS : MYSTIC_PERKS;
              const sp = localPool.filter(p => p.subclass === hoveredSub || p.subclass === 'base');
              const comp = (selectedArch === 'warlord' ? WARLORD_UNITS : selectedArch === 'conjurer' ? CONJURER_UNITS : MYSTIC_UNITS).find(u => u.tier > 1 && (u as any).subclass !== 'deathlord');
              return (
                <div className="flex flex-col gap-4 animate-fade-in">
                  {/* Subclass Portrait */}
                  <div className="relative w-full h-32 overflow-hidden rounded-sm">
                    <img
                      src={getSubclassPortrait(selectedArch, hoveredSub)}
                      onError={makeImgFallback('arcane', hoveredSub)}
                      alt={hoveredSub}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h3 className="text-2xl text-indigo-400 uppercase font-bold border-b border-zinc-800 pb-2">{SUBCLASSES[selectedArch].find(s => s.id === hoveredSub)?.name}</h3>
                  <p className="text-zinc-300 italic text-sm">{getDesc(hoveredSub)}</p>

                  <div className="mt-2">
                    <span className="text-xs text-zinc-500 uppercase tracking-widest">Companion</span>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="relative w-10 h-10 rounded overflow-hidden flex-shrink-0">
                        <img
                          src={getCompanionImage(hoveredSub)}
                          onError={makeImgFallback('nature', comp?.name ?? hoveredSub)}
                          alt={comp?.name ?? hoveredSub}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="text-emerald-400 font-semibold">{comp ? comp.name : 'Unknown'} (Tier {comp ? comp.tier : '?'})</div>
                    </div>
                  </div>

                  <div className="mt-2">
                    <span className="text-xs text-zinc-500 uppercase tracking-widest">Starting Summons</span>
                    <ul className="list-disc list-inside text-sm text-zinc-300">
                      {(selectedArch === 'warlord' ? WARLORD_UNITS : selectedArch === 'conjurer' ? CONJURER_UNITS : MYSTIC_UNITS)
                        .filter(u => u.tier === 1 && (u as any).subclass !== 'deathlord')
                        .slice(0, 3).map(u => <li key={u.id}>{u.name}</li>)}
                    </ul>
                  </div>

                  <div className="mt-2">
                    <span className="text-xs text-zinc-500 uppercase tracking-widest">Perk Pool</span>
                    <div className="text-sm text-zinc-300 flex flex-wrap gap-2 mt-1">
                      {sp.map(p => <span key={p.id} className="bg-zinc-800 px-2 py-1 rounded text-xs">{p.name}</span>)}
                    </div>
                  </div>

                  <div className="mt-2 text-sm">
                    <span className="text-zinc-500 uppercase tracking-widest">Recommended Floors:</span> <span className="text-yellow-400">1 - 5</span>
                  </div>
                </div>
              );
            })() : (
              <div className="w-full h-full flex items-center justify-center text-zinc-500 italic">Hover over a subclass for details</div>
            )}
          </div>
        </div>
      )}

      {step === 'element' && (
        <div className="flex flex-col items-center">
          <div className="flex gap-6 flex-wrap justify-center max-w-3xl">
            {[
              { s: MagicSchool.Fire, icon: '🔥', dmg: 'Burning / AoE' },
              { s: MagicSchool.Arcane, icon: '❄️', dmg: 'Freeze / Control' }, // mapped Ice to Arcane
              { s: MagicSchool.Nature, icon: '⚡', dmg: 'Chain / Stun' }, // mapped Lightning to Nature
              { s: MagicSchool.Life, icon: '🪨', dmg: 'Defense / Crush' } // mapped Earth to Life
            ].map(element => (
              <div key={element.s} onClick={() => { setSelectedElement(element.s); setStep('perks'); }} className="w-48 h-56 border border-zinc-700 bg-zinc-900 cursor-pointer hover:border-blue-500 transition flex flex-col items-center justify-center gap-4">
                <span className="text-4xl">{element.icon}</span>
                <span className="text-lg font-bold">{element.s}</span>
                <span className="text-xs text-zinc-400 text-center">{element.dmg}</span>
              </div>
            ))}
          </div>
          <button onClick={() => setStep('subclass')} className="mt-12 px-6 py-2 border border-zinc-600 hover:bg-zinc-800">Back</button>
        </div>
      )}

      {step === 'perks' && (
        <div className="flex flex-col items-center w-full max-w-5xl">
          <div className="text-zinc-400 mb-6 flex justify-between w-full items-end">
            <span>Selected: {selectedPerks.length} / 2</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 w-full">
            {perkPool.map(perk => {
              const isSelected = selectedPerks.includes(perk.id as string);
              return (
                <div
                  key={perk.id}
                  onClick={() => handlePerkToggle(perk.id as string)}
                  className={`p-5 border cursor-pointer transition flex flex-col gap-2 relative ${isSelected ? 'border-green-500 bg-green-900/20' : 'border-zinc-700 bg-zinc-900 hover:border-zinc-500'}`}
                >
                  {/* School pill — top-right corner */}
                  <div
                    className="absolute top-2 right-2 text-white font-bold rounded"
                    style={{
                      backgroundColor: SCHOOL_COLORS[perk.school] ?? '#555',
                      fontSize: '10px',
                      padding: '2px 6px',
                      borderRadius: '4px',
                    }}
                  >
                    {perk.school}
                  </div>

                  {/* Selected checkmark — sits below the pill */}
                  {isSelected && <div className="absolute top-7 right-2 text-green-400 text-sm font-bold">✓</div>}

                  <div className="flex items-center gap-3 pr-14">
                    <div className="relative w-8 h-8 flex-shrink-0 rounded overflow-hidden">
                      <img
                        src={getPerkIcon(perk.id as string)}
                        onError={makeImgFallback(perk.school, perk.name)}
                        alt={perk.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="font-bold text-lg">{perk.name}</span>
                  </div>
                  <p className="text-sm text-zinc-300 flex-1">{perk.description}</p>
                  {perk.synergy && (
                    <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', fontStyle: 'italic' }}>{perk.synergy}</p>
                  )}
                  <div className="text-xs text-blue-400 mt-1 italic pt-2 border-t border-zinc-800">{perk.synergy}</div>
                </div>
              );
            })}
          </div>
          <div className="flex gap-6 mt-12 w-full justify-center">
            <button onClick={() => setStep(selectedSub === 'elemental_master' ? 'element' : 'subclass')} className="px-6 py-2 border border-zinc-600 hover:bg-zinc-800">Back</button>
            <button
              onClick={() => setStep('spells')}
              disabled={selectedPerks.length !== 2}
              className="px-8 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 font-bold tracking-wide"
            >
              CONFIRM PERKS
            </button>
          </div>
        </div>
      )}

      {step === 'spells' && (
        <div className="flex flex-col items-center w-full max-w-4xl">
          <div className="text-zinc-400 mb-6">These starting spells will be permanently unlocked for this run.</div>
          <div className="flex flex-col gap-4 w-full">
            {spellPool.map(spell => (
              <div
                key={spell.id}
                className="p-4 border border-zinc-800 bg-zinc-900 flex justify-between items-center relative overflow-hidden"
                style={{ borderLeft: `3px solid ${SCHOOL_COLORS[spell.school] ?? '#555'}` }}
              >
                <div className="flex flex-col gap-1">
                  <div className="flex gap-3 items-center">
                    <span className="font-bold text-lg text-emerald-400">{spell.name}</span>
                    <span
                      className="text-white text-[10px] font-bold px-1.5 py-0.5 rounded"
                      style={{ backgroundColor: SCHOOL_COLORS[spell.school] ?? '#555' }}
                    >
                      {spell.school}
                    </span>
                  </div>
                  <span className="text-sm text-zinc-300">{spell.description}</span>
                </div>
                {/* Mana cost badge */}
                <div
                  className="flex-shrink-0 ml-4 flex flex-col items-center justify-center rounded-full text-white font-bold"
                  style={{ backgroundColor: '#2E86C1', width: '44px', height: '44px', fontSize: '11px', textAlign: 'center' }}
                >
                  {spell.manaCost}<br /><span style={{ fontSize: '9px', opacity: 0.8 }}>MP</span>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-6 mt-12 w-full justify-center">
            <button onClick={() => setStep('perks')} className="px-6 py-2 border border-zinc-600 hover:bg-zinc-800">Back</button>
            <button
              onClick={confirmRun}
              className="px-10 py-3 bg-red-700 hover:bg-red-600 font-bold tracking-widest text-lg shadow-[0_0_20px_rgba(220,38,38,0.5)]"
            >
              ENTER THE SHATTERED CODEX
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
