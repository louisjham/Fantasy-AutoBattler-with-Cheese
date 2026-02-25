import React from 'react';

interface TitleScreenProps {
  onStart: () => void;
}

export default function TitleScreen({ onStart }: TitleScreenProps) {
  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center w-full h-full text-center"
      style={{
        backgroundImage: 'url(/title_bg.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        imageRendering: 'pixelated'
      }}
    >
      <div className="absolute inset-0 bg-black/50 z-0"></div>

      <div className="relative z-10 space-y-12">
        <button
          onClick={onStart}
          className="px-8 py-4 bg-amber-700/80 hover:bg-amber-600 border-2 border-amber-400 text-amber-50 rounded text-xl uppercase tracking-widest font-bold shadow-[0_0_20px_rgba(214,158,46,0.6)] transition-all hover:scale-105 active:scale-95"
          style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}
        >
          Start New Run
        </button>
      </div>
    </div>
  );
}
