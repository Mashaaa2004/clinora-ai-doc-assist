import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, Loader2, Inbox, AlertTriangle, User as UserIcon, Phone, Calendar, CheckCircle2, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const URGENCY: Record<string, { label: string; cls: string }> = {
  emergency: { label: "SHOSHILINCH", cls: "bg-destructive/20 text-destructive border-destructive/40" },
  high: { label: "Yuqori", cls: "bg-orange-500/20 text-orange-700 dark:text-orange-300 border-orange-500/40" },
  medium: { label: "O'rta", cls: "bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40" },
  low: { label: "Past", cls: "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/40" },
};

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "Barchasi" },
  { value: "assigned", label: "Yangi" },
  { value: "in_review", label: "Ko'rib chiqilmoqda" },
  { value: "closed", label: "Yopilgan" },
];

const Queue = () => {
  const { user, loading: authLoading, isDoctor, isAdmin } = useAuth();
  const [clinicId, setClinicId] = useState<string | null>(null);
  const [rows, setRows] = useState<any[]>([]);
  const [patients, setPatients] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const load = async (cid: string | null) => {
    setLoading(true);
    let q = supabase.from("symptom_reports").select("*").order("created_at", { ascending: false }).limit(100);
    if (cid) q = q.eq("clinic_id", cid);
    const { data } = await q;
    const r = data ?? [];
    setRows(r);
    const pids = [...new Set(r.map((x: any) => x.patient_id))];
    if (pids.length) {
      const { data: ps } = await supabase.from("patient_profiles")
        .select("user_id,full_name,phone,date_of_birth,gender,allergies,chronic_conditions,blood_type")
        .in("user_id", pids);
      const m: Record<string, any> = {};
      (ps ?? []).forEach((p: any) => { m[p.user_id] = p; });
      setPatients(m);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("clinic_id").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => {
        const cid = data?.clinic_id ?? null;
        setClinicId(cid);
        load(cid);
      });
  }, [user]);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("symptom_reports").update({ status }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    setRows((rs) => rs.map((r) => r.id === id ? { ...r, status } : r));
    toast.success("Holat yangilandi");
  };

  if (authLoading) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (!user) return <Navigate to="/auth" replace />;
  if (!isDoctor && !isAdmin) return <Navigate to="/app" replace />;

  const filtered = filter === "all" ? rows : rows.filter((r) => r.status === filter);

  return (
    <>
      <Helmet><title>Bemorlar navbati — Clinora AI</title></Helmet>
      <div className="min-h-screen" style={{ background: "var(--gradient-soft)" }}>
        <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-lg">
          <div className="container flex h-14 items-center justify-between">
            <Link to="/app" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" /> Konsultatsiya
            </Link>
            <Button variant="ghost" size="sm" onClick={() => load(clinicId)}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </header>
        <main className="container max-w-3xl px-4 py-6">
          <h1 className="text-2xl font-semibold">Bemorlar navbati</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {clinicId ? "Sizning klinikangizga yuborilgan bemor so'rovlari." : "Klinika biriktirilmagan — admindan klinikani biriktirishni so'rang."}
          </p>

          <div className="mt-4 flex flex-wrap gap-1.5 rounded-2xl border border-border bg-card p-1.5">
            {STATUS_OPTIONS.map((s) => (
              <button key={s.value} onClick={() => setFilter(s.value)}
                className={"rounded-xl px-3 py-1.5 text-xs font-medium transition " + (filter === s.value ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted")}>
                {s.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="py-12 text-center"><Loader2 className="inline h-6 w-6 animate-spin text-primary" /></div>
          ) : filtered.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-border bg-card p-10 text-center">
              <Inbox className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Hozircha bemor so'rovlari yo'q</p>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {filtered.map((r) => {
                const p = patients[r.patient_id];
                const u = URGENCY[r.ai_urgency] || URGENCY.medium;
                return (
                  <div key={r.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={"inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase " + u.cls}>
                            {r.ai_urgency === "emergency" && <AlertTriangle className="h-3 w-3" />}{u.label}
                          </span>
                          <span className="text-sm font-medium">{r.recommended_specialization || "—"}</span>
                          <span className="text-xs text-muted-foreground">· {new Date(r.created_at).toLocaleString("ru-RU")}</span>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                          <span className="inline-flex items-center gap-1 font-semibold text-foreground">
                            <UserIcon className="h-3.5 w-3.5" /> {p?.full_name || "Bemor"}
                          </span>
                          {p?.phone && <span className="inline-flex items-center gap-1 text-muted-foreground"><Phone className="h-3 w-3" />{p.phone}</span>}
                          {p?.date_of_birth && <span className="inline-flex items-center gap-1 text-muted-foreground"><Calendar className="h-3 w-3" />{p.date_of_birth}</span>}
                          {p?.gender && <span className="text-muted-foreground">{p.gender === "male" ? "Erkak" : p.gender === "female" ? "Ayol" : p.gender}</span>}
                        </div>

                        {(p?.allergies?.length || p?.chronic_conditions?.length || p?.blood_type) ? (
                          <div className="mt-2 flex flex-wrap gap-1 text-[11px]">
                            {p?.blood_type && <span className="rounded-full bg-rose-500/15 px-2 py-0.5 font-medium text-rose-700 dark:text-rose-300">🩸 {p.blood_type}</span>}
                            {(p?.allergies ?? []).map((a: string) => <span key={a} className="rounded-full bg-amber-500/15 px-2 py-0.5 text-amber-700 dark:text-amber-300">⚠ {a}</span>)}
                            {(p?.chronic_conditions ?? []).map((c: string) => <span key={c} className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground">{c}</span>)}
                          </div>
                        ) : null}

                        <div className="mt-3 rounded-xl bg-muted/50 p-3 text-sm">
                          <div className="text-[11px] font-semibold uppercase text-muted-foreground">AI xulosa</div>
                          <p className="mt-1">{r.ai_summary || "—"}</p>
                        </div>
                        <details className="mt-2 text-xs text-muted-foreground">
                          <summary className="cursor-pointer">Bemor shikoyati</summary>
                          <p className="mt-1 whitespace-pre-wrap rounded-lg bg-background p-2">{r.symptoms}</p>
                        </details>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
                      <span className="text-xs text-muted-foreground">Holat:</span>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium">{r.status}</span>
                      <div className="ml-auto flex gap-2">
                        {r.status !== "in_review" && r.status !== "closed" && (
                          <Button size="sm" variant="outline" className="rounded-xl" onClick={() => updateStatus(r.id, "in_review")}>
                            Ko'rib chiqishni boshlash
                          </Button>
                        )}
                        {r.status !== "closed" && (
                          <Button size="sm" className="rounded-xl" style={{ background: "var(--gradient-primary)" }} onClick={() => updateStatus(r.id, "closed")}>
                            <CheckCircle2 className="mr-1 h-4 w-4" /> Yopish
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </>
  );
};

export default Queue;