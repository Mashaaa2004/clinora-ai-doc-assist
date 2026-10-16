import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useT } from "@/i18n/LanguageContext";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { Activity, ArrowDown, ArrowUpRight, Brain, Clock, Heart, Instagram, Send, ShieldCheck } from "lucide-react";
import clinicImage from "@/assets/clinora-clinic.jpg";

const Index = () => {
  const { t } = useT();
  useEffect(() => {
    document.documentElement.classList.add("home-scroll");
    return () => document.documentElement.classList.remove("home-scroll");
  }, []);
  return (
    <div className="home-page min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-background">
        <div className="home-container flex h-20 items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-3" aria-label="Clinora AI">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary font-display text-xl font-bold text-primary-foreground">C</span>
            <span className="text-lg font-bold sm:text-xl">Clinora AI</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-5">
            <LanguageSwitcher />
            <Button asChild size="sm" className="rounded-lg px-4 sm:px-6"><Link to="/auth">{t("idx.signin")}<ArrowUpRight className="ml-2 h-4 w-4" /></Link></Button>
          </div>
        </div>
      </header>
      <main>
        <section className="home-hero relative isolate overflow-hidden">
          <img src={clinicImage} width={1536} height={1024} fetchPriority="high" alt="" className="absolute inset-0 -z-20 h-full w-full object-cover" />
          <div className="home-hero-shade absolute inset-0 -z-10 bg-background/20" />
          <div className="home-container relative flex min-h-[540px] items-center py-14">
            <div className="home-intro max-w-xl">
              <div className="mb-6 flex items-center gap-2 text-xs font-semibold uppercase text-primary"><span className="h-2 w-2 rounded-full bg-primary" />{t("idx.badge")}</div>
              <h1 className="font-display text-5xl font-semibold leading-tight sm:text-6xl lg:text-7xl">Clinora AI</h1>
              <p className="mt-5 max-w-lg text-2xl font-medium leading-snug sm:text-3xl">{t("idx.heroTitle")} {t("idx.heroSpan")}</p>
              <p className="mt-5 max-w-md text-base leading-relaxed text-muted-foreground">{t("idx.heroDesc")}</p>
              <div className="mt-8 flex flex-wrap items-center gap-5">
                <Button asChild size="lg" className="h-12 rounded-lg px-6"><Link to="/auth">{t("idx.try")}<ArrowUpRight className="ml-3 h-4 w-4" /></Link></Button>
                <span className="text-sm text-muted-foreground">{t("idx.free")}</span>
              </div>
              <Button asChild variant="ghost" size="icon" className="mt-7 rounded-full text-foreground"><a href="#overview" aria-label={t("idx.benefitsT")}><ArrowDown className="h-5 w-5" /></a></Button>
            </div>
          </div>
        </section>
        <section id="overview" className="scroll-mt-24 border-b border-border bg-background">
          <div className="home-container grid gap-10 py-14 md:grid-cols-2 md:gap-16 md:py-20">
            <div>
              <Clock className="mb-5 h-7 w-7 text-muted-foreground" />
              <h2 className="text-2xl font-semibold sm:text-3xl">{t("idx.problemT")}</h2>
              <p className="mt-4 max-w-lg text-base leading-relaxed text-muted-foreground">{t("idx.problemD")}</p>
            </div>
            <div className="border-t border-border pt-9 md:border-l md:border-t-0 md:pl-12 md:pt-0">
              <Brain className="mb-5 h-7 w-7 text-primary" />
              <h2 className="text-2xl font-semibold sm:text-3xl">{t("idx.solutionT")}</h2>
              <p className="mt-4 max-w-lg text-base leading-relaxed text-muted-foreground">{t("idx.solutionD")}</p>
            </div>
          </div>
        </section>
        <section className="bg-secondary">
          <div className="home-container py-16 md:py-20">
            <div className="mb-10 flex items-end justify-between gap-6"><h2 className="max-w-2xl text-3xl font-semibold leading-tight sm:text-4xl">{t("idx.benefitsT")}</h2><Activity className="hidden h-8 w-8 shrink-0 text-primary sm:block" /></div>
            <div className="grid gap-5 md:grid-cols-3">
              {[
                { icon: Clock, title: t("idx.b1T"), text: t("idx.b1D"), tone: "text-primary bg-primary/10" },
                { icon: Activity, title: t("idx.b2T"), text: t("idx.b2D"), tone: "text-accent-foreground bg-accent" },
                { icon: Heart, title: t("idx.b3T"), text: t("idx.b3D"), tone: "text-warning-foreground bg-warning/15" },
              ].map(({ icon: Icon, title, text, tone }, i) => (
                <article key={title} className="home-benefit rounded-lg border border-border bg-card p-7">
                  <div className="mb-8 flex items-center justify-between"><span className={`flex h-11 w-11 items-center justify-center rounded-lg ${tone}`}><Icon className="h-5 w-5" /></span><span className="text-xs text-muted-foreground">0{i + 1}</span></div>
                  <h3 className="text-xl font-semibold">{title}</h3>
                  <p className="mt-3 text-base leading-relaxed text-muted-foreground">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
        <section className="border-y border-border bg-accent">
          <div className="home-container flex flex-col items-start justify-between gap-8 py-16 md:flex-row md:items-center md:py-20">
            <div className="max-w-2xl"><h2 className="text-3xl font-semibold leading-tight sm:text-4xl">{t("idx.ctaT")}</h2><p className="mt-4 text-base text-muted-foreground">{t("idx.ctaD")}</p></div>
            <Button asChild size="lg" className="h-12 shrink-0 rounded-lg px-6"><Link to="/auth">{t("idx.ctaBtn")}<ArrowUpRight className="ml-3 h-4 w-4" /></Link></Button>
          </div>
        </section>
      </main>
      <footer className="bg-background">
        <div className="home-container flex flex-col justify-between gap-6 py-9 text-xs text-muted-foreground lg:flex-row lg:items-center">
          <div className="flex max-w-lg items-start gap-2"><ShieldCheck className="h-4 w-4 shrink-0 text-primary" /><span>{t("status.aiNote")}</span></div>
          <div className="flex items-center gap-6">
            <a href="https://t.me/clinora_support" target="_blank" rel="noreferrer" className="flex items-center gap-2 transition-colors hover:text-primary"><Send className="h-4 w-4" />Telegram</a>
            <a href="https://instagram.com/clinora.ai" target="_blank" rel="noreferrer" className="flex items-center gap-2 transition-colors hover:text-primary"><Instagram className="h-4 w-4" />Instagram</a>
          </div>
          <span>© {new Date().getFullYear()} Clinora AI</span>
        </div>
      </footer>
    </div>
  );
};
export default Index;
