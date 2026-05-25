import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useT } from "@/i18n/LanguageContext";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import {
  Activity,
  Brain,
  Clock,
  Heart,
  Instagram,
  Send,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Zap,
} from "lucide-react";

const MedicalBackdrop = () => (
  <div className="med-bg" aria-hidden>
    {/* Heart */}
    <svg className="med-float-1" width="90" height="90" viewBox="0 0 24 24" fill="none" stroke="hsl(174 72% 45%)" strokeWidth="1.2">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
    {/* DNA */}
    <svg className="med-float-2" width="110" height="110" viewBox="0 0 64 64" fill="none" stroke="hsl(188 85% 55%)" strokeWidth="1.4">
      <path d="M16 4 C40 16 24 32 48 44 M48 4 C24 16 40 32 16 44 M16 12 H48 M16 20 H48 M16 28 H48 M16 36 H48"/>
    </svg>
    {/* Plus / cross */}
    <svg className="med-float-3" width="80" height="80" viewBox="0 0 24 24" fill="hsl(160 70% 55% / 0.25)" stroke="hsl(160 70% 45%)" strokeWidth="1">
      <path d="M9 2h6v7h7v6h-7v7H9v-7H2V9h7z"/>
    </svg>
    {/* Pill */}
    <svg className="med-float-4" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="hsl(200 90% 55%)" strokeWidth="1.4">
      <rect x="2" y="8" width="20" height="8" rx="4"/>
      <path d="M12 8v8"/>
    </svg>
    {/* ECG pulse */}
    <svg className="med-float-5" width="220" height="60" viewBox="0 0 220 60" fill="none">
      <path className="ecg-line" d="M0 30 H40 L50 10 L60 50 L72 20 L82 40 L92 30 H220" stroke="hsl(174 72% 50%)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
    {/* Stethoscope-ish circles */}
    <svg className="med-float-1" style={{ top: "65%", left: "70%" }} width="70" height="70" viewBox="0 0 24 24" fill="none" stroke="hsl(188 85% 50%)" strokeWidth="1.2">
      <circle cx="12" cy="12" r="8"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  </div>
);

const Index = () => {
  const { t } = useT();
  return (
    <div className="relative min-h-screen bg-mesh text-foreground overflow-hidden">
      {/* Animated mesh + grain layer */}
      <div className="bg-mesh-animated pointer-events-none absolute inset-0 -z-10" aria-hidden />
      {/* Medical floating icons */}
      <div className="absolute inset-0 -z-10"><MedicalBackdrop /></div>

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-2xl shadow-lg animate-glow-pulse"
              style={{ background: "var(--gradient-primary)" }}
            >
              <span className="font-display text-lg font-extrabold leading-none text-primary-foreground">C</span>
            </div>
            <span className="text-xl font-bold tracking-tight">Clinora AI</span>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <Link to="/auth">
              <Button size="sm" className="shine rounded-full px-6 h-10 text-primary-foreground font-semibold" style={{ background: "var(--gradient-primary)" }}>
                {t("idx.signin")}
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
      {/* Hero */}
      <section className="relative">
        <div className="container py-20 md:py-28">
          <div className="mx-auto max-w-3xl text-center animate-fade-up">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-white/60 px-5 py-2 text-sm font-semibold text-primary backdrop-blur-md shadow-sm">
              <Sparkles className="h-4 w-4" />
              {t("idx.badge")}
            </div>
            <h1 className="text-balance text-5xl font-bold tracking-tight md:text-7xl leading-[1.05]">
              {t("idx.heroTitle")}{" "}
              <span className="text-gradient-primary">{t("idx.heroSpan")}</span>
            </h1>
            <p className="mx-auto mt-8 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground md:text-2xl">
              {t("idx.heroDesc")}
            </p>
            <div className="mt-12 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link to="/auth">
                <Button
                  size="lg"
                  className="shine rounded-full px-10 py-7 text-lg font-semibold text-primary-foreground shadow-xl"
                  style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}
                >
                  <Zap className="mr-2 h-5 w-5" />
                  {t("idx.try")}
                </Button>
              </Link>
              <span className="text-base text-muted-foreground font-medium">{t("idx.free")}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Problem / Solution */}
      <section className="container relative py-16 md:py-20">
        <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2">
          <div className="glass-card card-tilt rounded-3xl p-9">
            <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 ring-1 ring-destructive/30 animate-float">
              <Clock className="h-7 w-7 text-destructive" />
            </div>
            <h2 className="mb-3 text-2xl md:text-3xl font-bold">{t("idx.problemT")}</h2>
            <p className="text-lg leading-relaxed text-muted-foreground">
              {t("idx.problemD")}
            </p>
          </div>
          <div className="glass-card card-tilt rounded-3xl p-9">
            <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/30 animate-float" style={{ animationDelay: "1.5s" }}>
              <Brain className="h-7 w-7 text-primary" />
            </div>
            <h2 className="mb-3 text-2xl md:text-3xl font-bold">{t("idx.solutionT")}</h2>
            <p className="text-lg leading-relaxed text-muted-foreground">
              {t("idx.solutionD")}
            </p>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="container relative pb-20 md:pb-28">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-14 text-center text-4xl font-bold tracking-tight md:text-6xl">
            <span className="text-gradient-primary">{t("idx.benefitsT")}</span>
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { icon: Zap, title: t("idx.b1T"), text: t("idx.b1D") },
              { icon: Activity, title: t("idx.b2T"), text: t("idx.b2D") },
              { icon: Heart, title: t("idx.b3T"), text: t("idx.b3D") },
            ].map(({ icon: Icon, title, text }, i) => (
              <div
                key={title}
                className="glass-card card-tilt group rounded-3xl p-9"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div
                  className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl shadow-lg transition-transform group-hover:scale-110 group-hover:rotate-6"
                  style={{ background: "var(--gradient-primary)" }}
                >
                  <Icon className="h-8 w-8 text-primary-foreground" />
                </div>
                <h3 className="mb-2 text-2xl font-bold">{title}</h3>
                <p className="text-lg leading-relaxed text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container relative pb-24">
        <div className="glass-card card-tilt mx-auto max-w-3xl overflow-hidden rounded-[2rem] p-14 text-center">
          <h2 className="text-4xl font-bold md:text-5xl">{t("idx.ctaT")}</h2>
          <p className="mt-5 text-xl text-muted-foreground">
            {t("idx.ctaD")}
          </p>
          <Link to="/auth" className="mt-10 inline-block">
            <Button
              size="lg"
              className="shine rounded-full px-12 py-7 text-lg font-semibold text-primary-foreground"
              style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}
            >
              {t("idx.ctaBtn")}
            </Button>
          </Link>
        </div>
      </section>

      <footer className="relative border-t border-border/60 py-8 backdrop-blur-sm bg-background/60">
        <div className="container flex flex-col items-center justify-between gap-4 text-sm text-muted-foreground md:flex-row">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <span>{t("status.aiNote")}</span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="https://t.me/clinora_support"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white/70 px-3 py-1.5 backdrop-blur transition-colors hover:border-primary/60 hover:text-primary"
            >
              <Send className="h-3.5 w-3.5" /> Telegram
            </a>
            <a
              href="https://instagram.com/clinora.ai"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white/70 px-3 py-1.5 backdrop-blur transition-colors hover:border-primary/60 hover:text-primary"
            >
              <Instagram className="h-3.5 w-3.5" /> Instagram
            </a>
          </div>
          <span>© {new Date().getFullYear()} Clinora AI</span>
        </div>
      </footer>
    </div>
  );
};

export default Index;