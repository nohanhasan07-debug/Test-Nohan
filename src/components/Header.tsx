import { Activity, LayoutList, LogOut, Settings } from 'lucide-react';
import ClubLogo from '@/components/ClubLogo';
import CourtLines from '@/components/CourtLines';

export type AppView = 'leaderboard' | 'performance';

interface HeaderProps {
  displayName: string;
  isMaster: boolean;
  view: AppView;
  onChangeView: (view: AppView) => void;
  onOpenSettings: () => void;
  onSignOut: () => void;
}

export default function Header({
  displayName,
  isMaster,
  view,
  onChangeView,
  onOpenSettings,
  onSignOut,
}: HeaderProps) {
  const isPerformance = view === 'performance';
  const ViewIcon = isPerformance ? LayoutList : Activity;
  return (
    <header className="relative overflow-hidden border-b-4 border-gold bg-maroon text-cream">
      <CourtLines className="text-cream/15" />
      <div className="relative mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 md:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <ClubLogo className="h-14 w-14 shrink-0 ring-2 ring-gold" />
          <div className="min-w-0">
            <p className="truncate font-display text-xl font-bold leading-tight tracking-wide md:text-2xl">
              PANIC AT THE COURT
            </p>
            <p className="text-[11px] uppercase tracking-[0.25em] text-gold-light">Tennis Club Leaderboard</p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span className="mr-1 hidden max-w-[10rem] truncate text-sm text-cream/80 md:inline">
            {displayName}
          </span>
          <button
            type="button"
            onClick={() => onChangeView(isPerformance ? 'leaderboard' : 'performance')}
            aria-pressed={isPerformance}
            className="inline-flex items-center gap-2 rounded-full border-2 border-gold/70 px-3 py-2 text-sm font-semibold text-cream transition hover:border-gold hover:bg-maroon-light focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          >
            <ViewIcon className="h-4 w-4 text-gold" aria-hidden="true" />
            <span className="hidden sm:inline">{isPerformance ? 'Klasemen' : 'Performa Saya'}</span>
          </button>
          {isMaster && (
            <button
              type="button"
              onClick={onOpenSettings}
              className="inline-flex items-center gap-2 rounded-full border-2 border-gold/70 px-3 py-2 text-sm font-semibold text-cream transition hover:border-gold hover:bg-maroon-light focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            >
              <Settings className="h-4 w-4 text-gold" aria-hidden="true" />
              <span className="hidden sm:inline">Pengaturan</span>
            </button>
          )}
          <button
            type="button"
            onClick={onSignOut}
            aria-label="Keluar"
            className="inline-flex items-center gap-2 rounded-full border-2 border-gold/70 px-3 py-2 text-sm font-semibold text-cream transition hover:border-gold hover:bg-maroon-light focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          >
            <LogOut className="h-4 w-4 text-gold" aria-hidden="true" />
            <span className="hidden sm:inline">Keluar</span>
          </button>
        </div>
      </div>
    </header>
  );
}
