import RankBadge from '@/components/RankBadge';
import type { PlayerStats } from '@/types';

interface WinRateViewProps {
  ranking: PlayerStats[];
}

export default function WinRateView({ ranking }: WinRateViewProps) {
  if (ranking.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-maroon/30 bg-cream-dark p-8 text-center">
        <p className="font-display text-lg font-bold">Belum ada data win rate</p>
        <p className="mt-1 text-sm text-maroon/80">Win rate muncul setelah pertandingan pertama tercatat.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border-2 border-maroon bg-white/70 shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="bg-maroon text-cream">
          <tr className="text-xs uppercase tracking-wider">
            <th className="px-4 py-3 font-semibold">#</th>
            <th className="px-4 py-3 font-semibold">Pemain</th>
            <th className="px-3 py-3 text-center font-semibold">MP</th>
            <th className="px-3 py-3 text-center font-semibold">Menang</th>
            <th className="px-4 py-3 text-right font-semibold">Win Rate</th>
          </tr>
        </thead>
        <tbody>
          {ranking.map((entry, index) => (
            <tr
              key={entry.playerId}
              className={`border-t border-maroon/10 transition hover:bg-maroon/5 ${index === 0 ? 'bg-gold/30' : ''}`}
            >
              <td className="px-4 py-3">
                <RankBadge rank={index + 1} />
              </td>
              <td className="px-4 py-3 font-display text-base font-bold">{entry.name}</td>
              <td className="px-3 py-3 text-center">{entry.mp}</td>
              <td className="px-3 py-3 text-center">{entry.w}</td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-3">
                  <div className="hidden h-2 w-24 overflow-hidden rounded-full bg-maroon/10 sm:block">
                    <div
                      className="h-full rounded-full bg-clay transition-all duration-700"
                      style={{ width: `${entry.winRate}%` }}
                    />
                  </div>
                  <span className="w-14 text-right font-display text-lg font-bold">{entry.winRate}%</span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
