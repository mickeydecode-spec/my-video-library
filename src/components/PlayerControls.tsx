import { useState, useCallback, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Camera, Repeat, Gauge, RatioIcon, Volume2, VolumeX,
  Languages, ChevronUp, ChevronDown, Type
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface PlayerControlsProps {
  videoRef: React.RefObject<HTMLVideoElement>;
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

export function PlayerControls({ videoRef }: PlayerControlsProps) {
  const [speed, setSpeed] = useState(1);
  const [abLoop, setAbLoop] = useState<{ a: number | null; b: number | null }>({ a: null, b: null });
  const [aspect, setAspect] = useState('auto');
  const [volumeBoost, setVolumeBoost] = useState(100);
  const [audioTracks, setAudioTracks] = useState<{ id: number; label: string; language: string; enabled: boolean }[]>([]);
  const [subtitleSize, setSubtitleSize] = useState(100);
  const gainNodeRef = useRef<GainNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const abIntervalRef = useRef<number | null>(null);

  // Initialize Web Audio API for volume boost
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
    } catch (e) {
      console.warn('Audio boost init failed:', e);
    }
  }, [videoRef]);

  // Detect audio tracks
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    const detectTracks = () => {
      const at = (el as any).audioTracks;
      if (at && at.length > 0) {
        const tracks: typeof audioTracks = [];
        for (let i = 0; i < at.length; i++) {
          tracks.push({
            id: i,
            label: at[i].label || `Track ${i + 1}`,
            language: at[i].language || 'unknown',
            enabled: at[i].enabled,
          });
        }
        setAudioTracks(tracks);
      }
    };

    el.addEventListener('loadedmetadata', detectTracks);
    detectTracks();
    return () => el.removeEventListener('loadedmetadata', detectTracks);
  }, [videoRef]);

  // Speed control
  const changeSpeed = useCallback((newSpeed: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = newSpeed;
      setSpeed(newSpeed);
    }
  }, [videoRef]);

  // A-B Loop
  useEffect(() => {
    if (abIntervalRef.current) clearInterval(abIntervalRef.current);
    if (abLoop.a !== null && abLoop.b !== null && videoRef.current) {
      abIntervalRef.current = window.setInterval(() => {
        const el = videoRef.current;
        if (el && el.currentTime >= abLoop.b!) {
          el.currentTime = abLoop.a!;
        }
      }, 100);
    }
    return () => { if (abIntervalRef.current) clearInterval(abIntervalRef.current); };
  }, [abLoop, videoRef]);

  const toggleAbLoop = useCallback(() => {
    const el = videoRef.current;
    if (!el) return;
    if (abLoop.a === null) {
      setAbLoop({ a: el.currentTime, b: null });
    } else if (abLoop.b === null) {
      setAbLoop(prev => ({ ...prev, b: el.currentTime }));
    } else {
      setAbLoop({ a: null, b: null });
    }
  }, [abLoop, videoRef]);

  // Screenshot
  const takeScreenshot = useCallback(() => {
    const el = videoRef.current;
    if (!el) return;
    const canvas = document.createElement('canvas');
    canvas.width = el.videoWidth;
    canvas.height = el.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(el, 0, 0);
    const link = document.createElement('a');
    link.download = `screenshot-${Math.floor(el.currentTime)}s.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }, [videoRef]);

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

  const handleVolumeBoost = useCallback((val: number[]) => {
    if (!sourceRef.current) initAudioBoost();
    setVolumeBoost(val[0]);
  }, [initAudioBoost]);

  // Switch audio track
  const switchAudioTrack = useCallback((trackId: string) => {
    const el = videoRef.current;
    if (!el) return;
    const at = (el as any).audioTracks;
    if (!at) return;
    for (let i = 0; i < at.length; i++) {
      at[i].enabled = i === parseInt(trackId);
    }
    setAudioTracks(prev => prev.map((t, i) => ({ ...t, enabled: i === parseInt(trackId) })));
  }, [videoRef]);

  // Subtitle size
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    const style = document.createElement('style');
    style.id = 'mytube-subtitle-style';
    const existing = document.getElementById('mytube-subtitle-style');
    if (existing) existing.remove();
    style.textContent = `video::cue { font-size: ${subtitleSize}% !important; }`;
    document.head.appendChild(style);
    return () => { style.remove(); };
  }, [subtitleSize, videoRef]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const el = videoRef.current;
      if (!el) return;
      // Don't capture when typing in inputs
      if ((e.target as HTMLElement)?.tagName === 'INPUT' || (e.target as HTMLElement)?.tagName === 'TEXTAREA') return;

      switch (e.key.toLowerCase()) {
        case '[': changeSpeed(Math.max(0.25, speed - 0.25)); e.preventDefault(); break;
        case ']': changeSpeed(Math.min(4, speed + 0.25)); e.preventDefault(); break;
        case 'l': toggleAbLoop(); e.preventDefault(); break;
        case 's': if (e.ctrlKey || e.metaKey) { e.preventDefault(); takeScreenshot(); } break;
        case 'j': el.currentTime = Math.max(0, el.currentTime - 10); e.preventDefault(); break;
        case 'k': el.paused ? el.play() : el.pause(); e.preventDefault(); break;
        case 'arrowleft': el.currentTime = Math.max(0, el.currentTime - 5); e.preventDefault(); break;
        case 'arrowright': el.currentTime += 5; e.preventDefault(); break;
        case 'arrowup': el.volume = Math.min(1, el.volume + 0.05); e.preventDefault(); break;
        case 'arrowdown': el.volume = Math.max(0, el.volume - 0.05); e.preventDefault(); break;
        case 'f': {
          if (document.fullscreenElement) document.exitFullscreen();
          else el.requestFullscreen?.();
          e.preventDefault();
          break;
        }
        case 'm': el.muted = !el.muted; e.preventDefault(); break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [videoRef, speed, changeSpeed, toggleAbLoop, takeScreenshot]);

  const abLabel = abLoop.a === null ? 'A-B' : abLoop.b === null ? `A: ${abLoop.a.toFixed(1)}s` : 'Clear';

  return (
    <div className="flex items-center gap-1 flex-wrap px-2 py-1.5 bg-card/80 backdrop-blur border-t border-border">
      {/* Speed */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 px-2">
            <Gauge className="h-3.5 w-3.5" /> {speed}x
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-40 p-2" side="top">
          <p className="text-xs font-medium mb-2 text-muted-foreground">Playback Speed</p>
          <div className="grid grid-cols-5 gap-1">
            {SPEED_OPTIONS.map(s => (
              <Button key={s} variant={speed === s ? 'default' : 'ghost'} size="sm" className="h-7 text-xs px-1" onClick={() => changeSpeed(s)}>
                {s}x
              </Button>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      {/* A-B Loop */}
      <Button variant={abLoop.a !== null ? 'default' : 'ghost'} size="sm" className="h-7 text-xs gap-1 px-2" onClick={toggleAbLoop}>
        <Repeat className="h-3.5 w-3.5" /> {abLabel}
      </Button>

      {/* Screenshot */}
      <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 px-2" onClick={takeScreenshot} title="Screenshot (Ctrl+S)">
        <Camera className="h-3.5 w-3.5" />
      </Button>

      {/* Aspect Ratio */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 px-2">
            <RatioIcon className="h-3.5 w-3.5" /> {ASPECT_OPTIONS.find(a => a.value === aspect)?.label}
          </Button>
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

      {/* Volume Boost */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant={volumeBoost > 100 ? 'default' : 'ghost'} size="sm" className="h-7 text-xs gap-1 px-2">
            {volumeBoost > 100 ? <Volume2 className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
            {volumeBoost}%
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-48 p-3" side="top">
          <p className="text-xs font-medium mb-2 text-muted-foreground">Volume Boost</p>
          <Slider min={50} max={300} step={10} value={[volumeBoost]} onValueChange={handleVolumeBoost} />
          <p className="text-xs text-muted-foreground mt-1 text-center">{volumeBoost}%</p>
        </PopoverContent>
      </Popover>

      {/* Audio Tracks */}
      {audioTracks.length > 1 && (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 px-2">
              <Languages className="h-3.5 w-3.5" /> Audio
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-2" side="top">
            <p className="text-xs font-medium mb-2 text-muted-foreground">Audio Track</p>
            {audioTracks.map(t => (
              <Button key={t.id} variant={t.enabled ? 'default' : 'ghost'} size="sm"
                className="h-7 text-xs w-full justify-start" onClick={() => switchAudioTrack(String(t.id))}>
                {t.label} ({t.language})
              </Button>
            ))}
          </PopoverContent>
        </Popover>
      )}

      {/* Subtitle Size */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 px-2">
            <Type className="h-3.5 w-3.5" /> Sub {subtitleSize}%
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-48 p-3" side="top">
          <p className="text-xs font-medium mb-2 text-muted-foreground">Subtitle Size</p>
          <Slider min={50} max={200} step={10} value={[subtitleSize]} onValueChange={v => setSubtitleSize(v[0])} />
          <div className="flex justify-between mt-1">
            <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setSubtitleSize(s => Math.max(50, s - 10))}>
              <ChevronDown className="h-3 w-3" />
            </Button>
            <span className="text-xs text-muted-foreground">{subtitleSize}%</span>
            <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setSubtitleSize(s => Math.min(200, s + 10))}>
              <ChevronUp className="h-3 w-3" />
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {/* Keyboard shortcuts hint */}
      <span className="ml-auto text-[10px] text-muted-foreground hidden md:inline">
        [ ] Speed · L Loop · F Full · J/K Seek/Play · M Mute · ←→ ±5s · ↑↓ Vol
      </span>
    </div>
  );
}
