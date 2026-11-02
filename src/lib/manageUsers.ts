import { FunctionsHttpError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { AccountRole, Profile } from '@/types';
import { toProfile, type ProfileRow } from '@/lib/profiles';

export type ManageUsersRequest =
  | { action: 'create'; username: string; password: string; displayName: string; role: AccountRole }
  | { action: 'resetPassword'; userId: string; password: string }
  | { action: 'update'; userId: string; displayName: string; role: AccountRole }
  | { action: 'delete'; userId: string };

const FALLBACK_ERROR = 'Permintaan gagal. Coba lagi.';

export async function manageUsers(request: ManageUsersRequest): Promise<void> {
  const { data, error } = await supabase.functions.invoke<{ ok?: boolean; error?: string }>('manage-users', {
    body: request,
  });

  if (error) {
    let message = FALLBACK_ERROR;
    if (error instanceof FunctionsHttpError) {
      try {
        const body = (await error.context.json()) as { error?: unknown };
        if (typeof body.error === 'string') message = body.error;
      } catch {
        message = FALLBACK_ERROR;
      }
    }
    throw new Error(message);
  }

  if (!data?.ok) throw new Error(data?.error ?? FALLBACK_ERROR);
}

export async function fetchProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, display_name, role')
    .order('created_at', { ascending: true });
  if (error || !data) throw new Error('Daftar pengguna tidak bisa dimuat.');
  return data.map((row) => toProfile(row as ProfileRow));
}
