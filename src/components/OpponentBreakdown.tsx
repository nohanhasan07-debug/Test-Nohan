import type { OpponentRecord } from '@/lib/personalStats';

interface OpponentBreakdownProps {
  opponents: OpponentRecord[];
  nameOf: (playerId: string) => string;
}

export default function OpponentBreakdown({ opponents, nameOf }: OpponentBreakdownProps) {
  if (opponents.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-maroon/30 bg-cream-dark p-8 text-center">
        <p className="font-display text-lg font-bold">Belum ada pertandingan</p>
        <p className="mt-1 text-sm text-maroon/80">Rekor melawan tiap pemain akan muncul setelah match tercatat.</p>
      </div>
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {opponents.map((opponent) => (
        <li
          key={opponent.playerId}
          className="rounded-2xl border-2 border-maroon/15 bg-white/70 p-5 shadow-sm transition hover:shadow-md"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-maroon/70">Anda vs</p>
              <p className="truncate font-display text-xl font-bold">{nameOf(opponent.playerId)}</p>
            </div>
            <p className="shrink-0 rounded-full bg-maroon px-3 py-1 text-xs font-semibold text-cream">
              {opponent.played} match
            </p>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
            <div className="rounded-xl bg-olive/10 py-2">
              <p className="font-display text-lg font-bold text-olive">{opponent.wins}</p>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-olive">Menang</p>
            </div>
            <div className="rounded-xl bg-clay/10 py-2">
              <p className="font-display text-lg font-bold text-clay">{opponent.losses}</p>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-clay">Kalah</p>
            </div>
            <div className="rounded-xl bg-maroon/5 py-2">
              <p className="font-display text-lg font-bold text-maroon">{opponent.draws}</p>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-maroon/80">Seri</p>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-baseline justify-between text-xs font-semibold text-maroon/80">
              <span>Peluang menang berikutnya</span>
              <span className="font-display text-base font-bold text-maroon-dark">{opponent.winRate}%</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-maroon/10" role="presentation">
              <div
                className="h-full rounded-full bg-gold transition-all duration-700"
                style={{ width: `${opponent.winRate}%` }}
              />
            </div>
            <p className="mt-2 text-[11px] text-maroon/70">Dihitung dari hasil pertandingan Anda melawan pemain ini.</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
