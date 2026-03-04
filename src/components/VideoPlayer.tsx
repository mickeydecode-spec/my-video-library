import { VideoFile } from '@/lib/fileScanner';
import { loadSubtitleAsVtt } from '@/lib/fileScanner';
import { ChevronDown, Minimize2, SkipBack, SkipForward, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect, useRef, useState } from 'react';

interface VideoPlayerProps {
  video: VideoFile;
  onClose: () => void;
  onMinimize: () => void;
  onNext: () => void;
  onPrev: () => void;
}

export function VideoPlayer({ video, onClose, onMinimize, onNext, onPrev }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [subtitleUrls, setSubtitleUrls] = useState<{ lang: string; url: string }[]>([]);

  useEffect(() => {
    // Load subtitle tracks
    async function loadSubs() {
      const subs = await Promise.all(
        video.subtitleFiles.map(async (sf) => {
          const url = await loadSubtitleAsVtt(sf);
          return { lang: sf.language, url };
        })
      );
      setSubtitleUrls(subs);
    }
    loadSubs();
  }, [video]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().catch(() => {});
    }
  }, [video.url, subtitleUrls]);

  return (
    <div className="flex flex-col bg-background">
      <div className="relative bg-player-bg">
        <div className="max-w-5xl mx-auto">
          <video
            ref={videoRef}
            className="w-full aspect-video"
            controls
            autoPlay
            key={video.id}
          >
            <source src={video.url} />
            {subtitleUrls.map((s, i) => (
              <track
                key={i}
                kind="subtitles"
                src={s.url}
                srcLang={s.lang}
                label={s.lang}
                default={i === 0}
              />
            ))}
          </video>
        </div>
        <div className="absolute top-2 right-2 flex gap-1">
          <Button variant="ghost" size="icon" onClick={onMinimize} className="text-primary-foreground hover:bg-primary-foreground/20">
            <Minimize2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-primary-foreground hover:bg-primary-foreground/20">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="max-w-5xl mx-auto w-full p-4">
        <h1 className="text-xl font-semibold">{video.name}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {video.folder.split('/').pop()}
        </p>
        <div className="flex gap-2 mt-3">
          <Button variant="secondary" size="sm" onClick={onPrev} className="gap-1">
            <SkipBack className="h-4 w-4" /> Previous
          </Button>
          <Button variant="secondary" size="sm" onClick={onNext} className="gap-1">
            Next <SkipForward className="h-4 w-4" />
          </Button>
        </div>
        {video.subtitleFiles.length > 0 && (
          <p className="text-xs text-muted-foreground mt-2">
            Subtitles: {video.subtitleFiles.map(s => s.language).join(', ')}
          </p>
        )}
      </div>
    </div>
  );
}
