import { Folder, Home, List } from 'lucide-react';
import { Playlist } from '@/lib/fileScanner';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SidebarProps {
  playlists: Playlist[];
  activePlaylist: string | null;
  onSelectPlaylist: (path: string | null) => void;
  isOpen: boolean;
  totalVideos: number;
}

export function Sidebar({ playlists, activePlaylist, onSelectPlaylist, isOpen, totalVideos }: SidebarProps) {
  if (!isOpen) return null;

  return (
    <aside className="w-60 shrink-0 border-r bg-background overflow-hidden">
      <ScrollArea className="h-full">
        <div className="p-2 space-y-1">
          <button
            onClick={() => onSelectPlaylist(null)}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent",
              activePlaylist === null && "bg-accent font-medium"
            )}
          >
            <Home className="h-4 w-4 shrink-0" />
            <span className="truncate">All Videos</span>
            <span className="ml-auto text-xs text-muted-foreground">{totalVideos}</span>
          </button>

          {playlists.length > 0 && (
            <div className="pt-4 pb-1 px-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <List className="h-3 w-3" /> Playlists
              </p>
            </div>
          )}

          {playlists.map(pl => (
            <button
              key={pl.path}
              onClick={() => onSelectPlaylist(pl.path)}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent",
                activePlaylist === pl.path && "bg-accent font-medium"
              )}
            >
              <Folder className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="truncate">{pl.name}</span>
              <span className="ml-auto text-xs text-muted-foreground">{pl.videos.length}</span>
            </button>
          ))}
        </div>
      </ScrollArea>
    </aside>
  );
}
