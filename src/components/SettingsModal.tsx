import { useEffect, useState, useMemo } from 'react';
import {
  X,
  Search,
  Shield,
  Key,
  Edit2,
  Trash2,
  Check,
  User,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface SettingsModalProps {
  currentUserId: string;
  onClose: () => void;
}

interface MemberAccount {
  id: string;
  username: string;
  display_name?: string;
  name?: string;
  role: 'master' | 'member';
  password?: string;
}

export default function SettingsModal({ currentUserId, onClose }: SettingsModalProps) {
  const [members, setMembers] = useState<MemberAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // State form edit username
  const [editingUsernameId, setEditingUsernameId] = useState<string | null>(null);
  const [newUsernameInput, setNewUsernameInput] = useState('');

  // State form reset password
  const [resettingPasswordId, setResettingPasswordId] = useState<string | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');

  // Tutup dengan tombol Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Load daftar akun dari database
  const loadMembers = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('role', { ascending: false });

      if (error) throw error;
      if (data) {
        setMembers(data as MemberAccount[]);
      }
    } catch (err: any) {
      console.error('Gagal memuat akun member:', err);
      setErrorMessage(err.message || 'Gagal memuat data akun dari database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadMembers();
  }, []);

  // Filter pencarian
  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) return members;
    const q = searchQuery.toLowerCase();
    return members.filter(
      (m) =>
        m.username.toLowerCase().includes(q) ||
        (m.display_name && m.display_name.toLowerCase().includes(q))
    );
  }, [members, searchQuery]);

  // Ubah peran akun (Master <-> Member)
  const handleToggleRole = async (member: MemberAccount) => {
    if (member.id === currentUserId) {
      alert('Anda tidak bisa mengubah peran akun Anda sendiri.');
      return;
    }

    const nextRole = member.role === 'master' ? 'member' : 'master';
    const roleLabel = nextRole === 'master' ? 'Master Admin' : 'Member Biasa';

    if (!window.confirm(`Ubah peran @${member.username} menjadi ${roleLabel}?`)) return;

    try {
      setStatusMessage(null);
      setErrorMessage(null);

      const { error } = await supabase
        .from('profiles')
        .update({ role: nextRole })
        .eq('id', member.id);

      if (error) throw error;

      setMembers((prev) =>
        prev.map((m) => (m.id === member.id ? { ...m, role: nextRole } : m))
      );
      setStatusMessage(`Berhasil mengubah @${member.username} menjadi ${roleLabel}!`);
    } catch (err: any) {
      setErrorMessage(`Gagal mengubah peran: ${err.message}`);
    }
  };

  // Simpan perubahan username
  const handleSaveUsername = async (memberId: string) => {
    const trimmed = newUsernameInput.trim().toLowerCase();
    if (!trimmed) {
      setErrorMessage('Username tidak boleh kosong.');
      return;
    }

    try {
      setStatusMessage(null);
      setErrorMessage(null);

      const { data: taken } = await supabase
        .from('profiles')
        .select('id')
        .ilike('username', trimmed)
        .neq('id', memberId)
        .maybeSingle();

      if (taken) {
        setErrorMessage('Username ini sudah dipakai oleh akun lain.');
        return;
      }

      const { error: profileErr } = await supabase
        .from('profiles')
        .update({
          username: trimmed,
          display_name: trimmed,
          name: trimmed,
        })
        .eq('id', memberId);

      if (profileErr) throw profileErr;

      await supabase
        .from('club_players')
        .update({ name: trimmed })
        .eq('profile_id', memberId);

      setMembers((prev) =>
        prev.map((m) => (m.id === memberId ? { ...m, username: trimmed, display_name: trimmed } : m))
      );

      setStatusMessage(`Username berhasil diubah menjadi @${trimmed}!`);
      setEditingUsernameId(null);
      setNewUsernameInput('');
    } catch (err: any) {
      setErrorMessage(`Gagal ganti username: ${err.message}`);
    }
  };

  // Simpan password baru
  const handleSavePassword = async (memberId: string, username: string) => {
    if (!newPasswordInput || newPasswordInput.length < 6) {
      setErrorMessage('Password baru minimal 6 karakter.');
      return;
    }

    try {
      setStatusMessage(null);
      setErrorMessage(null);

      const { error } = await supabase
        .from('profiles')
        .update({ password: newPasswordInput })
        .eq('id', memberId);

      if (error) throw error;

      setStatusMessage(`Password untuk @${username} berhasil diperbarui!`);
      setResettingPasswordId(null);
      setNewPasswordInput('');
    } catch (err: any) {
      setErrorMessage(`Gagal ubah password: ${err.message}`);
    }
  };

  // Hapus akun
  const handleDeleteMember = async (member: MemberAccount) => {
    if (member.id === currentUserId) {
      alert('Anda tidak bisa menghapus akun Anda sendiri.');
      return;
    }

    if (!window.confirm(`PERINGATAN: Hapus permanen akun @${member.username}?`)) return;

    try {
      setStatusMessage(null);
      setErrorMessage(null);

      const { error } = await supabase.from('profiles').delete().eq('id', member.id);
      if (error) throw error;

      await supabase.from('club_players').delete().eq('profile_id', member.id);

      setMembers((prev) => prev.filter((m) => m.id !== member.id));
      setStatusMessage(`Akun @${member.username} berhasil dihapus.`);
    } catch (err: any) {
      setErrorMessage(`Gagal menghapus akun: ${err.message}`);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative flex flex-col w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-3xl border border-[#FF7A45]/40 bg-[#160603] shadow-2xl shadow-black">
        {/* HEADER MODAL */}
        <div className="flex items-center justify-between border-b border-white/15 px-6 py-4 bg-[#1E0904]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FF7A45]/20 border border-[#FF7A45]/50 text-[#FF7A45]">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h2 style={{ color: '#FFFFFF' }} className="font-serif text-xl font-bold tracking-wide">
                Pengaturan Master
              </h2>
              <p style={{ color: '#FF7A45' }} className="text-[11px] font-sans font-bold uppercase tracking-widest">
                Manajemen Akun & Hak Akses
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup modal"
            style={{ color: '#FFFFFF', backgroundColor: 'rgba(255, 122, 69, 0.15)', borderColor: 'rgba(255, 122, 69, 0.4)' }}
            className="flex h-8 w-8 items-center justify-center rounded-full border transition hover:bg-[#FF7A45]/30"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* NOTIFIKASI SUKSES / ERROR */}
        <div className="px-6 pt-3 space-y-2">
          {statusMessage && (
            <div className="flex items-center gap-2 rounded-xl border border-green-500/50 bg-green-500/15 px-4 py-2.5 text-xs font-semibold text-green-300">
              <Check className="h-4 w-4 shrink-0 text-green-400" />
              <span>{statusMessage}</span>
            </div>
          )}
          {errorMessage && (
            <div className="flex items-center gap-2 rounded-xl border border-red-500/50 bg-red-500/15 px-4 py-2.5 text-xs font-semibold text-red-300">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* SEARCH BAR */}
        <div className="px-6 pt-3 pb-2 flex items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#FF7A45]" />
            <input
              type="text"
              placeholder="Cari username member..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                backgroundColor: '#0F0402',
                borderColor: 'rgba(255, 122, 69, 0.4)',
                color: '#FFFFFF',
              }}
              className="w-full rounded-2xl border py-2.5 pl-9 pr-4 text-xs font-medium outline-none focus:border-[#FF7A45]"
            />
          </div>

          <button
            type="button"
            onClick={() => void loadMembers()}
            title="Muat ulang daftar"
            style={{ color: '#FF7A45', borderColor: 'rgba(255, 122, 69, 0.4)', backgroundColor: 'rgba(255, 122, 69, 0.1)' }}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border transition hover:bg-[#FF7A45]/20"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* DAFTAR AKUN MEMBER */}
        <div className="flex-1 overflow-y-auto px-6 py-3 space-y-3">
          {loading ? (
            <div className="py-12 text-center">
              <p style={{ color: '#FF7A45' }} className="font-serif text-xs font-bold uppercase tracking-widest animate-pulse">
                Memuat Akun Member...
              </p>
            </div>
          ) : filteredMembers.length === 0 ? (
            <div style={{ color: 'rgba(253, 248, 245, 0.6)' }} className="py-12 text-center text-xs">
              Tidak ada akun member yang cocok.
            </div>
          ) : (
            filteredMembers.map((member) => {
              const isSelf = member.id === currentUserId;
              const isMaster = member.role === 'master';

              return (
                <div
                  key={member.id}
                  style={{ backgroundColor: '#1F0803', borderColor: 'rgba(255, 122, 69, 0.35)' }}
                  className="rounded-2xl border p-4 shadow-md transition-all hover:border-[#FF7A45]"
                >
                  {/* BARIS UTAMA */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        style={{ borderColor: 'rgba(255, 122, 69, 0.4)', backgroundColor: 'rgba(255, 122, 69, 0.15)' }}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-[#FF7A45]"
                      >
                        <User className="h-5 w-5" />
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span style={{ color: '#FFFFFF' }} className="font-serif text-base font-extrabold tracking-wide">
                            @{member.username}
                          </span>
                          {isSelf && (
                            <span
                              style={{ backgroundColor: '#FF7A45', color: '#0F0402' }}
                              className="rounded-full px-2 py-0.5 text-[9px] uppercase tracking-wider font-extrabold shadow"
                            >
                              ANDA
                            </span>
                          )}
                        </div>
                        <p style={{ color: 'rgba(253, 248, 245, 0.7)' }} className="text-xs font-medium">
                          {member.display_name || member.name || 'Member Klub'}
                        </p>
                      </div>
                    </div>

                    {/* STATUS ROLE & TOMBOL GANTI PERAN */}
                    <div className="flex items-center gap-2">
                      <span
                        style={
                          isMaster
                            ? { color: '#FF7A45', backgroundColor: 'rgba(255, 122, 69, 0.2)', borderColor: '#FF7A45' }
                            : { color: '#FDF8F5', backgroundColor: 'rgba(255, 255, 255, 0.12)', borderColor: 'rgba(255, 255, 255, 0.3)' }
                        }
                        className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider shadow-sm"
                      >
                        {isMaster && <Shield className="h-3.5 w-3.5" />}
                        {isMaster ? 'Master Admin' : 'Member'}
                      </span>

                      {!isSelf && (
                        <button
                          type="button"
                          onClick={() => handleToggleRole(member)}
                          style={
                            isMaster
                              ? { color: '#FDF8F5', backgroundColor: 'rgba(255, 255, 255, 0.1)', borderColor: 'rgba(255, 255, 255, 0.3)' }
                              : { background: 'linear-gradient(to right, #B84013, #FF7A45)', color: '#FFFFFF', borderColor: '#FF7A45' }
                          }
                          className="border px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider shadow-md hover:brightness-110 active:scale-95 transition-all"
                        >
                          {isMaster ? 'Turunkan ke Member' : 'Jadikan Master 👑'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* FORM EDIT USERNAME */}
                  {editingUsernameId === member.id && (
                    <div className="mt-3 pt-3 border-t border-white/10 flex flex-wrap items-center gap-2">
                      <input
                        type="text"
                        placeholder="Username baru..."
                        value={newUsernameInput}
                        onChange={(e) => setNewUsernameInput(e.target.value)}
                        style={{ backgroundColor: '#0F0402', color: '#FFFFFF', borderColor: '#FF7A45' }}
                        className="rounded-xl border px-3 py-1.5 text-xs outline-none font-semibold"
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveUsername(member.id)}
                        style={{ backgroundColor: '#FF7A45', color: '#0F0402' }}
                        className="rounded-xl px-3 py-1.5 text-xs font-bold uppercase hover:brightness-110 shadow"
                      >
                        Simpan
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingUsernameId(null);
                          setNewUsernameInput('');
                        }}
                        style={{ color: '#FDF8F5', borderColor: 'rgba(255, 255, 255, 0.3)' }}
                        className="rounded-xl border px-3 py-1.5 text-xs hover:bg-white/10"
                      >
                        Batal
                      </button>
                    </div>
                  )}

                  {/* FORM RESET PASSWORD */}
                  {resettingPasswordId === member.id && (
                    <div className="mt-3 pt-3 border-t border-white/10 flex flex-wrap items-center gap-2">
                      <input
                        type="text"
                        placeholder="Password baru (min. 6 karakter)..."
                        value={newPasswordInput}
                        onChange={(e) => setNewPasswordInput(e.target.value)}
                        style={{ backgroundColor: '#0F0402', color: '#FFFFFF', borderColor: '#FF7A45' }}
                        className="rounded-xl border px-3 py-1.5 text-xs outline-none font-semibold"
                      />
                      <button
                        type="button"
                        onClick={() => handleSavePassword(member.id, member.username)}
                        style={{ backgroundColor: '#FF7A45', color: '#0F0402' }}
                        className="rounded-xl px-3 py-1.5 text-xs font-bold uppercase hover:brightness-110 shadow"
                      >
                        Simpan Password
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setResettingPasswordId(null);
                          setNewPasswordInput('');
                        }}
                        style={{ color: '#FDF8F5', borderColor: 'rgba(255, 255, 255, 0.3)' }}
                        className="rounded-xl border px-3 py-1.5 text-xs hover:bg-white/10"
                      >
                        Batal
                      </button>
                    </div>
                  )}

                  {/* TOMBOL AKSI CEPAT */}
                  <div className="mt-3 pt-3 border-t border-white/10 flex flex-wrap items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingUsernameId(editingUsernameId === member.id ? null : member.id);
                        setNewUsernameInput(member.username);
                        setResettingPasswordId(null);
                      }}
                      style={{ color: '#FDF8F5', backgroundColor: 'rgba(255, 122, 69, 0.15)', borderColor: 'rgba(255, 122, 69, 0.35)' }}
                      className="border flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold hover:bg-[#FF7A45]/30 transition-all"
                    >
                      <Edit2 className="h-3.5 w-3.5 text-[#FF7A45]" />
                      <span>Ubah Username</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setResettingPasswordId(resettingPasswordId === member.id ? null : member.id);
                        setNewPasswordInput('');
                        setEditingUsernameId(null);
                      }}
                      style={{ color: '#FDF8F5', backgroundColor: 'rgba(255, 122, 69, 0.15)', borderColor: 'rgba(255, 122, 69, 0.35)' }}
                      className="border flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold hover:bg-[#FF7A45]/30 transition-all"
                    >
                      <Key className="h-3.5 w-3.5 text-[#FF7A45]" />
                      <span>Ubah Password</span>
                    </button>

                    {!isSelf && (
                      <button
                        type="button"
                        onClick={() => handleDeleteMember(member)}
                        style={{ color: '#FCA5A5', backgroundColor: 'rgba(239, 68, 68, 0.15)', borderColor: 'rgba(239, 68, 68, 0.4)' }}
                        className="border flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold hover:bg-red-500/30 transition-all"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-red-400" />
                        <span>Hapus</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* FOOTER MODAL (TOMBOL TUTUP DENGAN KONTRAS TINGGI) */}
        <div className="border-t border-white/15 px-6 py-4 text-right bg-[#1E0904]">
          <button
            type="button"
            onClick={onClose}
            style={{
              color: '#FFFFFF',
              backgroundColor: 'rgba(255, 122, 69, 0.25)',
              borderColor: '#FF7A45',
            }}
            className="border-2 px-7 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all hover:bg-[#FF7A45] hover:text-[#0F0402] shadow-lg active:scale-95"
          >
            TUTUP
          </button>
        </div>
      </div>
    </div>
  );
}
