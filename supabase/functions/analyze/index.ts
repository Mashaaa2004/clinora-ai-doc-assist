import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { CLINICAL_SAFETY, SAFETY_PROPERTIES, hasProcessingConsent, attachGrounding, groundingContext, minimizeIdentifiers, retrievalQuery, type Passage } from "../_shared/clinical-grounding.ts";

type Lang = "uz" | "ru" | "en" | "kk" | "ky" | "tr";

const LANG_INSTRUCTION: Record<Lang, string> = {
  uz: "Жавобни ҳамиша КИРИЛЛ ўзбек тилида қайтаринг. Барча майдонлар (симптомлар, тавсиялар, рецептлар, текширувлар, ташхислар, оила учун маслаҳат) кирилл ўзбек тилида бўлсин.",
  ru: "Всегда возвращайте ответ ПОЛНОСТЬЮ на русском языке. Все поля (симптомы, рекомендации, рецепты, обследования, диагнозы, советы семье) должны быть на русском.",
  en: "Always return the response ENTIRELY in English. All fields (symptoms, recommendations, prescriptions, tests, diagnoses, family advice) must be in English.",
  kk: "Жауапты ҮНЕМІ қазақ тілінде (кирилл жазуы) қайтарыңыз. Барлық өрістер (симптомдар, ұсыныстар, рецепттер, тексерулер, диагноздар, отбасыға кеңес) қазақ тілінде болуы тиіс.",
  ky: "Жоопту ДАЙЫМА кыргыз тилинде (кирилл жазуу) кайтарыңыз. Бардык талаалар (симптомдор, сунуштар, рецепттер, текшерүүлөр, диагноздор, үй-бүлөгө кеңеш) кыргыз тилинде болушу керек.",
  tr: "Yanıtı HER ZAMAN tamamen Türkçe olarak döndürün. Tüm alanlar (semptomlar, öneriler, reçeteler, tetkikler, tanılar, aile için tavsiye) Türkçe olmalıdır.",
};

