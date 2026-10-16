import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { CLINICAL_SAFETY, SAFETY_PROPERTIES, attachGrounding, groundingContext, minimizeIdentifiers, retrievalQuery, type Passage } from "../_shared/clinical-grounding.ts";

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
    if(body.consentConfirmed !== true) return json({error:"Patient AI processing consent confirmation required",code:"CONSENT_REQUIRED"},400);
    const identifiers = [body.patient_name, body.full_name, body.patient?.full_name, body.patient?.name].filter((v): v is string => typeof v === "string");
    const raw = JSON.stringify(minimizeIdentifiers(body, identifiers));
    if (raw.length > 100_000) {
      return json({ error: "Input too long", code: "INPUT_TOO_LONG" }, 413);
    }

    const langKey = typeof body.language === "string" ? body.language.toLowerCase().slice(0, 5) : "uz";
    const langInstr = LANG_INSTRUCTIONS[langKey] ?? LANG_INSTRUCTIONS.uz;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return json({ error: "AI not configured" }, 500);

    const cloud = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
    const {data: retrieved,error: retrievalError}=await cloud.rpc("search_protocol_passages",{search_text:retrievalQuery(raw)});
    if(retrievalError)return json({error:"Protocol lookup unavailable"},503);
    const passages=(retrieved??[]) as Passage[];
    const systemPrompt = `${CLINICAL_SAFETY}
${langInstr}
Draft a consultation document using only the supplied data. Return JSON containing title, document (plain text with SOAP headings), soap, review_flags, urgent_flags and cited_passage_ids. Do not include identifying information in the document.
${groundingContext(passages)}`;

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
        response_format: { type: "json_schema", json_schema: { name:"clinical_document", strict:true, schema:{type:"object",properties:{title:{type:"string"},document:{type:"string"},...SAFETY_PROPERTIES},required:["title","document","soap","review_flags","urgent_flags","cited_passage_ids"],additionalProperties:false} } },
      }),
    });

    if (!aiResp.ok) {
      const failure=await aiResp.json().catch(()=>({}));
      return json({error:failure.message??failure.error?.message??"Document generation failed"},aiResp.status);
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
      ...attachGrounding(parsed,passages),
      requires_clinician_approval:true,
      ok: true,
      title: String(parsed.title ?? "Medical Consultation Document"),
      document,
      language: langKey,
      generated_at: new Date().toISOString(),
    });
  } catch (e) {
    console.error("generate-document request failed");
    return json({ error: "Internal server error" }, 500);
  }
});
