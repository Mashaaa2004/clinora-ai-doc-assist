import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useT } from "@/i18n/LanguageContext";
import type { Lang } from "@/i18n/translations";
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
export const OPEN_LEGAL_EVENT = "clinora:open-legal";

type LegalContent = {
  title: string;
  intro: string;
  s1Title: string; s1: string;
  s2Title: string; s2: string;
  s3Title: string; s3: string;
  s4Title: string; s4: string;
  s5Title: string; s5Intro: string;
  s6Title: string; s6: string;
  cb1: string; cb2: string; cb3: string;
  accept: string;
};

const CONTENT: Record<Lang, LegalContent> = {
  uz: {
    title: "Clinora AI — Foydalanish shartlari va maxfiylik",
    intro: "Platformadan foydalanishni boshlashdan oldin quyidagi shartlar bilan tanishing va tasdiqlang.",
    s1Title: "Platforma haqida",
    s1: "Clinora AI — shifokorlar faoliyatiga yordam beruvchi sun'iy intellekt asosidagi klinik yordamchi platforma hisoblanadi. Platforma simptomlarni tahlil qilish, ehtimoliy tashxis variantlarini shakllantirish, laborator va instrumental tekshiruvlarni tavsiya qilish hamda klinik hujjatlarni avtomatlashtirish uchun mo'ljallangan.",
    s2Title: "Muhim eslatma",
    s2: "Clinora AI mustaqil shifokor hisoblanmaydi hamda yakuniy tashxis yoki davolash qarorini qabul qilmaydi. Platforma tomonidan yaratilgan tavsiyalar faqat yordamchi xarakterga ega. Yakuniy klinik qaror va javobgarlik faqat shifokor zimmasida qoladi.",
    s3Title: "Ma'lumotlar maxfiyligi",
    s3: "Platformaga kiritilgan tibbiy ma'lumotlar maxfiy hisoblanadi va amaldagi qonunchilik asosida himoyalanadi. Clinora AI shifrlash, xavfsiz autentifikatsiya, audit tizimi va kirish nazorati mexanizmlaridan foydalanadi.",
    s4Title: "Sun'iy intellekt texnologiyalari",
    s4: "Platformada AI, NLP, ovozni matnga aylantirish va kompyuter ko'rish texnologiyalari qo'llanilishi mumkin. Foydalanuvchi platformadan foydalanish orqali AI texnologiyalaridan foydalanishga rozilik bildiradi.",
    s5Title: "Huquqiy asos",
    s5Intro: "Clinora AI faoliyati O'zbekiston Respublikasi qonunchiligi va xalqaro me'yorlarga mos tashkil etiladi (PF-5590, PQ-4996, PQ-358; WHO AI Ethics; EU AI Act).",
    s6Title: "Foydalanuvchi tasdig'i",
    s6: "Platformadan foydalanishni davom ettirish orqali foydalanuvchi mazkur shartlarga rozilik bildiradi va yakuniy tibbiy qaror faqat shifokor tomonidan qabul qilinishini tasdiqlaydi.",
    cb1: "Men shifokor sifatida foydalanish shartlari va qonunchilik asoslari bilan tanishdim va qabul qilaman.",
    cb2: "Har bir suhbatdan oldin bemordan AI ishlatilishi va ma'lumotlari qayta ishlanishiga informatsion rozilik olishga majburman.",
    cb3: "Yakuniy tashxis, retsept va davolash qarorlari uchun to'liq javobgarlikni o'z zimmamga olaman.",
    accept: "Roziman va davom etaman",
  },
  ru: {
    title: "Clinora AI — Условия использования и конфиденциальность",
    intro: "Перед началом работы ознакомьтесь с условиями и подтвердите согласие.",
    s1Title: "О платформе",
    s1: "Clinora AI — клинический ИИ-ассистент для врачей: анализ симптомов, предложение диагнозов, рекомендации по лабораторным и инструментальным исследованиям, автоматизация клинической документации.",
    s2Title: "Важно",
    s2: "Clinora AI не является самостоятельным врачом и не принимает окончательных решений. Все рекомендации носят вспомогательный характер. Полная ответственность за клиническое решение лежит на враче.",
    s3Title: "Конфиденциальность данных",
    s3: "Все медицинские данные конфиденциальны и защищаются согласно действующему законодательству. Применяются шифрование, безопасная аутентификация, аудит и контроль доступа.",
    s4Title: "Технологии ИИ",
    s4: "На платформе используются ИИ, NLP, распознавание речи и компьютерное зрение. Использование платформы означает согласие на применение этих технологий.",
    s5Title: "Правовая основа",
    s5Intro: "Деятельность Clinora AI соответствует законодательству Республики Узбекистан и международным нормам (УП-5590, ПП-4996, ПП-358; WHO AI Ethics; EU AI Act).",
    s6Title: "Подтверждение пользователя",
    s6: "Продолжая использование платформы, пользователь соглашается с условиями и подтверждает, что окончательное медицинское решение принимает только врач.",
    cb1: "Я как врач ознакомился с условиями использования и правовыми основами и принимаю их.",
    cb2: "Перед каждой консультацией обязуюсь получать у пациента информированное согласие на использование ИИ и обработку данных.",
    cb3: "Принимаю полную ответственность за итоговый диагноз, рецепт и решения о лечении.",
    accept: "Согласен и продолжить",
  },
  en: {
    title: "Clinora AI — Terms of Use and Privacy",
    intro: "Please review and accept the terms before using the platform.",
    s1Title: "About the platform",
    s1: "Clinora AI is an AI-based clinical assistant for doctors: symptom analysis, suggesting differential diagnoses, recommending lab and instrumental exams, and automating clinical documentation.",
    s2Title: "Important notice",
    s2: "Clinora AI is not an independent physician and does not make final decisions. All outputs are advisory only. Full responsibility for clinical decisions rests with the doctor.",
    s3Title: "Data privacy",
    s3: "All medical data is confidential and protected under applicable law. Encryption, secure authentication, audit and access control are used.",
    s4Title: "AI technologies",
    s4: "The platform may use AI, NLP, speech-to-text and computer vision. By using the platform you consent to the use of these technologies.",
    s5Title: "Legal basis",
    s5Intro: "Clinora AI complies with the legislation of the Republic of Uzbekistan and international standards (UP-5590, PP-4996, PP-358; WHO AI Ethics; EU AI Act).",
    s6Title: "User acceptance",
    s6: "By continuing to use the platform, the user accepts these terms and confirms that the final medical decision is made solely by the doctor.",
    cb1: "As a doctor I have reviewed and accept the terms of use and legal basis.",
    cb2: "Before each consultation I will obtain the patient's informed consent for AI use and data processing.",
    cb3: "I take full responsibility for the final diagnosis, prescription and treatment decisions.",
    accept: "I agree and continue",
  },
  kk: {
    title: "Clinora AI — Пайдалану шарттары және құпиялылық",
    intro: "Платформаны пайдалану алдында шарттармен танысып, растаңыз.",
    s1Title: "Платформа туралы",
    s1: "Clinora AI — дәрігерлерге арналған клиникалық ЖИ көмекшісі: симптомдарды талдау, мүмкін диагноздарды ұсыну, зертханалық және аспаптық зерттеулерді ұсыну, клиникалық құжаттаманы автоматтандыру.",
    s2Title: "Маңызды ескерту",
    s2: "Clinora AI тәуелсіз дәрігер болып табылмайды және түпкілікті шешім қабылдамайды. Барлық ұсыныстар тек көмекші сипатта. Толық жауапкершілік дәрігерде қалады.",
    s3Title: "Деректер құпиялылығы",
    s3: "Барлық медициналық деректер құпия болып табылады және қолданыстағы заңнамаға сәйкес қорғалады. Шифрлеу, қауіпсіз аутентификация, аудит және қол жеткізуді бақылау қолданылады.",
    s4Title: "ЖИ технологиялары",
    s4: "Платформада ЖИ, NLP, дауысты мәтінге айналдыру және компьютерлік көру қолданылуы мүмкін. Пайдалану осы технологияларға келісімді білдіреді.",
    s5Title: "Құқықтық негіз",
    s5Intro: "Clinora AI Өзбекстан Республикасының заңнамасына және халықаралық нормаларға сәйкес жұмыс істейді (PF-5590, PQ-4996, PQ-358; WHO AI Ethics; EU AI Act).",
    s6Title: "Пайдаланушының растауы",
    s6: "Платформаны пайдалануды жалғастыру арқылы пайдаланушы шарттарға келіседі және түпкілікті медициналық шешімді тек дәрігер қабылдайтынын растайды.",
    cb1: "Дәрігер ретінде пайдалану шарттарымен және құқықтық негіздермен таныстым және қабылдаймын.",
    cb2: "Әр кеңес алдында пациенттен ЖИ қолдану мен деректерін өңдеуге ақпараттық келісім алуға міндеттенемін.",
    cb3: "Түпкілікті диагноз, рецепт және емдеу шешімдері үшін толық жауапкершілікті өзіме аламын.",
    accept: "Келісемін және жалғастырамын",
  },
  ky: {
    title: "Clinora AI — Колдонуу шарттары жана купуялуулук",
    intro: "Платформаны колдонуудан мурун шарттар менен таанышып, ырастаңыз.",
    s1Title: "Платформа жөнүндө",
    s1: "Clinora AI — дарыгерлер үчүн клиникалык ЖИ жардамчысы: симптомдорду талдоо, мүмкүн болгон диагноздорду сунуштоо, лабораториялык жана аспаптык изилдөөлөрдү сунуштоо, клиникалык документтерди автоматташтыруу.",
    s2Title: "Маанилүү эскертүү",
    s2: "Clinora AI көз карандысыз дарыгер эмес жана акыркы чечимди кабыл албайт. Бардык сунуштар жардамчы мүнөздө гана. Толук жоопкерчилик дарыгерде.",
    s3Title: "Маалымат купуялуулугу",
    s3: "Бардык медициналык маалыматтар купуя жана колдонуудагы мыйзамдар боюнча корголот. Шифрлөө, коопсуз аутентификация, аудит жана жеткиликтүүлүктү көзөмөлдөө колдонулат.",
    s4Title: "ЖИ технологиялары",
    s4: "Платформада ЖИ, NLP, үндү текстке айлантуу жана компьютердик көрүү колдонулушу мүмкүн. Колдонуу бул технологияларга макулдук берүүнү билдирет.",
    s5Title: "Укуктук негиз",
    s5Intro: "Clinora AI Өзбекстан Республикасынын мыйзамдарына жана эл аралык ченемдерге ылайык иштейт (PF-5590, PQ-4996, PQ-358; WHO AI Ethics; EU AI Act).",
    s6Title: "Колдонуучунун ырастоосу",
    s6: "Платформаны колдонууну улантуу менен колдонуучу шарттарга макул болуп, акыркы медициналык чечимди дарыгер гана кабыл аларын ырастайт.",
    cb1: "Дарыгер катары колдонуу шарттары жана укуктук негиздер менен таанышып, кабыл алам.",
    cb2: "Ар бир консультациядан мурун бейтаптан ЖИ колдонууга жана маалыматтарын иштетүүгө маалыматтык макулдук алууга милдеттенемин.",
    cb3: "Акыркы диагноз, рецепт жана дарылоо чечимдери үчүн толук жоопкерчиликти өзүмө алам.",
    accept: "Макулмун жана улантам",
  },
  tr: {
    title: "Clinora AI — Kullanım Koşulları ve Gizlilik",
    intro: "Platformu kullanmadan önce lütfen koşulları inceleyin ve onaylayın.",
    s1Title: "Platform hakkında",
    s1: "Clinora AI, doktorlar için yapay zekâ tabanlı klinik asistandır: semptom analizi, olası tanı önerileri, laboratuvar ve görüntüleme tetkik önerileri, klinik belgelerin otomasyonu.",
    s2Title: "Önemli uyarı",
    s2: "Clinora AI bağımsız bir hekim değildir ve nihai kararı vermez. Tüm çıktılar yalnızca yardımcı niteliktedir. Klinik karar ve sorumluluk tamamen hekime aittir.",
    s3Title: "Veri gizliliği",
    s3: "Tüm tıbbi veriler gizlidir ve yürürlükteki mevzuata göre korunur. Şifreleme, güvenli kimlik doğrulama, denetim ve erişim kontrolü kullanılır.",
    s4Title: "Yapay zekâ teknolojileri",
    s4: "Platformda YZ, NLP, ses-metin dönüşümü ve bilgisayarla görme kullanılabilir. Platformu kullanmak bu teknolojilerin kullanımına onay vermek anlamına gelir.",
    s5Title: "Hukuki dayanak",
    s5Intro: "Clinora AI, Özbekistan Cumhuriyeti mevzuatına ve uluslararası normlara uygun çalışır (PF-5590, PQ-4996, PQ-358; WHO AI Ethics; EU AI Act).",
    s6Title: "Kullanıcı onayı",
    s6: "Platformu kullanmaya devam ederek kullanıcı koşulları kabul eder ve nihai tıbbi kararın yalnızca hekim tarafından verildiğini onaylar.",
    cb1: "Hekim olarak kullanım koşullarını ve hukuki dayanakları okudum ve kabul ediyorum.",
    cb2: "Her görüşmeden önce hastadan YZ kullanımı ve veri işleme için bilgilendirilmiş onam almayı taahhüt ederim.",
    cb3: "Nihai tanı, reçete ve tedavi kararları için tam sorumluluğu üstlenirim.",
    accept: "Kabul ediyorum ve devam et",
  },
};

