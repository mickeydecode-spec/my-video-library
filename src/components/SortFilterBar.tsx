import { ArrowDownAZ, ArrowUpAZ, Clock, Film, Filter, MonitorPlay, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

export type SortField = 'name' | 'duration' | 'size' | 'format';
export type SortDirection = 'asc' | 'desc';

export interface FilterState {
  formats: string[];
  durationRange: 'all' | 'short' | 'medium' | 'long'; // short <5m, medium 5-30m, long >30m
  tags: string[];
}

interface SortFilterBarProps {
  sortField: SortField;
  sortDirection: SortDirection;
  onSortChange: (field: SortField, direction: SortDirection) => void;
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  availableFormats: string[];
  availableTags: string[];
  totalCount: number;
  filteredCount: number;
}

export function SortFilterBar({
  sortField,
  sortDirection,
  onSortChange,
  filters,
  onFiltersChange,
  availableFormats,
  availableTags,
  totalCount,
  filteredCount,
}: SortFilterBarProps) {
  const hasActiveFilters =
    filters.formats.length > 0 || filters.durationRange !== 'all' || filters.tags.length > 0;

  const toggleFormat = (fmt: string) => {
    const newFormats = filters.formats.includes(fmt)
      ? filters.formats.filter(f => f !== fmt)
      : [...filters.formats, fmt];
    onFiltersChange({ ...filters, formats: newFormats });
  };

  const toggleTag = (tag: string) => {
    const newTags = filters.tags.includes(tag)
      ? filters.tags.filter(t => t !== tag)
      : [...filters.tags, tag];
    onFiltersChange({ ...filters, tags: newTags });
  };

  const clearFilters = () => {
    onFiltersChange({ formats: [], durationRange: 'all', tags: [] });
  };

  return (
    <div className="flex items-center gap-2 px-4 py-2 border-b flex-wrap">
      {/* Sort */}
      <Select
        value={`${sortField}-${sortDirection}`}
        onValueChange={(val) => {
          const [field, dir] = val.split('-') as [SortField, SortDirection];
          onSortChange(field, dir);
        }}
      >
        <SelectTrigger className="w-[160px] h-8 text-xs">
          <SelectValue placeholder="Sort by..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="name-asc">Name A→Z</SelectItem>
          <SelectItem value="name-desc">Name Z→A</SelectItem>
          <SelectItem value="duration-asc">Duration ↑</SelectItem>
          <SelectItem value="duration-desc">Duration ↓</SelectItem>
          <SelectItem value="size-asc">Size ↑</SelectItem>
          <SelectItem value="size-desc">Size ↓</SelectItem>
          <SelectItem value="format-asc">Format A→Z</SelectItem>
        </SelectContent>
      </Select>

      {/* Filter dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 gap-1 text-xs">
            <Filter className="h-3.5 w-3.5" />
            Filters
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
                {filters.formats.length + (filters.durationRange !== 'all' ? 1 : 0) + filters.tags.length}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          {availableFormats.length > 0 && (
            <>
              <DropdownMenuLabel className="text-xs">Format</DropdownMenuLabel>
              {availableFormats.map(fmt => (
                <DropdownMenuCheckboxItem
                  key={fmt}
                  checked={filters.formats.includes(fmt)}
                  onCheckedChange={() => toggleFormat(fmt)}
                  className="text-xs"
                >
                  {fmt.toUpperCase()}
                </DropdownMenuCheckboxItem>
              ))}
              <DropdownMenuSeparator />
            </>
          )}

          <DropdownMenuLabel className="text-xs">Duration</DropdownMenuLabel>
          {(['all', 'short', 'medium', 'long'] as const).map(range => (
            <DropdownMenuCheckboxItem
              key={range}
              checked={filters.durationRange === range}
              onCheckedChange={() => onFiltersChange({ ...filters, durationRange: range })}
              className="text-xs"
            >
              {range === 'all' && 'All durations'}
              {range === 'short' && '< 5 minutes'}
              {range === 'medium' && '5 – 30 minutes'}
              {range === 'long' && '> 30 minutes'}
            </DropdownMenuCheckboxItem>
          ))}

          {availableTags.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs">Tags</DropdownMenuLabel>
              {availableTags.map(tag => (
                <DropdownMenuCheckboxItem
                  key={tag}
                  checked={filters.tags.includes(tag)}
                  onCheckedChange={() => toggleTag(tag)}
                  className="text-xs"
                >
                  {tag}
                </DropdownMenuCheckboxItem>
              ))}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {hasActiveFilters && (
        <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs" onClick={clearFilters}>
          <X className="h-3.5 w-3.5" /> Clear
        </Button>
      )}

      <span className="ml-auto text-xs text-muted-foreground">
        {filteredCount === totalCount
          ? `${totalCount} videos`
          : `${filteredCount} of ${totalCount} videos`}
      </span>
    </div>
  );
}
