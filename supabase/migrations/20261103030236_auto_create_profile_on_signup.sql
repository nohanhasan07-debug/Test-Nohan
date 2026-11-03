/*
# Create member profile and club player automatically on sign-up

1. Behavior
- When someone signs up from the app with a username, a `profiles` row is created with role 'member'.
- The new account is linked to a club player with the same name (ignoring case) if that player has no account yet.
- If no such player exists, a new player with that name is created.
- Accounts created by the master admin tool are not affected, because that tool creates the profile itself.

2. Security
- The trigger function runs with the owner's rights so it can write profiles and players during sign-up.
- Role is always set to 'member' here, so sign-up can never create a master admin.
- The function is not callable by anonymous or signed-in users directly.

3. Notes
- If a linked player already belongs to another account, the new account is created without a player link.
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

DROP TRIGGER IF EXISTS on_auth_user_created_club ON auth.users;
CREATE TRIGGER on_auth_user_created_club
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_club_signup();
