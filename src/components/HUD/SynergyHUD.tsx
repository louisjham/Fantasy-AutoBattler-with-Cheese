import React, { useEffect, useState } from 'react';
import { ActiveSynergy } from '../../systems/SynergySystem';
import { MagicSchool } from '../../types';
import { globalEventBus } from '../../EventBus';

interface SynergyHUDProps {
  synergies: ActiveSynergy[];
}

const SCHOOL_COLORS: Record<MagicSchool, string> = {
  [MagicSchool.Fire]: '#FF4422',
  [MagicSchool.Death]: '#9922CC',
  [MagicSchool.Nature]: '#33AA44',
  [MagicSchool.Arcane]: '#2244FF',
  [MagicSchool.Life]: '#FFCC00'
};

export default function SynergyHUD({ synergies }: SynergyHUDProps) {
  const [triggerPulses, setTriggerPulses] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const handleTrigger = (payload: { school: MagicSchool }) => {
      setTriggerPulses(prev => ({ ...prev, [payload.school]: true }));
      setTimeout(() => {
        setTriggerPulses(prev => ({ ...prev, [payload.school]: false }));
      }, 500);
    };

    globalEventBus.on('synergy:trigger', handleTrigger);
    return () => globalEventBus.off('synergy:trigger', handleTrigger);
  }, []);

  if (synergies.length === 0) return null;

  return (
    <div className="absolute top-4 right-4 flex flex-col gap-2 z-10 pointer-events-none font-sans">
      {synergies.map(syn => {
        const color = SCHOOL_COLORS[syn.school];
        const isPulsing = triggerPulses[syn.school];
        
        return (
          <div 
            key={syn.school}
            className={`flex flex-col bg-[#0D0D0D] border border-[#333333] p-2 rounded shadow-lg transition-transform duration-200 ${isPulsing ? 'scale-110' : 'scale-100'}`}
            style={{ 
              boxShadow: isPulsing ? `0 0 15px ${color}` : `0 0 5px ${color}40`,
              borderColor: isPulsing ? color : '#333333'
            }}
          >
            <div className="flex items-center justify-between gap-4 mb-1">
              <span className="text-xs font-bold tracking-wider" style={{ color }}>
                {syn.school.toUpperCase()}
              </span>
              <span className="text-xs text-white bg-zinc-800 px-2 py-0.5 rounded">
                {syn.unitCount}
              </span>
            </div>
            
            <div className="flex gap-1 mt-1">
              {[1, 2, 3].map(tier => (
                <div 
                  key={tier}
                  className={`h-1 flex-1 rounded-full ${syn.tier >= tier ? '' : 'opacity-20'}`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
