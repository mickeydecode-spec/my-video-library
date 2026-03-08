import { Clock, Folder, FolderOpen, Grid3X3, Home, LayoutList, List, Rows3, Sparkles, Tag, Trash2 } from 'lucide-react';
import { Playlist } from '@/lib/fileScanner';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { WatchHistoryEntry } from '@/hooks/useWatchHistory';
import { SmartPlaylist } from '@/hooks/useTagManager';
import { Button } from '@/components/ui/button';
import { LayoutMode } from '@/hooks/useLayoutPreference';

interface SidebarProps {
  playlists: Playlist[];
  activePlaylist: string | null;
  onSelectPlaylist: (path: string | null) => void;
  isOpen: boolean;
  totalVideos: number;
  recentlyWatched: WatchHistoryEntry[];
  onShowHistory: () => void;
  showingHistory: boolean;
  smartPlaylists: SmartPlaylist[];
  activeSmartPlaylist: string | null;
  onSelectSmartPlaylist: (id: string | null) => void;
  onRemoveSmartPlaylist: (id: string) => void;
  layout: LayoutMode;
  onLayoutChange: (mode: LayoutMode) => void;
}

const layoutOptions: { mode: LayoutMode; icon: typeof Grid3X3; label: string }[] = [
  { mode: 'grid', icon: Grid3X3, label: 'Grid' },
  { mode: 'list', icon: LayoutList, label: 'List' },
  { mode: 'compact', icon: Rows3, label: 'Compact' },
];

export function Sidebar({
  playlists, activePlaylist, onSelectPlaylist, isOpen, totalVideos,
  recentlyWatched, onShowHistory, showingHistory,
  smartPlaylists, activeSmartPlaylist, onSelectSmartPlaylist, onRemoveSmartPlaylist,
  layout, onLayoutChange,
}: SidebarProps) {
  return (
    <aside
      className={cn(
        "shrink-0 border-r bg-background overflow-hidden transition-all duration-200",
        isOpen ? "w-60" : "w-0 border-r-0"
      )}
    >
      <ScrollArea className="h-full">
        <div className="p-2 space-y-1">
          {/* View Mode */}
          <div className="pb-1 px-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2 px-2 py-1">
              View
            </p>
            <div className="flex gap-1">
              {layoutOptions.map(({ mode, icon: Icon, label }) => (
                <Button
                  key={mode}
                  variant={layout === mode ? 'secondary' : 'ghost'}
                  size="sm"
                  className="flex-1 h-8 text-xs gap-1.5"
                  onClick={() => onLayoutChange(mode)}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </Button>
              ))}
            </div>
          </div>

          {/* All Videos */}
          <button
            onClick={() => { onSelectPlaylist(null); onSelectSmartPlaylist(null); }}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent",
              activePlaylist === null && !showingHistory && !activeSmartPlaylist && "bg-accent font-medium"
            )}
          >
            <Home className="h-4 w-4 shrink-0" />
            <span className="truncate">All Videos</span>
            <span className={cn(
              "ml-auto text-xs text-muted-foreground transition-all",
              totalVideos > 0 && "text-primary font-medium"
            )}>{totalVideos}</span>
          </button>

          {/* Empty state */}
          {totalVideos === 0 && playlists.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-6 px-3 text-center animate-in fade-in duration-300">
              <FolderOpen className="h-8 w-8 text-muted-foreground/50" />
              <p className="text-xs text-muted-foreground">Open a folder to browse videos</p>
            </div>
          )}

          {/* History */}
          {recentlyWatched.length > 0 && (
            <button
              onClick={onShowHistory}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent animate-in fade-in slide-in-from-left-2 duration-200",
                showingHistory && "bg-accent font-medium"
              )}
            >
              <Clock className="h-4 w-4 shrink-0" />
              <span className="truncate">History</span>
              <span className="ml-auto text-xs text-muted-foreground">{recentlyWatched.length}</span>
            </button>
          )}

          {/* Smart Playlists */}
          {smartPlaylists.length > 0 && (
            <>
              <div className="pt-4 pb-1 px-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="h-3 w-3" /> Smart Playlists
                </p>
              </div>
              {smartPlaylists.map(sp => (
                <div key={sp.id} className="flex items-center group animate-in fade-in slide-in-from-left-2 duration-200">
                  <button
                    onClick={() => onSelectSmartPlaylist(sp.id)}
                    className={cn(
                      "flex flex-1 items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent",
                      activeSmartPlaylist === sp.id && "bg-accent font-medium"
                    )}
                  >
                    <Tag className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="truncate">{sp.name}</span>
                  </button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100 shrink-0"
                    onClick={() => onRemoveSmartPlaylist(sp.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </>
          )}

          {/* Folder Playlists */}
          {playlists.length > 0 && (
            <div className="pt-4 pb-1 px-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <List className="h-3 w-3" /> Playlists
              </p>
            </div>
          )}

          {playlists.map((pl, i) => (
            <button
              key={pl.path}
              onClick={() => onSelectPlaylist(pl.path)}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent animate-in fade-in slide-in-from-left-2 duration-200",
                activePlaylist === pl.path && "bg-accent font-medium"
              )}
              style={{ animationDelay: `${i * 30}ms` }}
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
