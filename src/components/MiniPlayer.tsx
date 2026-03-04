import { VideoFile } from '@/lib/fileScanner';
import { loadSubtitleAsVtt } from '@/lib/fileScanner';
import { Maximize2, SkipForward, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect, useRef, useState } from 'react';

interface MiniPlayerProps {
  video: VideoFile;
  onExpand: () => void;
  onClose: () => void;
  onNext: () => void;
}

export function MiniPlayer({ video, onExpand, onClose, onNext }: MiniPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [subtitleUrls, setSubtitleUrls] = useState<{ lang: string; url: string }[]>([]);

  useEffect(() => {
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

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 rounded-xl overflow-hidden shadow-2xl border bg-card">
      <div className="relative">
        <video
          ref={videoRef}
          className="w-full aspect-video"
          controls
          autoPlay
          key={video.id}
        >
          <source src={video.url} />
          {subtitleUrls.map((s, i) => (
            <track key={i} kind="subtitles" src={s.url} srcLang={s.lang} label={s.lang} default={i === 0} />
          ))}
        </video>
      </div>
      <div className="flex items-center gap-2 p-2">
        <p className="flex-1 text-xs font-medium truncate">{video.name}</p>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onNext}>
          <SkipForward className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onExpand}>
          <Maximize2 className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
