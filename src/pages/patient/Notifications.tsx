import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, Bell, CheckCircle2, Clock, Loader2, Stethoscope } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const STATUS: Record<string, { label: string; icon: any; cls: string }> = {
  pending: { label: "Yangi so'rov qabul qilindi", icon: Clock, cls: "text-amber-600" },
  assigned: { label: "Shifokorga biriktirildi", icon: Stethoscope, cls: "text-primary" },
  in_review: { label: "Shifokor ko'rib chiqmoqda", icon: Stethoscope, cls: "text-blue-600" },
  closed: { label: "So'rov yopildi", icon: CheckCircle2, cls: "text-emerald-600" },
};

const Notifications = () => {
  const { user } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase.from("symptom_reports")
        .select("*").eq("patient_id", user.id).order("updated_at", { ascending: false }).limit(50);
      const r = data ?? [];
      setRows(r);
      const docIds = [...new Set(r.map((x: any) => x.assigned_doctor_id).filter(Boolean))];
      if (docIds.length) {
        const { data: profs } = await supabase.from("profiles")
          .select("user_id,full_name,specialty,phone").in("user_id", docIds);
        const map: Record<string, any> = {};
        (profs ?? []).forEach((p: any) => { map[p.user_id] = p; });
        setDoctors(map);
      }
      setLoading(false);
    };
    load();
    const ch = supabase.channel("notif-" + user.id)
      .on("postgres_changes",
        { event: "*", schema: "public", table: "symptom_reports", filter: `patient_id=eq.${user.id}` },
        () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  return (
    <>
      <Helmet><title>Bildirishnomalar — Clinora AI</title></Helmet>
      <div className="min-h-screen" style={{ background: "var(--gradient-soft)" }}>
        <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-lg">
          <div className="container flex h-14 items-center">
            <Link to="/patient" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" /> Orqaga
            </Link>
          </div>
        </header>
        <main className="container max-w-2xl px-4 py-6">
          <h1 className="text-xl font-semibold">Bildirishnomalar</h1>
          {loading ? (
            <div className="py-12 text-center"><Loader2 className="inline h-6 w-6 animate-spin text-primary" /></div>
          ) : rows.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-border bg-card p-8 text-center">
              <Bell className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Hozircha bildirishnomalar yo'q</p>
            </div>
          ) : (
            <div className="mt-4 space-y-2">
              {rows.map((r) => {
                const s = STATUS[r.status] || STATUS.pending;
                const Icon = s.icon;
                const doc = r.assigned_doctor_id ? doctors[r.assigned_doctor_id] : null;
                return (
                  <div key={r.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className={"mt-0.5 " + s.cls}><Icon className="h-5 w-5" /></div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold">{s.label}</div>
                        <div className="mt-0.5 text-xs text-muted-foreground">
                          {r.recommended_specialization || "—"} · {new Date(r.updated_at).toLocaleString("ru-RU")}
                        </div>
                        {doc && (
                          <div className="mt-2 rounded-xl bg-muted/50 p-2 text-xs">
                            <span className="font-medium">Dr. {doc.full_name}</span>
                            {doc.specialty && <span className="text-muted-foreground"> · {doc.specialty}</span>}
                            {doc.phone && <div className="text-muted-foreground">☎ {doc.phone}</div>}
                          </div>
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

export default Notifications;