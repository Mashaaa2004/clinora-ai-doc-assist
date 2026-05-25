import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Check, Copy, Crown, Send, Sparkles, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import SupportFooter from "@/components/SupportFooter";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useT } from "@/i18n/LanguageContext";
import { DATE_LOCALE } from "@/i18n/translations";

type Settings = {
  card_number: string;
  card_holder: string;
  telegram_support: string;
  pro_price_monthly: number;
};

const PricingPage = () => {
  const { user, isPro, proExpiresAt } = useAuth();
  const { t, lang } = useT();
  const DURATIONS = [
    { months: 1, label: t("pr.m1") },
    { months: 3, label: t("pr.m3") },
    { months: 6, label: t("pr.m6") },
    { months: 12, label: t("pr.m12") },
  ];
  const [settings, setSettings] = useState<Settings | null>(null);
  const [duration, setDuration] = useState(1);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase
      .from("platform_settings")
      .select("card_number,card_holder,telegram_support,pro_price_monthly")
      .eq("id", 1)
      .maybeSingle()
      .then(({ data }) => setSettings(data as Settings | null));
  }, []);

  const price = (settings?.pro_price_monthly ?? 250000) * duration;
  const fmt = (n: number) => n.toLocaleString(DATE_LOCALE[lang]) + " " + t("pr.suffix");

  const copy = (txt: string) => {
    navigator.clipboard.writeText(txt);
    toast.success(t("pr.copied"));
  };

  const submitRequest = async () => {
    if (!user) return;
    setBusy(true);
    const { error } = await supabase.from("payment_requests").insert({
      user_id: user.id,
      plan: "pro",
      duration_months: duration,
      amount: price,
    });
    setBusy(false);
    if (error) {
      toast.error(t("pr.reqFail"));
      return;
    }
    toast.success(t("pr.reqSent"));
  };

  const tg = settings?.telegram_support || "@clinora_support";
  const tgLink = `https://t.me/${tg.replace("@", "")}`;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--gradient-soft)" }}>
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-lg">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/app" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> {t("common.back")}
          </Link>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg shadow-md" style={{ background: "var(--gradient-primary)" }}>
              <span className="font-display text-sm font-extrabold leading-none text-primary-foreground">C</span>
            </div>
            <span className="text-sm font-semibold">{t("pr.tariffs")}</span>
          </div>
        </div>
      </header>

      <main className="container max-w-4xl py-10 md:py-14 flex-1">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium text-muted-foreground shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-primary" /> {t("pr.badge")}
          </div>
          <h1 className="mt-4 text-3xl md:text-4xl font-bold tracking-tight">
            {t("pr.heroT")}
          </h1>
          <p className="mt-3 text-muted-foreground">
            {t("pr.heroD")}
          </p>
          {isPro && proExpiresAt && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-success/10 px-4 py-1.5 text-sm font-semibold text-success">
              <Crown className="h-4 w-4" /> {t("pr.active")} · {new Date(proExpiresAt).toLocaleDateString(DATE_LOCALE[lang])} {t("pr.until")}
            </div>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* PRO */}
          <div
            className="relative rounded-3xl border border-primary/40 bg-card p-6 shadow-md md:p-8"
            style={{ boxShadow: "var(--shadow-glow)" }}
          >
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
              {t("pr.popular")}
            </span>
            <h3 className="text-xl font-semibold">Pro</h3>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-3xl font-bold">{fmt(price)}</span>
              <span className="text-sm text-muted-foreground">/ {DURATIONS.find((d) => d.months === duration)?.label}</span>
            </div>

            <div className="mt-4 grid grid-cols-4 gap-2">
              {DURATIONS.map((d) => (
                <button
                  key={d.months}
                  onClick={() => setDuration(d.months)}
                  className={
                    "rounded-xl border px-2 py-2 text-xs font-semibold transition " +
                    (duration === d.months
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background hover:bg-muted")
                  }
                >
                  {d.label}
                </button>
              ))}
            </div>

            <ul className="mt-5 space-y-2 text-sm">
              {[
                t("pr.f1"),
                t("pr.f2"),
                t("pr.f3"),
                t("pr.f4"),
                t("pr.f5"),
                t("pr.f6"),
              ].map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            {settings && (
              <div className="mt-5 rounded-2xl border border-border bg-muted/30 p-4">
                <div className="text-xs font-semibold uppercase text-muted-foreground">{t("pr.cardTitle")}</div>
                <button
                  onClick={() => copy(settings.card_number)}
                  className="mt-1.5 flex w-full items-center justify-between rounded-lg bg-background p-2.5 font-mono text-sm hover:bg-muted"
                >
                  <span>{settings.card_number}</span>
                  <Copy className="h-4 w-4 text-muted-foreground" />
                </button>
                <div className="mt-1.5 text-xs text-muted-foreground">{settings.card_holder}</div>
                <div className="mt-3 text-xs text-muted-foreground">
                  {t("pr.cardHint")}
                </div>
              </div>
            )}

            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              <Button
                onClick={submitRequest}
                disabled={busy || !user}
                className="rounded-2xl"
                size="lg"
                style={{ background: "var(--gradient-primary)" }}
              >
                {t("pr.submitReq")}
              </Button>
              <Button
                onClick={() => window.open(tgLink, "_blank")}
                variant="outline"
                size="lg"
                className="rounded-2xl"
              >
                <Send className="h-4 w-4" /> {t("pr.sendReceipt")}
              </Button>
            </div>
          </div>

          {/* CLINIC */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-md md:p-8">
            <h3 className="text-xl font-semibold">{t("pr.clinicTitle")}</h3>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-3xl font-bold">{t("pr.clinicPrice")}</span>
            </div>
            <ul className="mt-5 space-y-2 text-sm">
              {[
                t("pr.cf1"),
                t("pr.cf2"),
                t("pr.cf3"),
                t("pr.cf4"),
                t("pr.cf5"),
                t("pr.cf6"),
              ].map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6 rounded-2xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
              {t("pr.clinicDesc")}
            </div>
            <Button
              onClick={() => window.open(tgLink, "_blank")}
              variant="outline"
              size="lg"
              className="mt-5 w-full rounded-2xl"
            >
              <Send className="h-4 w-4" /> {t("pr.contact")}
            </Button>
          </div>
        </div>

        <div className="mt-10 mx-auto max-w-2xl rounded-3xl border border-border bg-card p-6 text-center shadow-sm">
          <Crown className="mx-auto h-6 w-6 text-primary" />
          <p className="mt-2 text-sm text-muted-foreground">
            {t("pr.footerNote")}
          </p>
        </div>
      </main>

      <SupportFooter />
    </div>
  );
};

export default PricingPage;
