import { useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

const PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID;

type Callbacks = {
  onPartial?: (text: string) => void;
  onFinal?: (text: string) => void;
  onError?: (message: string) => void;
  onClose?: () => void;
};

/** Extract transcript text out of the various shapes an STT server may return. */
function pickText(payload: any): { text: string; isFinal: boolean } | null {
  if (!payload || typeof payload !== "object") return null;
  const node = payload.result ?? payload.data ?? payload;
  const text =
    node.text ?? node.transcript ?? node.partial ?? node.message ?? node.content ?? "";
  if (typeof text !== "string" || !text.trim()) return null;
  const isFinal =
    node.is_final === true ||
    node.final === true ||
    node.type === "final" ||
    payload.type === "final" ||
    node.event === "final";
  return { text, isFinal };
}

/**
 * Realtime speech-to-text through the Aisha AI proxy edge function.
 * Streams 16 kHz PCM16 audio from the microphone.
 */
export function useAishaStt() {
  const wsRef = useRef<WebSocket | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nodeRef = useRef<ScriptProcessorNode | null>(null);

  const stop = useCallback(() => {
    try { nodeRef.current?.disconnect(); } catch { /* noop */ }
    try { ctxRef.current?.close(); } catch { /* noop */ }
    try { streamRef.current?.getTracks().forEach((t) => t.stop()); } catch { /* noop */ }
    try {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: "stop" }));
      }
      wsRef.current?.close();
    } catch { /* noop */ }
    nodeRef.current = null;
    ctxRef.current = null;
    streamRef.current = null;
    wsRef.current = null;
  }, []);

  const start = useCallback(
    async (language: string, cb: Callbacks) => {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) throw new Error("not_authenticated");

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true },
      });
      streamRef.current = stream;

      const url = `wss://${PROJECT_ID}.functions.supabase.co/aisha-stt?token=${encodeURIComponent(
        token,
      )}&language=${encodeURIComponent(language)}`;

      const ws = new WebSocket(url);
      ws.binaryType = "arraybuffer";
      wsRef.current = ws;

      await new Promise<void>((resolve, reject) => {
        const timer = window.setTimeout(() => reject(new Error("stt_timeout")), 8000);
        ws.onopen = () => { window.clearTimeout(timer); resolve(); };
        ws.onerror = () => { window.clearTimeout(timer); reject(new Error("stt_connect_failed")); };
      });

      ws.onmessage = (e) => {
        if (typeof e.data !== "string") return;
        let payload: any;
        try { payload = JSON.parse(e.data); } catch { payload = { text: e.data }; }
        if (payload?.type === "error") { cb.onError?.(payload.message || "stt_error"); return; }
        const picked = pickText(payload);
        if (!picked) return;
        if (picked.isFinal) cb.onFinal?.(picked.text);
        else cb.onPartial?.(picked.text);
      };
      ws.onerror = () => cb.onError?.("stt_error");
      ws.onclose = () => cb.onClose?.();

      const AudioCtx: typeof AudioContext =
        (window as any).AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx({ sampleRate: 16000 });
      ctxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const processor = ctx.createScriptProcessor(4096, 1, 1);
      nodeRef.current = processor;

      processor.onaudioprocess = (ev) => {
        if (ws.readyState !== WebSocket.OPEN) return;
        const input = ev.inputBuffer.getChannelData(0);
        const pcm = new Int16Array(input.length);
        for (let i = 0; i < input.length; i++) {
          const s = Math.max(-1, Math.min(1, input[i]));
          pcm[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }
        try { ws.send(pcm.buffer); } catch { /* noop */ }
      };

      source.connect(processor);
      processor.connect(ctx.destination);
    },
    [],
  );

  return { start, stop };
}
