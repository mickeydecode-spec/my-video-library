import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { VideoFile } from '@/lib/fileScanner';
import { WatchHistoryEntry } from '@/hooks/useWatchHistory';
import { Play, X, ChevronLeft, ChevronRight, Folder, Film, Star } from 'lucide-react';
import { thumbnailCache, generateThumbnail } from '@/components/VideoCard';

interface PlexBrowserProps {
  videos: VideoFile[];
  onPlay: (video: VideoFile) => void;
  onExit: () => void;
  watchHistory?: Record<string, WatchHistoryEntry>;
  noteCounts?: Record<string, number>;
  videoTags?: Record<string, string[]>;
}

const ORANGE = '#e5a00d';
const BG = '#1f2326';
const SURFACE = '#282b2f';
const SIDEBAR_BG = '#1a1d21';

function PlexHero({ video, onPlay, watchHistory }: {
  video: VideoFile;
  onPlay: (v: VideoFile) => void;
  watchHistory?: Record<string, WatchHistoryEntry>;
}) {
  const [thumb, setThumb] = useState<string>(() => thumbnailCache.get(video.url)?.thumb || '');
  const entry = watchHistory?.[video.path];
  const resumePct = entry && entry.duration > 0 ? (entry.position / entry.duration) * 100 : 0;

  useEffect(() => {
    if (!thumb) generateThumbnail(video.url).then(r => setThumb(r.thumb));
  }, [video.url, thumb]);

  return (
    <div className="relative w-full h-[45vh] overflow-hidden">
      {thumb ? (
        <img src={thumb} alt={video.name} className="absolute inset-0 w-full h-full object-cover" style={{ filter: 'blur(8px) brightness(0.4)', transform: 'scale(1.1)' }} />
      ) : (
        <div className="absolute inset-0" style={{ backgroundColor: SURFACE }} />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-[#1f2326] via-[#1f2326]/60 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#1f2326]/80 via-transparent to-transparent" />

      <div className="absolute bottom-10 left-14 max-w-lg z-10">
        <div className="flex items-center gap-2 mb-2">
          <Star className="h-4 w-4" style={{ color: ORANGE, fill: ORANGE }} />
          <span className="text-white/50 text-xs">Featured</span>
        </div>
        <h1 className="text-3xl font-bold text-white mb-1">{video.name.replace(/\.[^/.]+$/, '')}</h1>
        <p className="text-sm text-white/40 mb-1">
          {video.folder.split('/').pop()}
          {video.format && <span className="ml-2 uppercase">{video.format}</span>}
          {video.size > 0 && <span className="ml-2">{(video.size / (1024 * 1024)).toFixed(0)} MB</span>}
        </p>
        {resumePct > 0 && resumePct < 95 && (
          <div className="w-48 h-1 bg-white/10 rounded-full mt-2 mb-3">
            <div className="h-full rounded-full" style={{ width: `${resumePct}%`, backgroundColor: ORANGE }} />
          </div>
        )}
        <button
          onClick={() => onPlay(video)}
          className="flex items-center gap-2 px-6 py-2.5 text-black font-semibold rounded-lg text-sm transition-all hover:brightness-110 mt-3"
          style={{ backgroundColor: ORANGE }}
        >
          <Play className="h-4 w-4 fill-current" />
          {resumePct > 0 && resumePct < 95 ? 'Resume' : 'Play'}
        </button>
      </div>
    </div>
  );
}

function PlexCard({ video, onPlay, watchHistory }: {
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
      className="shrink-0 w-[150px] cursor-pointer group"
      onClick={() => onPlay(video)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className="relative aspect-[2/3] rounded-lg overflow-hidden transition-all duration-200"
        style={{
          transform: hovered ? 'scale(1.05) translateY(-4px)' : 'scale(1)',
          boxShadow: hovered ? '0 12px 40px rgba(0,0,0,0.5)' : '0 2px 8px rgba(0,0,0,0.3)',
        }}
      >
        {thumb ? (
          <img src={thumb} alt={video.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: SURFACE }}>
            <Film className="h-8 w-8 text-white/15" />
          </div>
        )}
        {hovered && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <Play className="h-10 w-10 text-white fill-current drop-shadow-lg" />
          </div>
        )}
        {resumePct > 0 && resumePct < 95 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/40">
            <div className="h-full" style={{ width: `${resumePct}%`, backgroundColor: ORANGE }} />
          </div>
        )}
      </div>
      <p className="mt-1.5 text-xs text-white/70 truncate text-center">{video.name.replace(/\.[^/.]+$/, '')}</p>
    </div>
  );
}

function LibraryRow({ title, videos, onPlay, watchHistory }: {
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
    <div className="relative mb-8" onMouseEnter={() => setShowArrows(true)} onMouseLeave={() => setShowArrows(false)}>
      <h3 className="text-white font-semibold text-sm mb-3 px-1">{title}</h3>
      <div className="relative">
        {showArrows && (
          <>
            <button onClick={() => scroll('left')} className="absolute left-0 top-0 bottom-8 w-8 z-20 flex items-center justify-center bg-black/50 hover:bg-black/70 rounded-r transition-colors">
              <ChevronLeft className="h-5 w-5 text-white" />
            </button>
            <button onClick={() => scroll('right')} className="absolute right-0 top-0 bottom-8 w-8 z-20 flex items-center justify-center bg-black/50 hover:bg-black/70 rounded-l transition-colors">
              <ChevronRight className="h-5 w-5 text-white" />
            </button>
          </>
        )}
        <div ref={scrollRef} className="flex gap-3 overflow-x-scroll scroll-smooth" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {videos.map(v => <PlexCard key={v.id} video={v} onPlay={onPlay} watchHistory={watchHistory} />)}
        </div>
      </div>
    </div>
  );
}

export function PlexBrowser({ videos, onPlay, onExit, watchHistory = {}, noteCounts = {}, videoTags = {} }: PlexBrowserProps) {
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

  const folders = useMemo(() => Array.from(new Set(videos.map(v => v.folder.split('/').pop() || 'All'))), [videos]);
  const heroVideo = videos[0];

  // Continue watching
  const resumeVideos = useMemo(() =>
    videos.filter(v => { const e = watchHistory[v.path]; return e && e.duration > 0 && (e.position / e.duration) > 0.02 && (e.position / e.duration) < 0.95; }),
    [videos, watchHistory]
  );

  if (videos.length === 0) {
    return (
      <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: BG }}>
        <p className="text-white/50 text-lg">No videos. Open a folder to get started.</p>
        <button onClick={onExit} className="absolute top-6 right-6 text-white/70 hover:text-white"><X className="h-6 w-6" /></button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex" style={{ backgroundColor: BG }}>
      {/* Sidebar */}
      <div className="w-14 lg:w-52 shrink-0 flex flex-col border-r overflow-y-auto" style={{ borderColor: '#2a2d31', backgroundColor: SIDEBAR_BG, scrollbarWidth: 'none' }}>
        <div className="p-3 flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded flex items-center justify-center" style={{ backgroundColor: ORANGE }}>
            <Play className="h-3.5 w-3.5 text-black fill-current" />
          </div>
          <span className="text-white font-bold text-sm hidden lg:block">Plex</span>
        </div>
        <div className="hidden lg:block px-3 mb-2">
          <p className="text-[10px] text-white/30 uppercase font-semibold tracking-wider mb-1">Libraries</p>
        </div>
        {folders.map(f => (
          <button key={f} className="flex items-center gap-2 px-3 py-2 hover:bg-white/5 transition-colors text-white/60 hover:text-white/90 w-full text-left">
            <Folder className="h-4 w-4 shrink-0" />
            <span className="text-xs truncate hidden lg:block">{f}</span>
          </button>
        ))}
      </div>

      {/* Main */}
      <div ref={containerRef} className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
        {/* Top nav */}
        <div className="sticky top-0 z-40 flex items-center justify-between px-6 py-2.5 transition-colors duration-300" style={{ backgroundColor: scrolled ? SIDEBAR_BG : 'transparent' }}>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium" style={{ color: ORANGE }}>Home</span>
            <span className="text-white/50 text-sm font-medium hover:text-white cursor-pointer transition-colors">Movies</span>
            <span className="text-white/50 text-sm font-medium hover:text-white cursor-pointer transition-colors">TV Shows</span>
          </div>
          <button onClick={onExit} className="text-white/40 hover:text-white text-xs flex items-center gap-1 transition-colors">
            <X className="h-4 w-4" /> Exit
          </button>
        </div>

        {/* Hero */}
        <PlexHero video={heroVideo} onPlay={onPlay} watchHistory={watchHistory} />

        {/* Rows */}
        <div className="px-6 pt-4 pb-20">
          {resumeVideos.length > 0 && (
            <LibraryRow title="Continue Watching" videos={resumeVideos} onPlay={onPlay} watchHistory={watchHistory} />
          )}
          <LibraryRow title="Recently Added" videos={videos.slice(0, 20)} onPlay={onPlay} watchHistory={watchHistory} />
          {grouped.map(([folder, vids]) => (
            <LibraryRow key={folder} title={folder} videos={vids} onPlay={onPlay} watchHistory={watchHistory} />
          ))}
        </div>
      </div>
    </div>
  );
}
