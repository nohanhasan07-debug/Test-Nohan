import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const AUTH_EMAIL_DOMAIN = "patc-club.com";
const USERNAME_PATTERN = /^[a-z0-9_.]{3,20}$/;
const ROLES = ["master", "member"];

type Json = Record<string, unknown>;

function respond(body: Json, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function readString(body: Json, key: string): string {
  const value = body[key];
  return typeof value === "string" ? value.trim() : "";
}

function validatePassword(password: string): string | null {
  if (password.length < 6) return "Password minimal 6 karakter.";
  if (password.length > 72) return "Password maksimal 72 karakter.";
  return null;
}

function validateDisplayName(name: string): string | null {
  if (name.length < 1 || name.length > 40) return "Nama tampilan harus 1 sampai 40 karakter.";
  return null;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );

    const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
    const { data: caller, error: callerError } = await admin.auth.getUser(token);
    if (callerError || !caller.user) {
      return respond({ error: "Sesi tidak valid. Silakan masuk kembali." }, 401);
    }

    const { data: callerProfile, error: profileError } = await admin
      .from("profiles")
      .select("role")
      .eq("id", caller.user.id)
      .maybeSingle();
    if (profileError) throw profileError;
    if (callerProfile?.role !== "master") {
      return respond({ error: "Hanya master admin yang bisa mengelola akun." }, 403);
    }

    const body = (await req.json()) as Json;
    const action = readString(body, "action");
    const userId = readString(body, "userId");

    if (action === "create") {
      const username = readString(body, "username").toLowerCase();
      const password = typeof body.password === "string" ? body.password : "";
      const displayName = readString(body, "displayName");
      const role = readString(body, "role");

      if (!USERNAME_PATTERN.test(username)) {
        return respond({ error: "Username 3-20 karakter: huruf kecil, angka, titik, atau garis bawah." }, 400);
      }
      const passwordError = validatePassword(password);
      if (passwordError) return respond({ error: passwordError }, 400);
      const nameError = validateDisplayName(displayName);
      if (nameError) return respond({ error: nameError }, 400);
      if (!ROLES.includes(role)) return respond({ error: "Peran tidak valid." }, 400);

      const { data: taken } = await admin.from("profiles").select("id").eq("username", username).maybeSingle();
      if (taken) return respond({ error: "Username sudah dipakai." }, 409);

      const { data: created, error: createError } = await admin.auth.admin.createUser({
        email: `${username}@${AUTH_EMAIL_DOMAIN}`,
        password,
        email_confirm: true,
      });
      if (createError || !created.user) {
        return respond({ error: "Akun tidak bisa dibuat. Coba username lain." }, 400);
      }

      const { error: insertError } = await admin.from("profiles").insert({
        id: created.user.id,
        username,
        display_name: displayName,
        role,
      });
      if (insertError) {
        await admin.auth.admin.deleteUser(created.user.id);
        throw insertError;
      }
      return respond({ ok: true });
    }

    if (action === "resetPassword") {
      const password = typeof body.password === "string" ? body.password : "";
      const passwordError = validatePassword(password);
      if (passwordError) return respond({ error: passwordError }, 400);
      const { error } = await admin.auth.admin.updateUserById(userId, { password });
      if (error) return respond({ error: "Password tidak bisa diubah." }, 400);
      return respond({ ok: true });
    }

    if (action === "update") {
      const displayName = readString(body, "displayName");
      const role = readString(body, "role");
      const nameError = validateDisplayName(displayName);
      if (nameError) return respond({ error: nameError }, 400);
      if (!ROLES.includes(role)) return respond({ error: "Peran tidak valid." }, 400);

      if (userId === caller.user.id && role !== "master") {
        return respond({ error: "Anda tidak bisa menurunkan peran akun sendiri." }, 400);
      }

      const { error } = await admin
        .from("profiles")
        .update({ display_name: displayName, role })
        .eq("id", userId);
      if (error) throw error;
      return respond({ ok: true });
    }

    if (action === "delete") {
      if (userId === caller.user.id) {
        return respond({ error: "Anda tidak bisa menghapus akun sendiri." }, 400);
      }
      const { error } = await admin.auth.admin.deleteUser(userId);
      if (error) return respond({ error: "Akun tidak bisa dihapus." }, 400);
      return respond({ ok: true });
    }

    return respond({ error: "Aksi tidak dikenal." }, 400);
  } catch (err) {
    console.error("manage-users failed", err);
    return respond({ error: "Terjadi kesalahan di server. Coba lagi." }, 500);
  }
});
