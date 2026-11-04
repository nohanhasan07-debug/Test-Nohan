import { useEffect } from 'react';
import {
  ClipboardCheck,
  History,
  LayoutDashboard,
  LogOut,
  Percent,
  Settings,
  Swords,
  User,
  X,
  type LucideIcon,
} from 'lucide-react';
import ClubLogo from '@/components/ClubLogo';
import type { LeaderboardTab } from '@/types';

export type AppView = 'leaderboard' | 'performance' | 'approvals';

interface SidebarProps {
  username: string;
  isMaster: boolean;
  pendingCount: number;
  view: AppView;
  tab: LeaderboardTab;
  onChangeView: (view: AppView) => void;
  onChangeTab: (tab: LeaderboardTab) => void;
  onOpenSettings: () => void;
  onSignOut: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

interface NavItem {
  view: AppView;
  tab?: LeaderboardTab;
  label: string;
  icon: LucideIcon;
}

const NAV_ITEMS: NavItem[] = [
  { view: 'leaderboard', tab: 'standings', label: 'Dashboard / Klasemen', icon: LayoutDashboard },
  { view: 'leaderboard', tab: 'h2h', label: 'Head to Head Rivalry', icon: Swords },
  { view: 'leaderboard', tab: 'history', label: 'Riwayat Match', icon: History },
  { view: 'leaderboard', tab: 'winrate', label: 'Statistik & Win Rate', icon: Percent },
];

export default function Sidebar({
  username,
  isMaster,
  pendingCount,
  view,
  tab,
  onChangeView,
  onChangeTab,
  onOpenSettings,
  onSignOut,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  useEffect(() => {
    if (!mobileOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseMobile();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [mobileOpen, onCloseMobile]);

  const choose = (action: () => void) => {
    onCloseMobile();
    action();
  };

  const isItemActive = (item: NavItem) =>
    view === item.view && (item.tab ? tab === item.tab : true);

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 bg-ink-950/70 backdrop-blur-sm lg:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r-2 border-neon/30 bg-ink-900 transition-transform duration-300 lg:z-30 lg:w-60 lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between gap-2 border-b border-white/10 px-5 py-5">
          <div className="flex min-w-0 items-center gap-3">
            <ClubLogo className="h-11 w-11 shrink-0 ring-2 ring-neon" />
            <div className="min-w-0">
              <p className="truncate font-display text-base font-bold leading-tight tracking-wide">PANIC AT THE COURT</p>
              <p className="text-[10px] uppercase tracking-[0.2em] text-neon-light">Tennis Club</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Tutup menu"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/20 text-paper transition hover:bg-white/10 lg:hidden"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-paper/50">Navigasi</p>
          <ul className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => {
              const active = isItemActive(item);
              const Icon = item.icon;
              return (
                <li key={item.label}>
                  <button
                    type="button"
                    onClick={() =>
                      choose(() => {
                        onChangeView(item.view);
                        if (item.tab) onChangeTab(item.tab);
                      })
                    }
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition ${
                      active
                        ? 'bg-neon/15 text-neon-light ring-1 ring-neon/40'
                        : 'text-paper/80 hover:bg-white/10 hover:text-paper'
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0 text-neon" aria-hidden="true" />
                    <span className="truncate">{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>

          {isMaster && (
            <>
              <p className="mt-5 px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-paper/50">Admin</p>
              <ul className="flex flex-col gap-1">
                <li>
                  <button
                    type="button"
                    onClick={() => choose(() => onChangeView('approvals'))}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition ${
                      view === 'approvals'
                        ? 'bg-neon/15 text-neon-light ring-1 ring-neon/40'
                        : 'text-paper/80 hover:bg-white/10 hover:text-paper'
                    }`}
                  >
                    <ClipboardCheck className="h-4 w-4 shrink-0 text-neon" aria-hidden="true" />
                    <span className="flex-1 truncate">Persetujuan Match</span>
                    {pendingCount > 0 && (
                      <span className="rounded-full bg-neon px-2 text-[11px] font-bold leading-5 text-ink-950">
                        {pendingCount}
                      </span>
                    )}
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => choose(onOpenSettings)}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-paper/80 transition hover:bg-white/10 hover:text-paper"
                  >
                    <Settings className="h-4 w-4 shrink-0 text-neon" aria-hidden="true" />
                    <span className="truncate">Pengaturan Master</span>
                  </button>
                </li>
              </ul>
            </>
          )}
        </nav>

        <div className="border-t border-white/10 px-3 py-4">
          <div className="flex items-center gap-3 rounded-xl bg-white/5 px-3 py-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neon/20 text-neon">
              <User className="h-4 w-4" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-paper">@{username}</p>
              <p className="text-[10px] uppercase tracking-wider text-paper/60">{isMaster ? 'Master Admin' : 'Member'}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => choose(onSignOut)}
            className="mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-loss transition hover:bg-loss/10"
          >
            <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
