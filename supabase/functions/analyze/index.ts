import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
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

    const { transcript, previousHistory, language, labResults, instrumentalResults } = await req.json();
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

    const CEREBRAS_API_KEY = Deno.env.get("CEREBRAS_API_KEY");
    if (!CEREBRAS_API_KEY) throw new Error("No AI API key configured");

    const lang: Lang = ["uz", "ru", "en", "kk", "ky", "tr"].includes(language) ? language : "uz";
    const langInstr = LANG_INSTRUCTION[lang];
    const labels = LABELS[lang];

    const systemPrompt = `You are an experienced medical assistant AI helping a doctor during a patient consultation.
You will receive: (1) the patient's complaints / dialogue, (2) optionally previous visit history, (3) optionally already-known laboratory results, (4) optionally already-known instrumental exam results (US, ECG, MRI, etc.).

Your task — return ONE structured analysis containing:
- symptoms: list of identified symptoms
- lab_tests: recommended laboratory tests (with reason). If lab results are already provided, include them with their result filled in and add new ones only if necessary.
- instrumental_tests: recommended instrumental/apparatus exams (US, ECG, X-ray, MRI, CT, EEG, etc.) with reason. Same rule for already-provided results.
- differentials: EXACTLY 3 most likely differential diagnoses ordered by probability, each with: name, probability ("high"/"medium"/"low"), short reasoning (2-3 sentences) tying it to the symptoms AND any lab/instrumental findings. ALWAYS prioritize the available laboratory and instrumental results when reasoning — they outweigh subjective complaints.
- comorbidities: EXACTLY 3 possible CONCOMITANT or HIDDEN related conditions that could co-exist or develop alongside the main symptoms (purpose: EARLY DETECTION). These are NOT differentials — they are diseases the doctor should screen for. Each item MUST include: name, risk_level ("high"/"medium"/"low"), reasoning (1-2 sentences linking to symptoms / lab / instrumental data), specialist (the medical specialty the patient should be referred to — e.g. "Кардиолог", "Эндокринолог", "Невропатолог"), referral_note (1 short sentence the primary doctor can include when referring the patient to that specialist).
- recommendation: treatment plan (lifestyle, regimen, follow-up) for the MOST LIKELY diagnosis (the first differential). The doctor may switch to another diagnosis afterwards.
- prescriptions: tentative drug prescriptions for the MOST LIKELY diagnosis. The doctor will review and approve.
- family_advice: a SHORT, concise note (MAX 3 sentences, ~40-50 words total) for the patient's family in plain language. Cover only: (1) what the patient has (one sentence), (2) the most important home-care action(s), (3) when to call emergency. No filler, no greetings, no emotional preamble.

ANALYSIS ORDER: First consider the lab and instrumental results (if provided), then the symptoms / complaints, then the previous history. Diagnoses and comorbidities must be consistent with the test findings.

IMPORTANT: ${langInstr}
If previous history is provided, use it (chronic conditions, recurring symptoms).
Return the result via the structured tool only.`;

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
        model: "gpt-oss-120b",
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
                    description: "Exactly 3 differential diagnoses ordered by probability.",
                    minItems: 3,
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
                    description: "Exactly 3 possible concomitant/hidden related conditions to screen for. Each includes the specialist to refer the patient to and a short referral note.",
                    minItems: 3,
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
                required: ["symptoms", "recommendation", "prescriptions", "lab_tests", "instrumental_tests", "differentials", "comorbidities", "family_advice"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "medical_analysis" } },
    });

    const response: Response = await fetch("https://api.cerebras.ai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${CEREBRAS_API_KEY}`, "Content-Type": "application/json" },
      body: requestBody,
    });

    if (response.status === 429) {
      return new Response(JSON.stringify({ error: "Rate limit. Try again later." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (response.status === 402) {
      return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds to your workspace." }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!response.ok) {
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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
    return new Response(JSON.stringify(args), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze error:", e);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});