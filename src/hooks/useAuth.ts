import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { toProfile, type ProfileRow } from '@/lib/profiles';
import type { Profile } from '@/types';

const AUTH_EMAIL_DOMAIN = 'patc-club.com';

export type AuthState =
  | { status: 'loading' }
  | { status: 'signed-out' }
  | { status: 'signed-in'; profile: Profile | null };

const toAuthEmail = (username: string) => `${username.trim().toLowerCase()}@${AUTH_EMAIL_DOMAIN}`;

export function useAuth() {
  const [state, setState] = useState<AuthState>({ status: 'loading' });

  useEffect(() => {
    let active = true;

    const applySession = (session: Session | null) => {
      (async () => {
        if (!session) {
          if (active) setState({ status: 'signed-out' });
          return;
        }
        const { data, error } = await supabase
          .from('profiles')
          .select('id, username, display_name, role')
          .eq('id', session.user.id)
          .maybeSingle();
        if (!active) return;
        const profile = !error && data ? toProfile(data as ProfileRow) : null;
        setState({ status: 'signed-in', profile });
      })();
    };

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      applySession(session);
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (username: string, password: string): Promise<string | null> => {
    const { error } = await supabase.auth.signInWithPassword({ email: toAuthEmail(username), password });
    if (error) return 'Username atau password salah.';
    return null;
  };

  const signUp = async (username: string, password: string): Promise<string | null> => {
    const normalized = username.trim().toLowerCase();
    const { data, error } = await supabase.auth.signUp({
      email: toAuthEmail(normalized),
      password,
      options: { data: { username: normalized } },
    });
    if (error) {
      if (/already registered/i.test(error.message)) return 'Username sudah dipakai. Coba username lain.';
      return 'Akun tidak bisa dibuat. Coba lagi.';
    }
    if (!data.session) return 'Akun sudah dibuat, tetapi belum bisa langsung masuk. Hubungi master admin.';
    return null;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return { state, signIn, signUp, signOut };
}
