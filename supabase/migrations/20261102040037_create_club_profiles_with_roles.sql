/*
# Create club profiles with master/member roles

1. New Tables
- `profiles`: one row per club login account.
  - `id` (uuid, primary key) links to the sign-in account in Supabase Auth.
  - `username` (unique, lowercase, 3-20 characters: letters, digits, dot, underscore).
  - `display_name` (1-40 characters) shown in the app.
  - `role` ('master' or 'member'). Master admins can manage accounts and settings.
  - `created_at` timestamp.

2. Security
- Row level security is enabled on `profiles`.
- Signed-in users can read their own profile.
- Master admins can read all profiles through a helper function `is_master()`.
- No client-side insert, update, or delete. Accounts and roles are changed only by the server-side `manage-users` function, so users cannot promote themselves.
- The helper function `is_master()` is not callable by anonymous visitors.

3. Notes
- Passwords are never stored here; they live in Supabase Auth.
- Deleting an account in Supabase Auth also removes its profile (cascade).
*/

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text NOT NULL UNIQUE CHECK (username ~ '^[a-z0-9_.]{3,20}$'),
  display_name text NOT NULL CHECK (char_length(display_name) BETWEEN 1 AND 40),
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('master', 'member')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_master()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'master'
  );
$$;

REVOKE EXECUTE ON FUNCTION public.is_master() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_master() TO authenticated;

GRANT SELECT ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

DROP POLICY IF EXISTS "select_own_profile" ON public.profiles;
CREATE POLICY "select_own_profile" ON public.profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "masters_select_profiles" ON public.profiles;
CREATE POLICY "masters_select_profiles" ON public.profiles FOR SELECT
  TO authenticated USING (public.is_master());

CREATE INDEX IF NOT EXISTS profiles_role_idx ON public.profiles (role);
