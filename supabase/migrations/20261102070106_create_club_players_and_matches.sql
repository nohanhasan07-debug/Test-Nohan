/*
# Move club players and match history into Supabase

1. New Tables
- `club_players`: the people who play in the club.
  - `id` (uuid, primary key)
  - `name` (text, 1 to 30 characters, unique ignoring case)
  - `profile_id` (uuid, optional): the login account this player belongs to. Each account can link to at most one player.
  - `created_at` (timestamp)
- `club_matches`: every recorded match.
  - `id` (uuid, primary key)
  - `match_date` (date)
  - `format` ('singles' or 'doubles')
  - `team_a`, `team_b` (uuid arrays of player ids, 1 player for singles and 2 for doubles)
  - `games_a`, `games_b` (games won by each team, 0 to 99)
  - `created_by` (the account that logged the match)
  - `created_at` (timestamp)

2. Modified Tables
- None.

3. Security
- Row level security is enabled on both tables.
- Any signed-in member can read players and matches, because the club history is shared.
- Any signed-in member can log a match, but only as themselves.
- Only master admins can add players, link players to accounts, edit matches, or delete matches.
- Anonymous visitors have no access.

4. Important Notes
- Demo players and matches are inserted once so the leaderboard is not empty. Re-running this migration does not duplicate them.
- The browser no longer stores club data locally.
*/

CREATE TABLE IF NOT EXISTS club_players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 30),
  profile_id uuid UNIQUE REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS club_players_name_key ON club_players (lower(name));

CREATE TABLE IF NOT EXISTS club_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_date date NOT NULL,
  format text NOT NULL CHECK (format IN ('singles', 'doubles')),
  team_a uuid[] NOT NULL,
  team_b uuid[] NOT NULL,
  games_a integer NOT NULL CHECK (games_a BETWEEN 0 AND 99),
  games_b integer NOT NULL CHECK (games_b BETWEEN 0 AND 99),
  created_by uuid DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (
    (format = 'singles' AND cardinality(team_a) = 1 AND cardinality(team_b) = 1)
    OR (format = 'doubles' AND cardinality(team_a) = 2 AND cardinality(team_b) = 2)
  )
);

CREATE INDEX IF NOT EXISTS club_matches_match_date_idx ON club_matches (match_date DESC);

ALTER TABLE club_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_matches ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE ON club_players TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON club_matches TO authenticated;

DROP POLICY IF EXISTS "select_club_players" ON club_players;
CREATE POLICY "select_club_players" ON club_players FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_club_players_master" ON club_players;
CREATE POLICY "insert_club_players_master" ON club_players FOR INSERT
  TO authenticated WITH CHECK (is_master());

DROP POLICY IF EXISTS "update_club_players_master" ON club_players;
CREATE POLICY "update_club_players_master" ON club_players FOR UPDATE
  TO authenticated USING (is_master()) WITH CHECK (is_master());

DROP POLICY IF EXISTS "select_club_matches" ON club_matches;
CREATE POLICY "select_club_matches" ON club_matches FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_club_matches" ON club_matches;
CREATE POLICY "insert_own_club_matches" ON club_matches FOR INSERT
  TO authenticated WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "update_club_matches_master" ON club_matches;
CREATE POLICY "update_club_matches_master" ON club_matches FOR UPDATE
  TO authenticated USING (is_master()) WITH CHECK (is_master());

DROP POLICY IF EXISTS "delete_club_matches_master" ON club_matches;
CREATE POLICY "delete_club_matches_master" ON club_matches FOR DELETE
  TO authenticated USING (is_master());

INSERT INTO club_players (id, name) VALUES
  ('5c0a1f00-0000-4000-8000-000000000001', 'Nohan'),
  ('5c0a1f00-0000-4000-8000-000000000002', 'Komang'),
  ('5c0a1f00-0000-4000-8000-000000000003', 'Erco'),
  ('5c0a1f00-0000-4000-8000-000000000004', 'Anaf')
ON CONFLICT (id) DO NOTHING;

INSERT INTO club_matches (id, match_date, format, team_a, team_b, games_a, games_b) VALUES
  ('6d0a1f00-0000-4000-8000-000000000001', '2026-03-14', 'singles',
    ARRAY['5c0a1f00-0000-4000-8000-000000000001']::uuid[], ARRAY['5c0a1f00-0000-4000-8000-000000000002']::uuid[], 6, 4),
  ('6d0a1f00-0000-4000-8000-000000000002', '2026-04-11', 'doubles',
    ARRAY['5c0a1f00-0000-4000-8000-000000000001','5c0a1f00-0000-4000-8000-000000000003']::uuid[],
    ARRAY['5c0a1f00-0000-4000-8000-000000000002','5c0a1f00-0000-4000-8000-000000000004']::uuid[], 6, 3),
  ('6d0a1f00-0000-4000-8000-000000000003', '2026-11-01', 'singles',
    ARRAY['5c0a1f00-0000-4000-8000-000000000001']::uuid[], ARRAY['5c0a1f00-0000-4000-8000-000000000003']::uuid[], 6, 2),
  ('6d0a1f00-0000-4000-8000-000000000004', '2026-11-01', 'singles',
    ARRAY['5c0a1f00-0000-4000-8000-000000000002']::uuid[], ARRAY['5c0a1f00-0000-4000-8000-000000000004']::uuid[], 4, 6),
  ('6d0a1f00-0000-4000-8000-000000000005', '2026-11-02', 'doubles',
    ARRAY['5c0a1f00-0000-4000-8000-000000000001','5c0a1f00-0000-4000-8000-000000000004']::uuid[],
    ARRAY['5c0a1f00-0000-4000-8000-000000000002','5c0a1f00-0000-4000-8000-000000000003']::uuid[], 6, 4),
  ('6d0a1f00-0000-4000-8000-000000000006', '2026-11-02', 'singles',
    ARRAY['5c0a1f00-0000-4000-8000-000000000001']::uuid[], ARRAY['5c0a1f00-0000-4000-8000-000000000002']::uuid[], 6, 1)
ON CONFLICT (id) DO NOTHING;
