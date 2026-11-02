import type { LucideIcon } from 'lucide-react';
import { History, Percent, Trophy } from 'lucide-react';
import type { LeaderboardTab } from '@/types';

const TABS: { id: LeaderboardTab; label: string; icon: LucideIcon }[] = [
  { id: 'standings', label: 'Klasemen', icon: Trophy },
  { id: 'winrate', label: 'Win Rate', icon: Percent },
  { id: 'history', label: 'Riwayat', icon: History },
];

interface TabSwitcherProps {
  tab: LeaderboardTab;
  onChange: (tab: LeaderboardTab) => void;
}

export default function TabSwitcher({ tab, onChange }: TabSwitcherProps) {
  return (
    <div role="tablist" className="inline-flex w-full rounded-full border-2 border-paper/30 bg-white/5 p-1 sm:w-auto">
      {TABS.map(({ id, label, icon: Icon }) => {
        const active = tab === id;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(id)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition sm:flex-none ${
              active ? 'bg-paper text-ink-950 shadow' : 'text-paper/80 hover:bg-paper/10'
            }`}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            {label}
          </button>
        );
      })}
    </div>
  );
}
