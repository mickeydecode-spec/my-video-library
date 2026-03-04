import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'mytube_video_notes';

export interface VideoNote {
  id: string;
  videoPath: string;
  timestamp: number; // seconds
  note: string;
  createdAt: string;
}

function loadNotes(): VideoNote[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function useVideoNotes() {
  const [notes, setNotes] = useState<VideoNote[]>(loadNotes);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  }, [notes]);

  const addNote = useCallback((videoPath: string, timestamp: number, note: string) => {
    const newNote: VideoNote = {
      id: Math.random().toString(36).substring(2, 10),
      videoPath,
      timestamp,
      note,
      createdAt: new Date().toISOString(),
    };
    setNotes(prev => [...prev, newNote]);
    return newNote;
  }, []);

  const removeNote = useCallback((id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
  }, []);

  const getNotesForVideo = useCallback((videoPath: string): VideoNote[] => {
    return notes
      .filter(n => n.videoPath === videoPath)
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [notes]);

  const getNoteCount = useCallback((videoPath: string): number => {
    return notes.filter(n => n.videoPath === videoPath).length;
  }, [notes]);

  return { notes, addNote, removeNote, getNotesForVideo, getNoteCount };
}
