import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Building2, FileCheck2, Stethoscope, TrendingUp, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useT } from "@/i18n/LanguageContext";
import { Helmet } from "react-helmet-async";

type Stats = {
  doctors: number;
  hospitals: number;
  prescriptions: number;
  last7d: number;
  topHospitals: { hospital: string; count: number }[];
};

const Analytics = () => {
  const { t } = useT();
  const [s, setS] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase.rpc("platform_stats");
        if (error || !data) return;
        const d = data as any;
        setS({
          doctors: d.doctors ?? 0,
          hospitals: d.hospitals ?? 0,
          prescriptions: d.prescriptions ?? 0,
          last7d: d.last7d ?? 0,
          topHospitals: Array.isArray(d.topHospitals) ? d.topHospitals : [],
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
            {t("common.back")}
          </Link>
          <span className="font-semibold">{t("an.title")}</span>
          <div className="w-16" />
        </div>
      </header>

      <main className="container max-w-4xl py-8 md:py-12">
        {loading || !s ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <StatCard icon={<Stethoscope className="h-5 w-5" />} label={t("an.doctors")} value={s.doctors} />
              <StatCard icon={<Building2 className="h-5 w-5" />} label={t("an.hospitals")} value={s.hospitals} />
              <StatCard icon={<FileCheck2 className="h-5 w-5" />} label={t("an.scripts")} value={s.prescriptions} />
              <StatCard icon={<TrendingUp className="h-5 w-5" />} label={t("an.last7d")} value={s.last7d} />
            </div>

            <section className="mt-6 rounded-3xl border border-border bg-card p-6 shadow-md">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-primary">{t("an.topHospitals")}</h2>
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
                <p className="text-sm text-muted-foreground">{t("an.noData")}</p>
              )}
            </section>

            <p className="mt-6 text-center text-xs text-muted-foreground">
              {t("an.realtime")}
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
