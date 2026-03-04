import { VideoFile } from '@/lib/fileScanner';
import { loadSubtitleAsVtt } from '@/lib/fileScanner';
import { Bookmark, Minimize2, SkipBack, SkipForward, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect, useRef, useState, useCallback } from 'react';
import { NotesPanel } from '@/components/NotesPanel';
import { TagEditor } from '@/components/TagEditor';
import { VideoNote } from '@/hooks/useVideoNotes';

interface VideoPlayerProps {
  video: VideoFile;
  onClose: () => void;
  onMinimize: () => void;
  onNext: () => void;
  onPrev: () => void;
  // Watch history
  resumePosition?: number;
  onPositionUpdate?: (position: number, duration: number) => void;
  // Notes
  notes: VideoNote[];
  onAddNote: (timestamp: number, note: string) => void;
  onRemoveNote: (id: string) => void;
  // Tags
  tags: string[];
  allTags: string[];
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
}

export function VideoPlayer({
  video, onClose, onMinimize, onNext, onPrev,
  resumePosition, onPositionUpdate,
  notes, onAddNote, onRemoveNote,
  tags, allTags, onAddTag, onRemoveTag,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [subtitleUrls, setSubtitleUrls] = useState<{ lang: string; url: string }[]>([]);
  const [notesOpen, setNotesOpen] = useState(false);
  const hasResumed = useRef(false);

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
    hasResumed.current = false;
  }, [video]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().catch(() => {});
    }
  }, [video.url, subtitleUrls]);

  // Resume from saved position
  useEffect(() => {
    const el = videoRef.current;
    if (!el || hasResumed.current || !resumePosition || resumePosition < 2) return;
    
    const handleCanPlay = () => {
      if (!hasResumed.current && resumePosition < el.duration - 5) {
        el.currentTime = resumePosition;
        hasResumed.current = true;
      }
    };
    el.addEventListener('canplay', handleCanPlay);
    return () => el.removeEventListener('canplay', handleCanPlay);
  }, [resumePosition, subtitleUrls]);

  // Save position periodically
  useEffect(() => {
    const el = videoRef.current;
    if (!el || !onPositionUpdate) return;
    
    const interval = setInterval(() => {
      if (!el.paused && el.duration) {
        onPositionUpdate(el.currentTime, el.duration);
      }
    }, 5000);

    const handlePause = () => {
      if (el.duration) onPositionUpdate(el.currentTime, el.duration);
    };
    el.addEventListener('pause', handlePause);

    return () => {
      clearInterval(interval);
      el.removeEventListener('pause', handlePause);
      // Save on unmount
      if (el.duration) onPositionUpdate(el.currentTime, el.duration);
    };
  }, [onPositionUpdate, video.id]);

  const getCurrentTime = useCallback(() => {
    return videoRef.current?.currentTime || 0;
  }, []);

  const seekTo = useCallback((time: number) => {
    if (videoRef.current) videoRef.current.currentTime = time;
  }, []);

  return (
    <div className="flex flex-col bg-background h-full">
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col">
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
              <Button variant="ghost" size="icon" onClick={() => setNotesOpen(!notesOpen)} className="text-primary-foreground hover:bg-primary-foreground/20">
                <Bookmark className="h-4 w-4" />
              </Button>
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
              {video.format && <span className="ml-2 uppercase">{video.format}</span>}
              {video.size > 0 && <span className="ml-2">{(video.size / (1024 * 1024)).toFixed(1)} MB</span>}
            </p>
            <div className="flex gap-2 mt-3">
              <Button variant="secondary" size="sm" onClick={onPrev} className="gap-1">
                <SkipBack className="h-4 w-4" /> Previous
              </Button>
              <Button variant="secondary" size="sm" onClick={onNext} className="gap-1">
                Next <SkipForward className="h-4 w-4" />
              </Button>
            </div>
            <div className="mt-3">
              <TagEditor
                tags={tags}
                allTags={allTags}
                onAddTag={onAddTag}
                onRemoveTag={onRemoveTag}
              />
            </div>
            {video.subtitleFiles.length > 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                Subtitles: {video.subtitleFiles.map(s => s.language).join(', ')}
              </p>
            )}
          </div>
        </div>

        <NotesPanel
          notes={notes}
          onAddNote={onAddNote}
          onRemoveNote={onRemoveNote}
          onSeek={seekTo}
          getCurrentTime={getCurrentTime}
          isOpen={notesOpen}
          onClose={() => setNotesOpen(false)}
        />
      </div>
    </div>
  );
}
