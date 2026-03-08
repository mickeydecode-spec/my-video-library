import { useState, useRef, useEffect, useCallback } from 'react';
import { VideoFile } from '@/lib/fileScanner';
import {
  ArrowLeft, Play, Pause, SkipForward, SkipBack,
  Volume2, VolumeX, Maximize, Minimize, Settings
} from 'lucide-react';

interface NetflixPlayerProps {
  video: VideoFile;
  onBack: () => void;
  onNext?: () => void;
  onPrev?: () => void;
  resumePosition?: number;
  onPositionUpdate?: (pos: number, dur: number) => void;
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function NetflixPlayer({ video, onBack, onNext, onPrev, resumePosition, onPositionUpdate }: NetflixPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const progressRef = useRef<HTMLDivElement>(null);

  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverX, setHoverX] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [showSpeed, setShowSpeed] = useState(false);

  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      if (playing) setShowControls(false);
    }, 3000);
  }, [playing]);

  useEffect(() => {
    resetHideTimer();
    return () => clearTimeout(hideTimerRef.current);
  }, [resetHideTimer]);

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;

    if (resumePosition && resumePosition > 0) {
      vid.currentTime = resumePosition;
    }

    vid.play().catch(() => setPlaying(false));

    const onTime = () => {
      setCurrentTime(vid.currentTime);
      onPositionUpdate?.(vid.currentTime, vid.duration);
    };
    const onLoaded = () => setDuration(vid.duration);
    const onEnded = () => { setPlaying(false); onNext?.(); };

    vid.addEventListener('timeupdate', onTime);
    vid.addEventListener('loadedmetadata', onLoaded);
    vid.addEventListener('ended', onEnded);
    return () => {
      vid.removeEventListener('timeupdate', onTime);
      vid.removeEventListener('loadedmetadata', onLoaded);
      vid.removeEventListener('ended', onEnded);
    };
  }, [video]);

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    vid.playbackRate = speed;
  }, [speed]);

  const togglePlay = () => {
    const vid = videoRef.current;
    if (!vid) return;
    if (vid.paused) { vid.play(); setPlaying(true); }
    else { vid.pause(); setPlaying(false); }
    resetHideTimer();
  };

  const skip = (secs: number) => {
    const vid = videoRef.current;
    if (!vid) return;
    vid.currentTime = Math.max(0, Math.min(vid.duration, vid.currentTime + secs));
    resetHideTimer();
  };

  const seek = (e: React.MouseEvent) => {
    const bar = progressRef.current;
    const vid = videoRef.current;
    if (!bar || !vid) return;
    const rect = bar.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    vid.currentTime = pct * vid.duration;
    resetHideTimer();
  };

  const handleProgressHover = (e: React.MouseEvent) => {
    const bar = progressRef.current;
    if (!bar || !duration) return;
    const rect = bar.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setHoverTime(pct * duration);
    setHoverX(e.clientX - rect.left);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    setMuted(val === 0);
    if (videoRef.current) videoRef.current.volume = val;
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'k') { e.preventDefault(); togglePlay(); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); skip(10); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); skip(-10); }
      else if (e.key === 'f' || e.key === 'F') toggleFullscreen();
      else if (e.key === 'm' || e.key === 'M') {
        setMuted(m => {
          const next = !m;
          if (videoRef.current) videoRef.current.muted = next;
          return next;
        });
      }
      else if (e.key === 'Escape') onBack();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [playing]);

  const pct = duration > 0 ? (currentTime / duration) * 100 : 0;
  const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-black z-50 cursor-none select-none"
      onMouseMove={resetHideTimer}
      onClick={togglePlay}
      style={{ cursor: showControls ? 'default' : 'none' }}
    >
      <video
        ref={videoRef}
        src={video.url}
        muted={muted}
        className="w-full h-full object-contain"
        playsInline
      />

      {/* Top bar */}
      <div
        className={`absolute top-0 left-0 right-0 flex items-center gap-4 px-6 py-4 bg-gradient-to-b from-black/70 to-transparent transition-opacity duration-500 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onBack} className="text-white hover:text-white/80 transition-colors">
          <ArrowLeft className="h-6 w-6" />
        </button>
        <h2 className="text-white text-lg font-medium truncate">
          {video.name.replace(/\.[^/.]+$/, '')}
        </h2>
      </div>

      {/* Bottom controls */}
      <div
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-6 pb-6 pt-16 transition-opacity duration-500 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={e => e.stopPropagation()}
      >
        {/* Progress bar */}
        <div
          ref={progressRef}
          className="relative w-full h-1 bg-white/20 rounded-full cursor-pointer group mb-4 hover:h-2 transition-all"
          onClick={seek}
          onMouseMove={handleProgressHover}
          onMouseLeave={() => setHoverTime(null)}
        >
          {/* Buffered (fake) */}
          <div className="absolute h-full bg-white/10 rounded-full" style={{ width: `${Math.min(pct + 10, 100)}%` }} />
          {/* Played */}
          <div className="absolute h-full bg-[#e50914] rounded-full" style={{ width: `${pct}%` }} />
          {/* Thumb */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-[#e50914] rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ left: `calc(${pct}% - 6px)` }}
          />
          {/* Hover time tooltip */}
          {hoverTime !== null && (
            <div
              className="absolute -top-8 px-2 py-0.5 bg-black/90 text-white text-xs rounded pointer-events-none"
              style={{ left: `${hoverX}px`, transform: 'translateX(-50%)' }}
            >
              {formatTime(hoverTime)}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {onPrev && (
              <button onClick={onPrev} className="text-white/70 hover:text-white transition-colors">
                <SkipBack className="h-5 w-5" />
              </button>
            )}
            <button onClick={() => skip(-10)} className="text-white/70 hover:text-white transition-colors text-xs font-medium">
              <SkipBack className="h-5 w-5" />
            </button>
            <button onClick={togglePlay} className="text-white hover:text-white/80 transition-colors">
              {playing ? <Pause className="h-7 w-7" /> : <Play className="h-7 w-7 fill-current" />}
            </button>
            <button onClick={() => skip(10)} className="text-white/70 hover:text-white transition-colors text-xs font-medium">
              <SkipForward className="h-5 w-5" />
            </button>
            {onNext && (
              <button onClick={onNext} className="text-white/70 hover:text-white transition-colors">
                <SkipForward className="h-5 w-5" />
              </button>
            )}

            {/* Volume */}
            <div className="flex items-center gap-2 group/vol">
              <button
                onClick={() => {
                  const next = !muted;
                  setMuted(next);
                  if (videoRef.current) videoRef.current.muted = next;
                }}
                className="text-white/70 hover:text-white transition-colors"
              >
                {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={muted ? 0 : volume}
                onChange={handleVolume}
                className="w-0 group-hover/vol:w-20 transition-all duration-200 accent-[#e50914] h-1 cursor-pointer"
              />
            </div>

            <span className="text-white/70 text-xs ml-2">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Speed */}
            <div className="relative">
              <button
                onClick={() => setShowSpeed(!showSpeed)}
                className="text-white/70 hover:text-white transition-colors text-xs font-medium"
              >
                {speed}x
              </button>
              {showSpeed && (
                <div className="absolute bottom-full right-0 mb-2 bg-[#1a1a1a] rounded py-1 shadow-xl">
                  {speeds.map(s => (
                    <button
                      key={s}
                      onClick={() => { setSpeed(s); setShowSpeed(false); }}
                      className={`block w-full px-4 py-1.5 text-xs text-left hover:bg-white/10 transition-colors ${s === speed ? 'text-white' : 'text-white/60'}`}
                    >
                      {s}x
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button onClick={toggleFullscreen} className="text-white/70 hover:text-white transition-colors">
              {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
