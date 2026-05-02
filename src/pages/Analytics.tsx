import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Award, Building2, Crown, FileCheck2, Stethoscope, TrendingUp, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Stats = {
  doctors: number;
  hospitals: number;
  prescriptions: number;
  last7d: number;
  topHospitals: { hospital: string; count: number }[];
  topDoctors: { doctor_name: string; hospital: string; count: number }[];
  recent: { doctor_name: string; hospital: string; patient_name: string; created_at: string }[];
};

const Analytics = () => {
  const [s, setS] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [{ data: profiles }, { data: logs }] = await Promise.all([
          supabase.from("profiles").select("hospital"),
          supabase.from("prescriptions_log")
            .select("doctor_name,hospital,patient_name,created_at")
            .order("created_at", { ascending: false })
            .limit(500),
        ]);

        const doctors = profiles?.length ?? 0;
        const hospitalSet = new Set(
          (profiles ?? [])
            .map((p) => (p.hospital || "").trim().toLowerCase())
            .filter(Boolean)
        );
        const prescriptions = logs?.length ?? 0;
        const cutoff = Date.now() - 7 * 24 * 3600 * 1000;
        const last7d = (logs ?? []).filter((l) => new Date(l.created_at).getTime() > cutoff).length;

        const counter = new Map<string, number>();
        (logs ?? []).forEach((l) => {
          const k = (l.hospital || "Номаълум").trim() || "Номаълум";
          counter.set(k, (counter.get(k) ?? 0) + 1);
        });
        const topHospitals = [...counter.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([hospital, count]) => ({ hospital, count }));

        // Top doctors by patient count
        const docCounter = new Map<string, { count: number; hospital: string }>();
        (logs ?? []).forEach((l) => {
          const name = (l.doctor_name || "").trim();
          if (!name) return;
          const cur = docCounter.get(name) ?? { count: 0, hospital: l.hospital || "" };
          cur.count += 1;
          docCounter.set(name, cur);
        });
        const topDoctors = [...docCounter.entries()]
          .sort((a, b) => b[1].count - a[1].count)
          .slice(0, 5)
          .map(([doctor_name, v]) => ({ doctor_name, hospital: v.hospital, count: v.count }));

        setS({
          doctors,
          hospitals: hospitalSet.size,
          prescriptions,
          last7d,
          topHospitals,
          topDoctors,
          recent: (logs ?? []).slice(0, 8),
        });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="min-h-screen" style={{ background: "var(--gradient-soft)" }}>
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-lg">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/app" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Орқага
          </Link>
          <span className="font-semibold">Аналитика</span>
          <div className="w-16" />
        </div>
      </header>

      <main className="container max-w-4xl py-8 md:py-12">
        {loading || !s ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <StatCard icon={<Stethoscope className="h-5 w-5" />} label="Шифокорлар" value={s.doctors} />
              <StatCard icon={<Building2 className="h-5 w-5" />} label="Касалхоналар" value={s.hospitals} />
              <StatCard icon={<FileCheck2 className="h-5 w-5" />} label="Жами рецептлар" value={s.prescriptions} />
              <StatCard icon={<TrendingUp className="h-5 w-5" />} label="Охирги 7 кун" value={s.last7d} />
            </div>

            <section className="mt-6 rounded-3xl border border-border bg-card p-6 shadow-md">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-primary">Энг фаол касалхоналар</h2>
              {s.topHospitals.length ? (
                <ul className="space-y-3">
                  {s.topHospitals.map((h) => {
                    const max = s.topHospitals[0].count || 1;
                    const pct = (h.count / max) * 100;
                    return (
                      <li key={h.hospital}>
                        <div className="mb-1 flex justify-between text-sm">
                          <span className="font-medium text-foreground">{h.hospital}</span>
                          <span className="text-muted-foreground">{h.count}</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "var(--gradient-primary)" }} />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">Ҳали маълумот йўқ</p>
              )}
            </section>

            <section className="mt-6 rounded-3xl border border-border bg-card p-6 shadow-md">
              <div className="mb-4 flex items-center gap-2">
                <Award className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-semibold uppercase tracking-wide text-primary">
                  Энг кўп бемор кўрган шифокорлар
                </h2>
              </div>
              {s.topDoctors.length ? (
                <ol className="space-y-3">
                  {s.topDoctors.map((d, i) => (
                    <li key={d.doctor_name} className="flex items-center gap-3 rounded-2xl border border-border bg-background/50 p-3">
                      <div
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                        style={{
                          background: i === 0 ? "linear-gradient(135deg, hsl(45 93% 58%), hsl(35 93% 50%))" :
                                      i === 1 ? "hsl(var(--muted))" :
                                      i === 2 ? "linear-gradient(135deg, hsl(25 75% 55%), hsl(15 75% 45%))" :
                                      "hsl(var(--muted))",
                          color: i < 3 ? "white" : "hsl(var(--muted-foreground))",
                        }}
                      >
                        {i + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 truncate font-medium">
                          {d.doctor_name}
                          {i === 0 && <Crown className="h-3.5 w-3.5 text-warning" />}
                        </div>
                        <div className="truncate text-xs text-muted-foreground">{d.hospital || "—"}</div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="text-lg font-bold text-primary">{d.count}</div>
                        <div className="text-[10px] text-muted-foreground">бемор</div>
                      </div>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-sm text-muted-foreground">Ҳали маълумот йўқ</p>
              )}
            </section>

            <section className="mt-6 rounded-3xl border border-border bg-card p-6 shadow-md">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-primary">Сўнгги рецептлар</h2>
              {s.recent.length ? (
                <div className="divide-y divide-border">
                  {s.recent.map((r, i) => (
                    <div key={i} className="flex items-center justify-between gap-3 py-3 text-sm">
                      <div className="min-w-0">
                        <div className="truncate font-medium text-foreground">{r.patient_name || "Бемор"}</div>
                        <div className="truncate text-xs text-muted-foreground">
                          {r.doctor_name || "Шифокор"} · {r.hospital || "—"}
                        </div>
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {new Date(r.created_at).toLocaleString("ru-RU")}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Ҳали рецептлар йўқ</p>
              )}
            </section>

            <p className="mt-6 text-center text-xs text-muted-foreground">
              Барча рақамлар реал маълумотлар асосида янгиланиб туради
            </p>
          </>
        )}
      </main>
    </div>
  );
};

const StatCard = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) => (
  <div className="rounded-3xl border border-border bg-card p-5 shadow-md">
    <div className="flex items-center justify-between">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div className="flex h-8 w-8 items-center justify-center rounded-lg text-primary-foreground" style={{ background: "var(--gradient-primary)" }}>
        {icon}
      </div>
    </div>
    <div className="mt-3 text-3xl font-bold text-foreground">{value}</div>
  </div>
);

export default Analytics;
