import type { AccountRole, Profile } from '@/types';

export interface ProfileRow {
  id: string;
  username: string;
  display_name: string;
  role: AccountRole;
}

export function toProfile(row: ProfileRow): Profile {
  return { id: row.id, username: row.username, displayName: row.display_name, role: row.role };
}
