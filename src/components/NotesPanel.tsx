import { useState } from 'react';
import { VideoNote } from '@/hooks/useVideoNotes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Bookmark, Plus, Trash2, X } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface NotesPanelProps {
  notes: VideoNote[];
  onAddNote: (timestamp: number, note: string) => void;
  onRemoveNote: (id: string) => void;
  onSeek: (timestamp: number) => void;
  getCurrentTime: () => number;
  isOpen: boolean;
  onClose: () => void;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function NotesPanel({ notes, onAddNote, onRemoveNote, onSeek, getCurrentTime, isOpen, onClose }: NotesPanelProps) {
  const [noteText, setNoteText] = useState('');

  if (!isOpen) return null;

  const handleAdd = () => {
    if (!noteText.trim()) return;
    onAddNote(getCurrentTime(), noteText.trim());
    setNoteText('');
  };

  return (
    <div className="w-80 border-l bg-card flex flex-col shrink-0">
      <div className="flex items-center justify-between p-3 border-b">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Bookmark className="h-4 w-4" /> Notes & Bookmarks
        </h3>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex gap-1 p-2 border-b">
        <Input
          placeholder="Add a note at current time..."
          value={noteText}
          onChange={e => setNoteText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          className="h-8 text-xs"
        />
        <Button size="icon" className="h-8 w-8 shrink-0" onClick={handleAdd}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {notes.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              No notes yet. Add a bookmark at the current timestamp.
            </p>
          ) : (
            notes.map(note => (
              <div
                key={note.id}
                className="flex items-start gap-2 p-2 rounded-md hover:bg-accent cursor-pointer group"
                onClick={() => onSeek(note.timestamp)}
              >
                <span className="text-xs font-mono text-primary shrink-0 mt-0.5">
                  {formatTime(note.timestamp)}
                </span>
                <p className="text-xs flex-1 leading-relaxed">{note.note}</p>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 shrink-0"
                  onClick={e => { e.stopPropagation(); onRemoveNote(note.id); }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
