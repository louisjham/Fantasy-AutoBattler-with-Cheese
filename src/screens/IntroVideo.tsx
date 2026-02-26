import React, { useRef } from 'react';

interface IntroVideoProps {
    onComplete: () => void;
}

export default function IntroVideo({ onComplete }: IntroVideoProps) {
    const videoRef = useRef<HTMLVideoElement>(null);

    return (
        <div className="relative w-full h-full bg-black flex flex-col items-center justify-center overflow-hidden">
            <video
                ref={videoRef}
                src="intro.mp4" // TODO: Add actual video path here
                className="w-full h-full object-cover"
                autoPlay
                playsInline
                onEnded={onComplete}
            />

            <div className="absolute bottom-8 right-8 z-10">
                <button
                    onClick={onComplete}
                    className="bg-black/50 hover:bg-black/80 text-white font-bold py-2 px-4 rounded border border-zinc-600 transition-all text-xs"
                    style={{ fontFamily: "'Press Start 2P', monospace" }}
                >
                    SKIP &gt;&gt;
                </button>
            </div>

            <div className="absolute top-4 left-4 z-10 text-zinc-500 text-xs font-sans bg-black/70 p-2 rounded">
                Note: Place your video file in the 'public' folder and update the src in IntroVideo.tsx
            </div>
        </div>
    );
}
