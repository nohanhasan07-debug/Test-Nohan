import RankBadge from '@/components/RankBadge';
import type { PlayerStats } from '@/types';

interface StandingsViewProps {
  standings: PlayerStats[];
}

export default function StandingsView({ standings }: StandingsViewProps) {
  if (standings.length === 0) {
    return <EmptyMessage />;
  }

  return (
    <div>
      <ul className="flex flex-col gap-3 md:hidden">
        {standings.map((entry, index) => {
          const isTop = index === 0;
          return (
            <li
              key={entry.playerId}
              className={`flex items-center gap-4 rounded-2xl border-2 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                isTop ? 'border-gold bg-gold text-maroon-dark' : 'border-maroon/15 bg-white/70'
              }`}
            >
              <RankBadge rank={index + 1} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-lg font-bold">{entry.name}</p>
                <p className="mt-0.5 text-xs font-semibold text-maroon-dark/75">
                  {entry.mp} main · {entry.w}M {entry.d}S {entry.l}K · GD {formatGd(entry.gd)}
                </p>
              </div>
              <div className="text-right">
                <p className="font-display text-3xl font-bold leading-none">{entry.pts}</p>
                <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider">Poin</p>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="hidden overflow-hidden rounded-2xl border-2 border-maroon bg-white/70 shadow-sm md:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-maroon text-cream">
            <tr className="text-xs uppercase tracking-wider">
              <th className="px-4 py-3 font-semibold">#</th>
              <th className="px-4 py-3 font-semibold">Pemain</th>
              <th className="px-3 py-3 text-center font-semibold">MP</th>
              <th className="px-3 py-3 text-center font-semibold">W</th>
              <th className="px-3 py-3 text-center font-semibold">D</th>
              <th className="px-3 py-3 text-center font-semibold">L</th>
              <th className="px-3 py-3 text-center font-semibold">GD</th>
              <th className="px-4 py-3 text-center font-semibold">Poin</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((entry, index) => {
              const isTop = index === 0;
              return (
                <tr
                  key={entry.playerId}
                  className={`border-t border-maroon/10 transition hover:bg-maroon/5 ${
                    isTop ? 'bg-gold/30' : ''
                  }`}
                >
                  <td className="px-4 py-3">
                    <RankBadge rank={index + 1} />
                  </td>
                  <td className="px-4 py-3 font-display text-base font-bold">{entry.name}</td>
                  <td className="px-3 py-3 text-center">{entry.mp}</td>
                  <td className="px-3 py-3 text-center">{entry.w}</td>
                  <td className="px-3 py-3 text-center">{entry.d}</td>
                  <td className="px-3 py-3 text-center">{entry.l}</td>
                  <td className="px-3 py-3 text-center">{formatGd(entry.gd)}</td>
                  <td className="px-4 py-3 text-center font-display text-lg font-bold">{entry.pts}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function formatGd(gd: number) {
  return gd > 0 ? `+${gd}` : String(gd);
}

function EmptyMessage() {
  return (
    <div className="rounded-2xl border-2 border-dashed border-maroon/30 bg-cream-dark p-8 text-center">
      <p className="font-display text-lg font-bold">Belum ada pertandingan</p>
      <p className="mt-1 text-sm text-maroon-dark/75">Tekan tombol + Log Match untuk mencatat hasil pertama.</p>
    </div>
  );
}
