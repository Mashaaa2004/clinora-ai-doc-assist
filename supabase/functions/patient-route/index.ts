import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const URGENCIES = new Set(["low", "medium", "high", "emergency"]);
const SPECIALIZATIONS = new Set(["Terapevt", "Pediatr", "Kardiolog", "Nevrolog", "Gastroenterolog", "Endokrinolog", "Ginekolog", "Urolog", "Dermatolog", "LOR", "Oftalmolog", "Travmatolog", "Psixiatr", "Pulmonolog"]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return json({ error: "unauthorized" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: auth } } },
    );
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) return json({ error: "unauthorized" }, 401);
    const userId = userData.user.id;

    const body = await req.json().catch(() => ({}));
    const clinic_id = String(body.clinic_id || "");
    const symptoms = String(body.symptoms || "").trim();
    const language = String(body.language || "uz").slice(0, 8);
    if (!clinic_id || symptoms.length < 5) return json({ error: "invalid_input" }, 400);
    if (symptoms.length > 5_000) return json({ error: "input_too_long", code: "INPUT_TOO_LONG" }, 413);

    let summary = "AI baholash mavjud emas; shifokor ko‘rib chiqishi talab qilinadi.";
    let urgency = "unassessed";
    let specialization = "";
    let triageStatus = "manual_review_required";
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (LOVABLE_API_KEY) {
      const sys = `You are a medical triage assistant. Reply ONLY valid JSON: {"summary": string (in ${language}, max 2 sentences), "urgency": "low"|"medium"|"high"|"emergency", "specialization": one of [Terapevt, Pediatr, Kardiolog, Nevrolog, Gastroenterolog, Endokrinolog, Ginekolog, Urolog, Dermatolog, LOR, Oftalmolog, Travmatolog, Psixiatr, Pulmonolog]}`;
      const aiResp: Response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${LOVABLE_API_KEY}` },
        body: JSON.stringify({ model: "openai/gpt-5.6-sol", messages: [{ role: "system", content: sys }, { role: "user", content: symptoms }], response_format: { type: "json_object" } }),
      });

      if (aiResp.ok) {
        const aiJson = await aiResp.json();
        const txt = aiJson?.choices?.[0]?.message?.content ?? "{}";
        try {
          const parsed = JSON.parse(txt);
          const nextUrgency = String(parsed.urgency || "").toLowerCase();
          const nextSpecialization = String(parsed.specialization || "");
          if (parsed.summary && URGENCIES.has(nextUrgency) && SPECIALIZATIONS.has(nextSpecialization)) {
            summary = String(parsed.summary).slice(0, 1_000);
            urgency = nextUrgency;
            specialization = nextSpecialization;
            triageStatus = "ai_assessed";
          }
        } catch { /* keep explicit manual-review state */ }
      }
    }

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    let doctor: any = null;

    // Automatic assignment is allowed only after successful AI triage and only to actual doctors.
    if (triageStatus === "ai_assessed") {
      const { data: roleRows } = await admin.from("user_roles").select("user_id").eq("role", "doctor");
      const doctorIds = (roleRows ?? []).map((r) => r.user_id);
      if (doctorIds.length) {
        const { data: clinicDoctors } = await admin.from("profiles")
          .select("user_id,full_name,specialty")
          .eq("clinic_id", clinic_id)
          .in("user_id", doctorIds);
        const candidates = clinicDoctors ?? [];
        doctor = candidates.find((p) => (p.specialty || "").toLowerCase().includes(specialization.toLowerCase())) ?? candidates[0] ?? null;
      }
    }

    const { data: inserted, error: insErr } = await supabase.from("symptom_reports").insert({
      patient_id: userId,
      clinic_id,
      assigned_doctor_id: doctor?.user_id ?? null,
      symptoms,
      language,
      ai_summary: summary,
      ai_urgency: urgency,
      recommended_specialization: specialization,
      status: doctor ? "assigned" : "pending",
    }).select().single();
    if (insErr) {
      console.error("patient-route insert error:", insErr);
      return json({ error: "Could not create report" }, 400);
    }

    return json({ report: inserted, doctor, triage_status: triageStatus });
  } catch (e) {
    console.error("patient-route error:", e);
    return json({ error: "Internal server error" }, 500);
  }
});

function json(b: any, status = 200) {
  return new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
