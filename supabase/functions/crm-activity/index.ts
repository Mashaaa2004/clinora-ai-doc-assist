import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

function safeEq(a: string, b: string) {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "GET") return json({ error: "Method not allowed" }, 405);
  try {
    const expected = Deno.env.get("CLINORA_AI_API_KEY");
    if (!expected) return json({ error: "Server not configured" }, 500);
    const h = req.headers.get("Authorization") ?? "";
    const tok = h.startsWith("Bearer ") ? h.slice(7).trim() : "";
    if (!tok || !safeEq(tok, expected)) return json({ error: "Unauthorized" }, 401);

    const url = new URL(req.url);
    const sinceRaw = url.searchParams.get("updated_since");
    const since = sinceRaw && !isNaN(Date.parse(sinceRaw)) ? new Date(sinceRaw).toISOString() : null;
    const limit = Math.min(Math.max(parseInt(url.searchParams.get("limit") ?? "200") || 200, 1), 1000);

    const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const today = new Date(); today.setUTCHours(0, 0, 0, 0);

    const [{ data: roles }, { data: profiles }, { data: activity }, { data: todays }, usersRes] = await Promise.all([
      db.from("user_roles").select("user_id").eq("role", "doctor"),
      db.from("profiles").select("user_id,full_name,specialty,phone,hospital,clinic_id,base44_doctor_id"),
      db.from("doctor_activity").select("*"),
      db.from("consultations").select("user_id,duration_seconds").gte("created_at", today.toISOString()),
      db.auth.admin.listUsers({ perPage: 1000 }),
    ]);
    const doctorIds = new Set((roles ?? []).map((r) => r.user_id));
    const emails = new Map((usersRes.data?.users ?? []).map((u) => [u.id, u.email ?? ""]));
    const act = new Map((activity ?? []).map((a) => [a.user_id, a]));
    const stats = new Map<string, { count: number; total: number; n: number }>();
    for (const c of todays ?? []) {
      const s = stats.get(c.user_id) ?? { count: 0, total: 0, n: 0 };
      s.count++;
      if (c.duration_seconds != null) { s.total += c.duration_seconds; s.n++; }
      stats.set(c.user_id, s);
    }

    const doctors = (profiles ?? []).filter((p) => doctorIds.has(p.user_id)).map((p) => {
      const a = act.get(p.user_id);
      const s = stats.get(p.user_id) ?? { count: 0, total: 0, n: 0 };
      return {
        doctor_id: p.user_id,
        base44_doctor_id: p.base44_doctor_id,
        email: emails.get(p.user_id) ?? "",
        full_name: p.full_name,
        specialty: p.specialty,
        phone: p.phone,
        hospital: p.hospital,
        clinic_id: p.clinic_id,
        status: a?.status ?? "idle",
        in_consultation: a?.status === "in_consultation",
        consultation_started_at: a?.consultation_started_at ?? null,
        last_seen_at: a?.last_seen_at ?? null,
        patients_today: s.count,
        avg_consultation_seconds_today: s.n ? Math.round(s.total / s.n) : null,
      };
    });

    let q = db.from("consultations")
      .select("id,user_id,patient_code,started_at,ended_at,duration_seconds,chosen_diagnosis,language,created_at")
      .order("created_at", { ascending: false }).limit(limit);
    if (since) q = q.gte("created_at", since);
    const { data: consultations } = await q;

    return json({
      ok: true,
      generated_at: new Date().toISOString(),
      doctors,
      consultations: (consultations ?? []).map((c) => ({
        consultation_id: c.id,
        doctor_id: c.user_id,
        patient_code: c.patient_code,
        started_at: c.started_at,
        ended_at: c.ended_at ?? c.created_at,
        duration_seconds: c.duration_seconds,
        diagnosis: c.chosen_diagnosis,
        language: c.language,
      })),
    });
  } catch (e) {
    console.error("crm-activity error:", e);
    return json({ error: "Internal server error" }, 500);
  }
});
