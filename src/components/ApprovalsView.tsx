import { useEffect, useState } from 'react';
import { Check, X } from 'lucide-react';
import { formatDisplayDate } from '@/lib/date';
import { getErrorMessage } from '@/lib/errors';
import { fetchProfiles } from '@/lib/manageUsers';
import type { Match } from '@/types';

interface ApprovalsViewProps {
  matches: Match[];
  playerNames: Map<string, string>;
  onReview: (matchId: string, status: 'approved' | 'rejected') => Promise<void>;
}

export default function ApprovalsView({ matches, playerNames, onReview }: ApprovalsViewProps) {
  const [submitterNames, setSubmitterNames] = useState<Map<string, string>>(new Map());
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    // Master-only query; members cannot read other accounts.
    fetchProfiles()
      .then((profiles) => {
        if (active) setSubmitterNames(new Map(profiles.map((profile) => [profile.id, profile.displayName])));
      })
      .catch(() => {
        if (active) setError('Nama pengaju tidak bisa dimuat. Pertandingan tetap bisa diperiksa.');
      });
    return () => {
      active = false;
    };
  }, []);

  const nameOf = (id: string) => playerNames.get(id) ?? 'Pemain terhapus';
  const teamNames = (ids: string[]) => ids.map(nameOf).join(' & ');

  const review = async (match: Match, status: 'approved' | 'rejected') => {
    if (status === 'rejected' && !window.confirm('Tolak pertandingan ini? Pertandingan tidak akan masuk klasemen.')) {
      return;
    }
    setBusyId(match.id);
    setError(null);
    try {
      await onReview(match.id, status);
    } catch (cause) {
      setError(getErrorMessage(cause));
    } finally {
      setBusyId(null);
    }
  };

  const sorted = [...matches].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <section className="flex flex-col gap-6">
      <div>
        <p className="font-display text-2xl font-bold leading-tight">Menunggu Persetujuan</p>
        <p className="mt-1 text-sm text-paper/70">
          Periksa skor yang diinput member. Pertandingan yang disetujui akan masuk klasemen.
        </p>
      </div>

      {error && (
        <p role="alert" className="rounded-xl border border-loss/40 bg-loss/10 px-4 py-3 text-sm font-semibold text-loss">
          {error}
        </p>
      )}

      {sorted.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-white/20 bg-white/5 p-8 text-center">
          <p className="font-display text-lg font-bold">Tidak ada yang menunggu persetujuan</p>
          <p className="mt-1 text-sm text-paper/70">Semua input member sudah diperiksa.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-4">
          {sorted.map((match) => {
            const busy = busyId === match.id;
            return (
              <li key={match.id} className="rounded-2xl border-2 border-white/10 bg-white/5 p-4 shadow-sm md:p-5">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs font-semibold uppercase tracking-wider text-paper/70">
                  <div className="flex items-center gap-2">
                    <span>{formatDisplayDate(match.date)}</span>
                    <span className="rounded-full bg-paper px-2 py-0.5 text-[10px] text-ink-950">
                      {match.format === 'singles' ? 'Singles' : 'Doubles'}
                    </span>
                  </div>
                  <span className="normal-case tracking-normal text-paper/70">
                    Diajukan oleh {submitterNames.get(match.createdBy ?? '') ?? 'anggota klub'}
                  </span>
                </div>

                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                  <p className="text-left font-display text-base leading-snug md:text-lg">{teamNames(match.teamA)}</p>
                  <div className="rounded-xl border border-white/10 bg-ink-800 px-4 py-2 font-display text-xl font-bold text-paper md:text-2xl">
                    {match.gamesA} <span className="text-neon">-</span> {match.gamesB}
                  </div>
                  <p className="text-right font-display text-base leading-snug md:text-lg">{teamNames(match.teamB)}</p>
                </div>

                <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void review(match, 'rejected')}
                    className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-loss/60 px-5 py-2 text-sm font-semibold text-loss transition hover:bg-loss/10 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                    Tolak
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void review(match, 'approved')}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-neon px-5 py-2 text-sm font-semibold text-ink-950 shadow transition hover:-translate-y-0.5 hover:bg-neon-light active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Check className="h-4 w-4" aria-hidden="true" />
                    {busy ? 'Menyimpan...' : 'Setujui'}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
