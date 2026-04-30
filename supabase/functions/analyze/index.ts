import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { transcript } = await req.json();
    if (!transcript || typeof transcript !== "string" || transcript.trim().length < 3) {
      return new Response(JSON.stringify({ error: "Матн бўш ёки жуда қисқа" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY мавжуд эмас");

    const systemPrompt = `Сиз — тажрибали тиббий ёрдамчи AI сиз. Шифокор ёзиб олган бемор билан суҳбатни таҳлил қилиб, фақат қисқа ва аниқ маълумот беринг. Жавобни ҳамиша КИРИЛЛ ўзбек тилида қайтаринг. Натижани structured tool орқали юборинг.`;

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
          { role: "user", content: `Қуйидаги бемор суҳбатини тиббий тарзда таҳлил қил:\n\n"""${transcript}"""` },
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
                  diagnosis: {
                    type: "string",
                    description: "Эҳтимолий ташхис, қисқа изоҳ билан (кирилл ўзбек тилида)",
                  },
                  recommendation: {
                    type: "string",
                    description: "Шифокорга тавсия: текширувлар, дастлабки чора-тадбирлар (кирилл ўзбек тилида)",
                  },
                },
                required: ["symptoms", "diagnosis", "recommendation"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "medical_analysis" } },
      }),
    });

    if (response.status === 429) {
      return new Response(JSON.stringify({ error: "Сўровлар чегарасига етдингиз. Бироздан сўнг қайта уриниб кўринг." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (response.status === 402) {
      return new Response(JSON.stringify({ error: "AI кредитлари тугади. Илтимос ҳисобингизга маблағ қўшинг." }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!response.ok) {
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI хизматида хатолик" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(JSON.stringify({ error: "Натижа олинмади" }), {
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
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Номаълум хатолик" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});