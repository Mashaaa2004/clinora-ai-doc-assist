import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, Building2, Loader2, Send, AlertTriangle, CheckCircle2, Stethoscope } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

type Clinic = { id: string; name: string; address: string; languages_supported: string[] };

const NewRequest = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [symptoms, setSymptoms] = useState("");
  const [language, setLanguage] = useState("uz");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    supabase.from("clinics").select("id,name,address,languages_supported").eq("is_active", true).order("name")
      .then(({ data }) => setClinics((data as Clinic[]) ?? []));
    if (user) {
      supabase.from("patient_profiles").select("language").eq("user_id", user.id).maybeSingle()
        .then(({ data }) => { if (data?.language) setLanguage(data.language); });
    }
  }, [user]);

  const submit = async () => {
    if (!clinic || symptoms.trim().length < 5) {
      toast.error("Iltimos, shikoyatlaringizni batafsilroq yozing"); return;
    }
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("patient-route", {
      body: { clinic_id: clinic.id, symptoms: symptoms.trim(), language },
    });
    setBusy(false);
    if (error || !data?.report) { toast.error(error?.message || "Xatolik"); return; }
    setResult(data);
    setStep(3);
  };

  return (
    <>
      <Helmet><title>Yangi tibbiy so'rov — Clinora AI</title></Helmet>
      <div className="min-h-screen" style={{ background: "var(--gradient-soft)" }}>
        <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-lg">
          <div className="container flex h-14 items-center gap-2">
            <Link to="/patient" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" /> Orqaga
            </Link>
            <div className="ml-auto text-xs text-muted-foreground">{step}/3</div>
          </div>
        </header>

        <main className="container max-w-2xl px-4 py-6">
          {step === 1 && (
            <>
              <h1 className="text-xl font-semibold">Klinikani tanlang</h1>
              <p className="mt-1 text-sm text-muted-foreground">Faqat Clinora tarmog'iga ulangan klinikalar.</p>
              <div className="mt-4 grid gap-2">
                {clinics.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
                    Hozircha klinikalar ro'yxati bo'sh.
                  </div>
                )}
                {clinics.map((c) => (
                  <button key={c.id} onClick={() => { setClinic(c); setStep(2); }}
                    className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4 text-left shadow-sm transition hover:border-primary/60 hover:shadow-md">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-primary-foreground" style={{ background: "var(--gradient-primary)" }}>
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold">{c.name}</div>
                      <div className="mt-0.5 truncate text-xs text-muted-foreground">{c.address || "—"}</div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {(c.languages_supported || []).map((l) => (
                          <span key={l} className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase">{l}</span>
                        ))}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 2 && clinic && (
            <>
              <h1 className="text-xl font-semibold">Shikoyatlaringizni yozing</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Tanlangan klinika: <span className="font-medium text-foreground">{clinic.name}</span>
              </p>
              <div className="mt-4 space-y-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
                <div>
                  <Label htmlFor="lang">Til</Label>
                  <select id="lang" value={language} onChange={(e) => setLanguage(e.target.value)}
                    className="mt-1 h-10 w-full rounded-xl border border-input bg-background px-3 text-sm">
                    {(clinic.languages_supported || ["uz"]).map((l) => (
                      <option key={l} value={l}>{l.toUpperCase()}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="sym">Sizni nima bezovta qilmoqda?</Label>
                  <Textarea id="sym" value={symptoms} onChange={(e) => setSymptoms(e.target.value)} rows={6}
                    placeholder="Masalan: 3 kundan beri qattiq bosh og'rig'i, ko'ngil aynish..."
                    className="mt-1 rounded-xl" />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep(1)} className="rounded-xl">Orqaga</Button>
                  <Button onClick={submit} disabled={busy} className="flex-1 rounded-xl shadow-md" style={{ background: "var(--gradient-primary)" }}>
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="mr-2 h-4 w-4" /> Yuborish</>}
                  </Button>
                </div>
              </div>
            </>
          )}

          {step === 3 && result && (
            <ResultView result={result} onDone={() => navigate("/patient/requests")} />
          )}
        </main>
      </div>
    </>
  );
};

const ResultView = ({ result, onDone }: any) => {
  const r = result.report;
  const urgencyColor = r.ai_urgency === "emergency" ? "bg-destructive/20 text-destructive"
    : r.ai_urgency === "high" ? "bg-orange-500/20 text-orange-700 dark:text-orange-300"
    : r.ai_urgency === "low" ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300"
    : "bg-amber-500/20 text-amber-700 dark:text-amber-300";
  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-emerald-500/30 bg-card p-5 shadow-sm">
        <div className="flex items-center gap-2 text-emerald-600">
          <CheckCircle2 className="h-5 w-5" />
          <span className="font-semibold">So'rov qabul qilindi</span>
        </div>
        <div className="mt-3 space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <span className={"rounded-full px-2 py-0.5 text-xs font-semibold " + urgencyColor}>
              {r.ai_urgency === "emergency" ? <><AlertTriangle className="mr-1 inline h-3 w-3" /> SHOSHILINCH</>
                : r.ai_urgency === "high" ? "Yuqori"
                : r.ai_urgency === "low" ? "Past" : "O'rta"}
            </span>
            <span className="text-muted-foreground">·</span>
            <span className="font-medium">{r.recommended_specialization || "Terapevt"}</span>
          </div>
          <p className="rounded-xl bg-muted/50 p-3 text-sm">{r.ai_summary}</p>
        </div>
      </div>

      {result.doctor ? (
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Stethoscope className="h-4 w-4 text-primary" />
            Sizga tayinlangan shifokor
          </div>
          <div className="mt-2 text-base font-semibold">{result.doctor.full_name}</div>
          <div className="text-xs text-muted-foreground">{result.doctor.specialty || r.recommended_specialization}</div>
        </div>
      ) : (
        <div className="rounded-2xl border border-amber-500/30 bg-card p-4 text-sm text-muted-foreground">
          Klinikada hozircha mos shifokor band — administrator tez orada biriktiradi.
        </div>
      )}

      <Button onClick={onDone} className="w-full rounded-xl" style={{ background: "var(--gradient-primary)" }}>
        Mening so'rovlarim
      </Button>
    </div>
  );
};

export default NewRequest;