import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { VideoFile } from '@/lib/fileScanner';
import { WatchHistoryEntry } from '@/hooks/useWatchHistory';
import { Play, X, ChevronLeft, ChevronRight, Volume2, VolumeX, Radio, Users, Eye } from 'lucide-react';
import { thumbnailCache, generateThumbnail } from '@/components/VideoCard';

interface TwitchBrowserProps {
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

// Fake viewer count from video size
function fakeViewers(video: VideoFile): string {
  const n = ((video.size || 1000) % 9000) + 100;
  return n > 1000 ? `${(n / 1000).toFixed(1)}K` : `${n}`;
}

const PURPLE = '#9146ff';
const BG = '#0e0e10';
const SURFACE = '#18181b';
const SURFACE_HOVER = '#26262c';

function TwitchHero({ video, onPlay, watchHistory, muted, onToggleMute }: {
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
    videoRef.current?.play().catch(() => {});
  }, [video]);

  return (
    <div className="relative w-full h-[50vh] overflow-hidden">
      <video
        ref={videoRef}
        src={video.url}
        muted={muted}
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e10] via-transparent to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0e0e10]/70 via-transparent to-transparent" />

      <div className="absolute bottom-8 left-16 max-w-lg z-10">
        <div className="flex items-center gap-2 mb-2">
          <span className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold text-white" style={{ backgroundColor: '#eb0400' }}>
            <Radio className="h-3 w-3" /> LIVE
          </span>
          <span className="flex items-center gap-1 text-white/60 text-xs">
            <Eye className="h-3 w-3" /> {fakeViewers(video)} viewers
          </span>
        </div>
        <h1 className="text-3xl font-bold text-white mb-1 drop-shadow-lg">
          {video.name.replace(/\.[^/.]+$/, '')}
        </h1>
        <p className="text-sm text-white/50 mb-3">{video.folder.split('/').pop()}</p>
        {resumePct > 0 && resumePct < 95 && (
          <div className="w-48 h-1 bg-white/20 rounded-full mb-3">
            <div className="h-full rounded-full" style={{ width: `${resumePct}%`, backgroundColor: PURPLE }} />
          </div>
        )}
        <button
          onClick={() => onPlay(video)}
          className="flex items-center gap-2 px-5 py-2 text-white font-semibold rounded text-sm transition-colors"
          style={{ backgroundColor: PURPLE }}
        >
          <Play className="h-4 w-4 fill-current" />
          {resumePct > 0 && resumePct < 95 ? 'Resume' : 'Watch Now'}
        </button>
      </div>

      <button
        onClick={onToggleMute}
        className="absolute bottom-8 right-8 p-2 rounded-full text-white/50 hover:text-white transition-colors"
        style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
      >
        {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
      </button>
    </div>
  );
}

