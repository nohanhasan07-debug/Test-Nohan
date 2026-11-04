/*
# Automate signup player creation and protect master player deletion

1. Modified Signup Behavior
- `handle_new_club_signup()` now creates a fresh `club_players` row for every new account.
- The player name is copied exactly from the validated signup username.
- The new player is linked to the new profile through `profile_id`.
- Existing players are never silently reused during signup.

2. New Database Function
- `delete_club_player(p_player_id uuid)`: securely deletes a player only when called by a master account and only when no match history references that player.
- The function raises a safe, user-facing error when the player is still used by match history.

3. Security
- The signup trigger remains `SECURITY DEFINER` with a fixed `search_path` and cannot be called directly by anon or authenticated users.
- The delete function derives authorization from `auth.uid()` and is not callable by anonymous users.
- Direct client DELETE access to `club_players` is not granted; deletion is available only through the protected function.

4. Important Notes
- Existing player and match data is not deleted by this migration.
- Players with related match history must remain until the related history is handled.
*/

CREATE OR REPLACE FUNCTION public.handle_new_club_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_username text := NEW.raw_user_meta_data ->> 'username';
BEGIN
  IF v_username IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.profiles (id, username, display_name, role)
  VALUES (NEW.id, v_username, v_username, 'member');

  INSERT INTO public.club_players (name, profile_id)
  VALUES (v_username, NEW.id);

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.handle_new_club_signup() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.delete_club_player(p_player_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'master'
  ) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.club_matches
    WHERE p_player_id = ANY(team_a) OR p_player_id = ANY(team_b)
  ) THEN
    RAISE EXCEPTION 'player has match history';
  END IF;

  DELETE FROM public.club_players WHERE id = p_player_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'player not found';
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.delete_club_player(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_club_player(uuid) TO authenticated;
