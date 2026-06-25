import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
    const MAX_SYMPTOMS = 5_000;
    if (!clinic_id || symptoms.length < 5) return json({ error: "invalid_input" }, 400);
    if (symptoms.length > MAX_SYMPTOMS) return json({ error: "input_too_long", code: "INPUT_TOO_LONG" }, 413);

    // AI analysis: try Gemini, fall back to Groq
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
    let summary = symptoms.slice(0, 200);
    let urgency = "medium";
    let specialization = "Terapevt";

    if (GEMINI_API_KEY || GROQ_API_KEY) {
      const sys = `You are a medical triage assistant. Reply ONLY valid JSON: {"summary": string (in ${language}, max 2 sentences), "urgency": "low"|"medium"|"high"|"emergency", "specialization": one of [Terapevt, Pediatr, Kardiolog, Nevrolog, Gastroenterolog, Endokrinolog, Ginekolog, Urolog, Dermatolog, LOR, Oftalmolog, Travmatolog, Psixiatr, Pulmonolog]}`;
      const callGemini = () => fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${GEMINI_API_KEY}` },
        body: JSON.stringify({ model: "gemini-2.5-flash", messages: [{ role: "system", content: sys }, { role: "user", content: symptoms }], response_format: { type: "json_object" } }),
      });
      const callGroq = () => fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${GROQ_API_KEY}` },
        body: JSON.stringify({ model: "llama-3.3-70b-versatile", messages: [{ role: "system", content: sys }, { role: "user", content: symptoms }], response_format: { type: "json_object" } }),
      });

      let aiResp: Response | null = null;
      if (GEMINI_API_KEY) {
        aiResp = await callGemini();
        if (!aiResp.ok && GROQ_API_KEY && [401, 402, 403, 429].includes(aiResp.status)) {
          aiResp = await callGroq();
        }
      } else {
        aiResp = await callGroq();
      }

      if (aiResp && aiResp.ok) {
        const aiJson = await aiResp.json();
        const txt = aiJson?.choices?.[0]?.message?.content ?? "{}";
        try {
          const parsed = JSON.parse(txt);
          if (parsed.summary) summary = String(parsed.summary);
          if (parsed.urgency) urgency = String(parsed.urgency).toLowerCase();
          if (parsed.specialization) specialization = String(parsed.specialization);
        } catch { /* fallback */ }
      }
    }

    // Find doctor: same clinic + specialty match, else any in clinic
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    let doctor: any = null;
    const { data: matches } = await admin.from("profiles")
      .select("user_id,full_name,specialty")
      .eq("clinic_id", clinic_id)
      .ilike("specialty", `%${specialization}%`)
      .limit(1);
    if (matches?.length) doctor = matches[0];
    if (!doctor) {
      const { data: any1 } = await admin.from("profiles")
        .select("user_id,full_name,specialty").eq("clinic_id", clinic_id).limit(1);
      if (any1?.length) doctor = any1[0];
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

    return json({ report: inserted, doctor });
  } catch (e) {
    console.error("patient-route error:", e);
    return json({ error: "Internal server error" }, 500);
  }
});

function json(b: any, status = 200) {
  return new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}