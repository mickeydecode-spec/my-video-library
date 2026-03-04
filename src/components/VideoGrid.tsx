import { VideoFile } from '@/lib/fileScanner';
import { VideoCard } from './VideoCard';
import { WatchHistoryEntry } from '@/hooks/useWatchHistory';

interface VideoGridProps {
  videos: VideoFile[];
  onPlay: (video: VideoFile) => void;
  watchHistory?: Record<string, WatchHistoryEntry>;
  noteCounts?: Record<string, number>;
  videoTags?: Record<string, string[]>;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function VideoGrid({ videos, onPlay, watchHistory = {}, noteCounts = {}, videoTags = {} }: VideoGridProps) {
  if (videos.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted-foreground p-12">
        <p>No videos found. Open a folder to get started.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
      {videos.map(video => {
        const entry = watchHistory[video.path];
        const resumePercent = entry && entry.duration > 0
          ? (entry.position / entry.duration) * 100
          : undefined;
        const resumeTime = entry ? formatTime(entry.position) : undefined;

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
