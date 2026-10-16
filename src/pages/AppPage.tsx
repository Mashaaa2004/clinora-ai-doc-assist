import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  BarChart3,
  Brain,
  Check,
  CheckCircle2,
  Crown,
  Download,
  FileText,
  FlaskConical,
  HeartHandshake,
  History as HistoryIcon,
  HelpCircle,
  ShieldCheck,
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
  User,
  X,
  Activity,
  Inbox,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useT } from "@/i18n/LanguageContext";
import { SR_LOCALE, DATE_LOCALE } from "@/i18n/translations";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import GuideModal from "@/components/GuideModal";
import { OPEN_LEGAL_EVENT } from "@/components/LegalConsentModal";
import SupportFooter from "@/components/SupportFooter";
import { Helmet } from "react-helmet-async";
import QRCode from "qrcode";
import { Checkbox } from "@/components/ui/checkbox";
import { useAishaStt } from "@/hooks/useAishaStt";
import ClinicalReview, { type ClinicalFields } from "@/components/ClinicalReview";
import { FunctionsHttpError } from "@supabase/supabase-js";


type Prescription = {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  notes?: string;
};

type LabTest = { name: string; reason?: string; result?: string };
type InstrTest = { name: string; reason?: string; result?: string };
type Differential = {
  name: string;
  probability: "high" | "medium" | "low";
  reasoning: string;
};
type Comorbidity = {
  name: string;
  risk_level: "high" | "medium" | "low";
  reasoning: string;
  specialist?: string;
  referral_note?: string;
};

type AnalysisResult = ClinicalFields & {
  symptoms: string[];
  recommendation: string;
  prescriptions: Prescription[];
  lab_tests: LabTest[];
  instrumental_tests: InstrTest[];
  differentials: Differential[];
  comorbidities: Comorbidity[];
  family_advice: string;
};

const STORAGE_KEY = "clinora:last-result-v2";
const GUIDE_KEY = "clinora:guide-seen";
const LAST_USER_KEY = "clinora:last-user";

const emptyRx = (): Prescription => ({ name: "", dosage: "", frequency: "", duration: "", notes: "" });
const emptyLab = (): LabTest => ({ name: "", reason: "", result: "" });
const emptyInstr = (): InstrTest => ({ name: "", reason: "", result: "" });

type Step = 1 | 2 | 3 | 4 | 5;

