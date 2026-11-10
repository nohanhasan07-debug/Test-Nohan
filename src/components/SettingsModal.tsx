import { useState, type FormEvent } from 'react';
import { X, Trash2, UserPlus, AlertTriangle } from 'lucide-react';
import { useClubData } from '@/hooks/useClubData';
import { getErrorMessage } from '@/lib/errors';
import type { Player } from '@/types';

interface SettingsModalProps {
  currentUserId: string;
  onClose: () => void;
}

export default function SettingsModal({ onClose }: SettingsModalProps) {
  const { players, savePlayer, deletePlayer } = useClubData();
  const [newPlayerName, setNewPlayerName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playerToDelete, setPlayerToDelete] = useState<Player | null>(null);

  // Tambah Pemain Baru
  const handleAddPlayer = async (e: FormEvent) => {
    e.preventDefault();
    if (!newPlayerName.trim()) return;

    setSubmitting(true);
    setError(null);
    try {
      await savePlayer({ name: newPlayerName.trim() });
      setNewPlayerName('');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  // Eksekusi Hapus Pemain
  const handleConfirmDelete = async () => {
    if (!playerToDelete) return;

    setSubmitting(true);
    setError(null);
    try {
      await deletePlayer(playerToDelete.id);
      setPlayerToDelete(null);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-[#FF7A45]/30 bg-gradient-to-b from-[#2D0D06] via-[#1E0904] to-[#0F0402] p-6 text-white shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-5">
          <h2 className="font-serif text-2xl font-bold tracking-wide text-[#FDF8F5]">
            Pengaturan Master
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 text-[#FDF8F5] transition hover:bg-white/10"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Tambah Pemain */}
        <form onSubmit={handleAddPlayer} className="mb-6">
          <label className="block text-[#FF7A45] font-bold text-[11px] tracking-widest uppercase mb-1.5">
            Tambah Pemain Baru
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Nama pemain..."
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
              style={{
                color: '#FDF8F5',
                backgroundColor: '#120402',
                borderColor: 'rgba(255, 122, 69, 0.4)',
              }}
              className="flex-1 rounded-xl border px-3 py-2 text-xs font-semibold outline-none focus:border-[#FF7A45]"
            />
            <button
              type="submit"
              disabled={submitting || !newPlayerName.trim()}
              style={{ background: 'linear-gradient(to right, #B84013, #FF7A45)' }}
              className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-white shadow hover:brightness-110 active:scale-95 disabled:opacity-50"
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>Tambah</span>
            </button>
          </div>
        </form>

        {/* List Pemain Terdaftar */}
        <div>
          <span className="block text-[#FF7A45] font-bold text-[11px] tracking-widest uppercase mb-2">
            Daftar Pemain ({players.length})
          </span>
          <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
            {players.map((player) => (
              <div
                key={player.id}
                className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 transition hover:bg-white/10"
              >
                <span className="font-serif font-bold text-[#FDF8F5] text-sm">
                  {player.name}
                </span>

                {/* Tombol Hapus Pemain dengan Ikon Sampah */}
                <button
                  type="button"
                  onClick={() => setPlayerToDelete(player)}
                  aria-label={`Hapus ${player.name}`}
                  className="rounded-lg p-1.5 text-white/50 transition hover:bg-red-500/20 hover:text-red-400"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {error && (
          <p className="mt-4 rounded-xl border border-red-500/40 bg-red-500/15 px-3 py-2 text-xs text-red-300">
            {error}
          </p>
        )}

        {/* POP-UP MODAL KONFIRMASI HAPUS PEMAIN */}
        {playerToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-3xl border border-red-500/40 bg-[#1A0A06] p-6 text-center shadow-2xl">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/15 text-red-400">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h3 className="font-serif text-lg font-bold text-[#FDF8F5]">
                Hapus Pemain?
              </h3>
              <p className="mt-1.5 text-xs text-[#FDF8F5]/70 leading-relaxed">
                Apakah Anda yakin ingin menghapus <strong>{playerToDelete.name}</strong>? Data pertandingan terkait mungkin akan terpengaruh.
              </p>
              <div className="mt-5 flex gap-2 justify-center">
                <button
                  type="button"
                  onClick={() => setPlayerToDelete(null)}
                  className="rounded-xl border border-white/20 px-4 py-2 text-xs font-semibold text-[#FDF8F5] hover:bg-white/10"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={submitting}
                  className="rounded-xl bg-red-500 px-5 py-2 text-xs font-bold text-white shadow hover:bg-red-600 disabled:opacity-50"
                >
                  {submitting ? 'Menghapus...' : 'Ya, Hapus'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
