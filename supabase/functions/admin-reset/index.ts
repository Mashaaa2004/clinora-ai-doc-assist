import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(url, anon, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(url, service);

    // Verify caller is admin
    const { data: roles } = await admin
      .from("user_roles").select("user_id").eq("role", "admin");
    const adminIds = new Set((roles ?? []).map((r: any) => r.user_id));
    if (!adminIds.has(user.id)) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminArr = [...adminIds];

    // Wipe all data tables completely (admins don't generate patient data)
    const wipes = await Promise.all([
      admin.from("consultations").delete().not("id", "is", null),
      admin.from("prescriptions_log").delete().not("id", "is", null),
      admin.from("payment_requests").delete().not("id", "is", null),
      admin.from("subscriptions").delete().not("id", "is", null),
    ]);
    for (const w of wipes) if (w.error) throw w.error;

    // Delete profiles for non-admin users
    const { error: profErr } = await admin
      .from("profiles").delete().not("user_id", "in", `(${adminArr.map((id) => `"${id}"`).join(",")})`);
    if (profErr) throw profErr;

    // Delete user_roles for non-admin users (keeps admin rows)
    const { error: roleErr } = await admin
      .from("user_roles").delete().neq("role", "admin");
    if (roleErr) throw roleErr;

    // Delete auth.users for non-admins
    const { data: list, error: listErr } = await admin.auth.admin.listUsers({ perPage: 1000 });
    if (listErr) throw listErr;
    const toDelete = (list?.users ?? []).filter((u) => !adminIds.has(u.id));
    const delResults = await Promise.all(
      toDelete.map((u) => admin.auth.admin.deleteUser(u.id)),
    );
    const failed = delResults.filter((r) => r.error).length;

    return new Response(
      JSON.stringify({
        ok: true,
        deleted_users: toDelete.length - failed,
        failed_user_deletes: failed,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message ?? "Server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});