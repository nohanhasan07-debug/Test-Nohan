import { useMemo, useState } from 'react';
import { ChevronDown, Trophy } from 'lucide-react';
import { labelClass } from '@/components/formStyles';
import { formatDisplayDate } from '@/lib/date';
import { computeHeadToHead } from '@/lib/headToHead';
import type { Match, Player } from '@/types';

interface HeadToHeadViewProps {
  players: Player[];
  matches: Match[];
}

const selectClass =
  'w-full appearance-none rounded-xl border-2 border-white/20 bg-ink-900 px-4 py-2.5 pr-10 text-sm font-semibold text-paper focus:outline-none focus-visible:ring-2 focus-visible:ring-neon';

const OUTCOME_CLASS = {
  win: 'bg-neon text-ink-950',
  draw: 'bg-white/15 text-paper',
  loss: 'bg-loss text-ink-950',
} as const;

export default function HeadToHeadView({ players, matches }: HeadToHeadViewProps) {
  const [playerAId, setPlayerAId] = useState(players[0]?.id ?? '');
  const [playerBId, setPlayerBId] = useState(players[1]?.id ?? '');

  const nameOf = useMemo(() => new Map(players.map((player) => [player.id, player.name])), [players]);
  const summary = useMemo(
    () => computeHeadToHead(playerAId, playerBId, matches),
    [playerAId, playerBId, matches],
  );

  if (players.length < 2) {
    return (
      <EmptyMessage
        title="Butuh minimal dua pemain"
        text="Tambahkan pemain di Pengaturan untuk melihat rivalitas."
      />
    );
  }

  const nameA = nameOf.get(playerAId) ?? '';
  const nameB = nameOf.get(playerBId) ?? '';
  const samePlayer = playerAId === playerBId;
  const latest = summary.meetings[0];
  const teamName = (ids: string[]) => ids.map((id) => nameOf.get(id) ?? 'Pemain terhapus').join(' & ');

  const latestText = !latest
    ? null
    : latest.outcome === 'win'
      ? `Pemenang pertemuan terakhir: ${nameA}`
      : latest.outcome === 'loss'
        ? `Pemenang pertemuan terakhir: ${nameB}`
        : 'Pertemuan terakhir berakhir seri';

  return (
    <div className="flex flex-col gap-6">
      <section className="grid gap-4 sm:grid-cols-2">
        <PlayerSelect label="Pemain A" value={playerAId} players={players} onChange={setPlayerAId} />
        <PlayerSelect label="Pemain B" value={playerBId} players={players} onChange={setPlayerBId} />
      </section>

      {samePlayer ? (
        <EmptyMessage title="Pilih dua pemain yang berbeda" text="Rivalitas dihitung antara dua pemain yang berbeda." />
      ) : (
        <>
          <section className="rounded-2xl border border-white/10 bg-ink-800 p-5 shadow-lg md:p-6">
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-center">
              <div className="min-w-0">
                <p className="truncate font-display text-base font-bold md:text-lg">{nameA}</p>
                <p
                  className={`mt-2 font-display text-5xl font-bold leading-none md:text-6xl ${
                    summary.winsA > summary.winsB ? 'text-neon' : 'text-paper'
                  }`}
                >
                  {summary.winsA}
                </p>
                <p className="mt-2 text-[10px] font-semibold uppercase tracking-wider text-paper/70">Menang</p>
              </div>
              <p className="font-display text-sm font-bold uppercase tracking-[0.2em] text-paper/60">VS</p>
              <div className="min-w-0">
                <p className="truncate font-display text-base font-bold md:text-lg">{nameB}</p>
                <p
                  className={`mt-2 font-display text-5xl font-bold leading-none md:text-6xl ${
                    summary.winsB > summary.winsA ? 'text-neon' : 'text-paper'
                  }`}
                >
                  {summary.winsB}
                </p>
                <p className="mt-2 text-[10px] font-semibold uppercase tracking-wider text-paper/70">Menang</p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-3">
              <StatTile label="Seri" value={String(summary.draws)} />
              <StatTile
                label="Selisih Game"
                value={summary.gameDiff > 0 ? `+${summary.gameDiff}` : String(summary.gameDiff)}
                tone={summary.gameDiff > 0 ? 'text-neon' : summary.gameDiff < 0 ? 'text-loss' : 'text-paper'}
              />
              <StatTile label="Pertemuan" value={String(summary.meetings.length)} />
            </div>

            {latestText && (
              <div className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-neon/10 px-4 py-2.5 text-center text-sm font-semibold">
                <Trophy className="h-4 w-4 shrink-0 text-neon" aria-hidden="true" />
                <span>{latestText}</span>
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-4 font-display text-lg font-bold">Riwayat Pertemuan</h2>
            {summary.meetings.length === 0 ? (
              <EmptyMessage title="Belum pernah bertemu" text="Pertandingan di mana keduanya berhadapan akan muncul di sini." />
            ) : (
              <ul className="flex flex-col gap-3">
                {summary.meetings.map((meeting) => {
                  const { match } = meeting;
                  const outcomeText =
                    meeting.outcome === 'win' ? `${nameA} menang` : meeting.outcome === 'loss' ? `${nameB} menang` : 'Seri';
                  return (
                    <li key={match.id} className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-sm md:p-5">
                      <div className="mb-3 flex items-center justify-between gap-2 text-xs font-semibold uppercase tracking-wider text-paper/70">
                        <div className="flex items-center gap-2">
                          <span>{formatDisplayDate(match.date)}</span>
                          <span className="rounded-full bg-paper px-2 py-0.5 text-[10px] text-ink-950">
                            {match.format === 'singles' ? 'Singles' : 'Doubles'}
                          </span>
                        </div>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] ${OUTCOME_CLASS[meeting.outcome]}`}>
                          {outcomeText}
                        </span>
                      </div>
                      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                        <p className="text-left font-display text-base font-bold leading-snug md:text-lg">{nameA}</p>
                        <div className="rounded-xl border border-white/10 bg-ink-800 px-4 py-2 font-display text-xl font-bold text-paper md:text-2xl">
                          {meeting.aGames} <span className="text-neon">-</span> {meeting.bGames}
                        </div>
                        <p className="text-right font-display text-base font-bold leading-snug md:text-lg">{nameB}</p>
                      </div>
                      <p className="mt-3 text-center text-xs text-paper/60">
                        {teamName(match.teamA)} vs {teamName(match.teamB)}
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}

interface PlayerSelectProps {
  label: string;
  value: string;
  players: Player[];
  onChange: (id: string) => void;
}

function PlayerSelect({ label, value, players, onChange }: PlayerSelectProps) {
  return (
    <div>
      <span className={labelClass}>{label}</span>
      <div className="relative">
        <select value={value} onChange={(event) => onChange(event.target.value)} aria-label={label} className={selectClass}>
          {players.map((player) => (
            <option key={player.id} value={player.id}>
              {player.name}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-paper/80" aria-hidden="true" />
      </div>
    </div>
  );
}

interface StatTileProps {
  label: string;
  value: string;
  tone?: string;
}

function StatTile({ label, value, tone = 'text-paper' }: StatTileProps) {
  return (
    <div className="rounded-xl bg-white/5 px-3 py-3 text-center">
      <p className={`font-display text-xl font-bold md:text-2xl ${tone}`}>{value}</p>
      <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-paper/70">{label}</p>
    </div>
  );
}

function EmptyMessage({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-white/20 bg-white/5 p-8 text-center">
      <p className="font-display text-lg font-bold">{title}</p>
      <p className="mt-1 text-sm text-paper/70">{text}</p>
    </div>
  );
}
