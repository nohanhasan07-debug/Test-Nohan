/*
# Restrict club table privileges to what the app uses

1. Modified Tables
- `club_players` and `club_matches`: the default Supabase grants gave anonymous visitors and signed-in users every privilege. This migration removes them.

2. Security
- Anonymous visitors (anon) get no privileges on either table.
- Signed-in users get SELECT on both tables, INSERT and UPDATE on `club_players`, and SELECT, INSERT, UPDATE and DELETE on `club_matches`.
- Row level security policies still decide which rows each signed-in user can change.

3. Important Notes
- No data is changed. Only privileges are adjusted.
*/

REVOKE ALL ON club_players FROM anon, authenticated;
REVOKE ALL ON club_matches FROM anon, authenticated;

GRANT SELECT, INSERT, UPDATE ON club_players TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON club_matches TO authenticated;
