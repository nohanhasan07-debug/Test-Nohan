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
      {/* 1. BACKGROUND OVERLAY (BACKDROP BLUR) */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* 
        2. FLOATING DRAWER CONTAINER:
        - Mobile: Melayang (inset-y-3 left-3, rounded-3xl, shadow-2xl, p-5)
        - Desktop (lg:): Berubah otomatis menjadi sidebar kokoh docked di kiri layar
      */}
      <aside
        className={`fixed inset-y-3 left-3 z-50 flex w-[85%] max-w-[320px] flex-col rounded-3xl border border-white/15 bg-gradient-to-b from-[#1E0904] via-[#2D0D06] to-[#0F0402] p-5 shadow-2xl shadow-black/80 backdrop-blur-xl transition-transform duration-300 ease-out lg:inset-y-0 lg:left-0 lg:z-30 lg:w-60 lg:rounded-none lg:border-r lg:border-y-0 lg:border-l-0 lg:border-white/10 lg:bg-[#120402]/95 lg:p-4 lg:shadow-none ${
          mobileOpen ? 'translate-x-0' : '-translate-x-[125%] lg:translate-x-0'
        }`}
      >
        {/* HEADER DRAWER: LOGO & BRANDING */}
        <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-4">
          <div className="flex min-w-0 items-center gap-3">
            <ClubLogo className="h-10 w-10 shrink-0 rounded-full border border-[#FF7A45]/40 p-0.5 shadow-md" />
            <div className="min-w-0">
              <p className="truncate font-serif text-sm font-bold uppercase leading-tight tracking-wide text-[#FDF8F5]">
                Panic At The Court
              </p>
              <p className="text-[9px] uppercase tracking-[0.25em] text-[#FF7A45] font-sans">
                Tennis Club
              </p>
            </div>
          </div>

          {/* TOMBOL CLOSE (X) MELINGKAR TRANSPARAN */}
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Tutup menu"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/15 text-white/80 transition hover:bg-white/10 lg:hidden"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {/* LIST NAVIGASI */}
        <nav className="flex-1 overflow-y-auto py-4">
          {/* KATEGORI NAVIGASI */}
          <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest text-[#FF7A45]">
            Navigasi
          </p>
          <ul className="flex flex-col gap-1.5">
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
                    className={`flex w-full items-center gap-3 px-3 py-2.5 text-left text-xs transition-all ${
                      active
                        ? 'rounded-2xl border border-white/20 bg-gradient-to-r from-[#B84013] to-[#FF7A45] font-medium text-white shadow-lg shadow-[#B84013]/40'
                        : 'rounded-2xl text-white/70 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <Icon
                      className={`h-4 w-4 shrink-0 ${active ? 'text-white' : 'text-[#FF7A45]'}`}
                      aria-hidden="true"
                    />
                    <span className="truncate">{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>

          {/* KATEGORI ADMIN (KHUSUS MASTER) */}
          {isMaster && (
            <>
              <p className="mt-5 px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest text-[#FF7A45]">
                Admin
              </p>
              <ul className="flex flex-col gap-1.5">
                <li>
                  <button
                    type="button"
                    onClick={() => choose(() => onChangeView('approvals'))}
                    className={`flex w-full items-center gap-3 px-3 py-2.5 text-left text-xs transition-all ${
                      view === 'approvals'
                        ? 'rounded-2xl border border-white/20 bg-gradient-to-r from-[#B84013] to-[#FF7A45] font-medium text-white shadow-lg shadow-[#B84013]/40'
                        : 'rounded-2xl text-white/70 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <ClipboardCheck
                      className={`h-4 w-4 shrink-0 ${view === 'approvals' ? 'text-white' : 'text-[#FF7A45]'}`}
                      aria-hidden="true"
                    />
                    <span className="flex-1 truncate">Persetujuan Match</span>
                    {pendingCount > 0 && (
                      <span className="rounded-full bg-[#FF7A45] px-2 py-0.5 text-[10px] font-bold leading-none text-[#0F0402] shadow">
                        {pendingCount}
                      </span>
                    )}
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => choose(onOpenSettings)}
                    className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-xs text-white/70 transition-all hover:bg-white/5 hover:text-white"
                  >
                    <Settings className="h-4 w-4 shrink-0 text-[#FF7A45]" aria-hidden="true" />
                    <span className="truncate">Pengaturan Master</span>
                  </button>
                </li>
              </ul>
            </>
          )}
        </nav>

        {/* 4. FOOTER: CARD PROFIL USER & LOGOUT */}
        <div className="border-t border-white/10 pt-4">
          {/* Card User */}
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur-md">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#FF7A45]/30 bg-[#FF7A45]/10 text-[#FF7A45]">
              <User className="h-4 w-4" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-sans text-xs font-semibold text-[#FDF8F5]">
                @{username}
              </p>
              <p className="text-[9px] uppercase tracking-wider text-white/50 font-sans">
                {isMaster ? 'Master Admin' : 'Member'}
              </p>
            </div>
          </div>

          {/* Tombol Logout */}
          <button
            type="button"
            onClick={() => choose(onSignOut)}
            className="mt-3 flex w-full items-center gap-2 px-2 text-xs font-medium text-red-400 transition-colors hover:text-red-300"
          >
            <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Keluar Akun</span>
          </button>
        </div>
      </aside>
    </>
  );
}
