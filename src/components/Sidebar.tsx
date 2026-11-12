import { useEffect } from 'react';
import {
  ClipboardCheck,
  History,
  LayoutDashboard,
  LogOut,
  Percent,
  PlusCircle,
  Settings,
  Swords,
  User,
  Wallet,
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
  onOpenLogMatch?: () => void;
  onOpenFinance?: () => void; // Menu Keuangan
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
  onOpenLogMatch,
  onOpenFinance,
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
      {/* 1. BACKDROP OVERLAY DI MOBILE */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/75 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* 2. SIDEBAR CONTAINER */}
      <aside
        className={`fixed inset-y-3 left-3 z-50 flex w-[85%] max-w-[320px] flex-col rounded-3xl border border-white/20 bg-gradient-to-b from-[#1E0904] via-[#2D0D06] to-[#0F0402] p-5 shadow-2xl shadow-black/90 backdrop-blur-xl transition-transform duration-300 ease-out lg:inset-y-0 lg:left-0 lg:z-30 lg:w-64 lg:rounded-none lg:border-r lg:border-y-0 lg:border-l-0 lg:border-white/10 lg:bg-[#120402]/95 lg:p-5 lg:shadow-none ${
          mobileOpen ? 'translate-x-0' : '-translate-x-[125%] lg:translate-x-0'
        }`}
      >
        {/* HEADER BRANDING */}
        <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-5">
          <div className="flex items-center gap-3">
            <ClubLogo className="h-11 w-11 shrink-0 rounded-full border border-[#FF7A45]/40 p-0.5 shadow-md" />
            <div className="flex flex-col">
              <span style={{ color: '#FFFFFF' }} className="font-serif text-2xl font-black uppercase leading-none tracking-widest">
                PATC
              </span>
              <span className="mt-1 font-sans text-[10px] font-bold uppercase tracking-[0.25em] text-[#FF7A45]">
                Tennis Club
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Tutup menu"
            style={{ color: '#FFFFFF', borderColor: 'rgba(255, 255, 255, 0.2)' }}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition hover:bg-white/10 lg:hidden"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {/* TOMBOL LOG MATCH */}
        {onOpenLogMatch && (
          <div className="pt-4 pb-2">
            <button
              type="button"
              onClick={() => choose(onOpenLogMatch)}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#B84013] to-[#FF7A45] py-2.5 px-4 text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-[#B84013]/40 transition-all hover:brightness-110 active:scale-95"
            >
              <PlusCircle className="h-4 w-4" />
              <span>+ Log Match</span>
            </button>
          </div>
        )}

        {/* LIST NAVIGASI */}
        <nav className="flex-1 overflow-y-auto py-3">
          <p className="px-3 pb-2 text-[11px] font-bold uppercase tracking-widest text-[#FF7A45]">
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
                    style={active ? { color: '#FFFFFF' } : { color: '#FDF8F5' }}
                    className={`flex w-full items-center gap-3 px-3.5 py-2.5 text-left text-xs transition-all ${
                      active
                        ? 'rounded-2xl border border-white/25 bg-gradient-to-r from-[#B84013] to-[#FF7A45] font-semibold shadow-lg shadow-[#B84013]/40 drop-shadow'
                        : 'rounded-2xl font-medium hover:bg-white/10 hover:text-white'
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

          {/* ADMIN PANEL */}
          {isMaster && (
            <>
              <p className="mt-6 px-3 pb-2 text-[11px] font-bold uppercase tracking-widest text-[#FF7A45]">
                Admin Panel
              </p>
              <ul className="flex flex-col gap-1.5">
                {/* MENU KEUANGAN KAS (BARU) */}
                {onOpenFinance && (
                  <li>
                    <button
                      type="button"
                      onClick={() => choose(onOpenFinance)}
                      style={{ color: '#4ADE80', backgroundColor: 'rgba(74, 222, 128, 0.1)', borderColor: 'rgba(74, 222, 128, 0.25)' }}
                      className="flex w-full items-center gap-3 rounded-2xl border px-3.5 py-2.5 text-left text-xs font-bold transition-all hover:bg-[#4ADE80]/20"
                    >
                      <Wallet className="h-4 w-4 shrink-0 text-[#4ADE80]" aria-hidden="true" />
                      <span className="truncate">Keuangan Kas 💰</span>
                    </button>
                  </li>
                )}

                <li>
                  <button
                    type="button"
                    onClick={() => choose(() => onChangeView('approvals'))}
                    style={view === 'approvals' ? { color: '#FFFFFF' } : { color: '#FDF8F5' }}
                    className={`flex w-full items-center gap-3 px-3.5 py-2.5 text-left text-xs transition-all ${
                      view === 'approvals'
                        ? 'rounded-2xl border border-white/25 bg-gradient-to-r from-[#B84013] to-[#FF7A45] font-semibold shadow-lg shadow-[#B84013]/40 drop-shadow'
                        : 'rounded-2xl font-medium hover:bg-white/10 hover:text-white'
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
                    style={{ color: '#FDF8F5' }}
                    className="flex w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-left text-xs font-medium transition-all hover:bg-white/10 hover:text-white"
                  >
                    <Settings className="h-4 w-4 shrink-0 text-[#FF7A45]" aria-hidden="true" />
                    <span className="truncate">Pengaturan Master</span>
                  </button>
                </li>
              </ul>
            </>
          )}
        </nav>

        {/* FOOTER USER CARD */}
        <div className="border-t border-white/10 pt-4">
          <div
            style={{ borderColor: 'rgba(255, 122, 69, 0.4)', backgroundColor: 'rgba(255, 122, 69, 0.1)' }}
            className="flex items-center gap-3 rounded-2xl border p-3 backdrop-blur-md"
          >
            <div
              style={{ borderColor: 'rgba(255, 122, 69, 0.6)', backgroundColor: 'rgba(255, 122, 69, 0.25)' }}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-[#FF7A45]"
            >
              <User className="h-4 w-4" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <p style={{ color: '#FFFFFF' }} className="truncate font-sans text-xs font-bold leading-tight">
                @{username}
              </p>
              <p style={{ color: '#FF7A45' }} className="text-[10px] uppercase tracking-wider font-extrabold mt-0.5">
                {isMaster ? 'Master Admin 👑' : 'Member'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => choose(onSignOut)}
            className="mt-3 flex w-full items-center gap-2 px-2 text-xs text-red-400 font-semibold transition-colors hover:text-red-300"
          >
            <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Keluar Akun</span>
          </button>
        </div>
      </aside>
    </>
  );
}
