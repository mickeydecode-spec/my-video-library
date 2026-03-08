import { useRef, useEffect, useMemo, useState, useCallback } from 'react';
import { VideoFile } from '@/lib/fileScanner';
import { WebLayout } from '@/hooks/useWebLayout';
import { X, Volume2, VolumeX, Play, Pause, ChevronUp, ChevronDown, Folder } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

function TikTokItem({ video, isActive, videoTags }: { video: VideoFile; isActive: boolean; videoTags?: string[] }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [paused, setPaused] = useState(true);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (isActive) {
      el.currentTime = 0;
      el.play().catch(() => {});
      setPaused(false);
    } else {
      el.pause();
      setPaused(true);
    }
  }, [isActive]);

  const togglePlay = useCallback(() => {
    const el = videoRef.current;
    if (!el) return;
    if (el.paused) {
      el.play().catch(() => {});
      setPaused(false);
    } else {
      el.pause();
      setPaused(true);
    }
  }, []);

  const toggleMute = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const el = videoRef.current;
    if (!el) return;
    el.muted = !el.muted;
    setMuted(el.muted);
  }, []);

  const folderName = video.folder.split('/').pop() || '';

  return (
    <div
      className="h-screen w-full snap-start relative flex items-center justify-center bg-black cursor-pointer select-none"
      onClick={togglePlay}
    >
      <video
        ref={videoRef}
        src={video.url}
        className="h-full w-full object-contain"
        loop
        muted={muted}
        playsInline
        preload="metadata"
      />

      {/* Pause overlay */}
      {paused && isActive && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
          <Play className="h-16 w-16 text-white/80" />
        </div>
      )}

      {/* Bottom overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/70 to-transparent pointer-events-none">
        <h2 className="text-white text-lg font-semibold truncate drop-shadow-lg">
          {video.name}
        </h2>
        <div className="flex items-center gap-2 mt-1">
          <Folder className="h-3 w-3 text-white/70" />
          <span className="text-white/70 text-sm">{folderName}</span>
          {video.format && (
            <span className="text-white/50 text-xs uppercase">{video.format}</span>
          )}
        </div>
        {videoTags && videoTags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {videoTags.slice(0, 5).map(tag => (
              <Badge key={tag} variant="secondary" className="text-[10px] bg-white/20 text-white border-0">
                #{tag}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Right side controls */}
      <div className="absolute right-4 bottom-24 flex flex-col gap-4 pointer-events-auto">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full bg-white/10 hover:bg-white/20 text-white h-12 w-12"
          onClick={toggleMute}
        >
          {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
        </Button>
      </div>
    </div>
  );
}

export function TikTokFeed({ videos, onExit, videoTags = {} }: TikTokFeedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const shuffledVideos = useMemo(() => {
    return videos.length > 0 ? shuffleArray(videos) : [];
  }, [videos]);

  // Intersection observer to detect which video is in view
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const idx = Number(entry.target.getAttribute('data-index'));
            if (!isNaN(idx)) setActiveIndex(idx);
          }
        });
      },
      { root: container, threshold: 0.7 }
    );

    const items = container.querySelectorAll('[data-index]');
    items.forEach(item => observer.observe(item));

    return () => observer.disconnect();
  }, [shuffledVideos]);

  if (shuffledVideos.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center bg-black text-white">
        <p>No videos to show. Open a folder first.</p>
        <Button variant="ghost" className="ml-4 text-white" onClick={onExit}>Exit</Button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Exit button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-[60] rounded-full bg-white/10 hover:bg-white/20 text-white h-10 w-10"
        onClick={onExit}
      >
        <X className="h-5 w-5" />
      </Button>

      {/* Counter */}
      <div className="fixed top-4 right-4 z-[60] text-white/60 text-sm bg-black/40 px-3 py-1 rounded-full">
        {activeIndex + 1} / {shuffledVideos.length}
      </div>

      {/* Scroll hint arrows */}
      {activeIndex > 0 && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[60] text-white/40 animate-bounce">
          <ChevronUp className="h-6 w-6" />
        </div>
      )}
      {activeIndex < shuffledVideos.length - 1 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[60] text-white/40 animate-bounce">
          <ChevronDown className="h-6 w-6" />
        </div>
      )}

      {/* Feed */}
      <div
        ref={containerRef}
        className="h-screen overflow-y-scroll snap-y snap-mandatory scrollbar-none"
      >
        {shuffledVideos.map((video, idx) => (
          <div key={video.id} data-index={idx}>
            <TikTokItem
              video={video}
              isActive={idx === activeIndex}
              videoTags={videoTags[video.path]}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
