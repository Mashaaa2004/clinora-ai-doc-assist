import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  FilePlus2, ClipboardList, Bell, User as UserIcon, LogOut, Stethoscope,
  Activity, Clock, ChevronRight, Sparkles,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { supabase } from "@/integrations/supabase/client";

const Tile = ({ to, icon: Icon, title, desc, accent }: any) => (
  <Link to={to} className="group flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm transition hover:border-primary/50 hover:shadow-md">
    <div className={"flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-primary-foreground shadow-sm " + (accent || "")} style={!accent ? { background: "var(--gradient-primary)" } : undefined}>
      <Icon className="h-5 w-5" />
    </div>
    <div className="min-w-0 flex-1">
      <div className="text-sm font-semibold text-foreground">{title}</div>
      <div className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{desc}</div>
    </div>
    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
  </Link>
);

const StatCard = ({ icon: Icon, value, label, tone }: any) => (
  <div className="rounded-2xl border border-border bg-card p-3 shadow-sm">
    <div className={"mb-1 flex h-8 w-8 items-center justify-center rounded-lg " + tone}>
      <Icon className="h-4 w-4" />
    </div>
    <div className="text-xl font-semibold leading-tight">{value}</div>
    <div className="text-[11px] text-muted-foreground">{label}</div>
  </div>
);

const URGENCY_DOT: Record<string, string> = {
  emergency: "bg-destructive",
  high: "bg-orange-500",
  medium: "bg-amber-500",
  low: "bg-emerald-500",
};

const PatientDashboard = () => {
  const { signOut, user } = useAuth();
  const [name, setName] = useState("");
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    const [{ data: prof }, { data: reports }] = await Promise.all([
      supabase.from("patient_profiles").select("full_name").eq("user_id", user.id).maybeSingle(),
      supabase.from("symptom_reports").select("id,ai_urgency,ai_summary,symptoms,status,recommended_specialization,created_at")
        .eq("patient_id", user.id).order("created_at", { ascending: false }).limit(3),
    ]);
    if (prof?.full_name) setName(prof.full_name.split(" ")[0]);
    setRows(reports ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    if (!user) return;
    const ch = supabase
      .channel("patient-dashboard-" + user.id)
      .on("postgres_changes",
        { event: "*", schema: "public", table: "symptom_reports", filter: `patient_id=eq.${user.id}` },
        () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const active = rows.filter((r) => r.status !== "closed").length;
  const total = rows.length;

  return (
    <>
      <Helmet>
        <title>Bemor paneli — Clinora AI</title>
        <meta name="description" content="Clinora AI bemor paneli — klinika tanlash, shikoyat yuborish va tarix." />
      </Helmet>
      <div className="min-h-screen" style={{ background: "var(--gradient-soft)" }}>
        <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-lg">
          <div className="container flex h-14 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg shadow-sm" style={{ background: "var(--gradient-primary)" }}>
                <span className="font-display text-sm font-extrabold text-primary-foreground">C</span>
              </div>
              <span className="text-sm font-semibold">Clinora</span>
            </div>
            <div className="flex items-center gap-1">
              <LanguageSwitcher />
              <Button variant="ghost" size="sm" onClick={signOut} aria-label="Chiqish">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>

        <main className="container max-w-2xl px-4 py-6 pb-24">
          <h1 className="text-2xl font-semibold tracking-tight">
            Salom{name ? `, ${name}` : ""} 👋
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Tibbiy yordamga muhtojmisiz? Yangi so'rov yuboring.</p>

          <div className="mt-5 grid grid-cols-3 gap-2">
            <StatCard icon={Activity} value={active} label="Faol so'rovlar" tone="bg-primary/10 text-primary" />
            <StatCard icon={ClipboardList} value={total} label="Jami" tone="bg-emerald-500/10 text-emerald-600" />
            <StatCard icon={Clock} value={rows[0] ? new Date(rows[0].created_at).toLocaleDateString("ru-RU", { day: "2-digit", month: "short" }) : "—"} label="Oxirgi" tone="bg-violet-500/10 text-violet-600" />
          </div>

          <Link
            to="/patient/new"
            className="mt-4 flex items-center gap-3 rounded-2xl p-4 text-primary-foreground shadow-md transition hover:shadow-lg"
            style={{ background: "var(--gradient-primary)" }}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
              <Sparkles className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-semibold">Yangi tibbiy so'rov</div>
              <div className="text-xs opacity-90">AI sizni mos shifokorga yo'naltiradi</div>
            </div>
            <FilePlus2 className="h-5 w-5 opacity-90" />
          </Link>

          {!loading && rows.length > 0 && (
            <section className="mt-6">
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-sm font-semibold">So'nggi so'rovlar</h2>
                <Link to="/patient/requests" className="text-xs font-medium text-primary hover:underline">Hammasi →</Link>
              </div>
              <div className="space-y-2">
                {rows.map((r) => (
                  <Link key={r.id} to="/patient/requests"
                    className="block rounded-2xl border border-border bg-card p-3 shadow-sm transition hover:border-primary/50">
                    <div className="flex items-center gap-2 text-xs">
                      <span className={"h-2 w-2 rounded-full " + (URGENCY_DOT[r.ai_urgency] || "bg-muted-foreground")} />
                      <span className="font-medium">{r.recommended_specialization || "—"}</span>
                      <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase">{r.status}</span>
                    </div>
                    <p className="mt-1.5 line-clamp-2 text-sm text-foreground/90">{r.ai_summary || r.symptoms}</p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <section className="mt-6 grid gap-2">
            <Tile to="/patient/requests" icon={ClipboardList} title="Mening so'rovlarim" desc="Yuborilgan so'rovlar, holati va tayinlangan shifokor." accent="bg-emerald-500" />
            <Tile to="/patient/profile" icon={UserIcon} title="Profil" desc="Shaxsiy ma'lumotlar, qon guruhi, allergiyalar." accent="bg-violet-500" />
            <Tile to="/patient/notifications" icon={Bell} title="Bildirishnomalar" desc="Shifokor javoblari va yangiliklar." accent="bg-amber-500" />
          </section>

          <div className="mt-6 rounded-2xl border border-border bg-card p-4 text-xs text-muted-foreground">
            <Stethoscope className="mr-1 inline h-4 w-4 text-primary" />
            Faqat Clinora tarmog'iga ulangan klinika va shifokorlar ko'rinadi.
          </div>
        </main>

        <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-border/60 bg-background/90 backdrop-blur-lg sm:hidden">
          <div className="container grid max-w-2xl grid-cols-4 py-1.5 text-[10px] font-medium">
            {[
              { to: "/patient", icon: Activity, label: "Bosh" },
              { to: "/patient/new", icon: FilePlus2, label: "So'rov" },
              { to: "/patient/requests", icon: ClipboardList, label: "Tarix" },
              { to: "/patient/profile", icon: UserIcon, label: "Profil" },
            ].map((n) => (
              <Link key={n.to} to={n.to} className="flex flex-col items-center gap-0.5 rounded-lg py-1.5 text-muted-foreground transition hover:text-primary">
                <n.icon className="h-5 w-5" />
                {n.label}
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </>
  );
};

export default PatientDashboard;