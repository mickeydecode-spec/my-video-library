import { FolderOpen, Menu, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

interface HeaderProps {
  onOpenFolder: () => void;
  onToggleSidebar: () => void;
  onSearch: (query: string) => void;
}

export function Header({ onOpenFolder, onToggleSidebar, onSearch }: HeaderProps) {
  const [query, setQuery] = useState('');

  return (
    <header className="sticky top-0 z-50 flex h-14 items-center gap-2 border-b bg-background px-4">
      <Button variant="ghost" size="icon" onClick={onToggleSidebar} className="shrink-0">
        <Menu className="h-5 w-5" />
      </Button>

      <div className="flex items-center gap-1 text-primary font-bold text-xl mr-4">
        <svg viewBox="0 0 24 24" className="h-7 w-7 fill-primary">
          <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0C.488 3.45.029 5.804 0 12c.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0C23.512 20.55 23.971 18.196 24 12c-.029-6.185-.484-8.549-4.385-8.816zM9 16V8l8 4-8 4z" />
        </svg>
        <span className="hidden sm:inline">MyTube</span>
      </div>

      <div className="flex flex-1 max-w-xl items-center">
        <Input
          placeholder="Search videos..."
          value={query}
          onChange={e => { setQuery(e.target.value); onSearch(e.target.value); }}
          className="rounded-r-none border-r-0 bg-surface"
        />
        <Button
          variant="secondary"
          size="icon"
          className="rounded-l-none border border-input"
          onClick={() => onSearch(query)}
        >
          <Search className="h-4 w-4" />
        </Button>
      </div>

      <Button onClick={onOpenFolder} variant="ghost" size="sm" className="ml-2 gap-2 shrink-0">
        <FolderOpen className="h-4 w-4" />
        <span className="hidden sm:inline">Open Folder</span>
      </Button>
    </header>
  );
}
