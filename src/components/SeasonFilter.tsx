import { ChevronDown } from 'lucide-react';
import { getSeasonLabel } from '@/lib/date';

export type SeasonMode = 'active' | 'archive' | 'all';

interface SeasonFilterProps {
  mode: SeasonMode;
  onModeChange: (mode: SeasonMode) => void;
  activeKey: string;
  archiveKey: string;
  archiveSeasons: string[];
  onArchiveChange: (key: string) => void;
}

const selectClass =
  'w-full appearance-none rounded-full border-2 border-maroon bg-cream px-4 py-2 pr-10 text-sm font-semibold text-maroon-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-gold sm:w-auto';

export default function SeasonFilter({
  mode,
  onModeChange,
  activeKey,
  archiveKey,
  archiveSeasons,
  onArchiveChange,
}: SeasonFilterProps) {
  return (
    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
      <div className="relative">
        <select
          aria-label="Pilih season"
          value={mode}
          onChange={(event) => onModeChange(event.target.value as SeasonMode)}
          className={selectClass}
        >
          <option value="active">Season Aktif ({getSeasonLabel(activeKey)})</option>
          <option value="archive">Hall of Fame (Arsip)</option>
          <option value="all">All-Time</option>
        </select>
        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-maroon" aria-hidden="true" />
      </div>

      {mode === 'archive' &&
        (archiveSeasons.length > 0 ? (
          <div className="relative">
            <select
              aria-label="Pilih arsip season"
              value={archiveKey}
              onChange={(event) => onArchiveChange(event.target.value)}
              className={selectClass}
            >
              {archiveSeasons.map((key) => (
                <option key={key} value={key}>
                  {getSeasonLabel(key)}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-maroon" aria-hidden="true" />
          </div>
        ) : (
          <p className="text-sm text-maroon-dark/75">Belum ada arsip season.</p>
        ))}
    </div>
  );
}
