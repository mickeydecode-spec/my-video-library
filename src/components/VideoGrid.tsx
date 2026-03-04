import { VideoFile } from '@/lib/fileScanner';
import { VideoCard } from './VideoCard';

interface VideoGridProps {
  videos: VideoFile[];
  onPlay: (video: VideoFile) => void;
}

export function VideoGrid({ videos, onPlay }: VideoGridProps) {
  if (videos.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted-foreground p-12">
        <p>No videos found. Open a folder to get started.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
      {videos.map(video => (
        <VideoCard key={video.id} video={video} onClick={() => onPlay(video)} />
      ))}
    </div>
  );
}
