/*
# Require master approval for member-submitted matches

1. Modified Tables
- `club_matches`: new column `approval_status` ('pending', 'approved', 'rejected').
  - Existing matches are marked 'approved' so the leaderboard keeps its history.
  - New rows default to 'pending'.

2. Security
- Members can log matches only as pending, or as approved when they are master admins.
- Everyone sees approved matches. Members also see their own pending and rejected submissions. Master admins see all matches.
- Editing and deleting stay master-only (existing policies).

3. Important Notes
- Stats and leaderboards should count only approved matches. The browser filters for this.
- Re-running this migration is safe.
*/

ALTER TABLE club_matches ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'approved';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'club_matches_approval_status_check'
  ) THEN
    ALTER TABLE club_matches ADD CONSTRAINT club_matches_approval_status_check
      CHECK (approval_status IN ('pending', 'approved', 'rejected'));
  END IF;
END $$;

ALTER TABLE club_matches ALTER COLUMN approval_status SET DEFAULT 'pending';

CREATE INDEX IF NOT EXISTS club_matches_approval_status_idx ON club_matches (approval_status);

DROP POLICY IF EXISTS "select_club_matches" ON club_matches;
CREATE POLICY "select_club_matches" ON club_matches FOR SELECT
  TO authenticated
  USING (approval_status = 'approved' OR created_by = auth.uid() OR is_master());

DROP POLICY IF EXISTS "insert_own_club_matches" ON club_matches;
CREATE POLICY "insert_own_club_matches" ON club_matches FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND (approval_status = 'pending' OR (approval_status = 'approved' AND is_master()))
  );
