import { Activity, ClipboardCheck, LayoutList, LogOut, Settings } from 'lucide-react';
import ClubLogo from '@/components/ClubLogo';
import CourtLines from '@/components/CourtLines';

export type AppView = 'leaderboard' | 'performance' | 'approvals';

interface HeaderProps {
  displayName: string;
  isMaster: boolean;
  pendingCount: number;
  view: AppView;
  onChangeView: (view: AppView) => void;
  onOpenSettings: () => void;
  onSignOut: () => void;
}

export default function Header({
  displayName,
  isMaster,
  pendingCount,
  view,
  onChangeView,
  onOpenSettings,
  onSignOut,
}: HeaderProps) {
  const isPerformance = view === 'performance';
  const isApprovals = view === 'approvals';
  const ViewIcon = isPerformance ? LayoutList : Activity;
  return (
    <header className="relative overflow-hidden border-b-4 border-neon bg-ink-900 text-paper">
      <CourtLines className="text-paper/10" />
      <div className="relative mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 md:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <ClubLogo className="h-14 w-14 shrink-0 ring-2 ring-neon" />
          <div className="min-w-0">
            <p className="truncate font-display text-xl font-bold leading-tight tracking-wide md:text-2xl">
              PANIC AT THE COURT
            </p>
            <p className="text-[11px] uppercase tracking-[0.25em] text-neon-light">Tennis Club Leaderboard</p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span className="mr-1 hidden max-w-[10rem] truncate text-sm text-paper/80 md:inline">
            {displayName}
          </span>
          <button
            type="button"
            onClick={() => onChangeView(isPerformance ? 'leaderboard' : 'performance')}
            aria-pressed={isPerformance}
            className="inline-flex items-center gap-2 rounded-full border-2 border-neon/70 px-3 py-2 text-sm font-semibold text-paper transition hover:border-neon hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-neon"
          >
            <ViewIcon className="h-4 w-4 text-neon" aria-hidden="true" />
            <span className="hidden sm:inline">{isPerformance ? 'Klasemen' : 'Performa Saya'}</span>
          </button>
          {isMaster && (
            <button
              type="button"
              onClick={() => onChangeView(isApprovals ? 'leaderboard' : 'approvals')}
              aria-pressed={isApprovals}
              className="inline-flex items-center gap-2 rounded-full border-2 border-neon/70 px-3 py-2 text-sm font-semibold text-paper transition hover:border-neon hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-neon"
            >
              <ClipboardCheck className="h-4 w-4 text-neon" aria-hidden="true" />
              <span className="hidden sm:inline">Persetujuan</span>
              {pendingCount > 0 && (
                <span className="rounded-full bg-neon px-1.5 text-[11px] font-bold leading-5 text-ink-950">
                  {pendingCount}
                </span>
              )}
            </button>
          )}
          {isMaster && (
            <button
              type="button"
              onClick={onOpenSettings}
              className="inline-flex items-center gap-2 rounded-full border-2 border-neon/70 px-3 py-2 text-sm font-semibold text-paper transition hover:border-neon hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-neon"
            >
              <Settings className="h-4 w-4 text-neon" aria-hidden="true" />
              <span className="hidden sm:inline">Pengaturan</span>
            </button>
          )}
          <button
            type="button"
            onClick={onSignOut}
            aria-label="Keluar"
            className="inline-flex items-center gap-2 rounded-full border-2 border-neon/70 px-3 py-2 text-sm font-semibold text-paper transition hover:border-neon hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-neon"
          >
            <LogOut className="h-4 w-4 text-neon" aria-hidden="true" />
            <span className="hidden sm:inline">Keluar</span>
          </button>
        </div>
      </div>
    </header>
  );
}
