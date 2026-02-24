import React, { useEffect, useState } from 'react';
import { useGameStore } from '../store';
import { PlayerArchetype } from '../types';

interface ArchetypeSelectProps {
  onSelect: () => void;
}

export default function ArchetypeSelect({ onSelect }: ArchetypeSelectProps) {
  const { setArchetype } = useGameStore();
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; color: string; speed: number; size: number }[]>([]);

  const archetypes = [
    {
      id: PlayerArchetype.Conjurer,
      name: 'CONJURER',
      color: '#2244FF', // Arcane
      heroSlots: 3,
      summonSlots: 6,
      spell: 'Conjure Familiar (2 MP)',
      perk: 'Blood Pact',
      flavor: '"You are the architect of armies."',
    },
    {
      id: PlayerArchetype.Warlord,
      name: 'WARLORD',
      color: '#FF4422', // Fire
      heroSlots: 6,
      summonSlots: 3,
      spell: 'War Cry (3 MP)',
      perk: 'Bloodthirst',
      flavor: '"You survived. They didn\'t."',
    },
    {
      id: PlayerArchetype.Mystic,
      name: 'MYSTIC',
      color: '#9922CC', // Death/Mystic
      heroSlots: 4,
      summonSlots: 5,
      spell: 'Arcane Surge (0 MP)',
      perk: 'Spell Echo',
      flavor: '"You foresaw the Breaking. Nobody listened."',
    }
  ];

  useEffect(() => {
    // Generate some background particles
    const newParticles = Array.from({ length: 50 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      color: archetypes[Math.floor(Math.random() * archetypes.length)].color,
      speed: 0.1 + Math.random() * 0.3,
      size: 2 + Math.random() * 4
    }));
    setParticles(newParticles);

    let animationFrameId: number;
    const animate = () => {
      setParticles(prev => prev.map(p => ({
        ...p,
        y: p.y - p.speed,
        ...(p.y < -10 ? { y: 110, x: Math.random() * 100 } : {})
      })));
      animationFrameId = requestAnimationFrame(animate);
    };
    animate();

    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  const handleSelect = (archId: PlayerArchetype) => {
    setArchetype(archId);
    onSelect();
  };

  return (
    <div className="w-full h-full min-h-[600px] flex flex-col items-center justify-center bg-[#0D0D0D] relative overflow-hidden font-sans">
      {/* Background Particles */}
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute rounded-full opacity-30"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: p.color,
            boxShadow: `0 0 ${p.size * 2}px ${p.color}`
          }}
        />
      ))}

      <div className="z-10 text-center mb-12">
        <h2 className="text-3xl text-white mb-4 tracking-widest drop-shadow-md">SELECT ARCHETYPE</h2>
      </div>
      
      <div className="z-10 flex flex-wrap justify-center gap-8 px-4">
        {archetypes.map(arch => (
          <div 
            key={arch.id}
            onClick={() => handleSelect(arch.id)}
            className="w-72 bg-[#1A1A1A] border-2 cursor-pointer transition-transform duration-300 hover:scale-[1.05] p-6 flex flex-col gap-4 relative"
            style={{ borderColor: arch.color, boxShadow: `0 0 15px ${arch.color}40` }}
          >
            <h3 className="text-xl text-center tracking-wider" style={{ color: arch.color, textShadow: `0 0 10px ${arch.color}80` }}>
              {arch.name}
            </h3>
            
            <div className="text-xs text-zinc-300 space-y-3 mt-4 flex-1 leading-relaxed">
              <div className="flex justify-between">
                <span>Heroes:</span>
                <span className="text-white">{arch.heroSlots}</span>
              </div>
              <div className="flex justify-between">
                <span>Summons:</span>
                <span className="text-white">{arch.summonSlots}</span>
              </div>
              
              <div className="h-px bg-zinc-800 my-4"></div>
              
              <div>
                <span className="text-zinc-500 block mb-1">Starting Spell:</span>
                <span className="text-white">{arch.spell}</span>
              </div>
              
              <div>
                <span className="text-zinc-500 block mb-1">Starting Perk:</span>
                <span className="text-white">{arch.perk}</span>
              </div>
            </div>
            
            <div className="mt-6 text-[10px] text-zinc-500 italic text-center leading-tight">
              {arch.flavor}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
