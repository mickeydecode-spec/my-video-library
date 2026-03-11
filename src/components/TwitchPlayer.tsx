import { useState, useRef, useEffect, useCallback } from 'react';
import { VideoFile } from '@/lib/fileScanner';
import { usePlayerSubtitles } from '@/hooks/usePlayerSubtitles';
import {
  ArrowLeft, Play, Pause, SkipForward, SkipBack,
  Volume2, VolumeX, Maximize, Minimize, MessageSquare, Subtitles, Languages
} from 'lucide-react';

interface TwitchPlayerProps {
  video: VideoFile;
  onBack: () => void;
  onNext?: () => void;
  onPrev?: () => void;
  resumePosition?: number;
  onPositionUpdate?: (pos: number, dur: number) => void;
}

const PURPLE = '#9146ff';
const BG = '#0e0e10';
const SURFACE = '#18181b';

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function TwitchPlayer({ video, onBack, onNext, onPrev, resumePosition, onPositionUpdate }: TwitchPlayerProps) {
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
  const [showChat, setShowChat] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [showSpeed, setShowSpeed] = useState(false);
  const [showSubMenu, setShowSubMenu] = useState(false);
  const [showAudioMenu, setShowAudioMenu] = useState(false);

  const {
    subtitleTracks, activeSubtitle, setActiveSubtitle,
    audioTracks, activeAudioTrack, setActiveAudioTrack,
  } = usePlayerSubtitles(video, videoRef);

  useEffect(() => { setShowChat(window.innerWidth >= 768); }, []);

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
  const channelName = video.folder.split('/').pop() || 'Channel';

  return (
    <div ref={containerRef} className="fixed inset-0 z-50 flex flex-col md:flex-row" style={{ backgroundColor: BG }}>
      <div
        className="flex-1 relative select-none"
        onMouseMove={resetHideTimer}
        onClick={togglePlay}
        style={{ cursor: showControls ? 'default' : 'none' }}
      >
        <video ref={videoRef} muted={muted} className="w-full h-full object-contain" playsInline>
          <source src={video.url} />
          {subtitleTracks.map((s) => (
            <track key={s.index} kind="subtitles" src={s.url} srcLang={s.language} label={s.language} />
          ))}
        </video>

        {/* Top bar */}
        <div
          className={`absolute top-0 left-0 right-0 flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 bg-gradient-to-b from-black/70 to-transparent transition-opacity duration-500 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          onClick={e => e.stopPropagation()}
        >
          <button onClick={onBack} className="text-white hover:text-white/80"><ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" /></button>
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-white text-[10px] sm:text-xs font-bold shrink-0" style={{ backgroundColor: PURPLE }}>
              {channelName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-white text-xs sm:text-sm font-semibold truncate">{channelName}</p>
              <p className="text-white/50 text-[10px] sm:text-xs truncate max-w-[200px] sm:max-w-md">{video.name.replace(/\.[^/.]+$/, '')}</p>
            </div>
          </div>
        </div>

        {/* Bottom controls */}
        <div
          className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-3 sm:px-4 pb-3 sm:pb-4 pt-8 sm:pt-12 transition-opacity duration-500 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          onClick={e => e.stopPropagation()}
        >
          <div
            ref={progressRef}
            className="relative w-full h-1.5 sm:h-1 bg-white/20 rounded-full cursor-pointer group mb-2 sm:mb-3 hover:h-2 transition-all"
            onClick={seek}
            onMouseMove={handleProgressHover}
            onMouseLeave={() => setHoverTime(null)}
          >
            <div className="absolute h-full bg-white/10 rounded-full" style={{ width: `${Math.min(pct + 10, 100)}%` }} />
            <div className="absolute h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: PURPLE }} />
            <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: PURPLE, left: `calc(${pct}% - 6px)` }} />
            {hoverTime !== null && (
              <div className="absolute -top-8 px-2 py-0.5 bg-black/90 text-white text-xs rounded pointer-events-none" style={{ left: `${hoverX}px`, transform: 'translateX(-50%)' }}>
                {formatTime(hoverTime)}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              {onPrev && <button onClick={onPrev} className="text-white/70 hover:text-white hidden sm:block"><SkipBack className="h-4 w-4" /></button>}
              <button onClick={() => skip(-10)} className="text-white/70 hover:text-white"><SkipBack className="h-3.5 w-3.5 sm:h-4 sm:w-4" /></button>
              <button onClick={togglePlay} className="text-white hover:text-white/80">
                {playing ? <Pause className="h-5 w-5 sm:h-6 sm:w-6" /> : <Play className="h-5 w-5 sm:h-6 sm:w-6 fill-current" />}
              </button>
              <button onClick={() => skip(10)} className="text-white/70 hover:text-white"><SkipForward className="h-3.5 w-3.5 sm:h-4 sm:w-4" /></button>
              {onNext && <button onClick={onNext} className="text-white/70 hover:text-white hidden sm:block"><SkipForward className="h-4 w-4" /></button>}

              <div className="flex items-center gap-2 group/vol hidden sm:flex">
                <button onClick={() => { setMuted(m => { const next = !m; if (videoRef.current) videoRef.current.muted = next; return next; }); }} className="text-white/70 hover:text-white">
                  {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </button>
                <input type="range" min="0" max="1" step="0.05" value={muted ? 0 : volume} onChange={handleVolume}
                  className="w-0 group-hover/vol:w-16 transition-all duration-200 h-1 cursor-pointer" style={{ accentColor: PURPLE }} />
              </div>

              <span className="text-white/60 text-[10px] sm:text-xs">{formatTime(currentTime)} / {formatTime(duration)}</span>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              {/* Subtitle picker */}
              <div className="relative">
                <button
                  onClick={() => { setShowSubMenu(!showSubMenu); setShowAudioMenu(false); setShowSpeed(false); }}
                  className="transition-colors"
                  style={{ color: activeSubtitle >= 0 ? PURPLE : 'rgba(255,255,255,0.7)' }}
                  title="Subtitles"
                >
                  <Subtitles className="h-4 w-4" />
                </button>
                {showSubMenu && (
                  <div className="absolute bottom-full right-0 mb-2 rounded py-1 shadow-xl min-w-[140px]" style={{ backgroundColor: SURFACE }}>
                    <button onClick={() => { setActiveSubtitle(-1); setShowSubMenu(false); }}
                      className={`block w-full px-4 py-1.5 text-xs text-left hover:bg-white/10 ${activeSubtitle === -1 ? 'text-white' : 'text-white/60'}`}>Off</button>
                    {subtitleTracks.map(s => (
                      <button key={s.index} onClick={() => { setActiveSubtitle(s.index); setShowSubMenu(false); }}
                        className={`block w-full px-4 py-1.5 text-xs text-left hover:bg-white/10 ${activeSubtitle === s.index ? 'text-white' : 'text-white/60'}`}>
                        {s.language}
                      </button>
                    ))}
                    {subtitleTracks.length === 0 && <span className="block px-4 py-1.5 text-xs text-white/30">No subtitles</span>}
                  </div>
                )}
              </div>

              {/* Audio track picker */}
              <div className="relative hidden sm:block">
                <button onClick={() => { setShowAudioMenu(!showAudioMenu); setShowSubMenu(false); setShowSpeed(false); }}
                  className="text-white/70 hover:text-white transition-colors" title="Audio Track">
                  <Languages className="h-4 w-4" />
                </button>
                {showAudioMenu && (
                  <div className="absolute bottom-full right-0 mb-2 rounded py-1 shadow-xl min-w-[160px]" style={{ backgroundColor: SURFACE }}>
                    {audioTracks.length > 0 ? audioTracks.map(t => (
                      <button key={t.index} onClick={() => { setActiveAudioTrack(t.index); setShowAudioMenu(false); }}
                        className={`block w-full px-4 py-1.5 text-xs text-left hover:bg-white/10 ${t.index === activeAudioTrack ? 'text-white' : 'text-white/60'}`}>
                        {t.label} ({t.language})
                      </button>
                    )) : <span className="block px-4 py-1.5 text-xs text-white/30">No extra audio tracks</span>}
                  </div>
                )}
              </div>

              <div className="relative hidden sm:block">
                <button onClick={() => { setShowSpeed(!showSpeed); setShowSubMenu(false); setShowAudioMenu(false); }} className="text-white/70 hover:text-white text-xs font-medium">{speed}x</button>
                {showSpeed && (
                  <div className="absolute bottom-full right-0 mb-2 rounded py-1 shadow-xl" style={{ backgroundColor: SURFACE }}>
                    {speeds.map(s => (
                      <button key={s} onClick={() => { setSpeed(s); setShowSpeed(false); }}
                        className={`block w-full px-4 py-1.5 text-xs text-left hover:bg-white/10 ${s === speed ? 'text-white' : 'text-white/60'}`}>{s}x</button>
                    ))}
                  </div>
                )}
              </div>
              <button onClick={() => setShowChat(!showChat)} className="text-white/70 hover:text-white hidden md:block" title="Toggle Chat">
                <MessageSquare className="h-4 w-4" />
              </button>
              <button onClick={toggleFullscreen} className="text-white/70 hover:text-white">
                {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Chat panel */}
      {showChat && (
        <div className="hidden md:flex w-72 lg:w-80 shrink-0 flex-col border-l" style={{ borderColor: '#26262c', backgroundColor: SURFACE }}>
          <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: '#26262c' }}>
            <span className="text-white text-sm font-semibold">Stream Chat</span>
          </div>
          <div className="flex-1 flex items-center justify-center px-6">
            <p className="text-white/30 text-xs text-center">Chat is unavailable for local files</p>
          </div>
          <div className="px-3 py-3 border-t" style={{ borderColor: '#26262c' }}>
            <div className="rounded px-3 py-2 text-xs text-white/30" style={{ backgroundColor: '#26262c' }}>Send a message</div>
          </div>
        </div>
      )}
    </div>
  );
}
