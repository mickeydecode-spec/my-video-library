import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'mytube_tags';

export interface VideoTags {
  [videoPath: string]: string[];
}

export interface SmartPlaylist {
  id: string;
  name: string;
  query: string; // e.g., "tag:comedy" or "duration:>30"
}

const SMART_PLAYLISTS_KEY = 'mytube_smart_playlists';

function loadTags(): VideoTags {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function loadSmartPlaylists(): SmartPlaylist[] {
  try {
    const raw = localStorage.getItem(SMART_PLAYLISTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function useTagManager() {
  const [tags, setTags] = useState<VideoTags>(loadTags);
  const [smartPlaylists, setSmartPlaylists] = useState<SmartPlaylist[]>(loadSmartPlaylists);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tags));
  }, [tags]);

  useEffect(() => {
    localStorage.setItem(SMART_PLAYLISTS_KEY, JSON.stringify(smartPlaylists));
  }, [smartPlaylists]);

  const addTag = useCallback((videoPath: string, tag: string) => {
    setTags(prev => {
      const existing = prev[videoPath] || [];
      if (existing.includes(tag)) return prev;
      return { ...prev, [videoPath]: [...existing, tag] };
    });
  }, []);

  const removeTag = useCallback((videoPath: string, tag: string) => {
    setTags(prev => {
      const existing = prev[videoPath] || [];
      return { ...prev, [videoPath]: existing.filter(t => t !== tag) };
    });
  }, []);

  const getTagsForVideo = useCallback((videoPath: string): string[] => {
    return tags[videoPath] || [];
  }, [tags]);

  const getAllTags = useCallback((): string[] => {
    const all = new Set<string>();
    Object.values(tags).forEach(t => t.forEach(tag => all.add(tag)));
    return Array.from(all).sort();
  }, [tags]);

  const addSmartPlaylist = useCallback((name: string, query: string) => {
    setSmartPlaylists(prev => [
      ...prev,
      { id: Math.random().toString(36).substring(2, 10), name, query },
    ]);
  }, []);

  const removeSmartPlaylist = useCallback((id: string) => {
    setSmartPlaylists(prev => prev.filter(sp => sp.id !== id));
  }, []);

  return {
    tags,
    smartPlaylists,
    addTag,
    removeTag,
    getTagsForVideo,
    getAllTags,
    addSmartPlaylist,
    removeSmartPlaylist,
  };
}
