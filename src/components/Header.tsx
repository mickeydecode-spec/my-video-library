import { Download, FolderOpen, Grid3X3, LayoutList, Menu, Mic, MicOff, Search, Square, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { ThemeSelector, ThemeMode, ThemePreset } from '@/components/ThemeSelector';
import { LayoutMode } from '@/hooks/useLayoutPreference';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface HeaderProps {
  onOpenFolder: () => void;
  onToggleSidebar: () => void;
  onSearch: (query: string) => void;
  // Theme
  themeMode: ThemeMode;
  themePreset: ThemePreset;
  onThemeModeChange: (mode: ThemeMode) => void;
  onThemePresetChange: (preset: ThemePreset) => void;
  // Layout
  layout: LayoutMode;
  onLayoutChange: (layout: LayoutMode) => void;
  // Voice
  voiceSupported?: boolean;
  voiceListening?: boolean;
  onVoiceToggle?: () => void;
  // Export/Import
  onExport?: () => void;
  onImport?: () => void;
}

export function Header({
  onOpenFolder, onToggleSidebar, onSearch,
  themeMode, themePreset, onThemeModeChange, onThemePresetChange,
  layout, onLayoutChange,
  voiceSupported, voiceListening, onVoiceToggle,
  onExport, onImport,
}: HeaderProps) {
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
          className="rounded-r-none border-r-0"
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

      {/* Voice control */}
      {voiceSupported && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={voiceListening ? "destructive" : "ghost"}
              size="icon"
              onClick={onVoiceToggle}
              className="shrink-0"
            >
              {voiceListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {voiceListening ? 'Stop listening' : 'Voice commands: play, pause, next, search...'}
          </TooltipContent>
        </Tooltip>
      )}

      {/* Layout toggle */}
      <div className="hidden sm:flex items-center border rounded-md">
        <Button
          variant={layout === 'grid' ? 'secondary' : 'ghost'}
          size="icon"
          className="h-8 w-8 rounded-r-none"
          onClick={() => onLayoutChange('grid')}
        >
          <Grid3X3 className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant={layout === 'list' ? 'secondary' : 'ghost'}
          size="icon"
          className="h-8 w-8 rounded-none border-x"
          onClick={() => onLayoutChange('list')}
        >
          <LayoutList className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant={layout === 'compact' ? 'secondary' : 'ghost'}
          size="icon"
          className="h-8 w-8 rounded-l-none"
          onClick={() => onLayoutChange('compact')}
        >
          <Square className="h-3.5 w-3.5" />
        </Button>
      </div>

      <ThemeSelector
        mode={themeMode}
        preset={themePreset}
        onModeChange={onThemeModeChange}
        onPresetChange={onThemePresetChange}
      />

      {/* Export/Import */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" onClick={onExport} className="shrink-0 hidden sm:flex">
            <Download className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Export data</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" onClick={onImport} className="shrink-0 hidden sm:flex">
            <Upload className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Import data</TooltipContent>
      </Tooltip>

      <Button onClick={onOpenFolder} variant="ghost" size="sm" className="ml-2 gap-2 shrink-0">
        <FolderOpen className="h-4 w-4" />
        <span className="hidden sm:inline">Open Folder</span>
      </Button>
    </header>
  );
}
