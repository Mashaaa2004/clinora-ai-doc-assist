import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { FilePlus2, ClipboardList, Bell, User as UserIcon, LogOut, Stethoscope } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import LanguageSwitcher from "@/components/LanguageSwitcher";

const Tile = ({ to, icon: Icon, title, desc, accent }: any) => (
  <Link to={to} className="group block rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:border-primary/50 hover:shadow-md">
    <div className="flex items-start gap-4">
      <div className={"flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-primary-foreground shadow-sm " + (accent || "")} style={!accent ? { background: "var(--gradient-primary)" } : undefined}>
        <Icon className="h-6 w-6" />
      </div>
      <div className="min-w-0">
        <div className="font-semibold text-foreground">{title}</div>
        <div className="mt-1 text-sm text-muted-foreground">{desc}</div>
      </div>
    </div>
  </Link>
);

const PatientDashboard = () => {
  const { signOut, user } = useAuth();
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

        <main className="container max-w-2xl px-4 py-6">
          <h1 className="text-2xl font-semibold tracking-tight">Salom 👋</h1>
          <p className="mt-1 text-sm text-muted-foreground">Tibbiy yordamga muhtojmisiz? Yangi so'rov yuboring.</p>

          <div className="mt-6 grid gap-3">
            <Tile to="/patient/new" icon={FilePlus2} title="Yangi tibbiy so'rov" desc="Klinika tanlang va shikoyatlaringizni yozing — AI sizni mos shifokorga yo'naltiradi." />
            <Tile to="/patient/requests" icon={ClipboardList} title="Mening so'rovlarim" desc="Yuborilgan so'rovlar, holati va tayinlangan shifokor." accent="bg-emerald-500" />
            <Tile to="/patient/profile" icon={UserIcon} title="Profil" desc="Shaxsiy ma'lumotlar, qon guruhi, allergiyalar." accent="bg-violet-500" />
            <Tile to="/patient/notifications" icon={Bell} title="Bildirishnomalar" desc="Shifokor javoblari va yangiliklar." accent="bg-amber-500" />
          </div>

          <div className="mt-8 rounded-2xl border border-border bg-card p-4 text-xs text-muted-foreground">
            <Stethoscope className="mr-1 inline h-4 w-4 text-primary" />
            Faqat Clinora tarmog'iga ulangan klinika va shifokorlar ko'rinadi.
          </div>
        </main>
      </div>
    </>
  );
};

export default PatientDashboard;