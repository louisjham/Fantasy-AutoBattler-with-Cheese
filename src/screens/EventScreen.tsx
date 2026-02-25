import React, { useState, useEffect } from 'react';
import { useGameStore } from '../store';
import { GAME_EVENTS, GameEvent, EventChoice } from '../data/events';

interface EventScreenProps {
  onComplete: () => void;
}

export default function EventScreen({ onComplete }: EventScreenProps) {
  const [currentEvent, setCurrentEvent] = useState<GameEvent | null>(null);
  const [outcome, setOutcome] = useState<string | null>(null);

  useEffect(() => {
    const randomEvent = GAME_EVENTS[Math.floor(Math.random() * GAME_EVENTS.length)];
    setCurrentEvent(randomEvent);
  }, []);

  const handleChoice = (choice: EventChoice) => {
    // Basic effect parser mock — production would have a real effect parser in the store or helper
    // For now we just log it and maybe tweak gold/hp locally to show it works
    if (choice.effect === 'add_gold' || choice.effect === 'add_gold_risky') {
      useGameStore.setState(s => ({ gold: s.gold + (choice.effect === 'add_gold_risky' ? 40 : choice.value) }));
    }

    setOutcome(`You chose: ${choice.text}. Effect: ${choice.effect}`);
  };

  if (!currentEvent) return null;

  return (
    <div className="w-full h-full flex items-center justify-center p-6 bg-black/80">
      <div className="max-w-2xl w-full bg-zinc-900 border border-zinc-700 rounded-xl p-8 shadow-2xl flex flex-col items-center relative overflow-hidden">

        {/* Glow backdrop */}
        <div className="absolute inset-0 bg-indigo-900/20 pointer-events-none blur-3xl rounded-full"></div>

        <h2 className="text-3xl font-bold text-indigo-400 mb-6 text-center relative z-10" style={{ fontFamily: "'Press Start 2P', monospace", lineHeight: '1.5' }}>
          {currentEvent.title}
        </h2>

        <p className="text-zinc-300 text-lg mb-10 text-center leading-relaxed max-w-lg relative z-10 italic">
          "{currentEvent.description}"
        </p>

        {outcome ? (
          <div className="space-y-8 flex flex-col items-center relative z-10">
            <div className="text-emerald-400 text-center font-bold p-4 bg-emerald-900/20 rounded border border-emerald-800">
              {outcome}
            </div>
            <button
              onClick={onComplete}
              className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-bold"
              style={{ fontFamily: "'Press Start 2P', monospace" }}
            >
              CONTINUE
            </button>
          </div>
        ) : (
          <div className="space-y-4 w-full relative z-10 flex flex-col items-center">
            {currentEvent.choices.map((choice, idx) => (
              <button
                key={idx}
                onClick={() => handleChoice(choice)}
                className="group w-full max-w-md p-4 bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 rounded text-left transition-colors flex flex-col gap-2"
              >
                <div className="font-bold text-zinc-100 uppercase" style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '12px', lineHeight: '1.4' }}>{choice.text}</div>
                <div className="text-sm text-zinc-500 group-hover:text-indigo-300 transition-colors">{choice.preview}</div>
              </button>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
