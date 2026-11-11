import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types';

const STORAGE_KEY = 'patc_user_session';

export type AuthState =
  | { status: 'loading' }
  | { status: 'signed-out' }
  | { status: 'signed-in'; profile: Profile };

export function useAuth() {
  const [state, setState] = useState<AuthState>({ status: 'loading' });

  useEffect(() => {
    async function loadSession() {
      const savedProfile = localStorage.getItem(STORAGE_KEY);
      if (savedProfile) {
        try {
          const parsed = JSON.parse(savedProfile);
          const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', parsed.id)
            .maybeSingle();

          if (data) {
            const profile: Profile = {
              id: data.id,
              username: data.username,
              name: data.display_name || data.name || data.username,
              displayName: data.display_name || data.name || data.username,
              role: data.role || 'master',
              photo_url: data.photo_url || null,
            } as any;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
            setState({ status: 'signed-in', profile });
            return;
          }
        } catch {
          localStorage.removeItem(STORAGE_KEY);
        }
      }
      setState({ status: 'signed-out' });
    }
    loadSession();
  }, []);

  const signIn = async (username: string, password: string): Promise<string | null> => {
    try {
      const trimmedUsername = username.trim();

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .ilike('username', trimmedUsername)
        .eq('password', password)
        .maybeSingle();

      if (error) {
        console.error('Error saat login:', error);
        return `Gagal login: ${error.message}`;
      }

      if (!data) {
        return 'Username atau password salah.';
      }

      const profile: Profile = {
        id: data.id,
        username: data.username,
        name: data.display_name || data.name || data.username,
        displayName: data.display_name || data.name || data.username,
        role: data.role || 'master',
        photo_url: data.photo_url || null,
      } as any;

      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
      setState({ status: 'signed-in', profile });
      return null;
    } catch (err: any) {
      console.error('Crash saat login:', err);
      return err?.message || 'Terjadi kesalahan sistem saat login.';
    }
  };

  const signUp = async (username: string, password: string): Promise<string | null> => {
    try {
      const trimmedUsername = username.trim();

      // 1. Cek apakah username sudah dipakai
      const { data: existing, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .ilike('username', trimmedUsername)
        .maybeSingle();

      if (checkError) {
        console.error('Error cek username:', checkError);
        return `Gagal cek username: ${checkError.message}`;
      }

      if (existing) {
        return 'Username sudah dipakai. Coba username lain.';
      }

      const isMasterUser = trimmedUsername.toLowerCase() === 'nohan';

      // Buat UUID otomatis agar Supabase tidak menolak karena kolom ID kosong
      const newUserId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : undefined;

      const newProfileData: Record<string, any> = {
        username: trimmedUsername,
        password: password,
        display_name: trimmedUsername,
        name: trimmedUsername,
        role: isMasterUser ? 'master' : 'member',
      };

      if (newUserId) {
        newProfileData.id = newUserId;
      }

      // 2. Simpan user ke tabel profiles
      const { data, error } = await supabase
        .from('profiles')
        .insert(newProfileData)
        .select()
        .single();

      if (error || !data) {
        console.error('Error dari Supabase saat buat akun:', error);
        // Tampilkan pesan error asli dari database Supabase agar langsung ketahuan jika ada settingan DB yang kurang
        return error ? `Database error: ${error.message}` : 'Akun tidak bisa dibuat. Coba lagi.';
      }

      // 3. Otomatis tambahkan juga ke tabel daftar pemain klub (club_players)
      try {
        await supabase.from('club_players').insert({
          name: trimmedUsername,
          profile_id: data.id,
        });
      } catch (playerSyncError) {
        console.warn('Catatan: Nama gagal otomatis masuk club_players:', playerSyncError);
      }

      const profile: Profile = {
        id: data.id,
        username: data.username,
        name: data.display_name || data.name || data.username,
        displayName: data.display_name || data.name || data.username,
        role: data.role || 'master',
        photo_url: data.photo_url || null,
      } as any;

      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
      setState({ status: 'signed-in', profile });
      return null;
    } catch (err: any) {
      console.error('Crash saat mendaftar:', err);
      return err?.message || 'Terjadi kesalahan sistem saat mendaftar.';
    }
  };

  const signOut = async () => {
    localStorage.removeItem(STORAGE_KEY);
    setState({ status: 'signed-out' });
  };

  return { state, signIn, signUp, signOut };
}
