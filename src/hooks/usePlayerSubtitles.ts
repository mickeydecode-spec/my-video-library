import { useState, useEffect, useCallback, RefObject } from 'react';
import { VideoFile, loadSubtitleAsVtt } from '@/lib/fileScanner';

export interface SubtitleTrack {
  index: number;
  label: string;
  language: string;
  url: string;
}

export interface AudioTrackInfo {
  index: number;
  label: string;
  language: string;
  enabled: boolean;
}

export function usePlayerSubtitles(video: VideoFile, videoRef: RefObject<HTMLVideoElement>) {
  const [subtitleTracks, setSubtitleTracks] = useState<SubtitleTrack[]>([]);
  const [activeSubtitle, setActiveSubtitleState] = useState(-1); // -1 = off
  const [audioTracks, setAudioTracks] = useState<AudioTrackInfo[]>([]);
  const [activeAudioTrack, setActiveAudioTrackState] = useState(0);

  // Load subtitle files as VTT URLs
  useEffect(() => {
    let cancelled = false;
    async function loadSubs() {
      const tracks: SubtitleTrack[] = await Promise.all(
        video.subtitleFiles.map(async (sf, i) => {
          const url = await loadSubtitleAsVtt(sf);
          return { index: i, label: sf.language, language: sf.language, url };
        })
      );
      if (!cancelled) {
        setSubtitleTracks(tracks);
        setActiveSubtitleState(-1);
      }
    }
    loadSubs();
    return () => { cancelled = true; };
  }, [video]);

  // Sync textTracks mode when activeSubtitle changes
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    // Need a small delay for tracks to be added to the DOM
    const timer = setTimeout(() => {
      const tt = el.textTracks;
      for (let i = 0; i < tt.length; i++) {
        tt[i].mode = i === activeSubtitle ? 'showing' : 'disabled';
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [activeSubtitle, subtitleTracks, videoRef]);

  // Detect audio tracks
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    const detect = () => {
      const at = (el as any).audioTracks;
      if (at && at.length > 0) {
        const tracks: AudioTrackInfo[] = [];
        for (let i = 0; i < at.length; i++) {
          tracks.push({
            index: i,
            label: at[i].label || `Track ${i + 1}`,
            language: at[i].language || 'unknown',
            enabled: at[i].enabled,
          });
        }
        setAudioTracks(tracks);
        const enabledIdx = tracks.findIndex(t => t.enabled);
        if (enabledIdx >= 0) setActiveAudioTrackState(enabledIdx);
      }
    };
    el.addEventListener('loadedmetadata', detect);
    detect();
    return () => el.removeEventListener('loadedmetadata', detect);
  }, [videoRef, video]);

  const setActiveSubtitle = useCallback((index: number) => {
    setActiveSubtitleState(index);
  }, []);

  const setActiveAudioTrack = useCallback((index: number) => {
    const el = videoRef.current;
    if (!el) return;
    const at = (el as any).audioTracks;
    if (at) {
      for (let i = 0; i < at.length; i++) {
        at[i].enabled = i === index;
      }
    }
    setActiveAudioTrackState(index);
    setAudioTracks(prev => prev.map((t, i) => ({ ...t, enabled: i === index })));
  }, [videoRef]);

  return {
    subtitleTracks,
    activeSubtitle,
    setActiveSubtitle,
    audioTracks,
    activeAudioTrack,
    setActiveAudioTrack,
  };
}
