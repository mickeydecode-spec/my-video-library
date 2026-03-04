import { FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  onOpenFolder: () => void;
}

export function EmptyState({ onOpenFolder }: EmptyStateProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 p-12 text-center">
      <div className="rounded-full bg-surface p-6">
        <FolderOpen className="h-12 w-12 text-muted-foreground" />
      </div>
      <div>
        <h2 className="text-2xl font-bold mb-2">Welcome to MyTube</h2>
        <p className="text-muted-foreground max-w-md">
          Your local video player. Select a folder from your PC to browse and play videos.
          Subfolders become playlists automatically.
        </p>
      </div>
      <Button onClick={onOpenFolder} size="lg" className="gap-2">
        <FolderOpen className="h-5 w-5" />
        Open Folder
      </Button>
      <div className="flex flex-wrap gap-2 justify-center mt-2">
        {['MP4', 'WebM', 'MKV', 'AVI', 'MOV', 'SRT', 'VTT'].map(fmt => (
          <span key={fmt} className="rounded-full bg-chip px-3 py-1 text-xs font-medium text-muted-foreground">
            {fmt}
          </span>
        ))}
      </div>
    </div>
  );
}
