import { useEffect, useRef, useState } from 'react';
import { Activity, ClipboardCheck, LayoutList, LogOut, Menu, Settings, X } from 'lucide-react';
import ClubLogo from '@/components/ClubLogo';
import CourtLines from '@/components/CourtLines';

export type AppView = 'leaderboard' | 'performance' | 'approvals';

interface HeaderProps {
  username: string;
  isMaster: boolean;
  pendingCount: number;
  view: AppView;
  onChangeView: (view: AppView) => void;
  onOpenSettings: () => void;
  onSignOut: () => void;
}

const menuItemClass =
  'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-paper transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-neon';

export default function Header({
  username,
  isMaster,
  pendingCount,
  view,
  onChangeView,
  onOpenSettings,
  onSignOut,
}: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const isPerformance = view === 'performance';
  const isApprovals = view === 'approvals';
  const ViewIcon = isPerformance ? LayoutList : Activity;

  useEffect(() => {
    if (!menuOpen) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuOpen]);

  const choose = (action: () => void) => {
    setMenuOpen(false);
    action();
  };

  return (
    <header className="relative border-b-4 border-neon bg-ink-900 text-paper">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <CourtLines className="text-paper/10" />
      </div>
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

        <div className="flex shrink-0 items-center gap-3">
        <span className="hidden max-w-[10rem] truncate text-sm font-semibold text-paper/80 sm:inline">@{username}</span>
        <div ref={menuRef} className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? 'Tutup menu' : 'Buka menu'}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border-2 border-neon/70 text-paper transition hover:border-neon hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-neon"
          >
            {menuOpen ? (
              <X className="h-5 w-5 text-neon" aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5 text-neon" aria-hidden="true" />
            )}
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="animate-fade-up absolute right-0 top-full z-50 mt-3 w-64 rounded-2xl border-2 border-neon/50 bg-ink-900 p-2 shadow-xl"
            >
              <p className="truncate px-3 pb-2 pt-1 text-xs font-semibold uppercase tracking-[0.2em] text-paper/70">
                @{username}
              </p>
              <div className="my-1 h-px bg-white/10" />

              <button
                type="button"
                role="menuitem"
                onClick={() => choose(() => onChangeView(isPerformance ? 'leaderboard' : 'performance'))}
                className={menuItemClass}
              >
                <ViewIcon className="h-4 w-4 text-neon" aria-hidden="true" />
                {isPerformance ? 'Klasemen' : 'Performa Saya'}
              </button>

              {isMaster && (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => choose(() => onChangeView(isApprovals ? 'leaderboard' : 'approvals'))}
                  className={menuItemClass}
                >
                  <ClipboardCheck className="h-4 w-4 text-neon" aria-hidden="true" />
                  <span className="flex-1">Persetujuan</span>
                  {pendingCount > 0 && (
                    <span className="rounded-full bg-neon px-2 text-[11px] font-bold leading-5 text-ink-950">
                      {pendingCount}
                    </span>
                  )}
                </button>
              )}

              {isMaster && (
                <button type="button" role="menuitem" onClick={() => choose(onOpenSettings)} className={menuItemClass}>
                  <Settings className="h-4 w-4 text-neon" aria-hidden="true" />
                  Pengaturan
                </button>
              )}

              <div className="my-1 h-px bg-white/10" />
              <button
                type="button"
                role="menuitem"
                onClick={() => choose(onSignOut)}
                className={`${menuItemClass} text-loss`}
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Logout
              </button>
            </div>
          )}
        </div>
        </div>
      </div>
    </header>
  );
}
