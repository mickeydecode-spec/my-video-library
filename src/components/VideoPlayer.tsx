import { VideoFile } from '@/lib/fileScanner';
import { loadSubtitleAsVtt } from '@/lib/fileScanner';
import { Bookmark, X } from 'lucide-react';
import { useEffect, useRef, useState, useCallback } from 'react';
import { NotesPanel } from '@/components/NotesPanel';
import { TagEditor } from '@/components/TagEditor';
import { PlayerControls } from '@/components/PlayerControls';
import { VideoNote } from '@/hooks/useVideoNotes';
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger,
} from '@/components/ui/menubar';

interface VideoPlayerProps {
  video: VideoFile;
  onClose: () => void;
  onMinimize: () => void;
  onNext: () => void;
  onPrev: () => void;
  resumePosition?: number;
  onPositionUpdate?: (position: number, duration: number) => void;
  notes: VideoNote[];
  onAddNote: (timestamp: number, note: string) => void;
  onRemoveNote: (id: string) => void;
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
  const [controlsVisible, setControlsVisible] = useState(true);
  const hideTimerRef = useRef<number | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  // Auto-hide controls logic
  const resetHideTimer = useCallback(() => {
    setControlsVisible(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = window.setTimeout(() => {
      const el = videoRef.current;
      if (el && !el.paused) setControlsVisible(false);
    }, 3000);
  }, []);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    const showOnPause = () => { setControlsVisible(true); if (hideTimerRef.current) clearTimeout(hideTimerRef.current); };
    const hideOnPlay = () => resetHideTimer();
    el.addEventListener('pause', showOnPause);
    el.addEventListener('play', hideOnPlay);
    return () => {
      el.removeEventListener('pause', showOnPause);
      el.removeEventListener('play', hideOnPlay);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [resetHideTimer]);

  const handleMouseMove = useCallback(() => resetHideTimer(), [resetHideTimer]);
  const handleMouseLeave = useCallback(() => {
    const el = videoRef.current;
    if (el && !el.paused) {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      hideTimerRef.current = window.setTimeout(() => setControlsVisible(false), 1000);
    }
  }, []);

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
      if (!el.paused && el.duration) onPositionUpdate(el.currentTime, el.duration);
    }, 5000);
    const handlePause = () => {
      if (el.duration) onPositionUpdate(el.currentTime, el.duration);
    };
    el.addEventListener('pause', handlePause);
    return () => {
      clearInterval(interval);
      el.removeEventListener('pause', handlePause);
      if (el.duration) onPositionUpdate(el.currentTime, el.duration);
    };
  }, [onPositionUpdate, video.id]);

  const getCurrentTime = useCallback(() => videoRef.current?.currentTime || 0, []);
  const seekTo = useCallback((time: number) => {
    if (videoRef.current) videoRef.current.currentTime = time;
  }, []);

  const handleStop = useCallback(() => {
    const el = videoRef.current;
    if (!el) return;
    el.pause();
    el.currentTime = 0;
  }, []);

  const handleScreenshot = useCallback(() => {
    const el = videoRef.current;
    if (!el) return;
    const canvas = document.createElement('canvas');
    canvas.width = el.videoWidth;
    canvas.height = el.videoHeight;
    canvas.getContext('2d')?.drawImage(el, 0, 0);
    const link = document.createElement('a');
    link.download = `screenshot-${Math.floor(el.currentTime)}s.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }, []);

  const handleDoubleClick = useCallback(() => {
    const el = videoRef.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else el.closest('.vlc-player-root')?.requestFullscreen?.();
  }, []);

  const handleVideoClick = useCallback(() => {
    const el = videoRef.current;
    if (!el) return;
    el.paused ? el.play() : el.pause();
  }, []);

  return (
    <div
      ref={rootRef}
      className="vlc-player-root flex flex-col h-full relative"
      style={{ background: '#000', cursor: controlsVisible ? 'default' : 'none' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* VLC Menu Bar */}
      <div
        className="transition-all duration-300 ease-in-out z-10"
        style={{
          opacity: controlsVisible ? 1 : 0,
          transform: controlsVisible ? 'translateY(0)' : 'translateY(-100%)',
          pointerEvents: controlsVisible ? 'auto' : 'none',
        }}
      >
      <Menubar className="rounded-none border-0 border-b px-1 h-7 bg-black/90 border-white/10">
          <MenubarMenu>
            <MenubarTrigger className="text-xs px-2 py-0.5 h-6 font-normal text-white/80 hover:text-white">Media</MenubarTrigger>
            <MenubarContent>
              <MenubarItem onClick={onClose}>Close <MenubarShortcut>Ctrl+W</MenubarShortcut></MenubarItem>
              <MenubarSeparator />
              <MenubarItem onClick={onMinimize}>Minimize Player</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
          <MenubarMenu>
            <MenubarTrigger className="text-xs px-2 py-0.5 h-6 font-normal" style={{ color: '#333' }}>Playback</MenubarTrigger>
            <MenubarContent>
              <MenubarItem onClick={onPrev}>Previous <MenubarShortcut>P</MenubarShortcut></MenubarItem>
              <MenubarItem onClick={onNext}>Next <MenubarShortcut>N</MenubarShortcut></MenubarItem>
              <MenubarSeparator />
              <MenubarItem onClick={() => { if (videoRef.current) videoRef.current.playbackRate = 1; }}>Normal Speed</MenubarItem>
              <MenubarItem onClick={() => { if (videoRef.current) videoRef.current.playbackRate = Math.min(4, videoRef.current.playbackRate + 0.25); }}>
                Faster <MenubarShortcut>]</MenubarShortcut>
              </MenubarItem>
              <MenubarItem onClick={() => { if (videoRef.current) videoRef.current.playbackRate = Math.max(0.25, videoRef.current.playbackRate - 0.25); }}>
                Slower <MenubarShortcut>[</MenubarShortcut>
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>
          <MenubarMenu>
            <MenubarTrigger className="text-xs px-2 py-0.5 h-6 font-normal" style={{ color: '#333' }}>Audio</MenubarTrigger>
            <MenubarContent>
              <MenubarItem onClick={() => { if (videoRef.current) videoRef.current.muted = !videoRef.current.muted; }}>
                Mute <MenubarShortcut>M</MenubarShortcut>
              </MenubarItem>
              <MenubarSeparator />
              <MenubarItem disabled className="text-xs text-muted-foreground">Audio tracks shown in controls below</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
          <MenubarMenu>
            <MenubarTrigger className="text-xs px-2 py-0.5 h-6 font-normal" style={{ color: '#333' }}>Video</MenubarTrigger>
            <MenubarContent>
              <MenubarItem onClick={() => {
                if (document.fullscreenElement) document.exitFullscreen();
                else videoRef.current?.closest('.vlc-player-root')?.requestFullscreen?.();
              }}>
                Fullscreen <MenubarShortcut>F</MenubarShortcut>
              </MenubarItem>
              <MenubarItem onClick={handleScreenshot}>
                Take Screenshot <MenubarShortcut>Ctrl+S</MenubarShortcut>
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>
          <MenubarMenu>
            <MenubarTrigger className="text-xs px-2 py-0.5 h-6 font-normal" style={{ color: '#333' }}>Subtitle</MenubarTrigger>
            <MenubarContent>
              {video.subtitleFiles.length > 0
                ? video.subtitleFiles.map((s, i) => (
                  <MenubarItem key={i}>{s.language} - {s.name}</MenubarItem>
                ))
                : <MenubarItem disabled>No subtitles</MenubarItem>
              }
            </MenubarContent>
          </MenubarMenu>
          <MenubarMenu>
            <MenubarTrigger className="text-xs px-2 py-0.5 h-6 font-normal" style={{ color: '#333' }}>Tools</MenubarTrigger>
            <MenubarContent>
              <MenubarItem onClick={() => setNotesOpen(!notesOpen)}>Notes & Bookmarks</MenubarItem>
              <MenubarSeparator />
              <MenubarItem disabled className="text-xs">{video.name}</MenubarItem>
              <MenubarItem disabled className="text-xs text-muted-foreground">
                {video.format?.toUpperCase()} · {video.size > 0 ? `${(video.size / (1024 * 1024)).toFixed(1)} MB` : ''}
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>
          <MenubarMenu>
            <MenubarTrigger className="text-xs px-2 py-0.5 h-6 font-normal" style={{ color: '#333' }}>View</MenubarTrigger>
            <MenubarContent>
              <MenubarItem onClick={onMinimize}>Mini Player</MenubarItem>
            </MenubarContent>
          </MenubarMenu>

          <div className="flex-1" />
          <button onClick={() => setNotesOpen(!notesOpen)} className="p-1 rounded hover:bg-black/10 transition-colors mr-1" title="Notes & Bookmarks">
            <Bookmark className="h-3.5 w-3.5" style={{ color: '#555' }} />
          </button>
          <button onClick={onClose} className="p-1 rounded hover:bg-black/10 transition-colors" title="Close">
            <X className="h-3.5 w-3.5" style={{ color: '#555' }} />
          </button>
        </Menubar>
      </div>

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 flex items-center justify-center min-h-0" style={{ background: '#000' }}>
            <video
              ref={videoRef}
              className="max-w-full max-h-full w-full h-full"
              style={{ objectFit: 'contain' }}
              autoPlay
              key={video.id}
              onClick={handleVideoClick}
              onDoubleClick={handleDoubleClick}
            >
              <source src={video.url} />
              {subtitleUrls.map((s, i) => (
                <track key={i} kind="subtitles" src={s.url} srcLang={s.lang} label={s.lang} default={i === 0} />
              ))}
            </video>
          </div>

          {/* Bottom controls with auto-hide */}
          <div
            className="transition-all duration-300 ease-in-out"
            style={{
              opacity: controlsVisible ? 1 : 0,
              transform: controlsVisible ? 'translateY(0)' : 'translateY(100%)',
              pointerEvents: controlsVisible ? 'auto' : 'none',
            }}
          >
            <PlayerControls
              videoRef={videoRef}
              onPrev={onPrev}
              onNext={onNext}
              onStop={handleStop}
            />
            <div className="px-2 py-1" style={{ background: '#e0e0e0', borderTop: '1px solid #c8c8c8' }}>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-medium truncate" style={{ color: '#333' }}>{video.name}</span>
                <div className="flex-1" />
                <TagEditor tags={tags} allTags={allTags} onAddTag={onAddTag} onRemoveTag={onRemoveTag} />
              </div>
            </div>
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
