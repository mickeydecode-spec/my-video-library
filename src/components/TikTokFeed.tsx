import { useRef, useEffect, useMemo, useState, useCallback } from 'react';
import { VideoFile } from '@/lib/fileScanner';
import { X, Volume2, VolumeX, Play, Heart, Bookmark, Share2, MessageCircle, Music2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface TikTokFeedProps {
  videos: VideoFile[];
  onExit: () => void;
  videoTags?: Record<string, string[]>;
}

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

function TikTokItem({ video, isActive, videoTags, onSave, isSaved }: {
  video: VideoFile;
  isActive: boolean;
  videoTags?: string[];
  onSave: () => void;
  isSaved: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(true);
  const [muted, setMuted] = useState(true);
  const [liked, setLiked] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showPauseAnim, setShowPauseAnim] = useState(false);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (isActive) {
      el.play().catch(() => {});
      setPaused(false);
    } else {
      el.pause();
      setPaused(true);
    }
  }, [isActive]);

  // Time update — throttled via rAF
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    let raf: number;
    const update = () => {
      setCurrentTime(el.currentTime);
      setDuration(el.duration || 0);
      if (isActive && !el.paused) raf = requestAnimationFrame(update);
    };
    if (isActive) raf = requestAnimationFrame(update);
    return () => cancelAnimationFrame(raf);
  }, [isActive, paused]);

  const togglePlay = useCallback(() => {
    const el = videoRef.current;
    if (!el) return;
    if (el.paused) {
      el.play().catch(() => {});
      setPaused(false);
    } else {
      el.pause();
      setPaused(true);
      setShowPauseAnim(true);
      setTimeout(() => setShowPauseAnim(false), 600);
    }
  }, []);

  const toggleMute = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const el = videoRef.current;
    if (!el) return;
    el.muted = !el.muted;
    setMuted(el.muted);
  }, []);

  const handleLike = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setLiked(l => !l);
  }, []);

  const handleSave = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onSave();
  }, [onSave]);

  const handleSeek = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const el = videoRef.current;
    const bar = progressRef.current;
    if (!el || !bar || !duration) return;
    const rect = bar.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    el.currentTime = pct * duration;
    setCurrentTime(el.currentTime);
  }, [duration]);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const folderName = video.folder.split('/').pop() || '';

  return (
    <div
      className="h-[100dvh] w-full snap-start relative flex items-center justify-center bg-black cursor-pointer select-none overflow-hidden"
      onClick={togglePlay}
    >
      <video
        ref={videoRef}
        src={video.url}
        className="h-full w-full object-contain"
        loop
        muted={muted}
        playsInline
        preload="auto"
      />

      {/* Double-tap like animation */}
      {showPauseAnim && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <Play className="h-20 w-20 text-white/60 animate-ping" />
        </div>
      )}

      {/* Progress bar — bottom, clickable */}
      <div
        ref={progressRef}
        className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 z-20 cursor-pointer"
        onClick={handleSeek}
      >
        <div
          className="h-full bg-white/90 transition-[width] duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Time display */}
      {duration > 0 && (
        <div className="absolute bottom-3 left-4 z-20 text-white/60 text-[11px] font-mono pointer-events-none">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
      )}

      {/* Bottom-left info — TikTok style */}
      <div className="absolute bottom-8 left-0 right-16 p-4 pointer-events-none">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
            <Music2 className="h-4 w-4 text-white" />
          </div>
          <span className="text-white font-bold text-sm">@{folderName || 'local'}</span>
        </div>
        <h2 className="text-white text-[15px] font-medium leading-snug drop-shadow-lg line-clamp-2">
          {video.name.replace(/\.[^.]+$/, '')}
        </h2>
        {videoTags && videoTags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {videoTags.slice(0, 4).map(tag => (
              <span key={tag} className="text-[12px] text-cyan-300 font-medium">#{tag}</span>
            ))}
          </div>
        )}
        {video.format && (
          <div className="flex items-center gap-2 mt-1">
            <span className="text-white/40 text-[11px] uppercase">{video.format}</span>
            {video.size > 0 && (
              <span className="text-white/40 text-[11px]">{(video.size / (1024 * 1024)).toFixed(1)}MB</span>
            )}
          </div>
        )}
      </div>

      {/* Right sidebar actions — TikTok style */}
      <div className="absolute right-3 bottom-32 flex flex-col items-center gap-5 z-20">
        <button
          className="flex flex-col items-center gap-1"
          onClick={handleLike}
        >
          <div className={cn(
            "h-11 w-11 rounded-full flex items-center justify-center transition-all",
            liked ? "bg-red-500/20" : "bg-white/10"
          )}>
            <Heart className={cn("h-6 w-6 transition-colors", liked ? "text-red-500 fill-red-500" : "text-white")} />
          </div>
          <span className="text-white text-[11px]">{liked ? 'Liked' : 'Like'}</span>
        </button>

        <button
          className="flex flex-col items-center gap-1"
          onClick={handleSave}
        >
          <div className={cn(
            "h-11 w-11 rounded-full flex items-center justify-center transition-all",
            isSaved ? "bg-yellow-500/20" : "bg-white/10"
          )}>
            <Bookmark className={cn("h-6 w-6 transition-colors", isSaved ? "text-yellow-400 fill-yellow-400" : "text-white")} />
          </div>
          <span className="text-white text-[11px]">{isSaved ? 'Saved' : 'Save'}</span>
        </button>

        <button
          className="flex flex-col items-center gap-1"
          onClick={toggleMute}
        >
          <div className="h-11 w-11 rounded-full bg-white/10 flex items-center justify-center">
            {muted ? <VolumeX className="h-6 w-6 text-white" /> : <Volume2 className="h-6 w-6 text-white" />}
          </div>
          <span className="text-white text-[11px]">{muted ? 'Muted' : 'Sound'}</span>
        </button>
      </div>
    </div>
  );
}

