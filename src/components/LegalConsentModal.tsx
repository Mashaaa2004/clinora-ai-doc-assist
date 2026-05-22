import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Scale, Globe2, AlertTriangle } from "lucide-react";

const STORAGE_PREFIX = "clinora.legal.consent.v1.";

const LegalConsentModal = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [doctorAgreed, setDoctorAgreed] = useState(false);
  const [patientAgreed, setPatientAgreed] = useState(false);
  const [responsibility, setResponsibility] = useState(false);

  useEffect(() => {
    if (!user) return;
    const accepted = localStorage.getItem(STORAGE_PREFIX + user.id);
    if (!accepted) setOpen(true);
  }, [user]);

  const allChecked = doctorAgreed && patientAgreed && responsibility;

  const accept = () => {
    if (!user || !allChecked) return;
    localStorage.setItem(
      STORAGE_PREFIX + user.id,
      JSON.stringify({ at: new Date().toISOString() }),
    );
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="max-w-2xl"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/30">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-center text-2xl">
            AI'дан фойдаланиш бўйича ҳуқуқий розилик
          </DialogTitle>
          <DialogDescription className="text-center">
            Clinora AI'дан фойдаланишдан олдин қуйидаги шартлар билан танишинг ва тасдиқланг.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[45vh] rounded-md border bg-muted/30 p-4 text-sm leading-relaxed">
          <div className="space-y-4">
            <section>
              <div className="mb-1 flex items-center gap-2 font-semibold">
                <Globe2 className="h-4 w-4 text-primary" /> Халқаро қоидалар
              </div>
              <p className="text-muted-foreground">
                Clinora AI — <b>EU AI Act (2024)</b>, <b>WHO «Ethics & governance of AI for health» (2021/2024)</b>{" "}
                ва <b>HIPAA</b> принциплари асосида ишлайди. AI тиббиёт соҳасида{" "}
                <b>юқори хавф (high-risk)</b> деб тан олинади ва фақат шифокор назоратида қўлланилиши шарт.
                AI чиқарган ҳар қандай ташхис, рецепт ва тавсия <b>дастлабки таклиф</b> ҳисобланади —
                якуний қарор ҳамиша шифокорга тегишли.
              </p>
            </section>

            <section>
              <div className="mb-1 flex items-center gap-2 font-semibold">
                <Scale className="h-4 w-4 text-primary" /> Ўзбекистон Республикаси қонунчилиги
              </div>
              <p className="text-muted-foreground">
                Хизмат қуйидаги ҳужжатлар асосида тартибга солинади:
              </p>
              <ul className="ml-4 list-disc text-muted-foreground">
                <li>«Фуқаролар соғлиғини сақлаш тўғрисида»ги Қонун (1996, ўзгартиришлар билан)</li>
                <li>«Шахсга доир маълумотлар тўғрисида»ги Қонун № ЎРҚ-547 (2019)</li>
                <li>«Сунъий интеллект соҳасини ривожлантириш чора-тадбирлари» — ПҚ-4996 (2021), ПФ-358 (2024)</li>
                <li>Соғлиқни сақлаш вазирлигининг рақамли тиббиёт бўйича буйруқлари</li>
              </ul>
              <p className="mt-1 text-muted-foreground">
                Беморнинг шахсий ва тиббий маълумотлари <b>фақат унинг ёзма/оғзаки розилиги</b> асосида
                қайта ишланади ва Ўзбекистон ҳудудида сақланади.
              </p>
            </section>

            <section>
              <div className="mb-1 flex items-center gap-2 font-semibold text-destructive">
                <AlertTriangle className="h-4 w-4" /> Жавобгарлик чегараси
              </div>
              <p className="text-muted-foreground">
                Clinora AI — ёрдамчи восита. Хизмат кўрсатувчи AI'нинг хатоси, ноаниқ ёки тўлиқсиз
                тавсияси учун тиббий жавобгарликни ўз зиммасига олмайди. Беморга қўйилган якуний ташхис,
                тайинланган даво ва уларнинг оқибатлари учун <b>шифокор шахсан жавобгардир</b>.
              </p>
            </section>
          </div>
        </ScrollArea>

        <div className="space-y-3 pt-2">
          <label className="flex cursor-pointer items-start gap-3 rounded-lg border bg-card p-3 hover:bg-accent/40">
            <Checkbox
              checked={doctorAgreed}
              onCheckedChange={(v) => setDoctorAgreed(v === true)}
              className="mt-0.5"
            />
            <span className="text-sm">
              Мен — <b>шифокор</b> сифатида юқоридаги халқаро ва Ўзбекистон қонунчилиги шартлари билан
              танишдим ва уларни қабул қиламан.
            </span>
          </label>

          <label className="flex cursor-pointer items-start gap-3 rounded-lg border bg-card p-3 hover:bg-accent/40">
            <Checkbox
              checked={patientAgreed}
              onCheckedChange={(v) => setPatientAgreed(v === true)}
              className="mt-0.5"
            />
            <span className="text-sm">
              Мен ҳар бир суҳбатдан олдин <b>бемордан</b> AI ёрдамчи ишлатилиши ва унинг маълумотлари
              қайта ишланиши учун <b>информацион розилик</b> олишга мажбурман.
            </span>
          </label>

          <label className="flex cursor-pointer items-start gap-3 rounded-lg border bg-card p-3 hover:bg-accent/40">
            <Checkbox
              checked={responsibility}
              onCheckedChange={(v) => setResponsibility(v === true)}
              className="mt-0.5"
            />
            <span className="text-sm">
              Якуний ташхис, рецепт ва тиббий қарорлар учун <b>тўлиқ жавобгарликни</b> ўз зиммамга
              олишимни тасдиқлайман.
            </span>
          </label>
        </div>

        <DialogFooter>
          <Button
            disabled={!allChecked}
            onClick={accept}
            className="w-full"
            style={{ background: "var(--gradient-primary)" }}
          >
            Розиман ва давом этаман
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LegalConsentModal;