const AppPage = () => {
  const { profile, user, signOut, isPro, refreshProfile } = useAuth();
  const { t, lang } = useT();

  const [step, setStep] = useState<Step>(1);
  const [transcript, setTranscript] = useState("");
  const [patientName, setPatientName] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [chosenIdx, setChosenIdx] = useState<number>(0);
  const [confirmed, setConfirmed] = useState(false);
  const [reviewAccepted,setReviewAccepted]=useState(false);
  const [saving,setSaving]=useState(false);
  const [aiConsent,setAiConsent]=useState(false);
  const [selectedComorb, setSelectedComorb] = useState<number[]>([]);
  const [supported, setSupported] = useState(true);
  const [showGuide, setShowGuide] = useState(false);
  const [consultationId, setConsultationId] = useState<string | null>(null);
  const [patientCode, setPatientCode] = useState<string>("");

  const recognitionRef = useRef<any>(null);
  const baseTranscriptRef = useRef("");
  const aishaActiveRef = useRef(false);
  const aisha = useAishaStt();

  // ---- init ----
  useEffect(() => {
    if (!localStorage.getItem(GUIDE_KEY)) setShowGuide(true);

    // When a different doctor signs in (or a fresh login), reset platform to
    // a clean slate so a new patient's data can be entered from scratch.
    const lastUser = localStorage.getItem(LAST_USER_KEY);
    const currentUser = user?.id ?? null;
    if (currentUser && lastUser !== currentUser) {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.setItem(LAST_USER_KEY, currentUser);
      setStep(1);
      setTranscript("");
      setPatientName("");
      setResult(null);
      setChosenIdx(0);
      setConfirmed(false);
      setSelectedComorb([]);
      setPatientCode("");
      setConsultationId(null);
      baseTranscriptRef.current = "";
      return;
    }

    // Check for copied consultation from history
    const copyData = sessionStorage.getItem("clinora:copy-consultation");
    if (copyData) {
      try {
        const parsed = JSON.parse(copyData);
        if (parsed.patientName) setPatientName(parsed.patientName);
        if (parsed.transcript) {
          setTranscript(parsed.transcript);
          baseTranscriptRef.current = parsed.transcript;
        }
        sessionStorage.removeItem("clinora:copy-consultation");
        toast.success(t("hist.copied"));
      } catch {}
    }

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const p = JSON.parse(saved);
        if (p.transcript) {
          setTranscript(p.transcript);
          baseTranscriptRef.current = p.transcript;
        }
        if (p.patientName) setPatientName(p.patientName);
        if (p.result) setResult(p.result);
        if (typeof p.chosenIdx === "number") setChosenIdx(p.chosenIdx);
        if (typeof p.step === "number") setStep(p.step);
        // Approval is never restored from mutable browser storage.
        setConfirmed(false);
        if (Array.isArray(p.selectedComorb)) setSelectedComorb(p.selectedComorb);
      } catch {}
    }
  }, [user?.id]);

  // ---- speech recognition (re-init on language change) ----
  useEffect(() => {
    const SR =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      setSupported(false);
      return;
    }
    try { recognitionRef.current?.stop(); } catch {}

    const recognition = new SR();
    recognition.lang = SR_LOCALE[lang];
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event: any) => {
      let interim = "";
      let finalText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const tr = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalText += tr + " ";
        else interim += tr;
      }
      if (finalText) {
        baseTranscriptRef.current = (baseTranscriptRef.current + " " + finalText).trim();
      }
      setTranscript((baseTranscriptRef.current + " " + interim).trim());
    };
    recognition.onerror = (e: any) => {
      if (e.error === "not-allowed") toast.error("Microphone permission denied");
      else if (e.error !== "no-speech" && e.error !== "aborted")
        toast.error("Speech error: " + e.error);
    };
    recognition.onend = () => setIsRecording(false);
    recognitionRef.current = recognition;

    return () => { try { recognition.stop(); } catch {} };
  }, [lang]);

  const persist = (extra?: Partial<{ result: AnalysisResult | null; chosenIdx: number; step: Step; confirmed: boolean; patientName: string; transcript: string; selectedComorb: number[] }>) => {
    const data = {
      transcript,
      patientName,
      result,
      chosenIdx,
      step,
      confirmed,
      selectedComorb,
      ...extra,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  };

  const startBrowserRecognition = () => {
    if (!recognitionRef.current) { toast.error("Speech recognition is not available"); return; }
    baseTranscriptRef.current = transcript;
    try {
      recognitionRef.current.start();
      setIsRecording(true);
    } catch { toast.error("Could not start recording"); }
  };

  const stopRecording = () => {
    if (aishaActiveRef.current) {
      aisha.stop();
      aishaActiveRef.current = false;
    }
    try { recognitionRef.current?.stop(); } catch {}
    setIsRecording(false);
  };

  const toggleRecording = async () => {
    if (isRecording) { stopRecording(); return; }
    if (user && !localStorage.getItem("clinora_consult_start")) {
      const startedAt = new Date().toISOString();
      localStorage.setItem("clinora_consult_start", startedAt);
      supabase.from("doctor_activity").upsert({
        user_id: user.id, status: "in_consultation", consultation_started_at: startedAt, last_seen_at: startedAt,
      }).then(() => {});
    }


    baseTranscriptRef.current = transcript;
    try {
      await aisha.start(lang, {
        onPartial: (txt) => setTranscript((baseTranscriptRef.current + " " + txt).trim()),
        onFinal: (txt) => {
          baseTranscriptRef.current = (baseTranscriptRef.current + " " + txt).trim();
          setTranscript(baseTranscriptRef.current);
        },
        onError: () => {
          // Aisha dropped mid-session — switch to the browser recognizer.
          if (!aishaActiveRef.current) return;
          aishaActiveRef.current = false;
          aisha.stop();
          startBrowserRecognition();
        },
        onClose: () => {
          if (aishaActiveRef.current) {
            aishaActiveRef.current = false;
            setIsRecording(false);
          }
        },

      });
      aishaActiveRef.current = true;
      setIsRecording(true);
    } catch {
      // Aisha unavailable — fall back to the browser recognizer.
      aishaActiveRef.current = false;
      startBrowserRecognition();
    }
  };


  // ---- run AI analysis ----
  const runAnalysis = async () => {
    if(!aiConsent){toast.error("Bemorning AI orqali qayta ishlash roziligi talab qilinadi.");return;}
    if (!transcript.trim() || transcript.trim().length < 5) { toast.error(t("err.short")); return; }
    if (!isPro && user) {
      const { data: cnt } = await supabase.rpc("daily_usage_count", { _user_id: user.id });
      if ((cnt ?? 0) >= 5) { toast.error(t("err.dailyLimit")); return; }
    }
    if (isRecording) stopRecording();
    setIsAnalyzing(true);

    // Build previous history
    let previousHistory = "";
    const pn = patientName.trim();
    if (pn.length >= 2) {
      const { data: prev } = await supabase
        .from("consultations")
        .select("created_at,chosen_diagnosis,diagnosis,symptoms,recommendation,prescriptions,lab_tests,instrumental_tests")
        .eq("user_id", user?.id ?? "")
        .ilike("patient_name", pn)
        .order("created_at", { ascending: false })
        .limit(5);
      if (prev && prev.length > 0) {
        previousHistory = prev.map((c: any, i: number) => {
          const d = new Date(c.created_at).toLocaleDateString(DATE_LOCALE[lang]);
          const sx = Array.isArray(c.symptoms) ? c.symptoms.join(", ") : "";
          const rx = Array.isArray(c.prescriptions) ? c.prescriptions.map((p: any) => p.name).join(", ") : "";
          return `[${i + 1}] ${d} — Dx: ${c.chosen_diagnosis || c.diagnosis || "—"}. Sx: ${sx || "—"}. Rx: ${rx || "—"}. Plan: ${c.recommendation || "—"}`;
        }).join("\n");
      }
    }

    // Build labResults / instrumentalResults from already-entered values
    const labResults = (result?.lab_tests || [])
      .filter((l) => l.result && l.result.trim())
      .map((l) => `- ${l.name}: ${l.result}`).join("\n");
    const instrumentalResults = (result?.instrumental_tests || [])
      .filter((l) => l.result && l.result.trim())
      .map((l) => `- ${l.name}: ${l.result}`).join("\n");

    try {
      const { data, error } = await supabase.functions.invoke("analyze", {
        body: { transcript, patientName, previousHistory, language: lang, labResults, instrumentalResults, consentConfirmed: aiConsent },
      });
      if (error) {
        let msg=error.message;
        if(error instanceof FunctionsHttpError){const details=await error.context.json().catch(()=>({}));msg=details.error??msg;}
        toast.error(msg); return;
      }
      if ((data as any)?.error) { toast.error((data as any).error); return; }
      const res = data as AnalysisResult;
      // Sanitize
      res.symptoms ||= [];
      res.prescriptions ||= [];
      res.lab_tests ||= [];
      res.instrumental_tests ||= [];
      res.differentials ||= [];
      (res as any).comorbidities ||= [];
      res.family_advice ||= "";
      res.recommendation ||= "";
      // Merge previously-entered lab/instr results so doctor's input isn't lost
      if (result) {
        const mergeResults = <T extends { name: string; result?: string }>(neu: T[], old: T[]): T[] => {
          return neu.map((n) => {
            const match = old.find((o) => o.name?.trim().toLowerCase() === n.name?.trim().toLowerCase());
            return match?.result ? { ...n, result: match.result } : n;
          });
        };
        res.lab_tests = mergeResults(res.lab_tests, result.lab_tests || []);
        res.instrumental_tests = mergeResults(res.instrumental_tests, result.instrumental_tests || []);
      }
      setResult(res);
      setReviewAccepted(false);
      setChosenIdx(0);
      setSelectedComorb([]);
      setConfirmed(false);
      // Move to step 2 (lab)
      const nextStep: Step = 2;
      setStep(nextStep);
      persist({ result: res, chosenIdx: 0, step: nextStep, confirmed: false, selectedComorb: [] });
      toast.success("AI: " + (res.differentials?.length || 0) + " diagnoses + " + (res.lab_tests?.length || 0) + " labs");
    } catch (e) {
      console.error(e); toast.error(t("err.failed"));
    } finally { setIsAnalyzing(false); }
  };

  // ---- updaters ----
  const update = (fn: (r: AnalysisResult) => AnalysisResult) => {
    setResult((p) => {
      if (!p) return p;
      const n = fn(p);
      setConfirmed(false);
      setReviewAccepted(false);
      const data = { transcript, patientName, result: n, chosenIdx, step, confirmed };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return n;
    });
  };

  const handleClear = () => {
    setStep(1); setTranscript(""); setPatientName("");
    setResult(null); setChosenIdx(0); setConfirmed(false);
    setSelectedComorb([]);
    setReviewAccepted(false);
    setAiConsent(false);
    setConsultationId(null);
    setPatientCode("");
    baseTranscriptRef.current = "";
    localStorage.removeItem(STORAGE_KEY);
  };

  const goToStep = (s: Step) => { setStep(s); persist({ step: s }); };

  // ---- confirm & save ----
  const handleConfirm = async () => {
    if (!result || !user || !result.draft_id || !reviewAccepted || saving) return;
    const chosen = result.differentials[chosenIdx];
    if (!chosen?.name?.trim()) { toast.error(t("err.diagnosisEmpty")); return; }
    setSaving(true);
    const endedAt=new Date();
    const startIso=localStorage.getItem("clinora_consult_start");
    const startedAt=startIso?new Date(startIso):null;
    const cleaned={...result,symptoms:result.symptoms.map(s=>s.trim()).filter(Boolean),recommendation:result.recommendation.trim(),family_advice:result.family_advice.trim()};
    const docPrefix=user.id.replace(/-/g,"").slice(0,4).toUpperCase();
    const newCode=`${docPrefix}-${endedAt.getFullYear()}${String(endedAt.getMonth()+1).padStart(2,"0")}${String(endedAt.getDate()).padStart(2,"0")}-${Math.random().toString(36).slice(2,6).toUpperCase()}`;
    try {
      const {data:id,error}=await supabase.rpc("review_clinical_draft",{draft_id:result.draft_id,decision:"approved",edited:cleaned as any,final_record:{patient_name:patientName.trim(),patient_code:newCode,transcript,diagnosis:chosen.name,language:lang,started_at:startedAt?.toISOString()??null,duration_seconds:startedAt?Math.max(0,Math.round((endedAt.getTime()-startedAt.getTime())/1000)):null}});
      if(error)throw error;
      setResult(cleaned);setConfirmed(true);setStep(5);setPatientCode(newCode);setConsultationId(id);
      persist({result:cleaned,confirmed:false,step:5});
      localStorage.removeItem("clinora_consult_start");
      await supabase.from("doctor_activity").upsert({user_id:user.id,status:"idle",consultation_started_at:null,last_seen_at:endedAt.toISOString()});
      await supabase.from("prescriptions_log").insert({user_id:user.id,doctor_name:profile?.full_name??"",hospital:profile?.hospital??"",patient_name:patientName.trim(),symptoms_count:cleaned.symptoms.length,prescriptions_count:cleaned.prescriptions.length});
      toast.success(t("status.confirmed"));
    }catch(e){toast.error(e instanceof Error?e.message:"Tasdiqlash saqlanmadi");}finally{setSaving(false);}
  };
  const rejectDraft=async()=>{
    if(!result?.draft_id)return;
    const {error}=await supabase.rpc("review_clinical_draft",{draft_id:result.draft_id,decision:"rejected",edited:result as any});
    if(error){toast.error(error.message);return;} handleClear();toast.info("Qoralama rad etildi");
  };

  // ---- PDF ----
  const generatePdf = async () => {
    if (!result || !confirmed || !consultationId || !user) return;
    const {data: approved}=await supabase.from("consultations").select("document_status").eq("id",consultationId).eq("user_id",user.id).maybeSingle();
    if(approved?.document_status!=="approved"){toast.error("Shifokor tasdig‘i talab qilinadi");return;}
    // Refresh profile so latest doctor/hospital info appears on the PDF
    try { await refreshProfile(); } catch {}
    const chosen = result.differentials[chosenIdx];
    const pn = patientName.trim() || (lang === "ru" ? "Пациент" : lang === "en" ? "Patient" : "Бемор");
    const dateStr = new Date().toLocaleString(DATE_LOCALE[lang]);
    const docName = profile?.full_name?.trim() || "—";
    const specialty = profile?.specialty?.trim() || "";
    const docPhone = profile?.phone?.trim() || "";
    const workHours = profile?.work_hours?.trim() || "";
    const hosp = profile?.hospital?.trim() || "";
    const hospPhone = profile?.hospital_phone?.trim() || "";
    const hospAddr = profile?.hospital_address?.trim() || "";
    const docIg = (profile as any)?.doctor_instagram?.trim() || "";
    const docTg = (profile as any)?.doctor_telegram?.trim() || "";
    const clinicIg = (profile as any)?.clinic_instagram?.trim() || "";
    const clinicTg = (profile as any)?.clinic_telegram?.trim() || "";
    const at = (s: string) => (s.startsWith("@") || s.startsWith("http") ? s : "@" + s);

    // QR encodes a real, scannable verification URL that opens the public verify page.
    const origin = window.location.origin;
    const verifyUrl = consultationId ? `${origin}/verify/${consultationId}?print=1` : origin;
    const appUrl = origin;
    let qrVerifyUrl = "";
    let qrAppUrl = "";
    try { qrVerifyUrl = await QRCode.toDataURL(verifyUrl, { width: 220, margin: 1, errorCorrectionLevel: "M" }); } catch {}
    try { qrAppUrl = await QRCode.toDataURL(appUrl, { width: 220, margin: 1, errorCorrectionLevel: "M" }); } catch {}

    const esc = (s: string) => (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const L = (key: string) => t(key);

    const symptomsHtml = result.symptoms.length
      ? `<ul class="bul">${result.symptoms.map((s) => `<li>${esc(s)}</li>`).join("")}</ul>`
      : `<p class="muted">—</p>`;

    const labsHtml = result.lab_tests.length
      ? `<table class="rx"><thead><tr><th style="width:24px">№</th><th>${L("lab.name")}</th><th>${L("lab.reason")}</th><th style="width:32%">${L("lab.result")}</th></tr></thead><tbody>${result.lab_tests.map((l, i) => `<tr><td>${i + 1}</td><td><strong>${esc(l.name)}</strong></td><td>${esc(l.reason || "—")}</td><td>${l.result ? esc(l.result) : '<span style="color:#9ca3af">________________</span>'}</td></tr>`).join("")}</tbody></table>` : "";

    const instrHtml = result.instrumental_tests.length
      ? `<table class="rx"><thead><tr><th style="width:24px">№</th><th>${L("lab.name")}</th><th>${L("lab.reason")}</th><th style="width:32%">${L("lab.result")}</th></tr></thead><tbody>${result.instrumental_tests.map((l, i) => `<tr><td>${i + 1}</td><td><strong>${esc(l.name)}</strong></td><td>${esc(l.reason || "—")}</td><td>${l.result ? esc(l.result) : '<span style="color:#9ca3af">________________</span>'}</td></tr>`).join("")}</tbody></table>` : "";

    const referrals = (result.comorbidities || []).filter((_, i) => selectedComorb.includes(i));
    const comorbHtml = referrals.length
      ? `<table class="rx"><thead><tr><th style="width:28%">${lang === "ru" ? "Специалист" : lang === "en" ? "Specialist" : "Мутахассис"}</th><th style="width:28%">${lang === "ru" ? "По поводу" : lang === "en" ? "Reason" : "Сабаб (касаллик)"}</th><th>${lang === "ru" ? "Направление" : lang === "en" ? "Referral note" : "Йўналтириш изоҳи"}</th></tr></thead><tbody>${referrals.map((c) => `<tr><td><strong>${esc(c.specialist || "—")}</strong></td><td>${esc(c.name)} <span style="color:#92400e;font-size:8px;text-transform:uppercase">[${esc(c.risk_level)}]</span></td><td>${esc(c.referral_note || c.reasoning || "—")}</td></tr>`).join("")}</tbody></table>` : "";

    const rxHtml = result.prescriptions.length
      ? `<table class="rx"><thead><tr><th style="width:24px">№</th><th>${L("rx.name")}</th><th>${L("rx.dosage")}</th><th>${L("rx.frequency")}</th><th>${L("rx.duration")}</th><th>${L("rx.notes")}</th></tr></thead><tbody>${result.prescriptions.map((p, i) => `<tr><td>${i + 1}</td><td><strong>${esc(p.name)}</strong></td><td>${esc(p.dosage)}</td><td>${esc(p.frequency)}</td><td>${esc(p.duration)}</td><td>${esc(p.notes || "—")}</td></tr>`).join("")}</tbody></table>` : `<p class="muted">—</p>`;

    const html = `<!DOCTYPE html><html lang="${lang}"><head><meta charset="UTF-8"/><title>Clinora AI — ${esc(pn)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Manrope:wght@600;700;800&display=swap" rel="stylesheet">
<style>
  *{box-sizing:border-box}
  html,body{margin:0;padding:0;background:#f4f6fb;color:#111827;font-family:'Inter',system-ui,sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact;font-size:10.5px}
  .page{width:210mm;height:297mm;margin:16px auto;padding:8mm 11mm;background:#fff;box-shadow:0 8px 30px rgba(0,0,0,.08);overflow:hidden;position:relative}
  .inner{display:flex;flex-direction:column;transform-origin:top left}
  .header{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:8px;border-bottom:2px solid #2176eb}
  .brand{display:flex;align-items:center;gap:12px}
  .logo{width:32px;height:32px;border-radius:9px;background:linear-gradient(135deg,#2176eb,#4f9bff);display:flex;align-items:center;justify-content:center;color:#fff;font-family:'Manrope',sans-serif;font-weight:800;font-size:15px}
  .brand h1{font-family:'Manrope',sans-serif;font-size:15px;margin:0;color:#111827}
  .brand p{margin:1px 0 0;font-size:9px;color:#6b7280}
  .clinic{text-align:right;font-size:9px;color:#374151;line-height:1.35}
  .clinic .clinic-name{font-weight:700;color:#2176eb;font-size:10.5px}
  .meta{display:flex;justify-content:space-between;gap:8px;margin:6px 0 2px}
  .meta .row{background:#f9fafb;border:1px solid #eef0f4;border-radius:6px;padding:4px 8px;flex:1}
  .meta .label{font-size:8px;text-transform:uppercase;color:#6b7280;margin-bottom:1px}
  .meta .val{font-weight:600;color:#111827;font-size:10.5px}
  h2.section{font-family:'Manrope',sans-serif;font-size:9.5px;text-transform:uppercase;letter-spacing:.05em;color:#2176eb;margin:6px 0 2px;padding-bottom:1px;border-bottom:1px dashed #d1d5db}
  .bul{margin:0;padding-left:14px}
  .bul li{margin:0;font-size:10px;line-height:1.3}
  p.body{font-size:10px;line-height:1.35;margin:1px 0;white-space:pre-wrap}
  .muted{color:#9ca3af;font-style:italic;font-size:10px}
  table.rx{width:100%;border-collapse:collapse;font-size:9.5px;margin-top:2px}
  table.rx th{background:#eff5ff;color:#1e40af;text-align:left;padding:3px 6px;font-weight:600;border-bottom:1.5px solid #c8dcfb;font-size:9px}
  table.rx td{padding:3px 6px;border-bottom:1px solid #eef0f4;vertical-align:top;line-height:1.25}
  .dx-pill{display:inline-block;background:#ecfdf5;border:1px solid #10b981;color:#065f46;padding:4px 12px;border-radius:8px;font-weight:700;font-size:11.5px;margin-top:2px}
  .family-box{background:#fffbeb;border-left:3px solid #f59e0b;border-radius:5px;padding:5px 9px;margin-top:2px}
  .family-box p{margin:0;font-size:10px;line-height:1.4;color:#374151;white-space:pre-wrap}
  .signature{margin-top:auto;padding-top:8px;display:flex;justify-content:space-between;align-items:flex-end;gap:12px}
  .doctor-card{font-size:10px;color:#111827;line-height:1.35}
  .doctor-card .name{font-weight:700;font-size:11px}
  .doctor-card .spec{color:#2176eb;font-weight:500}
  .doctor-card .contact{color:#6b7280;font-size:9px}
  .qr-pair{display:flex;gap:10px}
  .qr-block{text-align:center;font-size:8px;color:#6b7280}
  .qr-block img{width:64px;height:64px;display:block;margin:0 auto 1px}
  .sig-line{width:150px;text-align:center;font-size:9px;color:#6b7280}
  .sig-line .line{border-bottom:1px solid #111827;height:20px;margin-bottom:2px}
  .footer{margin-top:6px;padding-top:5px;border-top:1px solid #e5e7eb;font-size:8.5px;color:#6b7280;text-align:center}
  .footer b{color:#2176eb}
  .actions{position:fixed;top:14px;right:14px;display:flex;gap:8px;z-index:9999}
  .actions button{background:#2176eb;color:#fff;border:none;padding:10px 16px;border-radius:10px;font-size:13px;font-weight:600;cursor:pointer;box-shadow:0 4px 14px rgba(33,118,235,.35);font-family:inherit}
  .actions .alt{background:#fff;color:#374151;border:1px solid #d1d5db}
  @media print{html,body{width:210mm;height:297mm}body{background:#fff}.page{box-shadow:none;margin:0;padding:7mm 10mm;width:210mm;height:297mm}.actions{display:none}@page{size:A4 portrait;margin:0}}
</style></head><body>
<div class="actions">
  <button class="alt" onclick="window.close()">${L("common.close")}</button>
  <button onclick="window.print()">📄 ${L("act.downloadPdf")}</button>
</div>
<div class="page">
 <div class="inner">
  <div class="header">
    <div class="brand"><div class="logo">C</div><div><h1>Clinora AI</h1><p>${L("pdf.title")}</p></div></div>
    <div class="clinic"><div class="clinic-name">${esc(hosp || "—")}</div>${hospAddr ? `<div>${esc(hospAddr)}</div>` : ""}${hospPhone ? `<div>☎ ${esc(hospPhone)}</div>` : ""}${clinicIg ? `<div>📷 ${esc(at(clinicIg))}</div>` : ""}${clinicTg ? `<div>✈ ${esc(at(clinicTg))}</div>` : ""}</div>
  </div>
  <div class="meta">
    <div class="row"><div class="label">${L("sec.patient")}</div><div class="val">${esc(pn)}</div></div>
    ${patientCode ? `<div class="row"><div class="label">${lang === "ru" ? "Код пациента" : lang === "en" ? "Patient ID" : "Бемор ID"}</div><div class="val" style="font-family:'JetBrains Mono',ui-monospace,monospace;letter-spacing:.5px;color:#2176eb">${esc(patientCode)}</div></div>` : ""}
    <div class="row"><div class="label">${lang === "ru" ? "Дата" : lang === "en" ? "Date" : "Сана"}</div><div class="val">${esc(dateStr)}</div></div>
  </div>

  ${result.soap ? `<h2 class="section">SOAP</h2><p class="body"><b>S:</b> ${esc(result.soap.subjective)}<br/><b>O:</b> ${esc(result.soap.objective)}<br/><b>A:</b> ${esc(result.soap.assessment)}<br/><b>P:</b> ${esc(result.soap.plan)}</p>` : ""}
  ${result.protocol_refs?.length ? `<h2 class="section">Rasmiy protokol manbalari</h2><p class="body">${result.protocol_refs.map(p=>esc(`${p.title} · ${p.section} · ${p.page}-sahifa · ${p.version} · ${p.revision_date??""} · ${p.source_url}`)).join("<br/>")}</p>` : `<p class="muted">Tasdiqlangan mos protokol topilmadi.</p>`}
  <h2 class="section">${L("sec.symptoms")}</h2>
  ${symptomsHtml}

  ${labsHtml ? `<h2 class="section">${L("sec.labs")}</h2>${labsHtml}` : ""}
  ${instrHtml ? `<h2 class="section">${L("sec.instr")}</h2>${instrHtml}` : ""}

  <h2 class="section">${L("sec.diagnosis")}</h2>
  <div><span class="dx-pill">${esc(chosen?.name || "—")}</span></div>

  ${comorbHtml ? `<h2 class="section">${L("sec.referrals")}</h2>${comorbHtml}` : ""}

  <h2 class="section">${L("sec.recommendation")}</h2>
  <p class="body">${esc(result.recommendation || "—")}</p>

  <h2 class="section">${L("sec.rx")}</h2>
  ${rxHtml}

  ${result.family_advice ? `<h2 class="section">${L("sec.family")}</h2><div class="family-box"><p>${esc(result.family_advice)}</p></div>` : ""}

  <div class="signature">
    <div class="doctor-card">
      <div class="name">Dr. ${esc(docName)}</div>
      ${specialty ? `<div class="spec">${esc(specialty)}</div>` : ""}
      ${docPhone ? `<div class="contact">☎ ${esc(docPhone)}</div>` : ""}
      ${workHours ? `<div class="contact">🕒 ${esc(workHours)}</div>` : ""}
      ${docIg ? `<div class="contact">📷 ${esc(at(docIg))}</div>` : ""}
      ${docTg ? `<div class="contact">✈ ${esc(at(docTg))}</div>` : ""}
    </div>
    <div class="qr-pair">
      ${qrAppUrl ? `<div class="qr-block"><img src="${qrAppUrl}" alt="App QR"/>${L("pdf.qrApp")}</div>` : ""}
      ${qrVerifyUrl ? `<div class="qr-block"><img src="${qrVerifyUrl}" alt="Verify QR"/>${L("pdf.qr")}</div>` : ""}
    </div>
    <div class="sig-line"><div class="line"></div>${L("pdf.signature")}</div>
  </div>

  <div class="footer">
    Clinora AI · <b>Telegram:</b> @clinora_support · <b>Instagram:</b> @clinora.ai<br/>
    <span style="font-style:italic">${L("pdf.disclaimer")}</span>
  </div>
 </div>
</div>
<script>
(function(){
  function fitToOnePage(){
    var page = document.querySelector('.page');
    var inner = document.querySelector('.inner');
    if(!page || !inner) return;
    inner.style.transform = 'none';
    inner.style.width = '100%';
    var cs = window.getComputedStyle(page);
    var padV = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
    var avail = page.clientHeight - padV;
    var need = inner.scrollHeight;
    if(need > avail){
      var s = Math.max(0.5, avail / need);
      inner.style.transform = 'scale(' + s + ')';
      inner.style.width = (100 / s) + '%';
      need = inner.scrollHeight;
      if(need * s > avail){
        s = Math.max(0.4, avail / need);
        inner.style.transform = 'scale(' + s + ')';
        inner.style.width = (100 / s) + '%';
      }
    }
    inner.style.minHeight = avail + 'px';
  }
  window.addEventListener('load', fitToOnePage);
  window.addEventListener('resize', fitToOnePage);
  window.addEventListener('beforeprint', fitToOnePage);
  function doPrint(){ fitToOnePage(); setTimeout(function(){ try { window.focus(); window.print(); } catch(e){} }, 60); }
  function whenImagesReady(cb){
    var imgs = Array.prototype.slice.call(document.images);
    if(!imgs.length) return cb();
    var left = imgs.length;
    var done = function(){ if(--left <= 0) cb(); };
    imgs.forEach(function(img){
      if(img.complete && img.naturalWidth > 0) done();
      else { img.addEventListener('load', done); img.addEventListener('error', done); }
    });
    // Safety timeout in case something hangs
    setTimeout(function(){ if(left > 0){ left = 0; cb(); } }, 2500);
  }
  window.addEventListener('load', function(){
    whenImagesReady(function(){ setTimeout(doPrint, 350); });
  });
})();
</script>
</body></html>`;

    const w = window.open("", "_blank", "width=900,height=1000");
    if (!w) { toast.error("Browser blocked the new window. Please allow popups."); return; }
    w.document.open(); w.document.write(html); w.document.close();
  };

  // ---- UI ----
  const cardCls = "paper-section p-5 md:p-6 mb-4";
  const labelCls = "mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-primary";

  const MedicalBackdrop = () => (
    <div className="med-bg" aria-hidden>
      <svg className="med-float-1" width="90" height="90" viewBox="0 0 24 24" fill="none" stroke="hsl(174 72% 45%)" strokeWidth="1.2">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>
      <svg className="med-float-2" width="110" height="110" viewBox="0 0 64 64" fill="none" stroke="hsl(188 85% 55%)" strokeWidth="1.4">
        <path d="M16 4 C40 16 24 32 48 44 M48 4 C24 16 40 32 16 44 M16 12 H48 M16 20 H48 M16 28 H48 M16 36 H48"/>
      </svg>
      <svg className="med-float-3" width="80" height="80" viewBox="0 0 24 24" fill="hsl(160 70% 55% / 0.25)" stroke="hsl(160 70% 45%)" strokeWidth="1">
        <path d="M9 2h6v7h7v6h-7v7H9v-7H2V9h7z"/>
      </svg>
      <svg className="med-float-4" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="hsl(200 90% 55%)" strokeWidth="1.4">
        <rect x="2" y="8" width="20" height="8" rx="4"/>
        <path d="M12 8v8"/>
      </svg>
      <svg className="med-float-5" width="220" height="60" viewBox="0 0 220 60" fill="none">
        <path className="ecg-line" d="M0 30 H40 L50 10 L60 50 L72 20 L82 40 L92 30 H220" stroke="hsl(174 72% 50%)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
  );

  const Stepper = () => (
    <div className="mb-6 flex items-center gap-1 overflow-x-auto pb-1">
      {[1, 2, 3, 4, 5].map((n) => {
        const active = step === n;
        const done = step > n;
        return (
          <button
            key={n}
            disabled={n > step && !result}
            onClick={() => { if (n <= step || result) goToStep(n as Step); }}
            className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              active ? "bg-primary text-primary-foreground" :
              done ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"
            } ${n > step && !result ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
          >
            <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
              active ? "bg-primary-foreground/20" : done ? "bg-success/30" : "bg-background"
            }`}>{done ? <Check className="h-3 w-3" /> : n}</span>
            <span className="hidden sm:inline">{t(`step.${n}.title`).split(":")[1]?.trim() || t(`step.${n}.title`)}</span>
          </button>
        );
      })}
    </div>
  );

  return (
    <>
      <Helmet>
        <title>AI Yordamchi — Clinora AI</title>
        <meta name="description" content="Bemor suhbatidan simptomlar, tashxis va tavsiyalarni AI yordamida oling. Shifokorlar uchun aqlli yordamchi." />
        <link rel="canonical" href="https://clinora-ai-doc-assist.lovable.app/app" />
        <meta property="og:title" content="AI Yordamchi — Clinora AI" />
        <meta property="og:description" content="Bemor suhbatidan simptomlar va tashxisni AI yordamida oling." />
        <meta property="og:url" content="https://clinora-ai-doc-assist.lovable.app/app" />
      </Helmet>
      <div className="relative min-h-screen bg-mesh overflow-hidden">
      <div className="bg-mesh-animated pointer-events-none absolute inset-0 -z-10" aria-hidden />
      <div className="absolute inset-0 -z-10"><MedicalBackdrop /></div>
      {showGuide && (
        <GuideModal onClose={(dontShow) => {
          setShowGuide(false);
          if (dontShow) localStorage.setItem(GUIDE_KEY, "1");
        }} />
      )}

      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-lg">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg shadow-md" style={{ background: "var(--gradient-primary)" }}>
              <span className="font-display text-sm font-extrabold leading-none text-primary-foreground">C</span>
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold text-foreground">Clinora AI</div>
              {profile?.full_name && (
                <div className="text-[11px] text-muted-foreground">Dr. {profile.full_name}{profile.hospital ? ` · ${profile.hospital}` : ""}</div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="rounded-full" onClick={() => setShowGuide(true)}>
              <HelpCircle className="h-4 w-4 sm:mr-1.5" />
              <span className="hidden sm:inline">{t("nav.guide")}</span>
            </Button>
            <Button variant="ghost" size="sm" className="rounded-full" onClick={() => window.dispatchEvent(new Event(OPEN_LEGAL_EVENT))} title="Legal & Privacy">
              <ShieldCheck className="h-4 w-4 sm:mr-1.5" />
              <span className="hidden md:inline">Legal</span>
            </Button>
            <LanguageSwitcher />
            <Link to="/history"><Button variant="ghost" size="sm" className="rounded-full"><HistoryIcon className="h-4 w-4 sm:mr-1.5" /><span className="hidden sm:inline">{t("nav.history")}</span></Button></Link>
            <Link to="/queue"><Button variant="ghost" size="sm" className="rounded-full"><Inbox className="h-4 w-4 sm:mr-1.5" /><span className="hidden sm:inline">Navbat</span></Button></Link>
            <Link to="/profile"><Button variant="ghost" size="sm" className="rounded-full"><User className="h-4 w-4 sm:mr-1.5" /><span className="hidden md:inline">{t("nav.profile")}</span></Button></Link>
            <Link to="/analytics"><Button variant="ghost" size="sm" className="rounded-full"><BarChart3 className="h-4 w-4 sm:mr-1.5" /><span className="hidden md:inline">{t("nav.analytics")}</span></Button></Link>
            <Link to="/pricing"><Button variant="ghost" size="sm" className="rounded-full text-primary" style={isPro ? { background: "hsl(var(--primary) / 0.12)" } : undefined}><Crown className="h-4 w-4 sm:mr-1.5" /><span className="hidden md:inline">{isPro ? "PRO" : t("nav.pro")}</span></Button></Link>
            <Button variant="ghost" size="sm" onClick={signOut} className="rounded-full"><LogOut className="h-4 w-4 sm:mr-1.5" /><span className="hidden md:inline">{t("nav.signout")}</span></Button>
          </div>
        </div>
      </header>

      <main className="container py-6 md:py-10 relative">
        <h1 className="sr-only">Clinora AI — Konsultatsiya</h1>
        <div className="paper-a4">
          <div className="paper-letterhead flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: "var(--gradient-primary)" }}>
                <span className="font-display text-base font-extrabold leading-none text-primary-foreground">C</span>
              </div>
              <div className="leading-tight">
                <div className="font-display text-lg font-bold">Clinora AI</div>
                <div className="text-[11px] text-slate-500">
                  {profile?.full_name ? `Dr. ${profile.full_name}` : "—"}
                  {profile?.specialty ? ` · ${profile.specialty}` : ""}
                </div>
              </div>
            </div>
            <div className="text-right text-[11px] leading-tight text-slate-600">
              {profile?.hospital && <div className="font-semibold text-slate-800">{profile.hospital}</div>}
              {profile?.hospital_phone && <div>{profile.hospital_phone}</div>}
              <div>{new Date().toLocaleDateString(DATE_LOCALE[lang])}</div>
            </div>
          </div>

          <Stepper />
          {result&&<ClinicalReview value={result} approved={confirmed} onChange={(key,text)=>update(r=>({...r,soap:{subjective:r.soap?.subjective??"",objective:r.soap?.objective??"",assessment:r.soap?.assessment??"",plan:r.soap?.plan??"",[key]:text}}))}/> }

        {/* STEP 1: Complaints */}
        {step === 1 && (
          <section className={cardCls + " md:p-8"}>
            <h2 className="text-lg font-semibold">{t("step.1.title")}</h2>
            <p className="mb-5 text-sm text-muted-foreground">{t("step.1.desc")}</p>

            {!supported && (
              <div className="mb-4 rounded-2xl border border-warning/30 bg-warning/10 p-3 text-sm">{t("rec.unsupported")}</div>
            )}

            <div className="mb-4">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">{t("sec.patient")}</label>
              <Input value={patientName} onChange={(e) => { setPatientName(e.target.value); persist({ patientName: e.target.value }); }} placeholder="—" className="rounded-xl" />
            </div>

            <div className="flex flex-col items-center text-center">
              <button onClick={toggleRecording}
                aria-label={isRecording ? t("rec.recording") : t("rec.start")}
                className="relative flex h-20 w-20 items-center justify-center rounded-full shadow-lg transition-all disabled:cursor-not-allowed disabled:opacity-50"
                style={{ background: isRecording ? "hsl(var(--destructive))" : "var(--gradient-primary)" }}>
                {isRecording && <span className="absolute inset-0 rounded-full animate-pulse-ring" style={{ background: "hsl(var(--destructive) / 0.4)" }} />}
                {isRecording ? <MicOff className="relative h-8 w-8 text-destructive-foreground" /> : <Mic className="relative h-8 w-8 text-primary-foreground" />}
              </button>
              <p className="mt-3 text-sm font-medium">{isRecording ? t("rec.recording") : t("rec.start")}</p>
              <p className="mt-1 text-xs text-muted-foreground">{t("rec.langNote")}</p>
            </div>

            <div className="mt-5">
              <label className="mb-2 block text-xs font-medium text-muted-foreground">{t("sec.complaints")}</label>
              <Textarea value={transcript} onChange={(e) => { setTranscript(e.target.value); baseTranscriptRef.current = e.target.value; persist({ transcript: e.target.value }); }}
                placeholder={t("rec.placeholder")} className="min-h-[140px] rounded-2xl bg-background text-base" />
            </div>

            <label className="mt-4 flex items-start gap-3 text-sm"><Checkbox checked={aiConsent} onCheckedChange={v=>setAiConsent(v===true)} aria-label="Bemor AI roziligi"/><span>Bemor AI orqali qayta ishlashga rozilik berdi; suhbatdagi ism, manzil va boshqa shaxsiy ma’lumotlarni olib tashladim.</span></label>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Button onClick={runAnalysis} disabled={isAnalyzing || !transcript.trim() || !aiConsent} size="lg" className="flex-1 rounded-2xl shadow-md" style={{ background: "var(--gradient-primary)" }}>
                {isAnalyzing ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> {t("act.analyzing")}</> : <><Sparkles className="mr-2 h-5 w-5" /> {t("act.suggestLabs")}</>}
              </Button>
              <Button onClick={handleClear} variant="outline" size="lg" aria-label={t("common.clear") || "Clear"} className="rounded-2xl" disabled={isAnalyzing || (!transcript && !result)}>
                <Trash2 className="h-5 w-5" />
              </Button>
            </div>
          </section>
        )}

        {/* STEP 2: Lab tests */}
        {step === 2 && result && (
          <section className="space-y-4">
            <div className={cardCls}>
              <h2 className="text-lg font-semibold">{t("step.2.title")}</h2>
              <p className="text-sm text-muted-foreground">{t("step.2.desc")}</p>
            </div>
            <div className={cardCls}>
              <h3 className={labelCls}><FlaskConical className="h-4 w-4" /> {t("sec.labs")}</h3>
              <div className="space-y-3">
                {result.lab_tests.map((l, i) => (
                  <div key={i} className="rounded-2xl border border-border/70 bg-background/60 p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">№ {i + 1}</span>
                      <Button variant="ghost" size="icon" aria-label="Remove lab test" onClick={() => update((r) => ({ ...r, lab_tests: r.lab_tests.filter((_, x) => x !== i) }))} className="h-7 w-7"><X className="h-4 w-4" /></Button>
                    </div>
                    <div className="space-y-2">
                      <Input value={l.name} onChange={(e) => update((r) => ({ ...r, lab_tests: r.lab_tests.map((x, idx) => idx === i ? { ...x, name: e.target.value } : x) }))} className="rounded-xl" placeholder={t("lab.name")} />
                      <Input value={l.reason || ""} onChange={(e) => update((r) => ({ ...r, lab_tests: r.lab_tests.map((x, idx) => idx === i ? { ...x, reason: e.target.value } : x) }))} className="rounded-xl" placeholder={t("lab.reason")} />
                      <Input value={l.result || ""} onChange={(e) => update((r) => ({ ...r, lab_tests: r.lab_tests.map((x, idx) => idx === i ? { ...x, result: e.target.value } : x) }))} className="rounded-xl" placeholder={t("lab.result") + " (" + t("common.optional") + ")"} />
                    </div>
                  </div>
                ))}
                <Button variant="outline" onClick={() => update((r) => ({ ...r, lab_tests: [...r.lab_tests, emptyLab()] }))} className="rounded-xl w-full"><Plus className="mr-2 h-4 w-4" /> {t("common.add")}</Button>
              </div>
            </div>
            <div className="flex gap-3">
              <Button onClick={() => goToStep(1)} variant="outline" size="lg" className="rounded-2xl">{t("common.back")}</Button>
              <Button onClick={() => goToStep(3)} size="lg" className="flex-1 rounded-2xl" style={{ background: "var(--gradient-primary)" }}>{t("common.next")}</Button>
            </div>
          </section>
        )}

        {/* STEP 3: Instrumental tests */}
        {step === 3 && result && (
          <section className="space-y-4">
            <div className={cardCls}>
              <h2 className="text-lg font-semibold">{t("step.3.title")}</h2>
              <p className="text-sm text-muted-foreground">{t("step.3.desc")}</p>
            </div>
            <div className={cardCls}>
              <h3 className={labelCls}><Activity className="h-4 w-4" /> {t("sec.instr")}</h3>
              <div className="space-y-3">
                {result.instrumental_tests.map((l, i) => (
                  <div key={i} className="rounded-2xl border border-border/70 bg-background/60 p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">№ {i + 1}</span>
                      <Button variant="ghost" size="icon" aria-label="Remove test" onClick={() => update((r) => ({ ...r, instrumental_tests: r.instrumental_tests.filter((_, x) => x !== i) }))} className="h-7 w-7"><X className="h-4 w-4" /></Button>
                    </div>
                    <div className="space-y-2">
                      <Input value={l.name} onChange={(e) => update((r) => ({ ...r, instrumental_tests: r.instrumental_tests.map((x, idx) => idx === i ? { ...x, name: e.target.value } : x) }))} className="rounded-xl" placeholder="УЗИ / ЭКГ / МРТ ..." />
                      <Input value={l.reason || ""} onChange={(e) => update((r) => ({ ...r, instrumental_tests: r.instrumental_tests.map((x, idx) => idx === i ? { ...x, reason: e.target.value } : x) }))} className="rounded-xl" placeholder={t("lab.reason")} />
                      <Textarea value={l.result || ""} onChange={(e) => update((r) => ({ ...r, instrumental_tests: r.instrumental_tests.map((x, idx) => idx === i ? { ...x, result: e.target.value } : x) }))} className="rounded-xl min-h-[60px]" placeholder={t("lab.result") + " (" + t("common.optional") + ")"} />
                    </div>
                  </div>
                ))}
                <Button variant="outline" onClick={() => update((r) => ({ ...r, instrumental_tests: [...r.instrumental_tests, emptyInstr()] }))} className="rounded-xl w-full"><Plus className="mr-2 h-4 w-4" /> {t("common.add")}</Button>
              </div>
            </div>
            <div className="flex gap-3">
              <Button onClick={() => goToStep(2)} variant="outline" size="lg" className="rounded-2xl">{t("common.back")}</Button>
              <Button onClick={runAnalysis} disabled={isAnalyzing} variant="outline" size="lg" className="rounded-2xl">
                {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Brain className="mr-2 h-4 w-4" /> {t("act.suggestDiagnosis")}</>}
              </Button>
              <Button onClick={() => goToStep(4)} size="lg" className="flex-1 rounded-2xl" style={{ background: "var(--gradient-primary)" }}>{t("common.next")}</Button>
            </div>
          </section>
        )}

        {/* STEP 4: Differential diagnosis selection */}
        {step === 4 && result && (
          <section className="space-y-4">
            <div className={cardCls}>
              <h2 className="text-lg font-semibold">{t("step.4.title")}</h2>
              <p className="text-sm text-muted-foreground">{t("step.4.desc")}</p>
            </div>
            <div className={cardCls}>
              <h3 className={labelCls}><Brain className="h-4 w-4" /> {t("sec.diff")}</h3>
              <div className="space-y-3">
                {result.differentials.map((d, i) => {
                  const chosen = i === chosenIdx;
                  const probColor = d.probability === "high" ? "bg-destructive/15 text-destructive" : d.probability === "medium" ? "bg-warning/15 text-warning" : "bg-primary/15 text-primary";
                  return (
                    <button key={i}
                      onClick={() => { setChosenIdx(i); persist({ chosenIdx: i }); }}
                      className={`block w-full rounded-2xl border p-4 text-left transition-all ${chosen ? "border-success bg-success/5 shadow-md" : "border-border bg-background/60 hover:border-primary/40"}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold">{d.name}</span>
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${probColor}`}>{d.probability}</span>
                            {chosen && <span className="rounded-full bg-success px-2 py-0.5 text-[10px] font-bold uppercase text-success-foreground">✓ {t("diff.chosen")}</span>}
                          </div>
                          <p className="mt-1.5 text-xs text-muted-foreground italic">{d.reasoning}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
            <label className="block text-sm">Shifokor kiritadigan tashxis<Input aria-label="Shifokor tashxisi" className="mt-2" onChange={e=>{const name=e.target.value;setChosenIdx(0);update(r=>({...r,differentials:[{name,probability:"medium",reasoning:"Shifokor kiritgan baho"},...r.differentials.slice(1)]}));}}/></label>
            {result.comorbidities && result.comorbidities.length > 0 && (
              <div className={cardCls}>
                <h3 className={labelCls}><Brain className="h-4 w-4 text-warning" /> {t("sec.comorbid")}</h3>
                <p className="text-xs text-muted-foreground mb-3">{t("sec.referralsHint")}</p>
                <div className="space-y-2">
                  {result.comorbidities.map((c, i) => {
                    const rc = c.risk_level === "high" ? "bg-destructive/15 text-destructive" : c.risk_level === "medium" ? "bg-warning/15 text-warning" : "bg-primary/15 text-primary";
                    const checked = selectedComorb.includes(i);
                    return (
                      <label
                        key={i}
                        className={`flex gap-3 rounded-xl border p-3 cursor-pointer transition-all ${checked ? "border-success bg-success/5 shadow-sm" : "border-warning/30 bg-warning/5 hover:border-warning/60"}`}
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(v) => {
                            const next = v
                              ? [...selectedComorb, i].sort((a, b) => a - b)
                              : selectedComorb.filter((x) => x !== i);
                            setSelectedComorb(next);
                            persist({ selectedComorb: next });
                          }}
                          className="mt-0.5"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm">{c.name}</span>
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${rc}`}>{c.risk_level}</span>
                            {c.specialist && (
                              <span className="rounded-full bg-primary/10 text-primary px-2 py-0.5 text-[10px] font-semibold">
                                → {c.specialist}
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground italic">{c.reasoning}</p>
                          {c.referral_note && (
                            <p className="mt-1.5 text-xs text-foreground/80">
                              <span className="font-semibold text-primary">{t("comorbid.refer")}:</span> {c.referral_note}
                            </p>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
            <div className="flex gap-3">
              <Button onClick={() => goToStep(3)} variant="outline" size="lg" className="rounded-2xl">{t("common.back")}</Button>
              <Button onClick={() => goToStep(5)} size="lg" className="flex-1 rounded-2xl" style={{ background: "var(--gradient-primary)" }}>{t("common.next")}</Button>
            </div>
          </section>
        )}

        {/* STEP 5: Recommendation, Rx, Family advice */}
        {step === 5 && result && (
          <section className="space-y-4">
            <div className={cardCls}>
              <h2 className="text-lg font-semibold">{t("step.5.title")}</h2>
              <p className="text-sm text-muted-foreground">{t("step.5.desc")}</p>
            </div>

            <div className={cardCls + " border-success/40"}>
              <h3 className={labelCls}><CheckCircle2 className="h-4 w-4 text-success" /> {t("sec.diagnosis")}</h3>
              <p className="text-base font-semibold text-success">{result.differentials[chosenIdx]?.name || "—"}</p>
            </div>

            <div className={cardCls}>
              <h3 className={labelCls}><span className="h-2 w-2 rounded-full bg-primary" /> {t("sec.recommendation")}</h3>
              <Textarea value={result.recommendation} onChange={(e) => update((r) => ({ ...r, recommendation: e.target.value }))} className="min-h-[100px] rounded-2xl" />
            </div>

            <div className={cardCls}>
              <h3 className={labelCls}><Pill className="h-4 w-4" /> {t("sec.rx")}</h3>
              <div className="space-y-3">
                {result.prescriptions.map((p, i) => (
                  <div key={i} className="rounded-2xl border border-border/70 bg-background/60 p-4">
                    <div className="mb-3 flex items-center justify-between"><span className="text-xs font-medium text-muted-foreground">№ {i + 1}</span><Button variant="ghost" size="icon" aria-label="Remove prescription" onClick={() => update((r) => ({ ...r, prescriptions: r.prescriptions.filter((_, x) => x !== i) }))} className="h-7 w-7"><X className="h-4 w-4" /></Button></div>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <div className="sm:col-span-2"><label className="mb-1 block text-xs text-muted-foreground">{t("rx.name")}</label><Input value={p.name} onChange={(e) => update((r) => ({ ...r, prescriptions: r.prescriptions.map((x, idx) => idx === i ? { ...x, name: e.target.value } : x) }))} className="rounded-xl" /></div>
                      <div><label className="mb-1 block text-xs text-muted-foreground">{t("rx.dosage")}</label><Input value={p.dosage} onChange={(e) => update((r) => ({ ...r, prescriptions: r.prescriptions.map((x, idx) => idx === i ? { ...x, dosage: e.target.value } : x) }))} className="rounded-xl" /></div>
                      <div><label className="mb-1 block text-xs text-muted-foreground">{t("rx.frequency")}</label><Input value={p.frequency} onChange={(e) => update((r) => ({ ...r, prescriptions: r.prescriptions.map((x, idx) => idx === i ? { ...x, frequency: e.target.value } : x) }))} className="rounded-xl" /></div>
                      <div><label className="mb-1 block text-xs text-muted-foreground">{t("rx.duration")}</label><Input value={p.duration} onChange={(e) => update((r) => ({ ...r, prescriptions: r.prescriptions.map((x, idx) => idx === i ? { ...x, duration: e.target.value } : x) }))} className="rounded-xl" /></div>
                      <div className="sm:col-span-2"><label className="mb-1 block text-xs text-muted-foreground">{t("rx.notes")}</label><Input value={p.notes || ""} onChange={(e) => update((r) => ({ ...r, prescriptions: r.prescriptions.map((x, idx) => idx === i ? { ...x, notes: e.target.value } : x) }))} className="rounded-xl" /></div>
                    </div>
                  </div>
                ))}
                <Button variant="outline" onClick={() => update((r) => ({ ...r, prescriptions: [...r.prescriptions, emptyRx()] }))} className="rounded-xl w-full"><Plus className="mr-2 h-4 w-4" /> {t("common.add")}</Button>
              </div>
            </div>

            <div className={cardCls}>
              <h3 className={labelCls}><HeartHandshake className="h-4 w-4" /> {t("sec.family")}</h3>
              <p className="-mt-2 mb-3 text-xs text-muted-foreground">{t("sec.familyHint")}</p>
              <Textarea value={result.family_advice} onChange={(e) => update((r) => ({ ...r, family_advice: e.target.value }))} className="min-h-[140px] rounded-2xl" />
            </div>

            {!confirmed ? (
              <div className="space-y-3">
                <label className="flex items-start gap-3 text-sm"><Checkbox checked={reviewAccepted} onCheckedChange={v=>setReviewAccepted(v===true)} aria-label="Shifokor ko‘rigi tasdiqi"/><span>Ma’lumotlarni, ogohlantirishlarni va manbalarni ko‘rib chiqdim; yakuniy hujjatni shifokor sifatida tasdiqlayman.</span></label>
                <Button onClick={()=>void rejectDraft()} variant="destructive" disabled={saving}>Qoralamani rad etish</Button>
                <Button onClick={() => goToStep(4)} variant="outline" size="lg" className="rounded-2xl">{t("common.back")}</Button>
                <Button onClick={handleConfirm} disabled={!reviewAccepted||saving||!result.draft_id} size="lg" className="flex-1 rounded-2xl shadow-md" style={{ background: "var(--gradient-primary)" }}>
                  <CheckCircle2 className="mr-2 h-5 w-5" /> {t("act.confirm")}
                </Button>
              </div>
            ) : (
              <div className={cardCls + " border-success/40"}>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-6 w-6 text-success" />
                  <div className="flex-1">
                    <h3 className="font-semibold">{t("status.confirmed")}</h3>
                    <p className="text-sm text-muted-foreground">{t("status.patient")}: <span className="font-medium text-foreground">{patientName || "—"}</span></p>
                    {patientCode && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        ID: <span className="font-mono font-semibold text-primary tracking-wider">{patientCode}</span>
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <Button onClick={generatePdf} size="lg" className="flex-1 rounded-2xl shadow-md" style={{ background: "var(--gradient-primary)" }}>
                    <Download className="mr-2 h-5 w-5" /> {t("act.downloadPdf")}
                  </Button>
                  <Button onClick={handleClear} variant="outline" size="lg" className="rounded-2xl">
                    <Plus className="mr-2 h-4 w-4" /> {t("act.newPatient")}
                  </Button>
                </div>
              </div>
            )}
          </section>
        )}

        <p className="mt-8 text-center text-xs text-muted-foreground">⚕️ {t("status.aiNote")}</p>
        </div>
      </main>
      <SupportFooter />
    </div>
    </>
  );
};

export default AppPage;