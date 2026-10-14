import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

const LANG_INSTRUCTIONS: Record<string, string> = {
  uz: "Hujjatni o'zbek tilida yozing.",
  ru: "Напишите документ на русском языке.",
  en: "Write the document in English.",
  tr: "Belgeyi Türkçe yazın.",
  kk: "Құжатты қазақ тілінде жазыңыз.",
  ky: "Документти кыргыз тилинде жазыңыз.",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    // ---- Auth: static bearer key issued to the CRM (stored server-side only) ----
    const expected = Deno.env.get("CLINORA_AI_API_KEY");
    if (!expected) return json({ error: "Server not configured" }, 500);
    const auth = req.headers.get("Authorization") ?? "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
    if (!token || !timingSafeEqual(token, expected)) {
      return json({ error: "Unauthorized" }, 401);
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return json({ error: "Invalid JSON body" }, 400);
    }
    const raw = JSON.stringify(body);
    if (raw.length > 100_000) {
      return json({ error: "Input too long", code: "INPUT_TOO_LONG" }, 413);
    }

    const langKey = typeof body.language === "string" ? body.language.toLowerCase().slice(0, 5) : "uz";
    const langInstr = LANG_INSTRUCTIONS[langKey] ?? LANG_INSTRUCTIONS.uz;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return json({ error: "AI not configured" }, 500);

    const systemPrompt = `You are Clinora.AI's medical document drafting engine.
You receive ONE consultation record as JSON (field names may vary between CRMs — interpret them intelligently).
Draft a complete, professionally structured medical consultation document from the data.
Use ONLY the data present in the input; never invent facts, diagnoses, or medications.
Structure the document with clear section headings, for example (omit a section if its data is absent):
PATIENT INFORMATION / SHIFOYAT & ANAMNEZ (complaints, history) / EXAMINATION FINDINGS / ASSESSMENT & DIAGNOSES / TREATMENT PLAN / PRESCRIPTIONS / RECOMMENDATIONS & FOLLOW-UP.
${langInstr}
Respond ONLY with a JSON object: {"title": string, "document": string} where "document" is the full drafted document as plain text with headings (no markdown fences).`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${LOVABLE_API_KEY}` },
      body: JSON.stringify({
        model: "openai/gpt-5.6-sol",
        reasoning_effort: "none",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Consultation data JSON:\n${raw}` },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!aiResp.ok) {
      console.error("generate-document AI error:", aiResp.status, await aiResp.text().catch(() => ""));
      return json({ error: "Document generation failed" }, 502);
    }
    const aiJson = await aiResp.json();
    const txt = aiJson?.choices?.[0]?.message?.content ?? "{}";
    let parsed: any = {};
    try {
      parsed = JSON.parse(txt);
    } catch {
      parsed = { document: txt };
    }
    const document = String(parsed.document ?? "").trim();
    if (!document) return json({ error: "Document generation failed" }, 502);

    return json({
      ok: true,
      title: String(parsed.title ?? "Medical Consultation Document"),
      document,
      language: langKey,
      generated_at: new Date().toISOString(),
    });
  } catch (e) {
    console.error("generate-document error:", e);
    return json({ error: "Internal server error" }, 500);
  }
});
