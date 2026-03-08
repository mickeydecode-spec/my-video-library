import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { VideoFile } from '@/lib/fileScanner';
import { WatchHistoryEntry } from '@/hooks/useWatchHistory';
import { Play, Info, ChevronLeft, ChevronRight, X, Volume2, VolumeX } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { thumbnailCache, generateThumbnail } from '@/components/VideoCard';

interface NetflixBrowserProps {
  videos: VideoFile[];
  onPlay: (video: VideoFile) => void;
  onExit: () => void;
  watchHistory?: Record<string, WatchHistoryEntry>;
  noteCounts?: Record<string, number>;
  videoTags?: Record<string, string[]>;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function HeroSection({ video, onPlay, watchHistory, muted, onToggleMute }: {
  video: VideoFile;
  onPlay: (v: VideoFile) => void;
  watchHistory?: Record<string, WatchHistoryEntry>;
  muted: boolean;
  onToggleMute: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const entry = watchHistory?.[video.path];
  const resumePct = entry && entry.duration > 0 ? (entry.position / entry.duration) * 100 : 0;

  useEffect(() => {
    const vid = videoRef.current;
    if (vid) {
      vid.play().catch(() => {});
    }
  }, [video]);

  return (
    <div className="relative w-full h-[60vh] overflow-hidden">
      <video
        ref={videoRef}
        src={video.url}
        muted={muted}
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      />
      {/* Gradients */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#141414]/80 via-transparent to-transparent" />

      {/* Content */}
      <div className="absolute bottom-12 left-12 max-w-lg z-10">
        <h1 className="text-4xl font-bold text-white mb-2 drop-shadow-lg leading-tight">
          {video.name.replace(/\.[^/.]+$/, '')}
        </h1>
        <p className="text-sm text-white/70 mb-1">
          {video.folder.split('/').pop()}
          {video.format && <span className="ml-2 uppercase">{video.format}</span>}
          {video.size > 0 && <span className="ml-2">{(video.size / (1024 * 1024)).toFixed(0)} MB</span>}
        </p>
        {resumePct > 0 && resumePct < 95 && (
          <div className="w-48 h-1 bg-white/20 rounded-full mt-2 mb-3">
            <div className="h-full bg-[#e50914] rounded-full" style={{ width: `${resumePct}%` }} />
          </div>
        )}
        <div className="flex gap-3 mt-4">
          <button
            onClick={() => onPlay(video)}
            className="flex items-center gap-2 px-6 py-2.5 bg-white text-black font-semibold rounded hover:bg-white/80 transition-colors text-sm"
          >
            <Play className="h-5 w-5 fill-current" />
            {resumePct > 0 && resumePct < 95 ? 'Resume' : 'Play'}
          </button>
          <button
            onClick={() => onPlay(video)}
            className="flex items-center gap-2 px-6 py-2.5 bg-white/20 text-white font-semibold rounded hover:bg-white/30 transition-colors backdrop-blur-sm text-sm"
          >
            <Info className="h-5 w-5" />
            More Info
          </button>
        </div>
      </div>

      {/* Mute toggle */}
      <button
        onClick={onToggleMute}
        className="absolute bottom-12 right-12 p-2 rounded-full border border-white/40 text-white/70 hover:text-white transition-colors"
      >
        {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
      </button>
    </div>
  );
}

function CategoryRow({ title, videos, onPlay, watchHistory, noteCounts, videoTags, onHover, hoveredId }: {
  title: string;
  videos: VideoFile[];
  onPlay: (v: VideoFile) => void;
  watchHistory?: Record<string, WatchHistoryEntry>;
  noteCounts?: Record<string, number>;
  videoTags?: Record<string, string[]>;
  onHover: (id: string | null) => void;
  hoveredId: string | null;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showArrows, setShowArrows] = useState(false);

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amt = scrollRef.current.clientWidth * 0.75;
    scrollRef.current.scrollBy({ left: dir === 'left' ? -amt : amt, behavior: 'smooth' });
  };

  return (
    <div
      className="relative px-12 mb-8"
      onMouseEnter={() => setShowArrows(true)}
      onMouseLeave={() => setShowArrows(false)}
    >
      <h3 className="text-white font-semibold text-base mb-2">{title}</h3>
      <div className="relative">
        {showArrows && (
          <>
            <button
              onClick={() => scroll('left')}
              className="absolute left-0 top-0 bottom-0 w-10 bg-black/50 z-20 flex items-center justify-center hover:bg-black/70 transition-colors"
            >
              <ChevronLeft className="h-6 w-6 text-white" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="absolute right-0 top-0 bottom-0 w-10 bg-black/50 z-20 flex items-center justify-center hover:bg-black/70 transition-colors"
            >
              <ChevronRight className="h-6 w-6 text-white" />
            </button>
          </>
        )}
        <div
          ref={scrollRef}
          className="flex gap-1.5 overflow-x-auto scrollbar-none scroll-smooth"
        >
          {videos.map(video => (
            <VideoCard
              key={video.id}
              video={video}
              onPlay={onPlay}
              watchHistory={watchHistory}
              noteCounts={noteCounts}
              videoTags={videoTags}
              onHover={onHover}
              isHovered={hoveredId === video.id}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function NetflixVideoCard({ video, onPlay, watchHistory, noteCounts, videoTags, onHover, isHovered }: {
  video: VideoFile;
  onPlay: (v: VideoFile) => void;
  watchHistory?: Record<string, WatchHistoryEntry>;
  noteCounts?: Record<string, number>;
  videoTags?: Record<string, string[]>;
  onHover: (id: string | null) => void;
  isHovered: boolean;
}) {
  const previewRef = useRef<HTMLVideoElement>(null);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const cardRef = useRef<HTMLDivElement>(null);
  const entry = watchHistory?.[video.path];
  const resumePct = entry && entry.duration > 0 ? (entry.position / entry.duration) * 100 : 0;
  const tags = videoTags?.[video.path];
  const noteCount = noteCounts?.[video.path] || 0;

  // Thumbnail from shared cache
  const [thumb, setThumb] = useState<string>(() => thumbnailCache.get(video.url)?.thumb || '');
  const [shouldLoadPreview, setShouldLoadPreview] = useState(false);

  // Lazy-load thumbnail via IntersectionObserver
  useEffect(() => {
    if (thumb) return;
    const el = cardRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        generateThumbnail(video.url).then(r => setThumb(r.thumb));
        obs.disconnect();
      }
    }, { rootMargin: '300px' });
    obs.observe(el);
    return () => obs.disconnect();
  }, [video.url, thumb]);

  const handleMouseEnter = () => {
    onHover(video.id);
    hoverTimerRef.current = setTimeout(() => {
      setShouldLoadPreview(true);
      // Wait a tick for the video element to mount, then play
      requestAnimationFrame(() => {
        previewRef.current?.play().catch(() => {});
      });
    }, 600);
  };

  const handleMouseLeave = () => {
    onHover(null);
    clearTimeout(hoverTimerRef.current);
    setShouldLoadPreview(false);
    if (previewRef.current) {
      previewRef.current.pause();
      previewRef.current.removeAttribute('src');
      previewRef.current.load();
    }
  };

  useEffect(() => {
    return () => clearTimeout(hoverTimerRef.current);
  }, []);

  return (
    <div
      ref={cardRef}
      className="shrink-0 w-[230px] cursor-pointer transition-all duration-300 ease-in-out relative group"
      style={{
        transform: isHovered ? 'scale(1.3)' : 'scale(1)',
        zIndex: isHovered ? 30 : 1,
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={() => onPlay(video)}
    >
      <div className="relative aspect-video bg-[#2a2a2a] rounded overflow-hidden">
        {/* Preview video - only rendered on hover */}
        {isHovered && shouldLoadPreview && (
          <video
            ref={previewRef}
            src={video.url}
            muted
            loop
            playsInline
            preload="auto"
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        {/* Thumbnail or placeholder */}
        {thumb ? (
          <img
            src={thumb}
            alt={video.name}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${isHovered && shouldLoadPreview ? 'opacity-0' : 'opacity-100'}`}
          />
        ) : (
          <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-[#2a2a2a]">
            <Play className="h-8 w-8 text-white/20" />
          </div>
        )}
        {/* Resume bar */}
        {resumePct > 0 && resumePct < 95 && (
          <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/20">
            <div className="h-full bg-[#e50914]" style={{ width: `${resumePct}%` }} />
          </div>
        )}
      </div>

      {/* Expanded info on hover */}
      {isHovered && (
        <div className="absolute top-full left-0 right-0 bg-[#1a1a1a] rounded-b p-3 shadow-2xl">
          <div className="flex items-center gap-2 mb-1.5">
            <button
              onClick={(e) => { e.stopPropagation(); onPlay(video); }}
              className="w-7 h-7 rounded-full bg-white flex items-center justify-center hover:bg-white/80"
            >
              <Play className="h-3.5 w-3.5 text-black fill-current" />
            </button>
            <span className="text-white text-xs font-medium truncate flex-1">
              {video.name.replace(/\.[^/.]+$/, '')}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-white/50">
            <span className="uppercase">{video.format}</span>
            {video.size > 0 && <span>{(video.size / (1024 * 1024)).toFixed(0)} MB</span>}
            {noteCount > 0 && <span>{noteCount} notes</span>}
          </div>
          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {tags.slice(0, 3).map(tag => (
                <span key={tag} className="text-[9px] px-1.5 py-0.5 bg-white/10 text-white/60 rounded">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function NetflixBrowser({ videos, onPlay, onExit, watchHistory = {}, noteCounts = {}, videoTags = {} }: NetflixBrowserProps) {
  const [muted, setMuted] = useState(true);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = () => setScrolled(el.scrollTop > 50);
    el.addEventListener('scroll', handler, { passive: true });
    return () => el.removeEventListener('scroll', handler);
  }, []);

  const grouped = useMemo(() => {
    const map = new Map<string, VideoFile[]>();
    videos.forEach(v => {
      const folder = v.folder.split('/').pop() || 'Uncategorized';
      if (!map.has(folder)) map.set(folder, []);
      map.get(folder)!.push(v);
    });
    return Array.from(map.entries());
  }, [videos]);

  const heroVideo = videos[0];

  if (videos.length === 0) {
    return (
      <div className="fixed inset-0 bg-[#141414] flex items-center justify-center z-50">
        <p className="text-white/50 text-lg">No videos. Open a folder to get started.</p>
        <button onClick={onExit} className="absolute top-6 right-6 text-white/70 hover:text-white">
          <X className="h-6 w-6" />
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="fixed inset-0 bg-[#141414] z-50 overflow-y-auto scrollbar-thin">
      {/* Top Nav */}
      <div className={`fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-12 py-4 transition-colors duration-500 ${scrolled ? 'bg-[#141414]' : 'bg-gradient-to-b from-black/70 to-transparent'}`}>
        <div className="flex items-center gap-6">
          <span className="text-[#e50914] font-bold text-2xl tracking-tight">N</span>
          <span className="text-white/70 text-sm">Browse</span>
        </div>
        <button
          onClick={onExit}
          className="text-white/70 hover:text-white transition-colors text-sm flex items-center gap-1"
        >
          <X className="h-4 w-4" />
          Exit
        </button>
      </div>

      {/* Hero */}
      <HeroSection
        video={heroVideo}
        onPlay={onPlay}
        watchHistory={watchHistory}
        muted={muted}
        onToggleMute={() => setMuted(!muted)}
      />

      {/* Rows */}
      <div className="relative -mt-16 z-10 pb-20">
        {grouped.map(([folder, vids]) => (
          <CategoryRow
            key={folder}
            title={folder}
            videos={vids}
            onPlay={onPlay}
            watchHistory={watchHistory}
            noteCounts={noteCounts}
            videoTags={videoTags}
            onHover={setHoveredId}
            hoveredId={hoveredId}
          />
        ))}

        {/* Continue Watching row */}
        {(() => {
          const resumeVideos = videos.filter(v => {
            const e = watchHistory[v.path];
            return e && e.duration > 0 && (e.position / e.duration) > 0.02 && (e.position / e.duration) < 0.95;
          });
          if (resumeVideos.length === 0) return null;
          return (
            <CategoryRow
              title="Continue Watching"
              videos={resumeVideos}
              onPlay={onPlay}
              watchHistory={watchHistory}
              noteCounts={noteCounts}
              videoTags={videoTags}
              onHover={setHoveredId}
              hoveredId={hoveredId}
            />
          );
        })()}
      </div>
    </div>
  );
}
