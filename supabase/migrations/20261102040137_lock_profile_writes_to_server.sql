/*
# Lock profile writes to the server

1. Modified Tables
- `profiles`: removes the default table-wide permissions that Supabase grants to the anonymous and signed-in roles.

2. Security
- Anonymous visitors get no access to `profiles`.
- Signed-in users keep read-only access, limited by the existing row policies (own profile, or all profiles for master admins).
- Insert, update, and delete remain available only to the server-side account manager, so roles cannot be changed from the browser.

3. Notes
- Existing data is untouched.
*/

REVOKE ALL ON public.profiles FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.profiles FROM authenticated;
GRANT SELECT ON public.profiles TO authenticated;
