// Aisha AI realtime speech-to-text WebSocket proxy.
// The browser connects here; the Aisha X-Api-Key never leaves the server.
import { createClient } from "npm:@supabase/supabase-js@2";

const AISHA_WS = "wss://back.aisha.group/api/v1/stt/realtime";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const upgrade = req.headers.get("upgrade") || "";
  if (upgrade.toLowerCase() !== "websocket") {
    return new Response(JSON.stringify({ error: "Expected WebSocket upgrade" }), {
      status: 426,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const url = new URL(req.url);
  const token = url.searchParams.get("token") || "";
  const language = (url.searchParams.get("language") || "uz").slice(0, 8);

  // ---- AuthN: only signed-in doctors may use the transcription proxy ----
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: `Bearer ${token}` } } },
    );
    const { data, error } = await supabase.auth.getUser();
    if (error || !data?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const apiKey = Deno.env.get("AISHA_API_KEY");
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "STT not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { socket: client, response } = Deno.upgradeWebSocket(req);

  let upstream: WebSocket | null = null;
  const pending: (string | ArrayBuffer)[] = [];

  const openUpstream = () => {
    // Aisha accepts the key either as a header (not settable from the WS API)
    // or as a query parameter, so it is passed in the URL here.
    const target = `${AISHA_WS}?api_key=${encodeURIComponent(apiKey)}&language=${encodeURIComponent(language)}`;
    const ws = new WebSocket(target);
    ws.binaryType = "arraybuffer";

    ws.onopen = () => {
      try {
        ws.send(JSON.stringify({ type: "start", language, sample_rate: 16000, encoding: "pcm_s16le" }));
      } catch { /* some servers do not expect a config frame */ }
      while (pending.length) {
        const chunk = pending.shift()!;
        try { ws.send(chunk as any); } catch { /* ignore */ }
      }
      try { client.send(JSON.stringify({ type: "ready" })); } catch { /* ignore */ }
    };
    ws.onmessage = (e) => {
      try { client.send(typeof e.data === "string" ? e.data : JSON.stringify({ type: "binary" })); } catch { /* ignore */ }
    };
    ws.onerror = () => {
      console.error("aisha upstream error");
      try { client.send(JSON.stringify({ type: "error", message: "upstream_error" })); } catch { /* ignore */ }
    };
    ws.onclose = () => {
      try { client.close(); } catch { /* ignore */ }
    };
    upstream = ws;
  };

  client.onopen = () => openUpstream();

  client.onmessage = (e) => {
    const data = e.data as string | ArrayBuffer;
    if (!upstream || upstream.readyState !== WebSocket.OPEN) {
      if (pending.length < 200) pending.push(data);
      return;
    }
    try { upstream.send(data as any); } catch { /* ignore */ }
  };

  client.onclose = () => { try { upstream?.close(); } catch { /* ignore */ } };
  client.onerror = () => { try { upstream?.close(); } catch { /* ignore */ } };

  return response;
});
