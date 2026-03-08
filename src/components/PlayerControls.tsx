import { useState, useCallback, useEffect, useRef } from 'react';
import {
  Play, Pause, Square, SkipBack, SkipForward,
  Maximize, ListVideo, Repeat, Shuffle,
  Volume2, Volume1, VolumeX, Volume,
  Camera, Gauge, RatioIcon, Languages, Type,
  ChevronUp, ChevronDown
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';

interface PlayerControlsProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  onPrev: () => void;
  onNext: () => void;
  onStop: () => void;
}

const SPEED_OPTIONS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 3, 4];
const ASPECT_OPTIONS = [
  { label: 'Auto', value: 'auto' },
  { label: 'Fill', value: 'fill' },
  { label: 'Stretch', value: 'stretch' },
  { label: '4:3', value: '4/3' },
  { label: '16:9', value: '16/9' },
  { label: '21:9', value: '21/9' },
];

function formatTime(seconds: number): string {
  if (!seconds || !isFinite(seconds)) return '00:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function PlayerControls({ videoRef, onPrev, onNext, onStop }: PlayerControlsProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [isLooping, setIsLooping] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);
  const [abLoop, setAbLoop] = useState<{ a: number | null; b: number | null }>({ a: null, b: null });
  const [aspect, setAspect] = useState('auto');
  const [volumeBoost, setVolumeBoost] = useState(100);
  const [audioTracks, setAudioTracks] = useState<{ id: number; label: string; language: string; enabled: boolean }[]>([]);
  const [subtitleSize, setSubtitleSize] = useState(100);
  const [isSeeking, setIsSeeking] = useState(false);
  const [showRemaining, setShowRemaining] = useState(false);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverPos, setHoverPos] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const gainNodeRef = useRef<GainNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const abIntervalRef = useRef<number | null>(null);
  const seekbarRef = useRef<HTMLDivElement>(null);

  // Sync play state
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onTime = () => { if (!isSeeking) setCurrentTime(el.currentTime); };
    const onDur = () => setDuration(el.duration);
    const onVol = () => {
      setVolume(Math.round(el.volume * 100));
      setIsMuted(el.muted);
    };
    el.addEventListener('play', onPlay);
    el.addEventListener('pause', onPause);
    el.addEventListener('timeupdate', onTime);
    el.addEventListener('loadedmetadata', onDur);
    el.addEventListener('durationchange', onDur);
    el.addEventListener('volumechange', onVol);
    // Init
    if (el.duration) setDuration(el.duration);
    setIsPlaying(!el.paused);
    setVolume(Math.round(el.volume * 100));
    setIsMuted(el.muted);
    return () => {
      el.removeEventListener('play', onPlay);
      el.removeEventListener('pause', onPause);
      el.removeEventListener('timeupdate', onTime);
      el.removeEventListener('loadedmetadata', onDur);
      el.removeEventListener('durationchange', onDur);
      el.removeEventListener('volumechange', onVol);
    };
  }, [videoRef, isSeeking]);

  // Audio boost init
  const initAudioBoost = useCallback(() => {
    const el = videoRef.current;
    if (!el || sourceRef.current) return;
    try {
      const ctx = new AudioContext();
      const source = ctx.createMediaElementSource(el);
      const gain = ctx.createGain();
      source.connect(gain);
      gain.connect(ctx.destination);
      audioCtxRef.current = ctx;
      sourceRef.current = source;
      gainNodeRef.current = gain;
    } catch (e) { console.warn('Audio boost init failed:', e); }
  }, [videoRef]);

  // Audio tracks detection
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    const detect = () => {
      const at = (el as any).audioTracks;
      if (at && at.length > 0) {
        const tracks: typeof audioTracks = [];
        for (let i = 0; i < at.length; i++) {
          tracks.push({ id: i, label: at[i].label || `Track ${i + 1}`, language: at[i].language || 'unknown', enabled: at[i].enabled });
        }
        setAudioTracks(tracks);
      }
    };
    el.addEventListener('loadedmetadata', detect);
    detect();
    return () => el.removeEventListener('loadedmetadata', detect);
  }, [videoRef]);

  // A-B Loop
  useEffect(() => {
    if (abIntervalRef.current) clearInterval(abIntervalRef.current);
    if (abLoop.a !== null && abLoop.b !== null && videoRef.current) {
      abIntervalRef.current = window.setInterval(() => {
        const el = videoRef.current;
        if (el && el.currentTime >= abLoop.b!) el.currentTime = abLoop.a!;
      }, 100);
    }
    return () => { if (abIntervalRef.current) clearInterval(abIntervalRef.current); };
  }, [abLoop, videoRef]);

  // Aspect ratio
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    el.style.objectFit = aspect === 'auto' ? 'contain' : aspect === 'fill' ? 'cover' : aspect === 'stretch' ? 'fill' : 'contain';
    el.style.aspectRatio = ['auto', 'fill', 'stretch'].includes(aspect) ? '' : aspect;
  }, [aspect, videoRef]);

  // Volume boost
  useEffect(() => {
    if (!gainNodeRef.current) return;
    gainNodeRef.current.gain.value = volumeBoost / 100;
  }, [volumeBoost]);

  // Subtitle size
  useEffect(() => {
    const existing = document.getElementById('mytube-subtitle-style');
    if (existing) existing.remove();
    const style = document.createElement('style');
    style.id = 'mytube-subtitle-style';
    style.textContent = `video::cue { font-size: ${subtitleSize}% !important; }`;
    document.head.appendChild(style);
    return () => { style.remove(); };
  }, [subtitleSize]);

  const togglePlay = useCallback(() => {
    const el = videoRef.current;
    if (!el) return;
    el.paused ? el.play() : el.pause();
  }, [videoRef]);

  const changeSpeed = useCallback((s: number) => {
    if (videoRef.current) { videoRef.current.playbackRate = s; setSpeed(s); }
  }, [videoRef]);

  const handleVolumeChange = useCallback((val: number[]) => {
    const el = videoRef.current;
    if (!el) return;
    el.volume = val[0] / 100;
    el.muted = false;
    setVolume(val[0]);
    setIsMuted(false);
  }, [videoRef]);

  const toggleMute = useCallback(() => {
    const el = videoRef.current;
    if (!el) return;
    el.muted = !el.muted;
  }, [videoRef]);

  const toggleFullscreen = useCallback(() => {
    const el = videoRef.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else el.closest('.vlc-player-root')?.requestFullscreen?.() || el.requestFullscreen?.();
  }, [videoRef]);

  const toggleAbLoop = useCallback(() => {
    const el = videoRef.current;
    if (!el) return;
    if (abLoop.a === null) setAbLoop({ a: el.currentTime, b: null });
    else if (abLoop.b === null) setAbLoop(prev => ({ ...prev, b: el.currentTime }));
    else setAbLoop({ a: null, b: null });
  }, [abLoop, videoRef]);

  const takeScreenshot = useCallback(() => {
    const el = videoRef.current;
    if (!el) return;
    const canvas = document.createElement('canvas');
    canvas.width = el.videoWidth;
    canvas.height = el.videoHeight;
    canvas.getContext('2d')?.drawImage(el, 0, 0);
    const link = document.createElement('a');
    link.download = `screenshot-${Math.floor(el.currentTime)}s.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }, [videoRef]);

  const switchAudioTrack = useCallback((trackId: string) => {
    const at = (videoRef.current as any)?.audioTracks;
    if (!at) return;
    for (let i = 0; i < at.length; i++) at[i].enabled = i === parseInt(trackId);
    setAudioTracks(prev => prev.map((t, i) => ({ ...t, enabled: i === parseInt(trackId) })));
  }, [videoRef]);

  // Seekbar interaction
  const handleSeekbarClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = videoRef.current;
    const bar = seekbarRef.current;
    if (!el || !bar || !duration) return;
    const rect = bar.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    el.currentTime = ratio * duration;
    setCurrentTime(ratio * duration);
  }, [videoRef, duration]);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Buffered range tracking
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    const updateBuffered = () => {
      if (el.buffered.length > 0 && el.duration > 0) {
        setBuffered((el.buffered.end(el.buffered.length - 1) / el.duration) * 100);
      }
    };
    el.addEventListener('progress', updateBuffered);
    return () => el.removeEventListener('progress', updateBuffered);
  }, [videoRef]);

  const handleSeekbarHover = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const bar = seekbarRef.current;
    if (!bar || !duration) return;
    const rect = bar.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setHoverTime(ratio * duration);
    setHoverPos(ratio * 100);
  }, [duration]);

  const VolumeIcon = isMuted || volume === 0 ? VolumeX : volume < 30 ? Volume : volume < 70 ? Volume1 : Volume2;

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const el = videoRef.current;
      if (!el) return;
      if ((e.target as HTMLElement)?.tagName === 'INPUT' || (e.target as HTMLElement)?.tagName === 'TEXTAREA') return;
      switch (e.key.toLowerCase()) {
        case ' ': togglePlay(); e.preventDefault(); break;
        case '[': changeSpeed(Math.max(0.25, speed - 0.25)); e.preventDefault(); break;
        case ']': changeSpeed(Math.min(4, speed + 0.25)); e.preventDefault(); break;
        case 'l': toggleAbLoop(); e.preventDefault(); break;
        case 's': if (e.ctrlKey || e.metaKey) { e.preventDefault(); takeScreenshot(); } break;
        case 'j': el.currentTime = Math.max(0, el.currentTime - 10); e.preventDefault(); break;
        case 'k': togglePlay(); e.preventDefault(); break;
        case 'arrowleft': el.currentTime = Math.max(0, el.currentTime - 5); e.preventDefault(); break;
        case 'arrowright': el.currentTime += 5; e.preventDefault(); break;
        case 'arrowup': el.volume = Math.min(1, el.volume + 0.05); e.preventDefault(); break;
        case 'arrowdown': el.volume = Math.max(0, el.volume - 0.05); e.preventDefault(); break;
        case 'f': toggleFullscreen(); e.preventDefault(); break;
        case 'm': toggleMute(); e.preventDefault(); break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [videoRef, speed, changeSpeed, toggleAbLoop, takeScreenshot, togglePlay, toggleFullscreen, toggleMute]);

  return (
    <div className="flex flex-col select-none bg-black/90 border-t border-white/10">
      {/* Seekbar - VLC style thin bar */}
      <div className="px-1 pt-1">
        <div className="flex items-center gap-2 text-xs text-white/70">
          <button
            className="font-mono text-[11px] min-w-[45px] hover:text-primary transition-colors bg-transparent border-none cursor-pointer p-0 text-left text-white/70"
            onClick={() => setShowRemaining(!showRemaining)}
            title="Toggle elapsed/remaining"
          >
            {showRemaining && duration > 0 ? `-${formatTime(duration - currentTime)}` : formatTime(currentTime)}
          </button>
          <div
            ref={seekbarRef}
            className="flex-1 h-[6px] rounded-sm cursor-pointer relative group/seek bg-white/20"
            style={{ background: '#c0c0c0' }}
            onClick={handleSeekbarClick}
            onMouseMove={handleSeekbarHover}
            onMouseLeave={() => setHoverTime(null)}
          >
            {/* Buffered range */}
            <div
              className="absolute top-0 left-0 h-full rounded-sm"
              style={{ width: `${buffered}%`, background: '#a0a0a0' }}
            />
            <div
              className="absolute top-0 left-0 h-full rounded-sm"
              style={{ width: `${progress}%`, background: '#ff6600' }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 h-3 w-3 rounded-full border border-[#999]"
              style={{ left: `calc(${progress}% - 6px)`, background: '#ff6600' }}
            />
            {/* Hover time tooltip */}
            {hoverTime !== null && (
              <div
                className="absolute -top-7 -translate-x-1/2 bg-[#333] text-white text-[10px] px-1.5 py-0.5 rounded pointer-events-none whitespace-nowrap"
                style={{ left: `${hoverPos}%` }}
              >
                {formatTime(hoverTime)}
              </div>
            )}
          </div>
          <span className="font-mono text-[11px] min-w-[45px] text-right">{formatTime(duration)}</span>
        </div>
      </div>

      {/* Transport controls - VLC bottom bar */}
      <div className="flex items-center gap-0.5 px-1 py-0.5">
        {/* Play / Pause */}
        <button
          onClick={togglePlay}
          className="p-1.5 rounded hover:bg-black/10 transition-colors"
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying
            ? <Pause className="h-4 w-4" style={{ color: '#333' }} />
            : <Play className="h-4 w-4" style={{ color: '#333' }} />
          }
        </button>

        {/* Previous */}
        <button onClick={onPrev} className="p-1.5 rounded hover:bg-black/10 transition-colors" title="Previous">
          <SkipBack className="h-3.5 w-3.5" style={{ color: '#333' }} />
        </button>

        {/* Stop */}
        <button onClick={onStop} className="p-1.5 rounded hover:bg-black/10 transition-colors" title="Stop">
          <Square className="h-3.5 w-3.5" style={{ color: '#333' }} />
        </button>

        {/* Next */}
        <button onClick={onNext} className="p-1.5 rounded hover:bg-black/10 transition-colors" title="Next">
          <SkipForward className="h-3.5 w-3.5" style={{ color: '#333' }} />
        </button>

        {/* Fullscreen */}
        <button onClick={toggleFullscreen} className="p-1.5 rounded hover:bg-black/10 transition-colors" title="Fullscreen (F)">
          <Maximize className="h-3.5 w-3.5" style={{ color: '#333' }} />
        </button>

        {/* Playlist / Extended controls separator */}
        <div className="flex items-center gap-0.5 ml-1 border-l pl-1" style={{ borderColor: '#bbb' }}>
          {/* A-B Loop */}
          <button
            onClick={toggleAbLoop}
            className="p-1.5 rounded hover:bg-black/10 transition-colors"
            title="A-B Loop (L)"
            style={{ color: abLoop.a !== null ? '#ff6600' : '#333' }}
          >
            <Repeat className="h-3.5 w-3.5" />
          </button>

          {/* Shuffle */}
          <button
            onClick={() => setIsShuffled(!isShuffled)}
            className="p-1.5 rounded hover:bg-black/10 transition-colors"
            title="Shuffle"
            style={{ color: isShuffled ? '#ff6600' : '#333' }}
          >
            <Shuffle className="h-3.5 w-3.5" />
          </button>

          {/* Screenshot */}
          <button onClick={takeScreenshot} className="p-1.5 rounded hover:bg-black/10 transition-colors" title="Screenshot (Ctrl+S)">
            <Camera className="h-3.5 w-3.5" style={{ color: '#333' }} />
          </button>
        </div>

        {/* Speed popover */}
        <Popover>
          <PopoverTrigger asChild>
            <button className="p-1.5 rounded hover:bg-black/10 transition-colors text-[11px] font-mono ml-1" style={{ color: speed !== 1 ? '#ff6600' : '#333' }}>
              {speed}x
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-40 p-2" side="top">
            <p className="text-xs font-medium mb-2 text-muted-foreground">Speed</p>
            <div className="grid grid-cols-5 gap-1">
              {SPEED_OPTIONS.map(s => (
                <Button key={s} variant={speed === s ? 'default' : 'ghost'} size="sm" className="h-7 text-xs px-1" onClick={() => changeSpeed(s)}>
                  {s}x
                </Button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Aspect Ratio */}
        <Popover>
          <PopoverTrigger asChild>
            <button className="p-1.5 rounded hover:bg-black/10 transition-colors" title="Aspect Ratio">
              <RatioIcon className="h-3.5 w-3.5" style={{ color: '#333' }} />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-36 p-2" side="top">
            <p className="text-xs font-medium mb-2 text-muted-foreground">Aspect Ratio</p>
            {ASPECT_OPTIONS.map(a => (
              <Button key={a.value} variant={aspect === a.value ? 'default' : 'ghost'} size="sm" className="h-7 text-xs w-full justify-start" onClick={() => setAspect(a.value)}>
                {a.label}
              </Button>
            ))}
          </PopoverContent>
        </Popover>

        {/* Audio tracks */}
        {audioTracks.length > 1 && (
          <Popover>
            <PopoverTrigger asChild>
              <button className="p-1.5 rounded hover:bg-black/10 transition-colors" title="Audio Track">
                <Languages className="h-3.5 w-3.5" style={{ color: '#333' }} />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-2" side="top">
              <p className="text-xs font-medium mb-2 text-muted-foreground">Audio Track</p>
              {audioTracks.map(t => (
                <Button key={t.id} variant={t.enabled ? 'default' : 'ghost'} size="sm" className="h-7 text-xs w-full justify-start" onClick={() => switchAudioTrack(String(t.id))}>
                  {t.label} ({t.language})
                </Button>
              ))}
            </PopoverContent>
          </Popover>
        )}

        {/* Subtitle size */}
        <Popover>
          <PopoverTrigger asChild>
            <button className="p-1.5 rounded hover:bg-black/10 transition-colors" title="Subtitle Size">
              <Type className="h-3.5 w-3.5" style={{ color: '#333' }} />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-3" side="top">
            <p className="text-xs font-medium mb-2 text-muted-foreground">Subtitle Size</p>
            <Slider min={50} max={200} step={10} value={[subtitleSize]} onValueChange={v => setSubtitleSize(v[0])} />
            <p className="text-xs text-muted-foreground mt-1 text-center">{subtitleSize}%</p>
          </PopoverContent>
        </Popover>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Volume - VLC style: icon + horizontal slider + percentage */}
        <div className="flex items-center gap-1 mr-1">
          <button onClick={toggleMute} className="p-1 rounded hover:bg-black/10 transition-colors" title="Mute (M)">
            <VolumeIcon className="h-3.5 w-3.5" style={{ color: '#333' }} />
          </button>
          <div className="w-20">
            <Slider
              min={0} max={200} step={1}
              value={[isMuted ? 0 : volume]}
              onValueChange={(v) => {
                if (v[0] > 100 && !sourceRef.current) initAudioBoost();
                if (v[0] > 100) {
                  if (gainNodeRef.current) gainNodeRef.current.gain.value = v[0] / 100;
                  setVolumeBoost(v[0]);
                  handleVolumeChange([100]);
                } else {
                  if (gainNodeRef.current) gainNodeRef.current.gain.value = 1;
                  setVolumeBoost(100);
                  handleVolumeChange(v);
                }
              }}
            />
          </div>
          <span className="text-[11px] font-mono min-w-[35px] text-right" style={{ color: '#333' }}>
            {isMuted ? 0 : volumeBoost > 100 ? volumeBoost : volume}%
          </span>
        </div>
      </div>
    </div>
  );
}
