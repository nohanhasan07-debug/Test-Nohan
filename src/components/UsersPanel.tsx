import { useCallback, useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import CreateUserForm, { type NewAccountValues } from '@/components/CreateUserForm';
import UserRow from '@/components/UserRow';
import { primaryButtonClass } from '@/components/formStyles';
import { fetchProfiles, manageUsers, type ManageUsersRequest } from '@/lib/manageUsers';
import type { Profile } from '@/types';

interface UsersPanelProps {
  currentUserId: string;
}

type LoadState = 'loading' | 'ready' | 'error';

interface Notice {
  tone: 'ok' | 'error';
  text: string;
}

export default function UsersPanel({ currentUserId }: UsersPanelProps) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [showCreate, setShowCreate] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  const load = useCallback(async () => {
    setLoadState('loading');
    try {
      setProfiles(await fetchProfiles());
      setLoadState('ready');
    } catch {
      setLoadState('error');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const perform = async (request: ManageUsersRequest, successText: string): Promise<string | null> => {
    try {
      await manageUsers(request);
    } catch (err) {
      return err instanceof Error ? err.message : 'Permintaan gagal. Coba lagi.';
    }
    setNotice({ tone: 'ok', text: successText });
    await load();
    return null;
  };

  const handleCreate = async (values: NewAccountValues) => {
    const result = await perform(
      { action: 'create', ...values },
      `Akun @${values.username} berhasil dibuat.`,
    );
    if (!result) setShowCreate(false);
    return result;
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-bold">Akun Pengguna</h3>
          <p className="text-sm text-maroon-dark/75">
            {loadState === 'ready' ? `${profiles.length} akun terdaftar.` : 'Memuat daftar akun...'}
          </p>
        </div>
        {!showCreate && (
          <button type="button" onClick={() => { setShowCreate(true); setNotice(null); }} className={primaryButtonClass}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Tambah Akun
          </button>
        )}
      </div>

      {notice && (
        <p
          role={notice.tone === 'error' ? 'alert' : 'status'}
          className={`rounded-xl border px-4 py-3 text-sm font-semibold ${
            notice.tone === 'error' ? 'border-clay/40 bg-clay/10 text-clay' : 'border-olive/40 bg-olive/10 text-olive'
          }`}
        >
          {notice.text}
        </p>
      )}

      {showCreate && <CreateUserForm onCreate={handleCreate} onCancel={() => setShowCreate(false)} />}

      {loadState === 'error' && (
        <div className="rounded-2xl border-2 border-clay/40 bg-clay/10 p-5 text-center">
          <p className="font-semibold text-clay">Daftar akun tidak bisa dimuat.</p>
          <button type="button" onClick={load} className="mt-3 text-sm font-semibold text-maroon underline underline-offset-4">
            Coba lagi
          </button>
        </div>
      )}

      {loadState === 'ready' && (
        <ul className="flex flex-col gap-3">
          {profiles.map((profile) => {
            const isSelf = profile.id === currentUserId;
            return (
              <UserRow
                key={profile.id}
                profile={profile}
                isSelf={isSelf}
                onUpdate={(displayName, role) =>
                  perform({ action: 'update', userId: profile.id, displayName, role }, `Data @${profile.username} diperbarui.`)
                }
                onResetPassword={(password) =>
                  perform({ action: 'resetPassword', userId: profile.id, password }, `Password @${profile.username} diganti.`)
                }
                onDelete={async () => {
                  if (!window.confirm(`Hapus akun @${profile.username}? Akun ini tidak bisa masuk lagi.`)) return;
                  const deleteError = await perform({ action: 'delete', userId: profile.id }, `Akun @${profile.username} dihapus.`);
                  if (deleteError) setNotice({ tone: 'error', text: deleteError });
                }}
              />
            );
          })}
        </ul>
      )}
    </div>
  );
}
