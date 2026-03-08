import { VideoFile } from '@/lib/fileScanner';
import { Bookmark, Play, Subtitles } from 'lucide-react';
import { useEffect, useState, useRef, memo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

// Global thumbnail cache and concurrency limiter
const thumbnailCache = new Map<string, { thumb: string; duration: string }>();
let activeDecoders = 0;
const MAX_CONCURRENT = 3;
const pendingQueue: (() => void)[] = [];

function runNext() {
  if (pendingQueue.length > 0 && activeDecoders < MAX_CONCURRENT) {
    const next = pendingQueue.shift();
    next?.();
  }
}

function generateThumbnail(url: string): Promise<{ thumb: string; duration: string }> {
  const cached = thumbnailCache.get(url);
  if (cached) return Promise.resolve(cached);

  return new Promise((resolve) => {
    const start = () => {
      activeDecoders++;
      const el = document.createElement('video');
      el.preload = 'metadata';
      el.src = url;
      el.currentTime = 2;
      el.muted = true;

      const cleanup = () => {
        el.src = '';
        activeDecoders--;
        runNext();
      };

      el.addEventListener('loadeddata', () => {
        const mins = Math.floor(el.duration / 60);
        const secs = Math.floor(el.duration % 60);
        const duration = `${mins}:${secs.toString().padStart(2, '0')}`;

        const canvas = document.createElement('canvas');
        canvas.width = 320;
        canvas.height = 180;
        const ctx = canvas.getContext('2d');
        let thumb = '';
        if (ctx) {
          ctx.drawImage(el, 0, 0, 320, 180);
          thumb = canvas.toDataURL();
        }
        const result = { thumb, duration };
        thumbnailCache.set(url, result);
        cleanup();
        resolve(result);
      });

      el.addEventListener('error', () => {
        cleanup();
        resolve({ thumb: '', duration: '' });
      });

      // Timeout fallback
      setTimeout(() => {
        if (activeDecoders > 0) {
          cleanup();
          resolve({ thumb: '', duration: '' });
        }
      }, 10000);
    };

    if (activeDecoders < MAX_CONCURRENT) {
      start();
    } else {
      pendingQueue.push(start);
    }
  });
}

interface VideoCardProps {
  video: VideoFile;
  onClick: () => void;
  resumePercent?: number;
  resumeTime?: string;
  noteCount?: number;
  tags?: string[];
}

export const VideoCard = memo(function VideoCard({ video, onClick, resumePercent, resumeTime, noteCount, tags }: VideoCardProps) {
  const [thumbnail, setThumbnail] = useState<string | null>(() => {
    const cached = thumbnailCache.get(video.url);
    return cached?.thumb || null;
  });
  const [duration, setDuration] = useState(() => {
    const cached = thumbnailCache.get(video.url);
    return cached?.duration || '';
  });
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Intersection observer for lazy loading
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    // If already cached, skip observer
    if (thumbnailCache.has(video.url)) {
      setIsVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [video.url]);

  // Generate thumbnail only when visible
  useEffect(() => {
    if (!isVisible || thumbnail) return;
    let cancelled = false;
    generateThumbnail(video.url).then(result => {
      if (!cancelled) {
        setThumbnail(result.thumb);
        setDuration(result.duration);
      }
    });
    return () => { cancelled = true; };
  }, [isVisible, video.url, thumbnail]);

  const folderName = video.folder.split('/').pop() || '';

  return (
    <div
      ref={cardRef}
      onClick={onClick}
      className="group cursor-pointer rounded-xl overflow-hidden transition-transform hover:scale-[1.02]"
    >
      <div className="relative aspect-video bg-surface rounded-xl overflow-hidden">
        {thumbnail ? (
          <img src={thumbnail} alt={video.name} className="w-full h-full object-cover" />
        ) : isVisible ? (
          <Skeleton className="w-full h-full" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Play className="h-10 w-10 text-muted-foreground" />
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-player-bg/40">
          <div className="rounded-full bg-primary p-3">
            <Play className="h-6 w-6 text-primary-foreground fill-primary-foreground" />
          </div>
        </div>
        {duration && (
          <span className="absolute bottom-2 right-2 bg-player-bg/80 text-primary-foreground text-xs px-1.5 py-0.5 rounded">
            {duration}
          </span>
        )}
        {video.subtitleFiles.length > 0 && (
          <span className="absolute bottom-2 left-2 bg-player-bg/80 text-primary-foreground text-xs px-1.5 py-0.5 rounded flex items-center gap-1">
            <Subtitles className="h-3 w-3" /> CC
          </span>
        )}
        {noteCount && noteCount > 0 && (
          <span className="absolute top-2 right-2 bg-player-bg/80 text-primary-foreground text-xs px-1.5 py-0.5 rounded flex items-center gap-1">
            <Bookmark className="h-3 w-3" /> {noteCount}
          </span>
        )}
        {resumePercent != null && resumePercent > 0 && resumePercent < 95 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted/50">
            <div className="h-full bg-primary" style={{ width: `${resumePercent}%` }} />
          </div>
        )}
      </div>
      <div className="p-2">
        <h3 className="text-sm font-medium leading-tight line-clamp-2">{video.name}</h3>
        <div className="flex items-center gap-2 mt-1">
          <p className="text-xs text-muted-foreground truncate">{folderName}</p>
          {video.format && (
            <span className="text-[10px] text-muted-foreground uppercase">{video.format}</span>
          )}
        </div>
        {resumeTime && resumePercent != null && resumePercent > 0 && resumePercent < 95 && (
          <p className="text-[10px] text-primary mt-0.5">Resume from {resumeTime}</p>
        )}
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {tags.slice(0, 3).map(tag => (
              <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">
                {tag}
              </Badge>
            ))}
            {tags.length > 3 && (
              <span className="text-[10px] text-muted-foreground">+{tags.length - 3}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
});
