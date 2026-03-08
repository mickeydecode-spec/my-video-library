import { useState, useRef, useEffect, useCallback } from 'react';
import { VideoFile } from '@/lib/fileScanner';
import {
  ArrowLeft, Play, Pause, SkipForward, SkipBack,
  Volume2, VolumeX, Maximize, Minimize, Subtitles
} from 'lucide-react';

interface PlexPlayerProps {
  video: VideoFile;
  onBack: () => void;
  onNext?: () => void;
  onPrev?: () => void;
  resumePosition?: number;
  onPositionUpdate?: (pos: number, dur: number) => void;
}

const ORANGE = '#e5a00d';
const BG = '#1f2326';

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function PlexPlayer({ video, onBack, onNext, onPrev, resumePosition, onPositionUpdate }: PlexPlayerProps) {
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
    hideTimerRef.current = setTimeout(() => { if (playing) setShowControls(false); }, 3000);
  }, [playing]);

  useEffect(() => { resetHideTimer(); return () => clearTimeout(hideTimerRef.current); }, [resetHideTimer]);

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    if (resumePosition && resumePosition > 0) vid.currentTime = resumePosition;
    vid.play().catch(() => setPlaying(false));
    const onTime = () => { setCurrentTime(vid.currentTime); onPositionUpdate?.(vid.currentTime, vid.duration); };
    const onLoaded = () => setDuration(vid.duration);
    const onEnded = () => { setPlaying(false); onNext?.(); };
    vid.addEventListener('timeupdate', onTime);
    vid.addEventListener('loadedmetadata', onLoaded);
    vid.addEventListener('ended', onEnded);
    return () => { vid.removeEventListener('timeupdate', onTime); vid.removeEventListener('loadedmetadata', onLoaded); vid.removeEventListener('ended', onEnded); };
  }, [video]);

  useEffect(() => { if (videoRef.current) videoRef.current.playbackRate = speed; }, [speed]);

  const togglePlay = () => {
    const vid = videoRef.current;
    if (!vid) return;
    if (vid.paused) { vid.play(); setPlaying(true); } else { vid.pause(); setPlaying(false); }
    resetHideTimer();
  };

  const skip = (secs: number) => {
    const vid = videoRef.current;
    if (!vid) return;
    vid.currentTime = Math.max(0, Math.min(vid.duration, vid.currentTime + secs));
    resetHideTimer();
  };

  const seek = (e: React.MouseEvent) => {
    const bar = progressRef.current; const vid = videoRef.current;
    if (!bar || !vid) return;
    const rect = bar.getBoundingClientRect();
    vid.currentTime = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)) * vid.duration;
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
    if (!document.fullscreenElement) { containerRef.current?.requestFullscreen(); setIsFullscreen(true); }
    else { document.exitFullscreen(); setIsFullscreen(false); }
  };

  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val); setMuted(val === 0);
    if (videoRef.current) videoRef.current.volume = val;
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'k') { e.preventDefault(); togglePlay(); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); skip(10); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); skip(-10); }
      else if (e.key === 'f' || e.key === 'F') toggleFullscreen();
      else if (e.key === 'm' || e.key === 'M') { setMuted(m => { const next = !m; if (videoRef.current) videoRef.current.muted = next; return next; }); }
      else if (e.key === 'Escape') onBack();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [playing]);

  const pct = duration > 0 ? (currentTime / duration) * 100 : 0;
  const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];
  const libraryName = video.folder.split('/').pop() || 'Library';

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 select-none"
      style={{ backgroundColor: 'black', cursor: showControls ? 'default' : 'none' }}
      onMouseMove={resetHideTimer}
      onClick={togglePlay}
    >
      <video ref={videoRef} src={video.url} muted={muted} className="w-full h-full object-contain" playsInline />

      {/* Top bar */}
      <div
        className={`absolute top-0 left-0 right-0 flex items-center gap-4 px-6 py-4 bg-gradient-to-b from-black/70 to-transparent transition-opacity duration-500 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onBack} className="text-white hover:text-white/80 transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h2 className="text-white text-base font-medium">{video.name.replace(/\.[^/.]+$/, '')}</h2>
          <p className="text-white/40 text-xs">{libraryName}</p>
        </div>
      </div>

      {/* Bottom controls */}
      <div
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-6 pb-5 pt-14 transition-opacity duration-500 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={e => e.stopPropagation()}
      >
        {/* Progress */}
        <div
          ref={progressRef}
          className="relative w-full h-1 bg-white/15 rounded-full cursor-pointer group mb-4 hover:h-2 transition-all"
          onClick={seek}
          onMouseMove={handleProgressHover}
          onMouseLeave={() => setHoverTime(null)}
        >
          <div className="absolute h-full bg-white/10 rounded-full" style={{ width: `${Math.min(pct + 10, 100)}%` }} />
          <div className="absolute h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: ORANGE }} />
          <div className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity border-2 border-white" style={{ backgroundColor: ORANGE, left: `calc(${pct}% - 7px)` }} />
          {hoverTime !== null && (
            <div className="absolute -top-8 px-2 py-0.5 bg-black/90 text-white text-xs rounded pointer-events-none" style={{ left: `${hoverX}px`, transform: 'translateX(-50%)' }}>
              {formatTime(hoverTime)}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {onPrev && <button onClick={onPrev} className="text-white/60 hover:text-white"><SkipBack className="h-5 w-5" /></button>}
            <button onClick={() => skip(-10)} className="text-white/60 hover:text-white text-xs font-medium rounded-full w-8 h-8 flex items-center justify-center bg-white/10 hover:bg-white/20 transition-colors">
              10
            </button>
            <button onClick={togglePlay} className="text-white hover:text-white/80 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors">
              {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 fill-current" />}
            </button>
            <button onClick={() => skip(10)} className="text-white/60 hover:text-white text-xs font-medium rounded-full w-8 h-8 flex items-center justify-center bg-white/10 hover:bg-white/20 transition-colors">
              10
            </button>
            {onNext && <button onClick={onNext} className="text-white/60 hover:text-white"><SkipForward className="h-5 w-5" /></button>}

            <div className="flex items-center gap-2 group/vol">
              <button onClick={() => { setMuted(m => { const next = !m; if (videoRef.current) videoRef.current.muted = next; return next; }); }} className="text-white/60 hover:text-white">
                {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </button>
              <input type="range" min="0" max="1" step="0.05" value={muted ? 0 : volume} onChange={handleVolume}
                className="w-0 group-hover/vol:w-20 transition-all duration-200 h-1 cursor-pointer" style={{ accentColor: ORANGE }} />
            </div>

            <span className="text-white/50 text-xs">{formatTime(currentTime)} / {formatTime(duration)}</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <button onClick={() => setShowSpeed(!showSpeed)} className="text-white/60 hover:text-white text-xs font-medium">{speed}x</button>
              {showSpeed && (
                <div className="absolute bottom-full right-0 mb-2 rounded-lg py-1 shadow-xl" style={{ backgroundColor: BG }}>
                  {speeds.map(s => (
                    <button key={s} onClick={() => { setSpeed(s); setShowSpeed(false); }}
                      className={`block w-full px-4 py-1.5 text-xs text-left hover:bg-white/10 ${s === speed ? 'text-white' : 'text-white/50'}`}>{s}x</button>
                  ))}
                </div>
              )}
            </div>
            {video.subtitleFiles.length > 0 && (
              <button className="text-white/60 hover:text-white"><Subtitles className="h-5 w-5" /></button>
            )}
            <button onClick={toggleFullscreen} className="text-white/60 hover:text-white">
              {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
