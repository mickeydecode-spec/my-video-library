import { LayoutDashboard } from 'lucide-react';
import { WebLayout } from '@/hooks/useWebLayout';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

interface LayoutSelectorProps {
  current: WebLayout;
  onChange: (layout: WebLayout) => void;
  slim?: boolean;
}

const layouts: { id: WebLayout; name: string; desc: string; icon: string }[] = [
  { id: 'youtube', name: 'YouTube', desc: 'Classic grid with sidebar', icon: '▦' },
  { id: 'netflix', name: 'Netflix', desc: 'Horizontal scroll rows', icon: '▬' },
  { id: 'twitch', name: 'Twitch', desc: 'Hero + compact grid', icon: '▣' },
  { id: 'plex', name: 'Plex', desc: 'Portrait poster cards', icon: '▮' },
  { id: 'tiktok', name: 'TikTok', desc: 'Single column feed', icon: '▯' },
];

export function LayoutSelector({ current, onChange, slim }: LayoutSelectorProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size={slim ? 'icon' : 'default'} className={cn("w-full justify-start gap-3", slim && "justify-center")}>
          <LayoutDashboard className="h-4 w-4 shrink-0" />
          {!slim && <span className="truncate text-sm">Layout</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent side="right" align="end" className="w-56 p-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 pb-2">Page Layout</p>
        {layouts.map(l => (
          <button
            key={l.id}
            onClick={() => onChange(l.id)}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent",
              current === l.id && "bg-accent font-medium"
            )}
          >
            <span className="text-lg leading-none w-5 text-center">{l.icon}</span>
            <div className="flex-1 text-left">
              <p className="font-medium text-sm">{l.name}</p>
              <p className="text-[10px] text-muted-foreground">{l.desc}</p>
            </div>
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}
