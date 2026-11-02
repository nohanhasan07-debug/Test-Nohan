/*
# Seed initial master admin account

1. New Accounts
- Creates the first master admin login: username `admin`, with a temporary password that the owner must change from the Settings menu after the first sign-in.
- Creates the matching `profiles` row with role 'master'.

2. Security
- The password is stored only as a bcrypt hash by Supabase Auth.
- The migration is idempotent: if the account already exists it does nothing.

3. Notes
- The sign-in email is generated internally as admin@patc-club.com; users never see it.
- Email confirmation is not needed because the account is marked confirmed here.
*/

DO $$
DECLARE
  master_id uuid;
  master_email text := 'admin@patc-club.com';
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = master_email) THEN
    master_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', master_id, 'authenticated', 'authenticated', master_email,
      extensions.crypt('PatcMaster2026!', extensions.gen_salt('bf')),
      now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
      now(), now(), '', '', '', ''
    );

    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES (
      gen_random_uuid(), master_id,
      jsonb_build_object('sub', master_id::text, 'email', master_email, 'email_verified', true),
      'email', master_id::text, now(), now(), now()
    );

    INSERT INTO public.profiles (id, username, display_name, role)
    VALUES (master_id, 'admin', 'Master Admin', 'master');
  END IF;
END $$;
