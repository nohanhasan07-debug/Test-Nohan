/*
# Remove unused player deletion function

The players menu was removed from the app, so the protected delete function is no longer called.
Player and match data are not changed by this migration.
*/

DROP FUNCTION IF EXISTS public.delete_club_player(uuid);
