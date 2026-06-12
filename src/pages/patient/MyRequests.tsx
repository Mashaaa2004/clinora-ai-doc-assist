import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, Loader2, Inbox } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const STATUS_LABEL: Record<string, string> = {
  pending: "Kutilmoqda", assigned: "Shifokorga yuborildi", in_review: "Ko'rib chiqilmoqda", closed: "Yopilgan",
};
const URGENCY: Record<string, string> = {
  emergency: "bg-destructive/20 text-destructive",
  high: "bg-orange-500/20 text-orange-700",
  medium: "bg-amber-500/20 text-amber-700",
  low: "bg-emerald-500/20 text-emerald-700",
};

const MyRequests = () => {
  const { user } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!user) return;
    const load = () => supabase.from("symptom_reports").select("*").eq("patient_id", user.id).order("created_at", { ascending: false })
      .then(({ data }) => { setRows(data ?? []); setLoading(false); });
    load();
    const ch = supabase.channel("my-requests-" + user.id)
      .on("postgres_changes",
        { event: "*", schema: "public", table: "symptom_reports", filter: `patient_id=eq.${user.id}` },
        () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);
  return (
    <>
      <Helmet><title>Mening so'rovlarim — Clinora AI</title></Helmet>
      <div className="min-h-screen" style={{ background: "var(--gradient-soft)" }}>
        <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-lg">
          <div className="container flex h-14 items-center">
            <Link to="/patient" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" /> Orqaga
            </Link>
          </div>
        </header>
        <main className="container max-w-2xl px-4 py-6">
          <h1 className="text-xl font-semibold">Mening so'rovlarim</h1>
          {loading ? <div className="py-12 text-center"><Loader2 className="inline h-6 w-6 animate-spin text-primary" /></div>
          : rows.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-border bg-card p-8 text-center">
              <Inbox className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Hali so'rov yo'q</p>
              <Link to="/patient/new" className="mt-3 inline-block text-sm font-medium text-primary hover:underline">Yangi so'rov →</Link>
            </div>
          ) : (
            <div className="mt-4 space-y-2">
              {rows.map((r) => (
                <div key={r.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={"rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase " + (URGENCY[r.ai_urgency] || URGENCY.medium)}>{r.ai_urgency}</span>
                        <span className="text-xs font-medium">{r.recommended_specialization || "—"}</span>
                      </div>
                      <p className="mt-2 line-clamp-2 text-sm">{r.ai_summary || r.symptoms}</p>
                      <p className="mt-1 text-[11px] text-muted-foreground">{new Date(r.created_at).toLocaleString("ru-RU")}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-muted px-2 py-1 text-[10px] font-medium">{STATUS_LABEL[r.status] || r.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </>
  );
};
export default MyRequests;