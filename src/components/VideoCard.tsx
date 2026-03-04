import { VideoFile } from '@/lib/fileScanner';
import { Bookmark, Play, Subtitles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';

interface VideoCardProps {
  video: VideoFile;
  onClick: () => void;
  resumePercent?: number; // 0-100
  resumeTime?: string; // formatted time string
  noteCount?: number;
  tags?: string[];
}

export function VideoCard({ video, onClick, resumePercent, resumeTime, noteCount, tags }: VideoCardProps) {
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [duration, setDuration] = useState('');

  useEffect(() => {
    const el = document.createElement('video');
    el.preload = 'metadata';
    el.src = video.url;
    el.currentTime = 2;
    el.muted = true;

    el.addEventListener('loadeddata', () => {
      const mins = Math.floor(el.duration / 60);
      const secs = Math.floor(el.duration % 60);
      setDuration(`${mins}:${secs.toString().padStart(2, '0')}`);

      const canvas = document.createElement('canvas');
      canvas.width = 320;
      canvas.height = 180;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(el, 0, 0, 320, 180);
        setThumbnail(canvas.toDataURL());
      }
      el.src = '';
    });

    return () => { el.src = ''; };
  }, [video.url]);

  const folderName = video.folder.split('/').pop() || '';

  return (
    <div
      onClick={onClick}
      className="group cursor-pointer rounded-xl overflow-hidden transition-transform hover:scale-[1.02]"
    >
      <div className="relative aspect-video bg-surface rounded-xl overflow-hidden">
        {thumbnail ? (
          <img src={thumbnail} alt={video.name} className="w-full h-full object-cover" />
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
        {/* Resume progress bar */}
        {resumePercent != null && resumePercent > 0 && resumePercent < 95 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted/50">
            <div
              className="h-full bg-primary"
              style={{ width: `${resumePercent}%` }}
            />
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
}
