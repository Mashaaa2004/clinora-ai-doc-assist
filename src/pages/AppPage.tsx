import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  BarChart3,
  Brain,
  CheckCircle2,
  Download,
  FileText,
  Loader2,
  LogOut,
  Mic,
  MicOff,
  Pencil,
  Pill,
  Plus,
  Sparkles,
  Stethoscope,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import jsPDF from "jspdf";

type Prescription = {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  notes?: string;
};

type AnalysisResult = {
  symptoms: string[];
  diagnosis: string;
  recommendation: string;
  prescriptions: Prescription[];
};

type Confirmed = {
  patientName: string;
  result: AnalysisResult;
  confirmedAt: string;
};

const STORAGE_KEY = "clinora:last-result";

const emptyPrescription = (): Prescription => ({
  name: "",
  dosage: "",
  frequency: "",
  duration: "",
  notes: "",
});

const AppPage = () => {
  const { profile, user, signOut } = useAuth();
  const [transcript, setTranscript] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [patientName, setPatientName] = useState("");
  const [confirmed, setConfirmed] = useState<Confirmed | null>(null);
  const [supported, setSupported] = useState(true);
  const recognitionRef = useRef<any>(null);
  const baseTranscriptRef = useRef("");

  useEffect(() => {
    const SR =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      setSupported(false);
    } else {
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
        if (e.error === "not-allowed") toast.error("Микрофонга рухсат берилмади");
        else if (e.error !== "no-speech" && e.error !== "aborted")
          toast.error("Овоз танишда хатолик: " + e.error);
      };

      recognition.onend = () => setIsRecording(false);
      recognitionRef.current = recognition;
    }

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.transcript) {
          setTranscript(parsed.transcript);
          baseTranscriptRef.current = parsed.transcript;
        }
        if (parsed.result) setResult(parsed.result);
        if (parsed.patientName) setPatientName(parsed.patientName);
        if (parsed.confirmed) setConfirmed(parsed.confirmed);
      } catch {}
    }

    return () => {
      try {
        recognitionRef.current?.stop();
      } catch {}
    };
  }, []);

  const persist = (next: Partial<{ transcript: string; result: AnalysisResult | null; patientName: string; confirmed: Confirmed | null }>) => {
    const current = {
      transcript,
      result,
      patientName,
      confirmed,
      ...next,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  };

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
      } catch {
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
    setConfirmed(null);
    try {
      const { data, error } = await supabase.functions.invoke("analyze", {
        body: { transcript },
      });
      if (error) {
        const msg = (error as any).context?.error || (error as any).message || "Хатолик";
        toast.error(msg);
        return;
      }
      if ((data as any)?.error) {
        toast.error((data as any).error);
        return;
      }
      const res = data as AnalysisResult;
      if (!res.prescriptions) res.prescriptions = [];
      setResult(res);
      persist({ result: res, confirmed: null });
      toast.success("Таҳлил тайёр — таҳрирлаб тасдиқланг");
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
    setConfirmed(null);
    setPatientName("");
    baseTranscriptRef.current = "";
    localStorage.removeItem(STORAGE_KEY);
  };

  // ---- Editing helpers ----
  const updateResult = (updater: (r: AnalysisResult) => AnalysisResult) => {
    setResult((prev) => {
      if (!prev) return prev;
      const next = updater(prev);
      persist({ result: next });
      return next;
    });
  };

  const updateSymptom = (i: number, v: string) =>
    updateResult((r) => ({ ...r, symptoms: r.symptoms.map((s, idx) => (idx === i ? v : s)) }));
  const removeSymptom = (i: number) =>
    updateResult((r) => ({ ...r, symptoms: r.symptoms.filter((_, idx) => idx !== i) }));
  const addSymptom = () =>
    updateResult((r) => ({ ...r, symptoms: [...r.symptoms, ""] }));

  const updatePrescription = (i: number, field: keyof Prescription, v: string) =>
    updateResult((r) => ({
      ...r,
      prescriptions: r.prescriptions.map((p, idx) => (idx === i ? { ...p, [field]: v } : p)),
    }));
  const removePrescription = (i: number) =>
    updateResult((r) => ({ ...r, prescriptions: r.prescriptions.filter((_, idx) => idx !== i) }));
  const addPrescription = () =>
    updateResult((r) => ({ ...r, prescriptions: [...r.prescriptions, emptyPrescription()] }));

  const handleConfirm = async () => {
    if (!result) return;
    const cleaned: AnalysisResult = {
      ...result,
      symptoms: result.symptoms.map((s) => s.trim()).filter(Boolean),
      prescriptions: result.prescriptions
        .map((p) => ({
          name: p.name.trim(),
          dosage: p.dosage.trim(),
          frequency: p.frequency.trim(),
          duration: p.duration.trim(),
          notes: p.notes?.trim() || "",
        }))
        .filter((p) => p.name),
    };
    if (!cleaned.diagnosis.trim()) {
      toast.error("Ташхис бўш бўлмаслиги керак");
      return;
    }
    const conf: Confirmed = {
      patientName: patientName.trim() || "Бемор",
      result: cleaned,
      confirmedAt: new Date().toISOString(),
    };
    setResult(cleaned);
    setConfirmed(conf);
    persist({ result: cleaned, patientName: conf.patientName, confirmed: conf });
    if (user) {
      const { error } = await supabase.from("prescriptions_log").insert({
        user_id: user.id,
        doctor_name: profile?.full_name || "",
        hospital: profile?.hospital || "",
        patient_name: conf.patientName,
        symptoms_count: cleaned.symptoms.length,
        prescriptions_count: cleaned.prescriptions.length,
      });
      if (error) console.error("log insert failed:", error);
    }
    toast.success("Тасдиқланди — PDF юклаб олса бўлади");
  };

  const handleEditAgain = () => {
    setConfirmed(null);
    persist({ confirmed: null });
  };

  // ---- PDF ----
  const generatePdf = () => {
    if (!confirmed) return;
    const { result: r, patientName: pn, confirmedAt } = confirmed;
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const margin = 48;
    let y = margin;

    // Header band
    doc.setFillColor(33, 118, 235);
    doc.rect(0, 0, pageW, 70, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("Clinora AI", margin, 32);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("Tibbiy xulosa va retsept", margin, 52);

    y = 100;
    doc.setTextColor(20, 20, 20);
    doc.setFontSize(11);
    const dateStr = new Date(confirmedAt).toLocaleString("ru-RU");
    const docName = profile?.full_name?.trim() || "Shifokor";
    const hosp = profile?.hospital?.trim() || "";
    doc.text(`Bemor: ${pn}`, margin, y);
    doc.text(`Sana: ${dateStr}`, pageW - margin, y, { align: "right" });
    y += 16;
    doc.text(`Davolovchi shifokor: ${docName}`, margin, y);
    if (hosp) doc.text(hosp, pageW - margin, y, { align: "right" });
    y += 16;
    doc.setDrawColor(220);
    doc.line(margin, y, pageW - margin, y);
    y += 20;

    const section = (title: string) => {
      if (y > 760) { doc.addPage(); y = margin; }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(33, 118, 235);
      doc.text(title, margin, y);
      y += 16;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(20, 20, 20);
    };

    const writeWrapped = (text: string, x = margin, maxW = pageW - margin * 2) => {
      const lines = doc.splitTextToSize(text, maxW);
      lines.forEach((line: string) => {
        if (y > 780) { doc.addPage(); y = margin; }
        doc.text(line, x, y);
        y += 15;
      });
    };

    section("Simptomlar");
    if (r.symptoms.length === 0) writeWrapped("—");
    else r.symptoms.forEach((s) => writeWrapped(`• ${s}`));
    y += 6;

    section("Tashxis");
    writeWrapped(r.diagnosis || "—");
    y += 6;

    section("Tavsiya");
    writeWrapped(r.recommendation || "—");
    y += 6;

    section("Retsept (dorilar)");
    if (r.prescriptions.length === 0) writeWrapped("—");
    else {
      r.prescriptions.forEach((p, i) => {
        if (y > 740) { doc.addPage(); y = margin; }
        doc.setFont("helvetica", "bold");
        writeWrapped(`${i + 1}. ${p.name}`);
        doc.setFont("helvetica", "normal");
        writeWrapped(`   Doza: ${p.dosage}   |   Tartib: ${p.frequency}   |   Davomiyligi: ${p.duration}`);
        if (p.notes) writeWrapped(`   Izoh: ${p.notes}`);
        y += 4;
      });
    }

    y += 20;
    if (y > 740) { doc.addPage(); y = margin; }
    doc.setDrawColor(220);
    doc.line(margin, y, pageW - margin, y);
    y += 18;
    doc.setFontSize(10);
    doc.setTextColor(120);
    writeWrapped("Eslatma: ushbu hujjat shifokor tomonidan tasdiqlangan. AI faqat yordamchi sifatida ishlatilgan, yakuniy qaror shifokorga tegishli.");
    y += 10;
    doc.setTextColor(20);
    doc.setFontSize(11);
    doc.text(`Shifokor: ${docName}`, margin, y + 20);
    doc.text("Imzo: ____________________", pageW - margin, y + 20, { align: "right" });

    const safe = pn.replace(/[^a-zA-Z0-9-_]/g, "_") || "bemor";
    doc.save(`Clinora_${safe}_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const cardCls = "rounded-3xl border border-border bg-card p-6 shadow-md";
  const labelCls = "mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-primary";

  return (
    <div className="min-h-screen" style={{ background: "var(--gradient-soft)" }}>
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-lg">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg shadow-md" style={{ background: "var(--gradient-primary)" }}>
              <Stethoscope className="h-4 w-4 text-primary-foreground" />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold text-foreground">Clinora AI</div>
              {profile?.full_name && (
                <div className="text-[11px] text-muted-foreground">
                  Др. {profile.full_name}{profile.hospital ? ` · ${profile.hospital}` : ""}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Link to="/analytics">
              <Button variant="ghost" size="sm" className="rounded-full">
                <BarChart3 className="h-4 w-4 sm:mr-1.5" />
                <span className="hidden sm:inline">Аналитика</span>
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={signOut} className="rounded-full">
              <LogOut className="h-4 w-4 sm:mr-1.5" />
              <span className="hidden sm:inline">Чиқиш</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container max-w-2xl py-8 md:py-12">
        {!supported && (
          <div className="mb-6 rounded-2xl border border-warning/30 bg-warning/10 p-4 text-sm">
            <strong className="text-warning">Диққат:</strong>{" "}
            <span className="text-foreground">Браузерингиз овоз танишни қўлламайди. Chrome ёки Edge'дан фойдаланинг.</span>
          </div>
        )}

        {/* Recorder */}
        <section className={cardCls + " md:p-8"}>
          <div className="flex flex-col items-center text-center">
            <button
              onClick={toggleRecording}
              disabled={!supported}
              aria-label={isRecording ? "Тўхтатиш" : "Ёзишни бошлаш"}
              className="relative flex h-24 w-24 items-center justify-center rounded-full shadow-lg transition-all disabled:cursor-not-allowed disabled:opacity-50"
              style={{ background: isRecording ? "hsl(var(--destructive))" : "var(--gradient-primary)" }}
            >
              {isRecording && (
                <span className="absolute inset-0 rounded-full animate-pulse-ring" style={{ background: "hsl(var(--destructive) / 0.4)" }} />
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
            <label className="mb-2 block text-xs font-medium text-muted-foreground">Жонли матн</label>
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
                <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Таҳлил қилинмоқда...</>
              ) : (
                <><Sparkles className="mr-2 h-5 w-5" /> Анализ қилиш</>
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

        {/* Loading */}
        {isAnalyzing && (
          <section className={"mt-6 animate-fade-up " + cardCls}>
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

        {/* Editable result */}
        {result && !isAnalyzing && !confirmed && (
          <section className="mt-6 animate-fade-up space-y-4">
            <div className={cardCls}>
              <div className="mb-3 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <Pencil className="h-4 w-4" /> AI натижасини таҳрирланг ва тасдиқланг
              </div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Бемор Ф.И.О.</label>
              <Input
                value={patientName}
                onChange={(e) => { setPatientName(e.target.value); persist({ patientName: e.target.value }); }}
                placeholder="Масалан: Алиев Аброр"
                className="rounded-xl"
              />
            </div>

            {/* Symptoms */}
            <div className={cardCls}>
              <h3 className={labelCls}><span className="h-2 w-2 rounded-full bg-primary" /> Симптомлар</h3>
              <div className="space-y-2">
                {result.symptoms.map((s, i) => (
                  <div key={i} className="flex gap-2">
                    <Input value={s} onChange={(e) => updateSymptom(i, e.target.value)} className="rounded-xl" />
                    <Button variant="outline" size="icon" onClick={() => removeSymptom(i)} className="rounded-xl shrink-0">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" onClick={addSymptom} className="rounded-xl w-full">
                  <Plus className="mr-2 h-4 w-4" /> Симптом қўшиш
                </Button>
              </div>
            </div>

            {/* Diagnosis */}
            <div className={cardCls}>
              <h3 className={labelCls}><span className="h-2 w-2 rounded-full bg-primary" /> Тахминий ташхис</h3>
              <Textarea
                value={result.diagnosis}
                onChange={(e) => updateResult((r) => ({ ...r, diagnosis: e.target.value }))}
                className="min-h-[90px] rounded-2xl"
              />
            </div>

            {/* Recommendation */}
            <div className={cardCls}>
              <h3 className={labelCls}><span className="h-2 w-2 rounded-full bg-primary" /> Тавсия</h3>
              <Textarea
                value={result.recommendation}
                onChange={(e) => updateResult((r) => ({ ...r, recommendation: e.target.value }))}
                className="min-h-[100px] rounded-2xl"
              />
            </div>

            {/* Prescriptions */}
            <div className={cardCls}>
              <h3 className={labelCls}><Pill className="h-4 w-4" /> Тахминий рецепт (дорилар)</h3>
              <p className="-mt-2 mb-4 text-xs text-muted-foreground">
                AI таклиф қилди. Шифокор қайта кўриб чиқиб, ўзгартириши шарт.
              </p>
              <div className="space-y-4">
                {result.prescriptions.map((p, i) => (
                  <div key={i} className="rounded-2xl border border-border/70 bg-background/60 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">№ {i + 1}</span>
                      <Button variant="ghost" size="icon" onClick={() => removePrescription(i)} className="h-7 w-7">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <label className="mb-1 block text-xs text-muted-foreground">Дори номи</label>
                        <Input value={p.name} onChange={(e) => updatePrescription(i, "name", e.target.value)} className="rounded-xl" />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-muted-foreground">Доза</label>
                        <Input value={p.dosage} onChange={(e) => updatePrescription(i, "dosage", e.target.value)} className="rounded-xl" placeholder="500 мг" />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-muted-foreground">Тартиб</label>
                        <Input value={p.frequency} onChange={(e) => updatePrescription(i, "frequency", e.target.value)} className="rounded-xl" placeholder="Кунига 3 маҳал" />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-muted-foreground">Давомийлиги</label>
                        <Input value={p.duration} onChange={(e) => updatePrescription(i, "duration", e.target.value)} className="rounded-xl" placeholder="5 кун" />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-muted-foreground">Изоҳ</label>
                        <Input value={p.notes || ""} onChange={(e) => updatePrescription(i, "notes", e.target.value)} className="rounded-xl" placeholder="Овқатдан кейин" />
                      </div>
                    </div>
                  </div>
                ))}
                <Button variant="outline" onClick={addPrescription} className="rounded-xl w-full">
                  <Plus className="mr-2 h-4 w-4" /> Дори қўшиш
                </Button>
              </div>
            </div>

            <Button
              onClick={handleConfirm}
              size="lg"
              className="w-full rounded-2xl shadow-md"
              style={{ background: "var(--gradient-primary)" }}
            >
              <CheckCircle2 className="mr-2 h-5 w-5" />
              Шифокор сифатида тасдиқлаш
            </Button>
          </section>
        )}

        {/* Confirmed view */}
        {confirmed && (
          <section className="mt-6 animate-fade-up space-y-4">
            <div className={cardCls + " border-success/40"}>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-6 w-6 text-success" />
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">Тасдиқланди</h3>
                  <p className="text-sm text-muted-foreground">
                    Бемор: <span className="font-medium text-foreground">{confirmed.patientName}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(confirmed.confirmedAt).toLocaleString("ru-RU")}
                  </p>
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <Button
                  onClick={generatePdf}
                  size="lg"
                  className="flex-1 rounded-2xl shadow-md"
                  style={{ background: "var(--gradient-primary)" }}
                >
                  <Download className="mr-2 h-5 w-5" /> PDF юклаб олиш
                </Button>
                <Button onClick={handleEditAgain} variant="outline" size="lg" className="rounded-2xl">
                  <Pencil className="mr-2 h-4 w-4" /> Қайта таҳрирлаш
                </Button>
              </div>
            </div>

            {/* Read-only preview */}
            <div className={cardCls}>
              <h3 className={labelCls}><FileText className="h-4 w-4" /> Хулоса (превью)</h3>
              <div className="space-y-4 text-sm">
                <div>
                  <div className="mb-1 text-xs uppercase text-muted-foreground">Симптомлар</div>
                  {confirmed.result.symptoms.length ? (
                    <ul className="space-y-1">
                      {confirmed.result.symptoms.map((s, i) => (
                        <li key={i} className="flex gap-2"><span className="text-primary">•</span><span>{s}</span></li>
                      ))}
                    </ul>
                  ) : <p className="text-muted-foreground">—</p>}
                </div>
                <div>
                  <div className="mb-1 text-xs uppercase text-muted-foreground">Ташхис</div>
                  <p>{confirmed.result.diagnosis}</p>
                </div>
                <div>
                  <div className="mb-1 text-xs uppercase text-muted-foreground">Тавсия</div>
                  <p>{confirmed.result.recommendation}</p>
                </div>
                <div>
                  <div className="mb-1 text-xs uppercase text-muted-foreground">Рецепт</div>
                  {confirmed.result.prescriptions.length ? (
                    <ol className="space-y-2">
                      {confirmed.result.prescriptions.map((p, i) => (
                        <li key={i} className="rounded-xl bg-muted/40 p-3">
                          <div className="font-medium">{i + 1}. {p.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {p.dosage} · {p.frequency} · {p.duration}
                            {p.notes ? ` · ${p.notes}` : ""}
                          </div>
                        </li>
                      ))}
                    </ol>
                  ) : <p className="text-muted-foreground">—</p>}
                </div>
              </div>
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
