import { useMemo } from 'react';
import { VideoFile } from '@/lib/fileScanner';
import { VideoCard } from './VideoCard';
import { WatchHistoryEntry } from '@/hooks/useWatchHistory';
import { LayoutMode } from '@/hooks/useLayoutPreference';
import { WebLayout } from '@/hooks/useWebLayout';
import { Play, Subtitles, Bookmark, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

interface VideoGridProps {
  videos: VideoFile[];
  onPlay: (video: VideoFile) => void;
  watchHistory?: Record<string, WatchHistoryEntry>;
  noteCounts?: Record<string, number>;
  videoTags?: Record<string, string[]>;
  layout?: LayoutMode;
  webLayout?: WebLayout;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function getResumeInfo(video: VideoFile, watchHistory: Record<string, WatchHistoryEntry>) {
  const entry = watchHistory[video.path];
  const resumePercent = entry && entry.duration > 0 ? (entry.position / entry.duration) * 100 : undefined;
  const resumeTime = entry ? formatTime(entry.position) : undefined;
  return { resumePercent, resumeTime };
}

// Netflix is now handled by NetflixBrowser component in Index.tsx

// Twitch: large hero + compact grid
function TwitchLayout({ videos, onPlay, watchHistory, noteCounts, videoTags }: Omit<VideoGridProps, 'layout' | 'webLayout'>) {
  if (videos.length === 0) return <EmptyGrid />;

  const heroVideo = videos[0];
  const rest = videos.slice(1);
  const { resumePercent: heroPct, resumeTime: heroTime } = getResumeInfo(heroVideo, watchHistory || {});

  return (
    <div className="flex flex-col gap-4 p-4">
      <VideoCard
        video={heroVideo}
        onClick={() => onPlay(heroVideo)}
        resumePercent={heroPct}
        resumeTime={heroTime}
        noteCount={noteCounts?.[heroVideo.path]}
        tags={videoTags?.[heroVideo.path]}
        variant="hero"
      />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {rest.map(video => {
          const { resumePercent, resumeTime } = getResumeInfo(video, watchHistory || {});
          return (
            <VideoCard
              key={video.id}
              video={video}
              onClick={() => onPlay(video)}
              resumePercent={resumePercent}
              resumeTime={resumeTime}
              noteCount={noteCounts?.[video.path]}
              tags={videoTags?.[video.path]}
            />
          );
        })}
      </div>
    </div>
  );
}

// Plex: portrait poster cards
function PlexLayout({ videos, onPlay, watchHistory, noteCounts, videoTags }: Omit<VideoGridProps, 'layout' | 'webLayout'>) {
  if (videos.length === 0) return <EmptyGrid />;

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-3 p-4">
      {videos.map(video => {
        const { resumePercent, resumeTime } = getResumeInfo(video, watchHistory || {});
        return (
          <VideoCard
            key={video.id}
            video={video}
            onClick={() => onPlay(video)}
            resumePercent={resumePercent}
            resumeTime={resumeTime}
            noteCount={noteCounts?.[video.path]}
            tags={videoTags?.[video.path]}
            variant="portrait"
          />
        );
      })}
    </div>
  );
}

// TikTok is now handled by TikTokFeed component in Index.tsx

function EmptyGrid() {
  return (
    <div className="flex flex-1 items-center justify-center text-muted-foreground p-12">
      <p>No videos found. Open a folder to get started.</p>
    </div>
  );
}

export function VideoGrid({ videos, onPlay, watchHistory = {}, noteCounts = {}, videoTags = {}, layout = 'grid', webLayout = 'youtube' }: VideoGridProps) {
  // Web layout takes priority
  // Netflix handled by NetflixBrowser in Index.tsx
  if (webLayout === 'twitch') {
    return <TwitchLayout videos={videos} onPlay={onPlay} watchHistory={watchHistory} noteCounts={noteCounts} videoTags={videoTags} />;
  }
  if (webLayout === 'plex') {
    return <PlexLayout videos={videos} onPlay={onPlay} watchHistory={watchHistory} noteCounts={noteCounts} videoTags={videoTags} />;
  }
  // TikTok handled by TikTokFeed in Index.tsx — fallback to default grid
  if (webLayout === 'tiktok') {
    // Should not reach here, but just in case
  }

  if (videos.length === 0) return <EmptyGrid />;

  // YouTube default / list / compact modes
  if (layout === 'list') {
    return (
      <div className="flex flex-col gap-1 p-4">
        {videos.map(video => {
          const entry = watchHistory[video.path];
          const resumePercent = entry && entry.duration > 0 ? (entry.position / entry.duration) * 100 : undefined;
          const tags = videoTags[video.path];
          const folderName = video.folder.split('/').pop() || '';

          return (
            <div
              key={video.id}
              onClick={() => onPlay(video)}
              className="flex items-center gap-4 p-3 rounded-lg cursor-pointer hover:bg-accent transition-colors group"
            >
              <div className="relative w-40 aspect-video bg-muted rounded-md overflow-hidden shrink-0">
                <div className="w-full h-full flex items-center justify-center">
                  <Play className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                {resumePercent != null && resumePercent > 0 && resumePercent < 95 && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted-foreground/20">
                    <div className="h-full bg-primary" style={{ width: `${resumePercent}%` }} />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium truncate">{video.name}</h3>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  <span>{folderName}</span>
                  {video.format && <span className="uppercase">{video.format}</span>}
                  {video.size > 0 && <span>{(video.size / (1024 * 1024)).toFixed(1)} MB</span>}
                  {video.subtitleFiles.length > 0 && (
                    <span className="flex items-center gap-1"><Subtitles className="h-3 w-3" /> CC</span>
                  )}
                  {noteCounts[video.path] > 0 && (
                    <span className="flex items-center gap-1"><Bookmark className="h-3 w-3" /> {noteCounts[video.path]}</span>
                  )}
                </div>
                {tags && tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {tags.slice(0, 5).map(tag => (
                      <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">{tag}</Badge>
                    ))}
                  </div>
                )}
              </div>
              {entry && (
                <span className="text-[10px] text-primary shrink-0">
                  {formatTime(entry.position)}
                </span>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  const gridClass = layout === 'compact'
    ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2 p-4'
    : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4';

  return (
    <div className={gridClass}>
      {videos.map(video => {
        const { resumePercent, resumeTime } = getResumeInfo(video, watchHistory);
        return (
          <VideoCard
            key={video.id}
            video={video}
            onClick={() => onPlay(video)}
            resumePercent={resumePercent}
            resumeTime={resumeTime}
            noteCount={noteCounts[video.path]}
            tags={videoTags[video.path]}
          />
        );
      })}
    </div>
  );
}