export function TikTokFeed({ videos, onExit, videoTags = {} }: TikTokFeedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [savedVideos, setSavedVideos] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('tiktok-saved');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch { return new Set(); }
  });

  const shuffledVideos = useMemo(() => {
    return videos.length > 0 ? shuffleArray(videos) : [];
  }, [videos]);

  const toggleSave = useCallback((path: string) => {
    setSavedVideos(prev => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path); else next.add(path);
      try { localStorage.setItem('tiktok-saved', JSON.stringify([...next])); } catch {}
      return next;
    });
  }, []);

  // Intersection observer
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const idx = Number(entry.target.getAttribute('data-index'));
            if (!isNaN(idx)) setActiveIndex(idx);
          }
        }
      },
      { root: container, threshold: 0.7 }
    );

    const items = container.querySelectorAll('[data-index]');
    items.forEach(item => observer.observe(item));
    return () => observer.disconnect();
  }, [shuffledVideos]);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'j') {
        e.preventDefault();
        const container = containerRef.current;
        if (container) {
          const next = Math.min(activeIndex + 1, shuffledVideos.length - 1);
          const el = container.querySelector(`[data-index="${next}"]`);
          el?.scrollIntoView({ behavior: 'smooth' });
        }
      } else if (e.key === 'ArrowUp' || e.key === 'k') {
        e.preventDefault();
        const container = containerRef.current;
        if (container) {
          const prev = Math.max(activeIndex - 1, 0);
          const el = container.querySelector(`[data-index="${prev}"]`);
          el?.scrollIntoView({ behavior: 'smooth' });
        }
      } else if (e.key === 'Escape') {
        onExit();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [activeIndex, shuffledVideos.length, onExit]);

  if (shuffledVideos.length === 0) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-black text-white gap-4">
        <p className="text-white/60">No videos to show</p>
        <button onClick={onExit} className="text-white/80 underline text-sm">Go back</button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Top bar */}
      <div className="fixed top-0 left-0 right-0 z-[60] flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/60 to-transparent">
        <button onClick={onExit} className="text-white p-1">
          <X className="h-6 w-6" />
        </button>
        <div className="flex items-center gap-4">
          <span className="text-white/50 text-xs font-medium">
            {activeIndex + 1}/{shuffledVideos.length}
          </span>
        </div>
        <div className="w-6" /> {/* spacer */}
      </div>

      {/* Feed */}
      <div
        ref={containerRef}
        className="h-[100dvh] overflow-y-scroll snap-y snap-mandatory"
        style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
      >
        {shuffledVideos.map((video, idx) => (
          <div key={video.id} data-index={idx}>
            <TikTokItem
              video={video}
              isActive={idx === activeIndex}
              videoTags={videoTags[video.path]}
              onSave={() => toggleSave(video.path)}
              isSaved={savedVideos.has(video.path)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
