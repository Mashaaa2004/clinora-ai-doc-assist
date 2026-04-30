import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Brain, Loader2, Mic, MicOff, Sparkles, Stethoscope, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type AnalysisResult = {
  symptoms: string[];
  diagnosis: string;
  recommendation: string;
};

const STORAGE_KEY = "clinora:last-result";

const AppPage = () => {
  const [transcript, setTranscript] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [supported, setSupported] = useState(true);
  const recognitionRef = useRef<any>(null);
  const baseTranscriptRef = useRef("");

  useEffect(() => {
    const SR =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      setSupported(false);
      return;
    }
    const recognition = new SR();
    recognition.lang = "uz-UZ";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event: any) => {
      let interim = "";
      let finalText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalText += t + " ";
        else interim += t;
      }
      if (finalText) {
        baseTranscriptRef.current = (baseTranscriptRef.current + " " + finalText).trim();
      }
      setTranscript((baseTranscriptRef.current + " " + interim).trim());
    };

    recognition.onerror = (e: any) => {
      console.error("Speech error:", e);
      if (e.error === "not-allowed") {
        toast.error("Микрофонга рухсат берилмади");
      } else if (e.error !== "no-speech" && e.error !== "aborted") {
        toast.error("Овоз танишда хатолик: " + e.error);
      }
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.result) setResult(parsed.result);
        if (parsed.transcript) {
          setTranscript(parsed.transcript);
          baseTranscriptRef.current = parsed.transcript;
        }
      } catch {}
    }

    return () => {
      try {
        recognition.stop();
      } catch {}
    };
  }, []);

  const toggleRecording = () => {
    if (!recognitionRef.current) return;
    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      baseTranscriptRef.current = transcript;
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (e) {
        console.error(e);
        toast.error("Ёзишни бошлаб бўлмади");
      }
    }
  };

  const handleAnalyze = async () => {
    if (!transcript.trim() || transcript.trim().length < 5) {
      toast.error("Аввал бемор суҳбатини ёзинг");
      return;
    }
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    }
    setIsAnalyzing(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("analyze", {
        body: { transcript },
      });
      if (error) {
        // Try to extract status-specific message
        const msg = (error as any).context?.error || (error as any).message || "Хатолик юз берди";
        toast.error(msg);
        return;
      }
      if ((data as any)?.error) {
        toast.error((data as any).error);
        return;
      }
      const res = data as AnalysisResult;
      setResult(res);
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ transcript, result: res }));
      toast.success("Таҳлил тайёр");
    } catch (e) {
      console.error(e);
      toast.error("Сўровни юбориб бўлмади");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleClear = () => {
    setTranscript("");
    setResult(null);
    baseTranscriptRef.current = "";
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--gradient-soft)" }}>
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-lg">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Орқага
          </Link>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg shadow-md" style={{ background: "var(--gradient-primary)" }}>
              <Stethoscope className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground">Clinora AI</span>
          </div>
          <div className="w-16" />
        </div>
      </header>

      <main className="container max-w-2xl py-8 md:py-12">
        {!supported && (
          <div className="mb-6 rounded-2xl border border-warning/30 bg-warning/10 p-4 text-sm text-warning-foreground">
            <strong className="text-warning">Диққат:</strong>{" "}
            <span className="text-foreground">Браузерингиз овоз танишни қўлламайди. Chrome ёки Edge'дан фойдаланинг.</span>
          </div>
        )}

        {/* Recorder card */}
        <section className="rounded-3xl border border-border bg-card p-6 shadow-md md:p-8">
          <div className="flex flex-col items-center text-center">
            <button
              onClick={toggleRecording}
              disabled={!supported}
              aria-label={isRecording ? "Тўхтатиш" : "Ёзишни бошлаш"}
              className="relative flex h-24 w-24 items-center justify-center rounded-full shadow-lg transition-all disabled:cursor-not-allowed disabled:opacity-50"
              style={{ background: isRecording ? "hsl(var(--destructive))" : "var(--gradient-primary)" }}
            >
              {isRecording && (
                <span
                  className="absolute inset-0 rounded-full animate-pulse-ring"
                  style={{ background: "hsl(var(--destructive) / 0.4)" }}
                />
              )}
              {isRecording ? (
                <MicOff className="relative h-10 w-10 text-destructive-foreground" />
              ) : (
                <Mic className="relative h-10 w-10 text-primary-foreground" />
              )}
            </button>
            <p className="mt-4 text-sm font-medium text-foreground">
              {isRecording ? "🔴 Ёзилмоқда... гапиринг" : "🎤 Ёзишни бошлаш"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Тил: ўзбек (uz-UZ)</p>
          </div>

          <div className="mt-6">
            <label className="mb-2 block text-xs font-medium text-muted-foreground">
              Жонли матн
            </label>
            <Textarea
              value={transcript}
              onChange={(e) => {
                setTranscript(e.target.value);
                baseTranscriptRef.current = e.target.value;
              }}
              placeholder="Бемор билан суҳбат шу ерда пайдо бўлади..."
              className="min-h-[140px] resize-none rounded-2xl border-border bg-background text-base"
            />
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !transcript.trim()}
              size="lg"
              className="flex-1 rounded-2xl shadow-md"
              style={{ background: "var(--gradient-primary)" }}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Таҳлил қилинмоқда...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  Анализ қилиш
                </>
              )}
            </Button>
            <Button
              onClick={handleClear}
              variant="outline"
              size="lg"
              className="rounded-2xl"
              disabled={isAnalyzing || (!transcript && !result)}
            >
              <Trash2 className="h-5 w-5" />
            </Button>
          </div>
        </section>

        {/* Loading skeleton */}
        {isAnalyzing && (
          <section className="mt-6 animate-fade-up rounded-3xl border border-border bg-card p-6 shadow-md">
            <div className="flex items-center gap-3">
              <Brain className="h-5 w-5 animate-pulse text-primary" />
              <span className="text-sm text-muted-foreground">AI таҳлил қилмоқда...</span>
            </div>
            <div className="mt-4 space-y-3">
              <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
              <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
              <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
            </div>
          </section>
        )}

        {/* Result */}
        {result && !isAnalyzing && (
          <section className="mt-6 animate-fade-up space-y-4">
            <div className="rounded-3xl border border-border bg-card p-6 shadow-md">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-primary">
                <span className="h-2 w-2 rounded-full bg-primary" />
                Симптомлар
              </h3>
              {result.symptoms.length ? (
                <ul className="space-y-2">
                  {result.symptoms.map((s, i) => (
                    <li key={i} className="flex gap-2 text-foreground">
                      <span className="text-primary">•</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">Симптомлар аниқланмади</p>
              )}
            </div>

            <div className="rounded-3xl border border-border bg-card p-6 shadow-md">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-primary">
                <span className="h-2 w-2 rounded-full bg-primary" />
                Тахминий ташхис
              </h3>
              <p className="leading-relaxed text-foreground">{result.diagnosis}</p>
            </div>

            <div className="rounded-3xl border border-border bg-card p-6 shadow-md">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-primary">
                <span className="h-2 w-2 rounded-full bg-primary" />
                Тавсия
              </h3>
              <p className="leading-relaxed text-foreground">{result.recommendation}</p>
            </div>
          </section>
        )}

        <p className="mt-8 text-center text-xs text-muted-foreground">
          ⚕️ Бу AI фақат ёрдамчи, якуний қарор шифокорга тегишли
        </p>
      </main>
    </div>
  );
};

export default AppPage;