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

  // Load session dari LocalStorage saat web dibuka
  useEffect(() => {
    const savedProfile = localStorage.getItem(STORAGE_KEY);
    if (savedProfile) {
      try {
        const profile = JSON.parse(savedProfile);
        setState({ status: 'signed-in', profile });
      } catch {
        localStorage.removeItem(STORAGE_KEY);
        setState({ status: 'signed-out' });
      }
    } else {
      setState({ status: 'signed-out' });
    }
  }, []);

  // 1. LOGIN (Cek Username & Password murni dari tabel profiles)
  const signIn = async (username: string, password: string): Promise<string | null> => {
    try {
      const trimmedUsername = username.trim();

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .ilike('username', trimmedUsername)
        .eq('password', password)
        .maybeSingle();

      if (error || !data) {
        return 'Username atau password salah.';
      }

      const profile: Profile = {
        id: data.id,
        username: data.username,
        name: data.display_name || data.name || data.username,
        role: data.role || 'member',
        photo_url: data.photo_url || null,
      } as any;

      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
      setState({ status: 'signed-in', profile });
      return null;
    } catch {
      return 'Terjadi kesalahan sistem saat login.';
    }
  };

  // 2. SIGN UP (Simpan Username & Password murni ke tabel profiles)
  const signUp = async (username: string, password: string): Promise<string | null> => {
    try {
      const trimmedUsername = username.trim();

      // Cek ketersediaan username
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .ilike('username', trimmedUsername)
        .maybeSingle();

      if (existing) {
        return 'Username sudah dipakai. Coba username lain.';
      }

      // Buat akun baru langsung ke tabel profiles
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          username: trimmedUsername,
          password: password,
          display_name: trimmedUsername,
          name: trimmedUsername,
          role: 'member',
        })
        .select()
        .single();

      if (error || !data) {
        return 'Akun tidak bisa dibuat. Coba lagi.';
      }

      const profile: Profile = {
        id: data.id,
        username: data.username,
        name: data.display_name || data.name || data.username,
        role: data.role || 'member',
        photo_url: data.photo_url || null,
      } as any;

      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
      setState({ status: 'signed-in', profile });
      return null;
    } catch {
      return 'Terjadi kesalahan sistem saat mendaftar.';
    }
  };

  // 3. LOG OUT
  const signOut = async () => {
    localStorage.removeItem(STORAGE_KEY);
    setState({ status: 'signed-out' });
  };

  return { state, signIn, signUp, signOut };
}
