import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
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

const Index = () => {
  return (
    <div className="relative min-h-screen bg-mesh text-foreground">
      {/* Animated mesh + grain layer */}
      <div className="bg-mesh-animated grain pointer-events-none absolute inset-0 -z-10" aria-hidden />

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/60 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-2xl shadow-lg animate-glow-pulse"
              style={{ background: "var(--gradient-primary)" }}
            >
              <Stethoscope className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold tracking-tight">Clinora AI</span>
          </div>
          <Link to="/auth">
            <Button size="sm" className="shine rounded-full px-5 text-primary-foreground" style={{ background: "var(--gradient-primary)" }}>
              Кириш
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative">
        <div className="container py-24 md:py-32">
          <div className="mx-auto max-w-3xl text-center animate-fade-up">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5" />
              Шифокорлар учун AI ёрдамчи
            </div>
            <h1 className="text-balance text-5xl font-bold tracking-tight md:text-7xl">
              Clinora AI —{" "}
              <span className="text-gradient-primary">шифокорлар учун ақлли ёрдамчи</span>
            </h1>
            <p className="mx-auto mt-7 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground md:text-xl">
              30 сонияда бемор суҳбатидан симптомлар, ташхис ва тавсияларни автоматик тарзда олинг.
            </p>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link to="/auth">
                <Button
                  size="lg"
                  className="shine rounded-full px-9 py-6 text-base font-semibold text-primary-foreground shadow-xl"
                  style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}
                >
                  <Zap className="mr-2 h-5 w-5" />
                  Синаб кўриш
                </Button>
              </Link>
              <span className="text-sm text-muted-foreground">Бепул • Шифокорлар учун</span>
            </div>
          </div>
        </div>
      </section>

      {/* Problem / Solution */}
      <section className="container py-16 md:py-20">
        <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2">
          <div className="glass-card card-tilt rounded-3xl p-8">
            <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/15 ring-1 ring-destructive/30 animate-float">
              <Clock className="h-6 w-6 text-destructive" />
            </div>
            <h3 className="mb-3 text-2xl font-semibold">Муаммо</h3>
            <p className="text-base leading-relaxed text-muted-foreground">
              Узун навбатлар, вақт етишмаслиги ва ҳужжатлаштириш юки шифокорни асосий ишидан чалғитади.
            </p>
          </div>
          <div className="glass-card card-tilt rounded-3xl p-8">
            <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 ring-1 ring-primary/30 animate-float" style={{ animationDelay: "1.5s" }}>
              <Brain className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mb-3 text-2xl font-semibold">Ечим</h3>
            <p className="text-base leading-relaxed text-muted-foreground">
              AI ёрдамида бемор суҳбатини ёзинг, бир неча сонияда симптомлар ва дастлабки таҳлилни олинг.
            </p>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="container pb-20 md:pb-28">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-14 text-center text-4xl font-bold tracking-tight md:text-5xl">
            <span className="text-gradient-primary">Афзалликлар</span>
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { icon: Zap, title: "Тезлик", text: "30 сонияда тайёр таҳлил" },
              { icon: Activity, title: "Аниқлик", text: "Энг сўнгги AI моделлари асосида" },
              { icon: Heart, title: "Кам стресс", text: "Ҳужжат юкини камайтиради" },
            ].map(({ icon: Icon, title, text }, i) => (
              <div
                key={title}
                className="glass-card card-tilt group rounded-3xl p-8"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div
                  className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg transition-transform group-hover:scale-110 group-hover:rotate-3"
                  style={{ background: "var(--gradient-primary)" }}
                >
                  <Icon className="h-7 w-7 text-primary-foreground" />
                </div>
                <h3 className="mb-2 text-xl font-semibold">{title}</h3>
                <p className="text-base leading-relaxed text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container pb-24">
        <div className="glass-card card-tilt mx-auto max-w-3xl overflow-hidden rounded-[2rem] p-12 text-center">
          <h2 className="text-3xl font-bold md:text-4xl">Ҳозироқ синаб кўринг</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Микрофонни ёқинг, бемор билан суҳбатлашинг — қолганини AI бажаради.
          </p>
          <Link to="/auth" className="mt-8 inline-block">
            <Button
              size="lg"
              className="shine rounded-full px-10 py-6 text-base font-semibold text-primary-foreground"
              style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}
            >
              Бошлаш
            </Button>
          </Link>
        </div>
      </section>

      <footer className="border-t border-border/40 py-8 backdrop-blur-sm">
        <div className="container flex flex-col items-center justify-between gap-4 text-sm text-muted-foreground md:flex-row">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <span>Бу AI фақат ёрдамчи, якуний қарор шифокорга тегишли</span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="https://t.me/clinora_support"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/60 px-3 py-1.5 backdrop-blur transition-colors hover:border-primary/50 hover:text-primary"
            >
              <Send className="h-3.5 w-3.5" /> Telegram
            </a>
            <a
              href="https://instagram.com/clinora.ai"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/60 px-3 py-1.5 backdrop-blur transition-colors hover:border-primary/50 hover:text-primary"
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