// Sidebar channel item
function ChannelItem({ video, onPlay }: { video: VideoFile; onPlay: (v: VideoFile) => void }) {
  const colors = ['#e91916', '#00ad03', '#1e69ff', PURPLE, '#eb7a00', '#00c8af'];
  const color = colors[Math.abs(video.name.charCodeAt(0)) % colors.length];

  return (
    <button
      onClick={() => onPlay(video)}
      className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-[#26262c] rounded transition-colors group"
    >
      <div className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-white text-[10px] font-bold" style={{ backgroundColor: color }}>
        {video.name.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0 text-left hidden lg:block">
        <p className="text-xs text-white/80 truncate">{video.name.replace(/\.[^/.]+$/, '').slice(0, 16)}</p>
        <p className="text-[10px] text-white/40 truncate">{video.folder.split('/').pop()}</p>
      </div>
      <span className="flex items-center gap-0.5 text-[10px] text-red-500 shrink-0 hidden lg:flex">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
        {fakeViewers(video)}
      </span>
    </button>
  );
}

// Category card (portrait box-art style)
function TwitchCard({ video, onPlay, watchHistory }: {
  video: VideoFile;
  onPlay: (v: VideoFile) => void;
  watchHistory?: Record<string, WatchHistoryEntry>;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [thumb, setThumb] = useState<string>(() => thumbnailCache.get(video.url)?.thumb || '');
  const [hovered, setHovered] = useState(false);
  const entry = watchHistory?.[video.path];
  const resumePct = entry && entry.duration > 0 ? (entry.position / entry.duration) * 100 : 0;

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

  return (
    <div
      ref={cardRef}
      className="shrink-0 w-[180px] cursor-pointer group"
      onClick={() => onPlay(video)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className="relative aspect-[3/4] rounded-lg overflow-hidden transition-all duration-200"
        style={{
          border: hovered ? `2px solid ${PURPLE}` : '2px solid transparent',
          transform: hovered ? 'scale(1.05) translateY(-4px)' : 'scale(1)',
        }}
      >
        {thumb ? (
          <img src={thumb} alt={video.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: SURFACE }}>
            <Play className="h-8 w-8 text-white/20" />
          </div>
        )}
        {hovered && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <Play className="h-10 w-10 text-white fill-current drop-shadow-lg" />
          </div>
        )}
        {resumePct > 0 && resumePct < 95 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/40">
            <div className="h-full" style={{ width: `${resumePct}%`, backgroundColor: PURPLE }} />
          </div>
        )}
        {/* LIVE badge */}
        <div className="absolute top-2 left-2 flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold text-white bg-red-600">
          LIVE
        </div>
        <div className="absolute bottom-2 left-2 flex items-center gap-1 text-[10px] text-white bg-black/60 rounded px-1.5 py-0.5">
          <Eye className="h-2.5 w-2.5" /> {fakeViewers(video)}
        </div>
      </div>
      <div className="mt-1.5 px-0.5">
        <p className="text-xs text-white/90 font-medium truncate">{video.name.replace(/\.[^/.]+$/, '')}</p>
        <p className="text-[10px] text-white/40 truncate">{video.folder.split('/').pop()}</p>
      </div>
    </div>
  );
}

function CategoryShelf({ title, videos, onPlay, watchHistory }: {
  title: string;
  videos: VideoFile[];
  onPlay: (v: VideoFile) => void;
  watchHistory?: Record<string, WatchHistoryEntry>;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showArrows, setShowArrows] = useState(false);

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir === 'left' ? -400 : 400, behavior: 'smooth' });
  };

  return (
    <div
      className="relative mb-6"
      onMouseEnter={() => setShowArrows(true)}
      onMouseLeave={() => setShowArrows(false)}
    >
      <h3 className="text-white font-semibold text-sm mb-2 px-1">{title}</h3>
      <div className="relative">
        {showArrows && (
          <>
            <button onClick={() => scroll('left')} className="absolute left-0 top-0 bottom-8 w-8 z-20 flex items-center justify-center bg-black/60 hover:bg-black/80 transition-colors rounded-r">
              <ChevronLeft className="h-5 w-5 text-white" />
            </button>
            <button onClick={() => scroll('right')} className="absolute right-0 top-0 bottom-8 w-8 z-20 flex items-center justify-center bg-black/60 hover:bg-black/80 transition-colors rounded-l">
              <ChevronRight className="h-5 w-5 text-white" />
            </button>
          </>
        )}
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-scroll scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {videos.map(v => (
            <TwitchCard key={v.id} video={v} onPlay={onPlay} watchHistory={watchHistory} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function TwitchBrowser({ videos, onPlay, onExit, watchHistory = {}, noteCounts = {}, videoTags = {} }: TwitchBrowserProps) {
  const [muted, setMuted] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);

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

  const sidebarChannels = useMemo(() => videos.slice(0, 15), [videos]);
  const heroVideo = videos[0];

  if (videos.length === 0) {
    return (
      <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: BG }}>
        <p className="text-white/50 text-lg">No videos. Open a folder to get started.</p>
        <button onClick={onExit} className="absolute top-6 right-6 text-white/70 hover:text-white">
          <X className="h-6 w-6" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex" style={{ backgroundColor: BG }}>
      {/* Sidebar */}
      <div className="w-14 lg:w-56 shrink-0 flex flex-col border-r overflow-y-auto" style={{ borderColor: '#26262c', backgroundColor: SURFACE, scrollbarWidth: 'none' }}>
        <div className="p-3 flex items-center gap-2">
          <div className="w-7 h-7 rounded flex items-center justify-center" style={{ backgroundColor: PURPLE }}>
            <Play className="h-3.5 w-3.5 text-white fill-current" />
          </div>
          <span className="text-white font-bold text-sm hidden lg:block">Twitch</span>
        </div>
        <div className="px-2 py-1 hidden lg:block">
          <p className="text-[10px] text-white/40 uppercase font-semibold tracking-wider px-1 mb-1">Recommended Channels</p>
        </div>
        <div className="flex-1 px-1">
          {sidebarChannels.map(v => (
            <ChannelItem key={v.id} video={v} onPlay={onPlay} />
          ))}
        </div>
      </div>

      {/* Main content */}
      <div ref={containerRef} className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
        {/* Top nav */}
        <div
          className="sticky top-0 z-40 flex items-center justify-between px-6 py-2.5 transition-colors duration-300"
          style={{ backgroundColor: scrolled ? SURFACE : 'transparent' }}
        >
          <div className="flex items-center gap-4">
            <span className="text-white/60 text-sm font-medium hover:text-white cursor-pointer transition-colors">Following</span>
            <span className="text-white text-sm font-medium border-b-2 pb-0.5" style={{ borderColor: PURPLE }}>Browse</span>
            <span className="text-white/60 text-sm font-medium hover:text-white cursor-pointer transition-colors">Categories</span>
          </div>
          <button
            onClick={onExit}
            className="text-white/50 hover:text-white text-xs flex items-center gap-1 transition-colors"
          >
            <X className="h-4 w-4" /> Exit
          </button>
        </div>

        {/* Hero */}
        <TwitchHero
          video={heroVideo}
          onPlay={onPlay}
          watchHistory={watchHistory}
          muted={muted}
          onToggleMute={() => setMuted(!muted)}
        />

        {/* Category shelves */}
        <div className="px-6 pt-6 pb-20">
          {/* Live Channels row (all videos) */}
          <CategoryShelf title="Live Channels" videos={videos.slice(0, 20)} onPlay={onPlay} watchHistory={watchHistory} />

          {grouped.map(([folder, vids]) => (
            <CategoryShelf key={folder} title={folder} videos={vids} onPlay={onPlay} watchHistory={watchHistory} />
          ))}
        </div>
      </div>
    </div>
  );
}
