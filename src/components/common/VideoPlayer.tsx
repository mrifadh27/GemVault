'use client';

import { useState, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getImageUrl } from '@/lib/utils';

interface VideoPlayerProps {
  src: string;
  className?: string;
  autoPlay?: boolean;
}

export function VideoPlayer({ src, className, autoPlay = false }: VideoPlayerProps) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(autoPlay);
  const [muted, setMuted] = useState(true);
  const [progress, setProgress] = useState(0);

  const toggle = () => {
    if (!ref.current) return;
    if (playing) { ref.current.pause(); setPlaying(false); }
    else { ref.current.play(); setPlaying(true); }
  };

  const handleTimeUpdate = () => {
    if (!ref.current) return;
    setProgress((ref.current.currentTime / (ref.current.duration || 1)) * 100);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    ref.current.currentTime = pct * ref.current.duration;
  };

  const handleFullscreen = () => {
    if (ref.current?.requestFullscreen) ref.current.requestFullscreen();
  };

  const videoSrc = getImageUrl(src);

  return (
    <div className={cn('relative bg-black group overflow-hidden', className)}>
      <video
        ref={ref}
        src={videoSrc}
        className="w-full h-full object-cover"
        muted={muted}
        loop
        playsInline
        autoPlay={autoPlay}
        onTimeUpdate={handleTimeUpdate}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onClick={toggle}
      />

      {/* Play/Pause overlay */}
      <div
        className={cn(
          'absolute inset-0 flex items-center justify-center transition-opacity',
          playing ? 'opacity-0 group-hover:opacity-100' : 'opacity-100',
        )}
        onClick={toggle}
      >
        <div className="w-12 h-12 rounded-full bg-black/60 backdrop-blur flex items-center justify-center">
          {playing ? <Pause className="w-5 h-5 text-white" /> : <Play className="w-5 h-5 text-white ml-0.5" />}
        </div>
      </div>

      {/* Video badge */}
      <div className="absolute top-2.5 left-2.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/60 text-white backdrop-blur">
        📹 VIDEO
      </div>

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-3 pb-2 pt-6 opacity-0 group-hover:opacity-100 transition-opacity">
        {/* Seek bar */}
        <div
          className="h-1 bg-white/20 rounded-full cursor-pointer mb-2"
          onClick={handleSeek}
        >
          <div
            className="h-full bg-gold rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center justify-between">
          <button onClick={toggle} className="text-white">
            {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <div className="flex items-center gap-2">
            <button onClick={() => setMuted(m => !m)} className="text-white">
              {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <button onClick={handleFullscreen} className="text-white">
              <Maximize className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