const LegalConsentModal = () => {
  const { user } = useAuth();
  const { lang } = useT();
  const c = CONTENT[lang] ?? CONTENT.uz;
  const [open, setOpen] = useState(false);
  const [forced, setForced] = useState(false);
  const [doctorAgreed, setDoctorAgreed] = useState(false);
  const [patientAgreed, setPatientAgreed] = useState(false);
  const [responsibility, setResponsibility] = useState(false);

  useEffect(() => {
    if (!user) return;
    const accepted = localStorage.getItem(STORAGE_PREFIX + user.id);
    if (!accepted) setOpen(true);
  }, [user]);

  useEffect(() => {
    const handler = () => {
      setDoctorAgreed(false);
      setPatientAgreed(false);
      setResponsibility(false);
      setForced(true);
      setOpen(true);
    };
    window.addEventListener(OPEN_LEGAL_EVENT, handler);
    return () => window.removeEventListener(OPEN_LEGAL_EVENT, handler);
  }, []);

  const allChecked = doctorAgreed && patientAgreed && responsibility;

  const accept = () => {
    if (!allChecked) return;
    if (user) {
      localStorage.setItem(
        STORAGE_PREFIX + user.id,
        JSON.stringify({ at: new Date().toISOString() }),
      );
    }
    setForced(false);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o && forced) { setForced(false); setOpen(false); } }}>
      <DialogContent
        className="max-w-2xl"
        onPointerDownOutside={(e) => { if (!forced) e.preventDefault(); }}
        onEscapeKeyDown={(e) => { if (!forced) e.preventDefault(); }}
      >
        <DialogHeader>
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/30">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-center text-2xl">{c.title}</DialogTitle>
          <DialogDescription className="text-center">{c.intro}</DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[45vh] rounded-md border bg-muted/30 p-4 text-sm leading-relaxed">
          <div className="space-y-5">
            <section>
              <div className="mb-1 flex items-center gap-2 font-semibold">
                <FileText className="h-4 w-4 text-primary" /> {c.s1Title}
              </div>
              <p className="text-muted-foreground">{c.s1}</p>
            </section>

            <section>
              <div className="mb-1 flex items-center gap-2 font-semibold text-destructive">
                <AlertTriangle className="h-4 w-4" /> {c.s2Title}
              </div>
              <p className="text-muted-foreground">{c.s2}</p>
            </section>

            <section>
              <div className="mb-1 flex items-center gap-2 font-semibold">
                <Lock className="h-4 w-4 text-primary" /> {c.s3Title}
              </div>
              <p className="text-muted-foreground">{c.s3}</p>
            </section>

            <section>
              <div className="mb-1 flex items-center gap-2 font-semibold">
                <Cpu className="h-4 w-4 text-primary" /> {c.s4Title}
              </div>
              <p className="text-muted-foreground">{c.s4}</p>
            </section>

            <section>
              <div className="mb-1 flex items-center gap-2 font-semibold">
                <Scale className="h-4 w-4 text-primary" /> {c.s5Title}
              </div>
              <p className="text-muted-foreground">{c.s5Intro}</p>
              <ul className="ml-4 mt-2 list-disc space-y-1 text-muted-foreground">
                <li><a href="https://lex.uz/uz/docs/-4096197" target="_blank" rel="noreferrer" className="text-primary underline">PF-5590 — lex.uz</a></li>
                <li>PQ-4996 (17.02.2021)</li>
                <li><a href="https://gov.uz/oz/digital/news/view/24510" target="_blank" rel="noreferrer" className="text-primary underline">PQ-358 — gov.uz</a></li>
              </ul>
            </section>

            <section>
              <div className="mb-1 flex items-center gap-2 font-semibold">
                <ShieldCheck className="h-4 w-4 text-primary" /> {c.s6Title}
              </div>
              <p className="text-muted-foreground">{c.s6}</p>
            </section>
          </div>
        </ScrollArea>

        <div className="space-y-3 pt-2">
          <label className="flex cursor-pointer items-start gap-3 rounded-lg border bg-card p-3 hover:bg-accent/40">
            <Checkbox checked={doctorAgreed} onCheckedChange={(v) => setDoctorAgreed(v === true)} className="mt-0.5" />
            <span className="text-sm">{c.cb1}</span>
          </label>

          <label className="flex cursor-pointer items-start gap-3 rounded-lg border bg-card p-3 hover:bg-accent/40">
            <Checkbox checked={patientAgreed} onCheckedChange={(v) => setPatientAgreed(v === true)} className="mt-0.5" />
            <span className="text-sm">{c.cb2}</span>
          </label>

          <label className="flex cursor-pointer items-start gap-3 rounded-lg border bg-card p-3 hover:bg-accent/40">
            <Checkbox checked={responsibility} onCheckedChange={(v) => setResponsibility(v === true)} className="mt-0.5" />
            <span className="text-sm">{c.cb3}</span>
          </label>
        </div>

        <DialogFooter>
          <Button
            disabled={!allChecked}
            onClick={accept}
            className="w-full"
            style={{ background: "var(--gradient-primary)" }}
          >
            {c.accept}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LegalConsentModal;