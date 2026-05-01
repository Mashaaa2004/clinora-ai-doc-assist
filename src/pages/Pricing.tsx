import { Link } from "react-router-dom";
import { ArrowLeft, Check, Crown, Sparkles, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import SupportFooter from "@/components/SupportFooter";

const Plan = ({
  name,
  price,
  period,
  features,
  highlight,
  cta,
  onClick,
}: {
  name: string;
  price: string;
  period: string;
  features: string[];
  highlight?: boolean;
  cta: string;
  onClick: () => void;
}) => (
  <div
    className={
      "relative rounded-3xl border p-6 shadow-md md:p-8 " +
      (highlight ? "border-primary/50 bg-card" : "border-border bg-card")
    }
    style={highlight ? { boxShadow: "var(--shadow-glow)" } : undefined}
  >
    {highlight && (
      <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
        Машҳур
      </span>
    )}
    <h3 className="text-lg font-semibold">{name}</h3>
    <div className="mt-2 flex items-baseline gap-1">
      <span className="text-3xl font-bold">{price}</span>
      <span className="text-sm text-muted-foreground">{period}</span>
    </div>
    <ul className="mt-5 space-y-2 text-sm">
      {features.map((f) => (
        <li key={f} className="flex items-start gap-2">
          <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
          <span>{f}</span>
        </li>
      ))}
    </ul>
    <Button
      onClick={onClick}
      className="mt-6 w-full rounded-2xl"
      style={highlight ? { background: "var(--gradient-primary)" } : undefined}
      variant={highlight ? "default" : "outline"}
      size="lg"
    >
      {cta}
    </Button>
  </div>
);

const PricingPage = () => {
  const startCheckout = () => {
    toast.info("Тўлов тизими тез орада уланади. Ҳозирча бепул фойдаланинг 🎁");
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--gradient-soft)" }}>
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-lg">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/app" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Орқага
          </Link>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg shadow-md" style={{ background: "var(--gradient-primary)" }}>
              <Stethoscope className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-sm font-semibold">Тарифлар</span>
          </div>
        </div>
      </header>

      <main className="container max-w-5xl py-10 md:py-16 flex-1">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium text-muted-foreground shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-primary" /> Шифокорлар учун
          </div>
          <h1 className="mt-4 text-3xl md:text-4xl font-bold tracking-tight">
            Ўз тарифингизни танланг
          </h1>
          <p className="mt-3 text-muted-foreground">
            Ҳозир бошлаш бепул. Кўпроқ функция учун Pro тарифга ўтинг.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Plan
            name="Бепул"
            price="0 сўм"
            period="/ ой"
            features={[
              "Ойига 10 та таҳлил",
              "PDF юклаб олиш",
              "Беморлар тарихи (30 кун)",
            ]}
            cta="Ҳозир фойдаланилмоқда"
            onClick={() => toast.success("Сиз бепул режада фойдаланмоқдасиз")}
          />
          <Plan
            name="Pro"
            price="99 000 сўм"
            period="/ ой"
            features={[
              "Чексиз AI таҳлил",
              "Чексиз PDF",
              "Беморлар тарихи (чексиз)",
              "Аналитика панели",
              "Биринчи навбат саппорт",
            ]}
            highlight
            cta="Pro тарифига ўтиш"
            onClick={startCheckout}
          />
          <Plan
            name="Клиника"
            price="Шартнома"
            period=""
            features={[
              "Кўп шифокорлик аккаунт",
              "Клиника брендинги",
              "Йиғма ҳисоботлар",
              "Шахсий менежер",
            ]}
            cta="Боғланиш"
            onClick={() => window.open("https://t.me/clinora_support", "_blank")}
          />
        </div>

        <div className="mt-10 mx-auto max-w-2xl rounded-3xl border border-border bg-card p-6 text-center shadow-sm">
          <Crown className="mx-auto h-6 w-6 text-primary" />
          <p className="mt-2 text-sm text-muted-foreground">
            Тўлов тизимини фаоллаштириш учун Telegram саппортга ёзинг — биз ёрдам берамиз.
          </p>
        </div>
      </main>

      <SupportFooter />
    </div>
  );
};

export default PricingPage;
