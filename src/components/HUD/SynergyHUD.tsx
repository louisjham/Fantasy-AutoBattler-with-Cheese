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

/** Derive a human-friendly multiplier label from the synergy effect value.
 *  e.g. fire_1 value=15 → "+15%" | arcane_1 value=20 → "+20%"
 *  For effects that aren't additive %, we show the tier-based flat bonus.
 */
function getSynergyLabel(syn: ActiveSynergy): string {
  // Effects that express a direct % bonus or flat value we can display
  const { effect, value, tier } = syn;

  // Tier-based representative bonus labels
  if (effect === 'fire_1') return `+${value}% Burn`;
  if (effect === 'fire_2') return `Burn Spreads`;
  if (effect === 'fire_3') return `Burn Explode`;
  if (effect === 'death_1') return `Revive @${value}%`;
  if (effect === 'death_2') return `+${value} Mana/Death`;
  if (effect === 'death_3') return `+${value}% Skeletal`;
  if (effect === 'nature_1') return `+${value} HP/tick`;
  if (effect === 'nature_2') return `-${value} Summon Cost`;
  if (effect === 'nature_3') return `Full Heal`;
  if (effect === 'arcane_1') return `+${value}% Spell`;
  if (effect === 'arcane_2') return `+${value}% Regen`;
  if (effect === 'arcane_3') return `${value}% Refund`;
  if (effect === 'life_1') return `+${value} Max HP`;
  if (effect === 'life_2') return `Free Heal`;
  if (effect === 'life_3') return `Immortal`;

  // Fallback: show tier
  return `Tier ${tier}`;
}

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
        const label = getSynergyLabel(syn);

        return (
          <div
            key={syn.school}
            className={`flex flex-col bg-[#0D0D0D] border p-2 rounded shadow-lg transition-transform duration-200 ${isPulsing ? 'scale-110' : 'scale-100'}`}
            style={{
              boxShadow: isPulsing ? `0 0 15px ${color}` : `0 0 5px ${color}40`,
              borderColor: isPulsing ? color : '#333333',
              minWidth: '120px'
            }}
          >
            {/* Header row: school name + unit count */}
            <div className="flex items-center justify-between gap-3 mb-1">
              <span className="text-xs font-bold tracking-wider" style={{ color }}>
                {syn.school.toUpperCase()}
              </span>
              <span className="text-xs text-white bg-zinc-800 px-2 py-0.5 rounded font-mono">
                ×{syn.unitCount}
              </span>
            </div>

            {/* Bonus label — the key new bit */}
            <div
              className="text-[10px] font-bold px-2 py-0.5 rounded self-start mb-1"
              style={{
                backgroundColor: `${color}30`,
                color,
                border: `1px solid ${color}60`
              }}
            >
              {label}
            </div>

            {/* Tier dots */}
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
