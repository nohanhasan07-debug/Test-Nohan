import { Menu } from 'lucide-react';

interface TopBarProps {
  username: string;
  seasonLabel: string;
  onOpenMobileNav: () => void;
}

export default function TopBar({ username, seasonLabel, onOpenMobileNav }: TopBarProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-ink-900/95 backdrop-blur lg:bg-ink-900/80">
      <div className="flex items-center justify-between gap-3 px-4 py-3 lg:px-8">
        <button
          type="button"
          onClick={onOpenMobileNav}
          aria-label="Buka menu navigasi"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-neon/60 text-neon transition hover:bg-white/10 lg:hidden"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>

        <div className="flex items-center gap-3 lg:gap-5">
          <div className="hidden items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 sm:flex">
            <span className="h-2 w-2 rounded-full bg-neon" aria-hidden="true" />
            <span className="text-sm font-semibold text-paper">{seasonLabel}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden text-sm font-semibold text-paper/80 sm:inline">@{username}</span>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-neon/20 text-xs font-bold uppercase text-neon">
              {username.slice(0, 2)}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
