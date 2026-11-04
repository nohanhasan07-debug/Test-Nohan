import type { LucideIcon } from 'lucide-react';
import { History, Percent, Swords, Trophy } from 'lucide-react';
import type { LeaderboardTab } from '@/types';

const TABS: { id: LeaderboardTab; label: string; icon: LucideIcon }[] = [
  { id: 'standings', label: 'Klasemen', icon: Trophy },
  { id: 'winrate', label: 'Win Rate', icon: Percent },
  { id: 'history', label: 'Riwayat', icon: History },
  { id: 'h2h', label: 'Head to Head', icon: Swords },
];

interface TabSwitcherProps {
  tab: LeaderboardTab;
  onChange: (tab: LeaderboardTab) => void;
}

export default function TabSwitcher({ tab, onChange }: TabSwitcherProps) {
  return (
    <div
      role="tablist"
      className="flex w-full max-w-full overflow-x-auto rounded-full border-2 border-paper/30 bg-white/5 p-1 sm:w-auto"
    >
      {TABS.map(({ id, label, icon: Icon }) => {
        const active = tab === id;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(id)}
            className={`flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-2 py-1.5 text-[11px] font-semibold transition sm:gap-2 sm:px-4 sm:py-2 sm:text-sm ${
              active ? 'bg-paper text-ink-950 shadow' : 'text-paper/80 hover:bg-paper/10'
            }`}
          >
            <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden="true" />
            {label}
          </button>
        );
      })}
    </div>
  );
}
