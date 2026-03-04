import { Moon, Palette, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export type ThemeMode = 'dark' | 'light';
export type ThemePreset = 'youtube' | 'netflix' | 'plex';

interface ThemeSelectorProps {
  mode: ThemeMode;
  preset: ThemePreset;
  onModeChange: (mode: ThemeMode) => void;
  onPresetChange: (preset: ThemePreset) => void;
}

export function ThemeSelector({ mode, preset, onModeChange, onPresetChange }: ThemeSelectorProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="shrink-0">
          <Palette className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuLabel className="text-xs">Mode</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={mode} onValueChange={(v) => onModeChange(v as ThemeMode)}>
          <DropdownMenuRadioItem value="dark" className="text-xs gap-2">
            <Moon className="h-3.5 w-3.5" /> Dark
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="light" className="text-xs gap-2">
            <Sun className="h-3.5 w-3.5" /> Light
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs">Theme</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={preset} onValueChange={(v) => onPresetChange(v as ThemePreset)}>
          <DropdownMenuRadioItem value="youtube" className="text-xs">YouTube</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="netflix" className="text-xs">Netflix</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="plex" className="text-xs">Plex</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
