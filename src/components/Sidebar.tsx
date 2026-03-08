import { Clock, Folder, FolderOpen, Home, List, Sparkles, Tag, Trash2 } from 'lucide-react';
import { Playlist } from '@/lib/fileScanner';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { WatchHistoryEntry } from '@/hooks/useWatchHistory';
import { SmartPlaylist } from '@/hooks/useTagManager';
import { Button } from '@/components/ui/button';
import { WebLayout } from '@/hooks/useWebLayout';
import { LayoutSelector } from '@/components/LayoutSelector';

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
  webLayout: WebLayout;
  onWebLayoutChange: (layout: WebLayout) => void;
}

export function Sidebar({
  playlists, activePlaylist, onSelectPlaylist, isOpen, totalVideos,
  recentlyWatched, onShowHistory, showingHistory,
  smartPlaylists, activeSmartPlaylist, onSelectSmartPlaylist, onRemoveSmartPlaylist,
  webLayout, onWebLayoutChange,
}: SidebarProps) {
  const isSlim = webLayout === 'twitch';
  const isHidden = webLayout === 'netflix' || webLayout === 'tiktok';

  // When layout hides sidebar, show a floating layout button
  if (isHidden) {
    return (
      <aside className="fixed bottom-4 left-4 z-50">
        <LayoutSelector current={webLayout} onChange={onWebLayoutChange} slim />
      </aside>
    );
  }

  return (
    <aside
      className={cn(
        "shrink-0 border-r bg-background overflow-hidden transition-all duration-200 flex flex-col",
        !isOpen ? "w-0 border-r-0" : isSlim ? "w-16" : "w-60"
      )}
    >
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {/* All Videos */}
          <button
            onClick={() => { onSelectPlaylist(null); onSelectSmartPlaylist(null); }}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent",
              isSlim && "justify-center px-0",
              activePlaylist === null && !showingHistory && !activeSmartPlaylist && "bg-accent font-medium"
            )}
          >
            <Home className="h-4 w-4 shrink-0" />
            {!isSlim && <span className="truncate">All Videos</span>}
            {!isSlim && (
              <span className={cn(
                "ml-auto text-xs text-muted-foreground transition-all",
                totalVideos > 0 && "text-primary font-medium"
              )}>{totalVideos}</span>
            )}
          </button>

          {/* Empty state */}
          {!isSlim && totalVideos === 0 && playlists.length === 0 && (
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
                isSlim && "justify-center px-0",
                showingHistory && "bg-accent font-medium"
              )}
            >
              <Clock className="h-4 w-4 shrink-0" />
              {!isSlim && <span className="truncate">History</span>}
              {!isSlim && <span className="ml-auto text-xs text-muted-foreground">{recentlyWatched.length}</span>}
            </button>
          )}

          {/* Smart Playlists */}
          {!isSlim && smartPlaylists.length > 0 && (
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
          {playlists.length > 0 && !isSlim && (
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
                isSlim && "justify-center px-0",
                activePlaylist === pl.path && "bg-accent font-medium"
              )}
              style={{ animationDelay: `${i * 30}ms` }}
            >
              <Folder className="h-4 w-4 shrink-0 text-muted-foreground" />
              {!isSlim && <span className="truncate">{pl.name}</span>}
              {!isSlim && <span className="ml-auto text-xs text-muted-foreground">{pl.videos.length}</span>}
            </button>
          ))}
        </div>
      </ScrollArea>

      {/* Layout selector at bottom */}
      <div className="border-t p-2">
        <LayoutSelector current={webLayout} onChange={onWebLayoutChange} slim={isSlim} />
      </div>
    </aside>
  );
}
