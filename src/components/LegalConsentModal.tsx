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
import { ShieldCheck, Scale, Lock, Cpu, AlertTriangle, FileText } from "lucide-react";

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
            Clinora AI — Foydalanish shartlari va maxfiylik
          </DialogTitle>
          <DialogDescription className="text-center">
            Platformadan foydalanishni boshlashdan oldin quyidagi shartlar bilan tanishing va tasdiqlang.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[45vh] rounded-md border bg-muted/30 p-4 text-sm leading-relaxed">
          <div className="space-y-5">
            <section>
              <div className="mb-1 flex items-center gap-2 font-semibold">
                <FileText className="h-4 w-4 text-primary" /> Platforma haqida
              </div>
              <p className="text-muted-foreground">
                Clinora AI — shifokorlar faoliyatiga yordam beruvchi sun'iy intellekt asosidagi klinik
                yordamchi platforma hisoblanadi. Platforma simptomlarni tahlil qilish, ehtimoliy tashxis
                variantlarini shakllantirish, laborator va instrumental tekshiruvlarni tavsiya qilish hamda
                klinik hujjatlarni avtomatlashtirish uchun mo'ljallangan.
              </p>
            </section>

            <section>
              <div className="mb-1 flex items-center gap-2 font-semibold text-destructive">
                <AlertTriangle className="h-4 w-4" /> Muhim eslatma
              </div>
              <p className="text-muted-foreground">
                Clinora AI <b>mustaqil shifokor hisoblanmaydi</b> hamda yakuniy tashxis yoki davolash
                qarorini qabul qilmaydi. Platforma tomonidan yaratilgan tashxis tavsiyalari, davolash rejasi,
                retsept loyihalari va laborator tavsiyalar faqat <b>yordamchi tavsiya xarakteriga</b> ega.
                Yakuniy klinik qaror, tashxis va davolash uchun to'liq javobgarlik faqat tibbiyot xodimi
                (shifokor) zimmasida qoladi.
              </p>
            </section>

            <section>
              <div className="mb-1 flex items-center gap-2 font-semibold">
                <Lock className="h-4 w-4 text-primary" /> Ma'lumotlar maxfiyligi
              </div>
              <p className="text-muted-foreground">
                Platformaga kiritilgan tibbiy ma'lumotlar, simptomlar, laborator natijalar, ovozli va
                diagnostik ma'lumotlar maxfiy hisoblanadi va amaldagi qonunchilik asosida himoyalanadi.
                Clinora AI shifrlash, xavfsiz autentifikatsiya, audit tizimi va kirish nazorati
                mexanizmlaridan foydalanadi.
              </p>
            </section>

            <section>
              <div className="mb-1 flex items-center gap-2 font-semibold">
                <Cpu className="h-4 w-4 text-primary" /> Sun'iy intellekt texnologiyalari
              </div>
              <p className="text-muted-foreground">
                Platformada sun'iy intellekt, tabiiy tilni qayta ishlash (NLP), ovozni matnga aylantirish
                va kompyuter ko'rish texnologiyalari qo'llanilishi mumkin. Foydalanuvchi platformadan
                foydalanishni boshlashi orqali AI yordamchi texnologiyalaridan foydalanilishiga rozilik
                bildiradi.
              </p>
            </section>

            <section>
              <div className="mb-1 flex items-center gap-2 font-semibold">
                <Scale className="h-4 w-4 text-primary" /> Huquqiy asos
              </div>
              <p className="text-muted-foreground">
                Clinora AI faoliyati O'zbekiston Respublikasida raqamli texnologiyalar va sog'liqni saqlash
                tizimini rivojlantirish bo'yicha davlat siyosati yo'nalishlariga mos tashkil etiladi:
              </p>
              <ul className="ml-4 mt-2 list-disc space-y-2 text-muted-foreground">
                <li>
                  <b>PF-5590-son Farmoni (07.12.2018)</b> — "O'zbekiston Respublikasi sog'liqni saqlash
                  tizimini tubdan takomillashtirish bo'yicha kompleks chora-tadbirlar to'g'risida".
                  Elektron sog'liqni saqlash tizimini joriy etish ustuvor yo'nalish sifatida belgilangan.
                  {" "}
                  <a
                    href="https://lex.uz/uz/docs/-4096197"
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary underline"
                  >
                    lex.uz
                  </a>
                </li>
                <li>
                  <b>PQ-4996-son Qarori (17.02.2021)</b> — "Sun'iy intellekt texnologiyalarini jadal
                  joriy etish uchun shart-sharoitlar yaratish chora-tadbirlari to'g'risida".
                </li>
                <li>
                  <b>PQ-358-son Qarori (14.10.2024)</b> — "Sun'iy intellekt texnologiyalarini 2030-yilgacha
                  rivojlantirish strategiyasini tasdiqlash to'g'risida". Sog'liqni saqlashda AI texnologiyalari
                  ustuvor yo'nalish sifatida ko'rsatilgan.
                  {" "}
                  <a
                    href="https://gov.uz/oz/digital/news/view/24510"
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary underline"
                  >
                    gov.uz
                  </a>
                </li>
              </ul>
            </section>

            <section>
              <div className="mb-1 flex items-center gap-2 font-semibold">
                <ShieldCheck className="h-4 w-4 text-primary" /> Foydalanuvchi tasdig'i
              </div>
              <p className="text-muted-foreground">
                Platformadan foydalanishni davom ettirish orqali foydalanuvchi mazkur shartlarga rozilik
                bildiradi, AI yordamchi texnologiyasi ishlatilishini qabul qiladi va yakuniy tibbiy qaror
                faqat shifokor tomonidan qabul qilinishini tasdiqlaydi.
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
              Men <b>shifokor</b> sifatida yuqoridagi foydalanish shartlari va O'zbekiston qonunchiligi
              asoslari bilan tanishdim va ularni qabul qilaman.
            </span>
          </label>

          <label className="flex cursor-pointer items-start gap-3 rounded-lg border bg-card p-3 hover:bg-accent/40">
            <Checkbox
              checked={patientAgreed}
              onCheckedChange={(v) => setPatientAgreed(v === true)}
              className="mt-0.5"
            />
            <span className="text-sm">
              Har bir suhbatdan oldin <b>bemordan</b> AI yordamchi ishlatilishi va uning ma'lumotlari
              qayta ishlanishiga <b>informatsion rozilik</b> olishga majburman.
            </span>
          </label>

          <label className="flex cursor-pointer items-start gap-3 rounded-lg border bg-card p-3 hover:bg-accent/40">
            <Checkbox
              checked={responsibility}
              onCheckedChange={(v) => setResponsibility(v === true)}
              className="mt-0.5"
            />
            <span className="text-sm">
              Yakuniy tashxis, retsept va davolash qarorlari uchun <b>to'liq javobgarlikni</b> o'z
              zimmamga olishimni tasdiqlayman.
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
            Roziman va davom etaman
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LegalConsentModal;