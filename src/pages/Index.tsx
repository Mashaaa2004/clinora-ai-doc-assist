import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Activity, Brain, Clock, Heart, ShieldCheck, Sparkles, Stethoscope, Zap } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-lg">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl shadow-md" style={{ background: "var(--gradient-primary)" }}>
              <Stethoscope className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold tracking-tight text-foreground">Clinora AI</span>
          </div>
          <Link to="/auth">
            <Button size="sm" className="rounded-full">Кириш</Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 -z-10"
          style={{ background: "var(--gradient-hero)" }}
        />
        <div className="container py-20 md:py-28">
          <div className="mx-auto max-w-3xl text-center animate-fade-up">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium text-muted-foreground shadow-sm">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Шифокорлар учун AI ёрдамчи
            </div>
            <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground md:text-6xl">
              Clinora AI — <span className="bg-clip-text text-transparent" style={{ backgroundImage: "var(--gradient-primary)" }}>шифокорлар учун ақлли ёрдамчи</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-muted-foreground">
              30 сонияда бемор суҳбатидан симптомлар, ташхис ва тавсияларни автоматик тарзда олинг.
            </p>
            <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link to="/auth">
                <Button size="lg" className="rounded-full px-8 shadow-lg" style={{ background: "var(--gradient-primary)" }}>
                  <Zap className="mr-2 h-5 w-5" />
                  Синаб кўриш
                </Button>
              </Link>
              <span className="text-xs text-muted-foreground">Бепул • Шифокорлар учун</span>
            </div>
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className="container py-16 md:py-24">
        <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-border bg-card p-8 shadow-sm">
            <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-destructive/10">
              <Clock className="h-5 w-5 text-destructive" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-foreground">Муаммо</h3>
            <p className="text-muted-foreground">
              Узун навбатлар, вақт етишмаслиги ва ҳужжатлаштириш юки шифокорни асосий ишидан чалғитади.
            </p>
          </div>
          <div className="rounded-3xl border border-border bg-card p-8 shadow-sm">
            <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-accent">
              <Brain className="h-5 w-5 text-primary" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-foreground">Ечим</h3>
            <p className="text-muted-foreground">
              AI ёрдамида бемор суҳбатини ёзинг, бир неча сонияда симптомлар ва дастлабки таҳлилни олинг.
            </p>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="container pb-20 md:pb-28">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-12 text-center text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Афзалликлар
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { icon: Zap, title: "Тезлик", text: "30 сонияда тайёр таҳлил" },
              { icon: Activity, title: "Аниқлик", text: "Энг сўнгги AI моделлари асосида" },
              { icon: Heart, title: "Кам стресс", text: "Ҳужжат юкини камайтиради" },
            ].map(({ icon: Icon, title, text }) => (
              <div key={title} className="group rounded-3xl border border-border bg-card p-8 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl shadow-md" style={{ background: "var(--gradient-primary)" }}>
                  <Icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">{title}</h3>
                <p className="text-sm text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container pb-24">
        <div className="mx-auto max-w-3xl rounded-3xl border border-border p-10 text-center shadow-md" style={{ background: "var(--gradient-soft)" }}>
          <h2 className="text-2xl font-bold text-foreground md:text-3xl">Ҳозироқ синаб кўринг</h2>
          <p className="mt-3 text-muted-foreground">Микрофонни ёқинг, бемор билан суҳбатлашинг — қолганини AI бажаради.</p>
          <Link to="/auth" className="mt-6 inline-block">
            <Button size="lg" className="rounded-full px-8" style={{ background: "var(--gradient-primary)" }}>
              Бошлаш
            </Button>
          </Link>
        </div>
      </section>

      <footer className="border-t border-border/60 py-8">
        <div className="container flex flex-col items-center justify-between gap-3 text-xs text-muted-foreground md:flex-row">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            <span>Бу AI фақат ёрдамчи, якуний қарор шифокорга тегишли</span>
          </div>
          <span>© {new Date().getFullYear()} Clinora AI</span>
        </div>
      </footer>
    </div>
  );
};

export default Index;
