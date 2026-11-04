import RankBadge from '@/components/RankBadge';
import { FormDots, FormLegend, HotStreakBadge } from '@/components/FormIndicators';
import type { PlayerForm } from '@/lib/form';
import type { PlayerStats } from '@/types';

interface StandingsViewProps {
  standings: PlayerStats[];
  form: Map<string, PlayerForm>;
}

export default function StandingsView({ standings, form }: StandingsViewProps) {
  if (standings.length === 0) {
    return <EmptyMessage />;
  }

  return (
    <div className="pb-24 md:pb-4">
      <FormLegend />
      <div className="overflow-x-auto rounded-2xl border-2 border-white/15 bg-white/5 shadow-sm">
        <table className="min-w-[680px] w-full text-left text-xs sm:text-sm">
          <thead className="bg-white/10 text-paper">
            <tr className="whitespace-nowrap text-[10px] uppercase tracking-wider sm:text-xs">
              <th className="px-2 py-2 font-semibold sm:px-4 sm:py-3">#</th>
              <th className="px-2 py-2 font-semibold sm:px-4 sm:py-3">Pemain</th>
              <th className="px-2 py-2 text-center font-semibold sm:px-3 sm:py-3">Form</th>
              <th className="px-2 py-2 text-center font-semibold sm:px-3 sm:py-3">MP</th>
              <th className="px-2 py-2 text-center font-semibold sm:px-3 sm:py-3">W</th>
              <th className="px-2 py-2 text-center font-semibold sm:px-3 sm:py-3">D</th>
              <th className="px-2 py-2 text-center font-semibold sm:px-3 sm:py-3">L</th>
              <th className="px-2 py-2 text-center font-semibold sm:px-3 sm:py-3">GD</th>
              <th className="px-2 py-2 text-center font-semibold sm:px-4 sm:py-3">Poin</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((entry, index) => {
              const isTop = index === 0;
              const playerForm = form.get(entry.playerId);
              return (
                <tr
                  key={entry.playerId}
                  className={`whitespace-nowrap border-t border-white/10 transition hover:bg-white/5 ${
                    isTop ? 'bg-neon/10' : ''
                  }`}
                >
                  <td className="px-2 py-2 sm:px-4 sm:py-3">
                    <RankBadge rank={index + 1} />
                  </td>
                  <td className="px-2 py-2 sm:px-4 sm:py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-display text-sm font-bold sm:text-base">{entry.name}</span>
                      <HotStreakBadge streak={playerForm?.winStreak ?? 0} />
                    </div>
                  </td>
                  <td className="px-2 py-2 sm:px-3 sm:py-3">
                    <div className="flex justify-center">
                      <FormDots recent={playerForm?.recent ?? []} />
                    </div>
                  </td>
                  <td className="px-2 py-2 text-center sm:px-3 sm:py-3">{entry.mp}</td>
                  <td className="px-2 py-2 text-center sm:px-3 sm:py-3">{entry.w}</td>
                  <td className="px-2 py-2 text-center sm:px-3 sm:py-3">{entry.d}</td>
                  <td className="px-2 py-2 text-center sm:px-3 sm:py-3">{entry.l}</td>
                  <td className="px-2 py-2 text-center sm:px-3 sm:py-3">{formatGd(entry.gd)}</td>
                  <td className="px-2 py-2 text-center font-display text-base font-bold sm:px-4 sm:py-3 sm:text-lg">
                    {entry.pts}
                  </td>
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
    <div className="rounded-2xl border-2 border-dashed border-white/20 bg-white/5 p-8 text-center">
      <p className="font-display text-lg font-bold">Belum ada pertandingan</p>
      <p className="mt-1 text-sm text-paper/70">Tekan tombol + Log Match untuk mencatat hasil pertama.</p>
    </div>
  );
}
