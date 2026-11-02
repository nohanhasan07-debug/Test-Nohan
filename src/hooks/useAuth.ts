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
    const email = `${username.trim().toLowerCase()}@${AUTH_EMAIL_DOMAIN}`;
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return 'Username atau password salah.';
    return null;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return { state, signIn, signOut };
}
