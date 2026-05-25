import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Activity, ArrowLeft, Copy, FileText, FlaskConical, HeartHandshake, Loader2, Search, Stethoscope, Trash2, User, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useT } from "@/i18n/LanguageContext";
import { DATE_LOCALE } from "@/i18n/translations";
import { Helmet } from "react-helmet-async";

type Consultation = {
  id: string;
  patient_name: string;
  patient_code?: string;
  diagnosis: string;
  chosen_diagnosis?: string;
  recommendation: string;
  symptoms: string[];
  prescriptions: { name: string; dosage: string; frequency: string; duration: string; notes?: string }[];
  lab_tests?: { name: string; reason?: string; result?: string }[];
  instrumental_tests?: { name: string; reason?: string; result?: string }[];
  family_advice?: string;
  user_id: string;
  created_at: string;
};

const HistoryPage = () => {
  const { user, isPro } = useAuth();
  const { t, lang } = useT();
  const navigate = useNavigate();
  const [items, setItems] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const scope: "mine" = "mine";
  const doctorNames: Record<string, string> = {};

  const load = async () => {
    if (!user) return;
    setLoading(true);
    let query = supabase
      .from("consultations")
      .select("id,user_id,patient_name,patient_code,diagnosis,chosen_diagnosis,recommendation,symptoms,prescriptions,lab_tests,instrumental_tests,family_advice,created_at")
      .order("created_at", { ascending: false });
    query = query.eq("user_id", user.id);
    if (!isPro) query = query.limit(10);
    const { data, error } = await query;
    setLoading(false);
    if (error) {
      toast.error(t("hist.loadErr"));
      return;
    }
    const list = (data ?? []) as any as Consultation[];
    setItems(list);
  };

  useEffect(() => { load(); }, [user, isPro, lang]);

  const remove = async (id: string) => {
    if (!confirm(t("hist.confirmDel"))) return;
    const { error } = await supabase.from("consultations").delete().eq("id", id);
    if (error) { toast.error(t("hist.delErr")); return; }
    setItems((prev) => prev.filter((x) => x.id !== id));
    toast.success(t("hist.delOk"));
  };

  const copy = (x: Consultation) => {
    const summary = [
      x.patient_name ? `${x.patient_name}` : "",
      x.symptoms?.length ? `${t("hist.symptoms")}: ${x.symptoms.join(", ")}` : "",
      x.chosen_diagnosis || x.diagnosis ? `${t("hist.diagnosis")}: ${x.chosen_diagnosis || x.diagnosis}` : "",
      x.recommendation ? `${t("hist.recommendation")}: ${x.recommendation}` : "",
      x.prescriptions?.length ? `${t("hist.rx")}: ${x.prescriptions.map((p) => p.name).join(", ")}` : "",
      x.lab_tests?.length ? `${t("hist.labs")}: ${x.lab_tests.map((l) => l.name).join(", ")}` : "",
      x.instrumental_tests?.length ? `${t("hist.instr")}: ${x.instrumental_tests.map((i) => i.name).join(", ")}` : "",
    ].filter(Boolean).join("\n\n");

    sessionStorage.setItem("clinora:copy-consultation", JSON.stringify({
      patientName: x.patient_name,
      transcript: summary,
    }));
    navigate("/app");
    toast.success(t("hist.copied"));
  };

  const filtered = items.filter((x) =>
    !q.trim() ||
    x.patient_name.toLowerCase().includes(q.toLowerCase()) ||
    (x.patient_code || "").toLowerCase().includes(q.toLowerCase()) ||
    x.diagnosis.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div className="min-h-screen" style={{ background: "var(--gradient-soft)" }}>
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-lg">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/app" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> {t("common.back")}
          </Link>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg shadow-md" style={{ background: "var(--gradient-primary)" }}>
              <span className="font-display text-sm font-extrabold leading-none text-primary-foreground">C</span>
            </div>
            <span className="text-sm font-semibold">{t("hist.titleNav")}</span>
          </div>
        </div>
      </header>

      <main className="container max-w-3xl py-8 md:py-12">
        <div className="rounded-3xl border border-border bg-card p-6 shadow-md md:p-8">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold">{t("hist.title")}</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("hist.descMine")}
              </p>
            </div>
            <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
              {items.length}
            </span>
          </div>

          <div className="mt-5 relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("hist.searchPh")}
              className="rounded-xl pl-9"
            />
          </div>

          <div className="mt-6 space-y-3">
            {loading && (
              <div className="flex items-center justify-center py-10 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            )}

            {!loading && filtered.length === 0 && (
              <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
                <FileText className="mx-auto mb-3 h-8 w-8 opacity-40" />
                {t("hist.empty")}
              </div>
            )}

            {!loading && !isPro && items.length >= 10 && (
              <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 text-center text-sm">
                {t("hist.limitText")}{" "}
                <Link to="/pricing" className="font-semibold text-primary underline">{t("hist.upgrade")}</Link>
              </div>
            )}

            {!loading && filtered.map((x) => {
              const open = openId === x.id;
              const isMine = x.user_id === user?.id;
              return (
                <div key={x.id} className="rounded-2xl border border-border bg-background/60">
                  <button
                    onClick={() => setOpenId(open ? null : x.id)}
                    className="flex w-full items-center justify-between gap-3 p-4 text-left"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium truncate">{x.patient_name || t("common.patient")}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {x.patient_code ? <span className="font-mono text-primary">{x.patient_code}</span> : null}
                          {x.patient_code ? " · " : ""}{x.diagnosis || "—"} · {new Date(x.created_at).toLocaleDateString(DATE_LOCALE[lang])}
                          {doctorNames[x.user_id] ? ` · ${doctorNames[x.user_id]}` : ""}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {new Date(x.created_at).toLocaleTimeString(DATE_LOCALE[lang], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </button>

                  {open && (
                    <div className="border-t border-border/70 px-4 py-4 space-y-3 text-sm">
                      {x.symptoms?.length > 0 && (
                        <div>
                          <div className="mb-1 text-xs uppercase text-muted-foreground">{t("hist.symptoms")}</div>
                          <ul className="list-disc pl-5 space-y-0.5">
                            {x.symptoms.map((s, i) => <li key={i}>{s}</li>)}
                          </ul>
                        </div>
                      )}
                      <div>
                        <div className="mb-1 text-xs uppercase text-muted-foreground">{t("hist.diagnosis")}</div>
                        <p className="font-medium text-success">{x.chosen_diagnosis || x.diagnosis || "—"}</p>
                      </div>
                      <div>
                        <div className="mb-1 text-xs uppercase text-muted-foreground">{t("hist.recommendation")}</div>
                        <p className="whitespace-pre-wrap">{x.recommendation || "—"}</p>
                      </div>
                      {x.prescriptions?.length > 0 && (
                        <div>
                          <div className="mb-1 text-xs uppercase text-muted-foreground">{t("hist.rx")}</div>
                          <ol className="space-y-2">
                            {x.prescriptions.map((p, i) => (
                              <li key={i} className="rounded-xl bg-muted/40 p-3">
                                <div className="font-medium">{i + 1}. {p.name}</div>
                                <div className="text-xs text-muted-foreground">
                                  {p.dosage} · {p.frequency} · {p.duration}{p.notes ? ` · ${p.notes}` : ""}
                                </div>
                              </li>
                            ))}
                          </ol>
                        </div>
                      )}
                      {x.lab_tests && x.lab_tests.length > 0 && (
                        <div>
                          <div className="mb-1 flex items-center gap-1 text-xs uppercase text-muted-foreground">
                            <FlaskConical className="h-3 w-3" /> {t("hist.labs")}
                          </div>
                          <ol className="space-y-2">
                            {x.lab_tests.map((l, i) => (
                              <li key={i} className="rounded-xl bg-muted/40 p-3">
                                <div className="font-medium">{i + 1}. {l.name}</div>
                                {l.reason && <div className="text-xs text-muted-foreground">{t("hist.reason")} {l.reason}</div>}
                                <div className="text-xs">
                                  <span className="text-muted-foreground">{t("hist.result")} </span>
                                  {l.result || <span className="italic text-muted-foreground">—</span>}
                                </div>
                              </li>
                            ))}
                          </ol>
                        </div>
                      )}
                      {x.instrumental_tests && x.instrumental_tests.length > 0 && (
                        <div>
                          <div className="mb-1 flex items-center gap-1 text-xs uppercase text-muted-foreground">
                            <Activity className="h-3 w-3" /> {t("hist.instr")}
                          </div>
                          <ol className="space-y-2">
                            {x.instrumental_tests.map((l, i) => (
                              <li key={i} className="rounded-xl bg-muted/40 p-3">
                                <div className="font-medium">{i + 1}. {l.name}</div>
                                {l.reason && <div className="text-xs text-muted-foreground">{t("hist.reason")} {l.reason}</div>}
                                <div className="text-xs">
                                  <span className="text-muted-foreground">{t("hist.result")} </span>
                                  {l.result || <span className="italic text-muted-foreground">—</span>}
                                </div>
                              </li>
                            ))}
                          </ol>
                        </div>
                      )}
                      {x.family_advice && (
                        <div>
                          <div className="mb-1 flex items-center gap-1 text-xs uppercase text-muted-foreground">
                            <HeartHandshake className="h-3 w-3" /> {t("hist.family")}
                          </div>
                          <p className="rounded-xl bg-warning/10 p-3 text-sm whitespace-pre-wrap">{x.family_advice}</p>
                        </div>
                      )}
                      {doctorNames[x.user_id] && (
                        <div className="text-xs text-muted-foreground">
                          {t("hist.acceptedBy")} <b>{doctorNames[x.user_id]}</b>
                        </div>
                      )}
                      <div className="pt-2 flex justify-end gap-2">
                        {isMine && (
                          <>
                            <Button variant="outline" size="sm" onClick={() => copy(x)} className="rounded-xl">
                              <Copy className="mr-2 h-4 w-4" /> {t("common.copy")}
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => remove(x.id)} className="rounded-xl text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" /> {t("common.delete")}
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
};

export default HistoryPage;
