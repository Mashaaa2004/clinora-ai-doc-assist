import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Lang = "uz" | "ru" | "en";

const LANG_INSTRUCTION: Record<Lang, string> = {
  uz: "Жавобни ҳамиша КИРИЛЛ ўзбек тилида қайтаринг.",
  ru: "Всегда возвращайте ответ на русском языке.",
  en: "Always return the response in English.",
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
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { transcript, previousHistory, language, labResults, instrumentalResults } = await req.json();
    if (!transcript || typeof transcript !== "string" || transcript.trim().length < 3) {
      return new Response(JSON.stringify({ error: "Текст пуст или слишком короткий" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const lang: Lang = language === "ru" || language === "en" ? language : "uz";
    const langInstr = LANG_INSTRUCTION[lang];
    const labels = LABELS[lang];

    const systemPrompt = `You are an experienced medical assistant AI helping a doctor during a patient consultation.
You will receive: (1) the patient's complaints / dialogue, (2) optionally previous visit history, (3) optionally already-known laboratory results, (4) optionally already-known instrumental exam results (US, ECG, MRI, etc.).

Your task — return ONE structured analysis containing:
- symptoms: list of identified symptoms
- lab_tests: recommended laboratory tests (with reason). If lab results are already provided, include them with their result filled in and add new ones only if necessary.
- instrumental_tests: recommended instrumental/apparatus exams (US, ECG, X-ray, MRI, CT, EEG, etc.) with reason. Same rule for already-provided results.
- differentials: EXACTLY 3 most likely differential diagnoses ordered by probability, each with: name, probability ("high"/"medium"/"low"), short reasoning (2-3 sentences) tying it to the symptoms AND any lab/instrumental findings. ALWAYS prioritize the available laboratory and instrumental results when reasoning — they outweigh subjective complaints.
- comorbidities: 2-4 possible CONCOMITANT or HIDDEN related conditions that could co-exist or develop alongside the main symptoms (purpose: EARLY DETECTION). These are NOT differentials — they are diseases the doctor should screen for. Each item: name, risk_level ("high"/"medium"/"low"), reasoning (1-2 sentences explaining the link to the symptoms / lab / instrumental data).
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

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
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
                    description: "2-4 possible concomitant/hidden related conditions to screen for (early detection). NOT differentials.",
                    minItems: 2,
                    maxItems: 4,
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string", description: "Concomitant condition name" },
                        risk_level: { type: "string", enum: ["high", "medium", "low"] },
                        reasoning: { type: "string", description: "1-2 sentence link to symptoms / findings" },
                      },
                      required: ["name", "risk_level", "reasoning"],
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
      }),
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
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});