import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'mytube_watch_history';

export interface WatchHistoryEntry {
  videoPath: string;
  position: number;
  duration: number;
  lastWatched: string; // ISO string
}

function loadHistory(): Record<string, WatchHistoryEntry> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveHistory(history: Record<string, WatchHistoryEntry>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

export function useWatchHistory() {
  const [history, setHistory] = useState<Record<string, WatchHistoryEntry>>(loadHistory);

  useEffect(() => {
    saveHistory(history);
  }, [history]);

  const updatePosition = useCallback((videoPath: string, position: number, duration: number) => {
    setHistory(prev => ({
      ...prev,
      [videoPath]: {
        videoPath,
        position,
        duration,
        lastWatched: new Date().toISOString(),
      },
    }));
  }, []);

  const getEntry = useCallback((videoPath: string): WatchHistoryEntry | null => {
    return history[videoPath] || null;
  }, [history]);

  const getRecentlyWatched = useCallback((limit = 20): WatchHistoryEntry[] => {
    return Object.values(history)
      .sort((a, b) => new Date(b.lastWatched).getTime() - new Date(a.lastWatched).getTime())
      .slice(0, limit);
  }, [history]);

  const clearHistory = useCallback(() => {
    setHistory({});
  }, []);

  return { history, updatePosition, getEntry, getRecentlyWatched, clearHistory };
}