const LABELS: Record<Lang, { history: string; today: string; analyze: string }> = {
  uz: {
    history: "БЕМОРНИНГ ОЛДИНГИ ТАШРИФЛАРИ ТАРИХИ",
    today: "БУГУНГИ ШИКОЯТ ВА СУҲБАТ",
    analyze: "Иккаласини ҳисобга олиб тиббий тарзда таҳлил қилинг.",
  },
  ru: {
    history: "ИСТОРИЯ ПРЕДЫДУЩИХ ВИЗИТОВ ПАЦИЕНТА",
    today: "СЕГОДНЯШНИЕ ЖАЛОБЫ И БЕСЕДА",
    analyze: "Проанализируйте оба блока медицински.",
  },
  en: {
    history: "PATIENT'S PREVIOUS VISIT HISTORY",
    today: "TODAY'S COMPLAINTS AND CONVERSATION",
    analyze: "Analyze both blocks medically.",
  },
  kk: {
    history: "ПАЦИЕНТТІҢ АЛДЫҢҒЫ ҚАБЫЛДАУ ТАРИХЫ",
    today: "БҮГІНГІ ШАҒЫМДАР ЖӘНЕ ӘҢГІМЕ",
    analyze: "Екеуін де ескере отырып, медициналық тұрғыдан талдаңыз.",
  },
  ky: {
    history: "БЕЙТАПТЫН МУРУНКУ КАБЫЛ АЛУУ ТАРЫХЫ",
    today: "БҮГҮНКҮ АРЫЗ ЖАНА СҮЙЛӨШҮҮ",
    analyze: "Экөөнү тең эске алып, медициналык жактан талдаңыз.",
  },
  tr: {
    history: "HASTANIN ÖNCEKİ ZİYARET GEÇMİŞİ",
    today: "BUGÜNKÜ ŞİKAYETLER VE GÖRÜŞME",
    analyze: "İkisini de dikkate alarak tıbbi olarak analiz edin.",
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ---- AuthN: require valid Supabase JWT ----
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    // ---- Server-side quota enforcement (free tier: 5/day) ----
    const [{ data: isProData }, { data: cntData }] = await Promise.all([
      supabase.rpc("is_pro", { _user_id: userId }),
      supabase.rpc("daily_usage_count", { _user_id: userId }),
    ]);
    if (!isProData && (cntData ?? 0) >= 5) {
      return new Response(JSON.stringify({ error: "Daily limit reached", code: "QUOTA_EXCEEDED" }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    if(!hasProcessingConsent(body)) return new Response(JSON.stringify({error:"Patient AI processing consent confirmation required"}), {status:400,headers:{...corsHeaders,"Content-Type":"application/json"}});
    const { language } = body;
    const identifiers = typeof body.patientName === "string" ? [body.patientName] : [];
    const { transcript, previousHistory, labResults, instrumentalResults } = minimizeIdentifiers(body, identifiers) as Record<string, any>;
    if (!transcript || typeof transcript !== "string" || transcript.trim().length < 3) {
      return new Response(JSON.stringify({ error: "Текст пуст или слишком короткий" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ---- Input size limits (prevent payload abuse / token exhaustion) ----
    const MAX_TRANSCRIPT = 15_000;
    const MAX_HISTORY = 20_000;
    const MAX_LAB = 10_000;
    const MAX_INSTRUMENTAL = 10_000;
    const tooLong =
      transcript.length > MAX_TRANSCRIPT ||
      (typeof previousHistory === "string" && previousHistory.length > MAX_HISTORY) ||
      (typeof labResults === "string" && labResults.length > MAX_LAB) ||
      (typeof instrumentalResults === "string" && instrumentalResults.length > MAX_INSTRUMENTAL);
    if (tooLong) {
      return new Response(JSON.stringify({ error: "Input too long", code: "INPUT_TOO_LONG" }), {
        status: 413,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("No AI API key configured");

    const lang: Lang = ["uz", "ru", "en", "kk", "ky", "tr"].includes(language) ? language : "uz";
    const langInstr = LANG_INSTRUCTION[lang];
    const labels = LABELS[lang];

    const { data: passageData, error: retrievalError } = await supabase.rpc("search_protocol_passages", { search_text: retrievalQuery(transcript) });
    if (retrievalError) return new Response(JSON.stringify({ error: "Protocol lookup unavailable. Please try again later." }), {status:503,headers:{...corsHeaders,"Content-Type":"application/json"}});
    const passages = (passageData ?? []) as Passage[];
    const systemPrompt = `${CLINICAL_SAFETY}
${langInstr}
Return symptoms, lab_tests, instrumental_tests, differentials, comorbidities, recommendation, prescriptions, family_advice and SOAP fields through the structured tool. Preserve known lab results. Keep family advice concise and conditional, not a confirmed diagnosis.
${groundingContext(passages)}`;

    const parts: string[] = [];
    if (previousHistory && typeof previousHistory === "string" && previousHistory.trim()) {
      parts.push(`${labels.history}:\n${previousHistory}`);
    }
    parts.push(`${labels.today}:\n"""${transcript}"""`);
    if (labResults && typeof labResults === "string" && labResults.trim()) {
      parts.push(`LAB RESULTS ALREADY OBTAINED:\n${labResults}`);
    }
    if (instrumentalResults && typeof instrumentalResults === "string" && instrumentalResults.trim()) {
      parts.push(`INSTRUMENTAL EXAM RESULTS ALREADY OBTAINED:\n${instrumentalResults}`);
    }
    parts.push(labels.analyze);
    const userContent = parts.join("\n\n=====\n\n");

    const requestBody = JSON.stringify({
        model: "openai/gpt-5.6-sol",
        reasoning_effort: "none",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "medical_analysis",
              description: "Тиббий таҳлил натижаси",
              parameters: {
                type: "object",
                properties: {
                  ...SAFETY_PROPERTIES,
                  symptoms: {
                    type: "array",
                    items: { type: "string" },
                    description: "Аниқланган симптомлар рўйхати (кирилл ўзбек тилида)",
                  },
                  recommendation: {
                    type: "string",
                    description: "Шифокорга тавсия: текширувлар, дастлабки чора-тадбирлар (кирилл ўзбек тилида)",
                  },
                  prescriptions: {
                    type: "array",
                    description: "Тахминий дори рецептлари рўйхати (кирилл ўзбек тилида). Фақат тахминий, шифокор тасдиқлаши керак.",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string", description: "Дори номи" },
                        dosage: { type: "string", description: "Дозаси, масалан: 500 мг" },
                        frequency: { type: "string", description: "Қабул қилиш тартиби, масалан: кунига 3 маҳал" },
                        duration: { type: "string", description: "Давомийлиги, масалан: 5 кун" },
                        notes: { type: "string", description: "Қўшимча изоҳ (овқатдан кейин ва ҳ.к.)" },
                      },
                      required: ["name", "dosage", "frequency", "duration"],
                      additionalProperties: false,
                    },
                  },
                  lab_tests: {
                    type: "array",
                    description: "Тавсия этиладиган лаборатория ва инструментал текширувлар рўйхати (кирилл ўзбек тилида). Масалан: 'Умумий қон таҳлили', 'Қанд миқдори', 'УЗИ', 'ЭКГ'. Натижа киритиш учун жой шифокор томонидан тўлдирилади.",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string", description: "Текширув номи" },
                        reason: { type: "string", description: "Нима учун керак (қисқа изоҳ)" },
                      },
                      required: ["name"],
                      additionalProperties: false,
                    },
                  },
                  instrumental_tests: {
                    type: "array",
                    description: "Recommended instrumental / apparatus exams (US, ECG, X-ray, MRI, CT, EEG, etc.) with reason.",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string", description: "Exam name" },
                        reason: { type: "string", description: "Short reason why" },
                        result: { type: "string", description: "Result if already known, otherwise empty" },
                      },
                      required: ["name"],
                      additionalProperties: false,
                    },
                  },
                  differentials: {
                    type: "array",
                    description: "Possible differential diagnoses for clinician review; leave empty when unsupported.",
                    minItems: 0,
                    maxItems: 3,
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string", description: "Diagnosis name" },
                        probability: { type: "string", enum: ["high", "medium", "low"] },
                        reasoning: { type: "string", description: "Short 2-3 sentence reasoning" },
                      },
                      required: ["name", "probability", "reasoning"],
                      additionalProperties: false,
                    },
                  },
                  comorbidities: {
                    type: "array",
                    description: "Possible concomitant conditions only if supported; do not force a count. Each includes the specialist to refer the patient to and a short referral note.",
                    minItems: 0,
                    maxItems: 3,
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string", description: "Concomitant condition name" },
                        risk_level: { type: "string", enum: ["high", "medium", "low"] },
                        reasoning: { type: "string", description: "1-2 sentence link to symptoms / findings" },
                        specialist: { type: "string", description: "Medical specialty to refer the patient to (e.g. Кардиолог, Эндокринолог)" },
                        referral_note: { type: "string", description: "Short 1-sentence referral note from the primary doctor to that specialist" },
                      },
                      required: ["name", "risk_level", "reasoning", "specialist", "referral_note"],
                      additionalProperties: false,
                    },
                  },
                  family_advice: {
                    type: "string",
                    description: "Clear simple-language guidance for the patient's family members (4-8 sentences). Explains condition, home care, warning signs that require emergency, emotional support.",
                  },
                },
                required: ["symptoms", "recommendation", "prescriptions", "lab_tests", "instrumental_tests", "differentials", "comorbidities", "family_advice", "soap", "review_flags", "urgent_flags", "cited_passage_ids"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "medical_analysis" } },
    });

    const response: Response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: requestBody,
    });

    if (!response.ok) {
      const failure = await response.json().catch(() => ({}));
      const message = failure.message ?? failure.error?.message ?? "AI request failed";
      return new Response(JSON.stringify({error:message}), {status:response.status,headers:{...corsHeaders,"Content-Type":"application/json"}});
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(JSON.stringify({ error: "No result returned" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const args = JSON.parse(toolCall.function.arguments);
    const grounded = attachGrounding(args, passages);
    const { data: draft, error: draftError } = await supabase.from("clinical_drafts").insert({user_id:userId,original_analysis:grounded}).select("id").single();
    if (draftError) return new Response(JSON.stringify({error:"Draft could not be saved"}),{status:500,headers:{...corsHeaders,"Content-Type":"application/json"}});
    return new Response(JSON.stringify({...grounded,draft_id:draft.id}), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze request failed");
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});