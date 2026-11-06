/*
# Fix sign-up failing when a player with the same name already exists

1. Problem
- The sign-up trigger always inserted a new club player named after the username.
- Player names are unique (ignoring case), so a pre-existing player such as "Andrian" made the insert fail.
- The failure rolled back the whole account creation, so users saw "Akun tidak bisa dibuat".

2. Behavior
- If a player with the same name exists and has no account, the new account is linked to that player.
- If no player with that name exists, a new player is created and linked.
- If the matching player already belongs to another account, the new account is created without a player link.

3. Security
- The function stays SECURITY DEFINER with a fixed search_path and is not callable by anon or authenticated users.

4. Notes
- No existing data is changed by this migration.
- Re-running this migration is safe.
*/

CREATE OR REPLACE FUNCTION public.handle_new_club_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_username text := NEW.raw_user_meta_data ->> 'username';
  v_player_id uuid;
  v_player_profile_id uuid;
BEGIN
  IF v_username IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.profiles (id, username, display_name, role)
  VALUES (NEW.id, v_username, v_username, 'member');

  SELECT id, profile_id INTO v_player_id, v_player_profile_id
  FROM public.club_players
  WHERE lower(name) = lower(v_username)
  LIMIT 1;

  IF NOT FOUND THEN
    INSERT INTO public.club_players (name, profile_id) VALUES (v_username, NEW.id);
  ELSIF v_player_profile_id IS NULL THEN
    UPDATE public.club_players SET profile_id = NEW.id WHERE id = v_player_id;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.handle_new_club_signup() FROM PUBLIC, anon, authenticated;
