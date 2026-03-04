import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Tag, X } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface TagEditorProps {
  tags: string[];
  allTags: string[];
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
}

export function TagEditor({ tags, allTags, onAddTag, onRemoveTag }: TagEditorProps) {
  const [newTag, setNewTag] = useState('');
  const suggestions = allTags.filter(t => !tags.includes(t) && t.toLowerCase().includes(newTag.toLowerCase()));

  const handleAdd = () => {
    if (!newTag.trim()) return;
    onAddTag(newTag.trim().toLowerCase());
    setNewTag('');
  };

  return (
    <div className="flex flex-wrap items-center gap-1">
      {tags.map(tag => (
        <Badge key={tag} variant="secondary" className="gap-1 text-xs">
          {tag}
          <button onClick={() => onRemoveTag(tag)} className="ml-0.5 hover:text-destructive">
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-6 gap-1 text-xs px-2">
            <Plus className="h-3 w-3" /> Tag
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-48 p-2" align="start">
          <div className="flex gap-1">
            <Input
              placeholder="Add tag..."
              value={newTag}
              onChange={e => setNewTag(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              className="h-7 text-xs"
            />
            <Button size="icon" className="h-7 w-7 shrink-0" onClick={handleAdd}>
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          {suggestions.length > 0 && (
            <div className="mt-1 space-y-0.5">
              {suggestions.slice(0, 5).map(s => (
                <button
                  key={s}
                  onClick={() => { onAddTag(s); setNewTag(''); }}
                  className="w-full text-left text-xs px-2 py-1 rounded hover:bg-accent"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}
