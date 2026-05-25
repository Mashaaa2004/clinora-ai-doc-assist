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
const PDF_PREFIX = "clinora.legal.pdf.v1.";
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
  partiesTitle: string;
  partyPlatform: string;
  partyDoctor: string;
  downloadSigned: string;
  regenerate: string;
};

const CONTENT: Record<Lang, LegalContent> = {
  uz: {
    title: "Clinora AI — Ikki tomonlama shartnoma (Platforma va Shifokor)",
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
    partiesTitle: "Shartnoma tomonlari",
    partyPlatform: "1-tomon: Clinora AI platformasi",
    partyDoctor: "2-tomon: Shifokor",
    downloadSigned: "Imzolangan shartnomani yuklab olish (PDF)",
    regenerate: "Shartnomani qayta yaratish",
  },
  ru: {
    title: "Clinora AI — Двусторонний договор (Платформа и Врач)",
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
    partiesTitle: "Стороны договора",
    partyPlatform: "Сторона 1: Платформа Clinora AI",
    partyDoctor: "Сторона 2: Врач",
    downloadSigned: "Скачать подписанный договор (PDF)",
    regenerate: "Сгенерировать договор заново",
  },
  en: {
    title: "Clinora AI — Bilateral Agreement (Platform and Doctor)",
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
    partiesTitle: "Parties to the agreement",
    partyPlatform: "Party 1: Clinora AI Platform",
    partyDoctor: "Party 2: Doctor",
    downloadSigned: "Download signed agreement (PDF)",
    regenerate: "Regenerate agreement",
  },
  kk: {
    title: "Clinora AI — Екіжақты шарт (Платформа және Дәрігер)",
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
    partiesTitle: "Шарт тараптары",
    partyPlatform: "1-тарап: Clinora AI платформасы",
    partyDoctor: "2-тарап: Дәрігер",
    downloadSigned: "Қол қойылған шартты жүктеу (PDF)",
    regenerate: "Шартты қайта жасау",
  },
  ky: {
    title: "Clinora AI — Эки тараптуу келишим (Платформа жана Дарыгер)",
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
    partiesTitle: "Келишим тараптары",
    partyPlatform: "1-тарап: Clinora AI платформасы",
    partyDoctor: "2-тарап: Дарыгер",
    downloadSigned: "Кол коюлган келишимди жүктөө (PDF)",
    regenerate: "Келишимди кайра түзүү",
  },
  tr: {
    title: "Clinora AI — İki Taraflı Sözleşme (Platform ve Hekim)",
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
    partiesTitle: "Sözleşme tarafları",
    partyPlatform: "Taraf 1: Clinora AI Platformu",
    partyDoctor: "Taraf 2: Hekim",
    downloadSigned: "İmzalı sözleşmeyi indir (PDF)",
    regenerate: "Sözleşmeyi yeniden oluştur",
  },
};

const LegalConsentModal = () => {
  const { user, profile } = useAuth();
  const { lang } = useT();
  const c = CONTENT[lang] ?? CONTENT.uz;
  const [open, setOpen] = useState(false);
  const [forced, setForced] = useState(false);
  const [doctorAgreed, setDoctorAgreed] = useState(false);
  const [patientAgreed, setPatientAgreed] = useState(false);
  const [responsibility, setResponsibility] = useState(false);
  const [hasSavedPdf, setHasSavedPdf] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!user) { setHasSavedPdf(false); return; }
    setHasSavedPdf(!!localStorage.getItem(PDF_PREFIX + user.id));
  }, [user, open]);

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

  const generatePdf = async (persist = true) => {
    try {
      setGenerating(true);
      const { jsPDF } = await import("jspdf");
      const now = new Date();
      const dateStr = now.toLocaleString();
      const sig = profile?.full_name || user?.email || "—";
      const html = `
        <div style="font-family: Arial, Helvetica, sans-serif; width: 680px; padding: 28px; color: #111; line-height: 1.55;">
          <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:2px solid #2563eb;padding-bottom:10px;margin-bottom:16px;">
            <div style="font-size:20px;font-weight:700;color:#2563eb;">Clinora AI</div>
            <div style="font-size:11px;color:#666;">${dateStr}</div>
          </div>
          <h1 style="font-size:18px;margin:0 0 12px;">${c.title}</h1>
          <div style="border:1px solid #bfdbfe;border-radius:8px;padding:12px;margin-bottom:14px;background:#eff6ff;font-size:12px;">
            <div style="font-weight:700;margin-bottom:6px;color:#1e3a8a;">${c.partiesTitle}</div>
            <div style="margin-bottom:4px;"><b>${c.partyPlatform}</b> — Clinora AI, support: @clinora_support</div>
            <div><b>${c.partyDoctor}</b> — ${profile?.full_name || "—"}${profile?.specialty ? ", " + profile.specialty : ""}${profile?.hospital ? ", " + profile.hospital : ""}</div>
          </div>
          <div style="border:1px solid #e5e7eb;border-radius:8px;padding:12px;margin-bottom:16px;background:#f9fafb;font-size:12px;">
            <div><b>ID:</b> ${user?.id ?? "—"}</div>
            <div><b>Email:</b> ${user?.email ?? "—"}</div>
            <div><b>F.I.O / Full name:</b> ${profile?.full_name || "—"}</div>
            <div><b>Specialty:</b> ${profile?.specialty || "—"}</div>
            <div><b>Clinic / Hospital:</b> ${profile?.hospital || "—"}</div>
            <div><b>Phone:</b> ${profile?.phone || "—"}</div>
            <div><b>Address:</b> ${profile?.hospital_address || "—"}</div>
          </div>
          <div style="font-size:12px;color:#444;margin-bottom:14px;">${c.intro}</div>
          ${[
            [c.s1Title, c.s1],
            [c.s2Title, c.s2],
            [c.s3Title, c.s3],
            [c.s4Title, c.s4],
            [c.s5Title, c.s5Intro],
            [c.s6Title, c.s6],
          ]
            .map(
              ([t, p]) =>
                `<div style="margin-bottom:10px;"><div style="font-size:13px;font-weight:700;margin-bottom:2px;">${t}</div><div style="font-size:12px;color:#333;">${p}</div></div>`,
            )
            .join("")}
          <div style="margin-top:18px;border-top:1px dashed #cbd5e1;padding-top:12px;font-size:12px;">
            <div style="margin-bottom:4px;">☑ ${c.cb1}</div>
            <div style="margin-bottom:4px;">☑ ${c.cb2}</div>
            <div style="margin-bottom:4px;">☑ ${c.cb3}</div>
          </div>
          <div style="margin-top:22px;display:flex;justify-content:space-between;align-items:end;font-size:12px;">
            <div>
              <div style="color:#666;">Electronic signature</div>
              <div style="font-weight:700;font-size:14px;border-top:1px solid #111;padding-top:4px;margin-top:18px;min-width:220px;">${sig}</div>
            </div>
            <div style="text-align:right;color:#666;">
              <div>Signed at</div>
              <div style="font-weight:600;color:#111;">${dateStr}</div>
            </div>
          </div>
        </div>`;
      const container = document.createElement("div");
      container.style.position = "fixed";
      container.style.left = "-10000px";
      container.style.top = "0";
      container.innerHTML = html;
      document.body.appendChild(container);
      const pdf = new jsPDF({ unit: "pt", format: "a4" });
      const fileName = `Clinora_Legal_Consent_${now.toISOString().slice(0, 10)}.pdf`;
      await pdf.html(container.firstElementChild as HTMLElement, {
        callback: (doc) => {
          doc.save(fileName);
          if (persist && user) {
            try {
              const dataUri = doc.output("datauristring");
              localStorage.setItem(PDF_PREFIX + user.id, JSON.stringify({ data: dataUri, name: fileName, at: now.toISOString() }));
              setHasSavedPdf(true);
            } catch (err) {
              console.warn("Could not persist signed PDF", err);
            }
          }
          document.body.removeChild(container);
        },
        margin: [20, 20, 20, 20],
        autoPaging: "text",
        html2canvas: { scale: 0.72, useCORS: true },
      });
    } catch (e) {
      console.error("Legal PDF generation failed", e);
    } finally {
      setGenerating(false);
    }
  };

  const downloadSaved = () => {
    if (!user) return;
    const raw = localStorage.getItem(PDF_PREFIX + user.id);
    if (!raw) { generatePdf(true); return; }
    try {
      const { data, name } = JSON.parse(raw);
      const a = document.createElement("a");
      a.href = data;
      a.download = name || "Clinora_Legal_Consent.pdf";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch {
      generatePdf(true);
    }
  };

  const accept = async () => {
    if (!allChecked) return;
    const alreadySigned = user ? !!localStorage.getItem(STORAGE_PREFIX + user.id) : false;
    if (user) {
      localStorage.setItem(
        STORAGE_PREFIX + user.id,
        JSON.stringify({ at: new Date().toISOString() }),
      );
    }
    setForced(false);
    setOpen(false);
    if (!alreadySigned) {
      await generatePdf();
    } else if (user && !localStorage.getItem(PDF_PREFIX + user.id)) {
      await generatePdf();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o && forced) { setForced(false); setOpen(false); } }}>
      <DialogContent
        className="w-[calc(100vw-1.5rem)] max-w-2xl p-4 sm:p-6 rounded-2xl max-h-[92vh] overflow-y-auto"
        onPointerDownOutside={(e) => { if (!forced) e.preventDefault(); }}
        onEscapeKeyDown={(e) => { if (!forced) e.preventDefault(); }}
      >
        <DialogHeader>
          <div className="mx-auto mb-2 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/30">
            <ShieldCheck className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          </div>
          <DialogTitle className="text-center text-base sm:text-2xl leading-tight">{c.title}</DialogTitle>
          <DialogDescription className="text-center text-xs sm:text-sm">{c.intro}</DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[38vh] sm:max-h-[45vh] rounded-md border bg-muted/30 p-3 sm:p-4 text-xs sm:text-sm leading-relaxed">
          <div className="space-y-4 sm:space-y-5">
            <section>
              <div className="mb-1 flex items-center gap-2 font-semibold text-sm">
                <FileText className="h-4 w-4 text-primary" /> {c.s1Title}
              </div>
              <p className="text-muted-foreground">{c.s1}</p>
            </section>

            <section>
              <div className="mb-1 flex items-center gap-2 font-semibold text-destructive text-sm">
                <AlertTriangle className="h-4 w-4" /> {c.s2Title}
              </div>
              <p className="text-muted-foreground">{c.s2}</p>
            </section>

            <section>
              <div className="mb-1 flex items-center gap-2 font-semibold text-sm">
                <Lock className="h-4 w-4 text-primary" /> {c.s3Title}
              </div>
              <p className="text-muted-foreground">{c.s3}</p>
            </section>

            <section>
              <div className="mb-1 flex items-center gap-2 font-semibold text-sm">
                <Cpu className="h-4 w-4 text-primary" /> {c.s4Title}
              </div>
              <p className="text-muted-foreground">{c.s4}</p>
            </section>

            <section>
              <div className="mb-1 flex items-center gap-2 font-semibold text-sm">
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
              <div className="mb-1 flex items-center gap-2 font-semibold text-sm">
                <ShieldCheck className="h-4 w-4 text-primary" /> {c.s6Title}
              </div>
              <p className="text-muted-foreground">{c.s6}</p>
            </section>
          </div>
        </ScrollArea>

        <div className="space-y-2 sm:space-y-3 pt-2">
          <label className="flex cursor-pointer items-start gap-2.5 sm:gap-3 rounded-lg border bg-card p-2.5 sm:p-3 hover:bg-accent/40">
            <Checkbox checked={doctorAgreed} onCheckedChange={(v) => setDoctorAgreed(v === true)} className="mt-0.5" />
            <span className="text-xs sm:text-sm leading-snug">{c.cb1}</span>
          </label>

          <label className="flex cursor-pointer items-start gap-2.5 sm:gap-3 rounded-lg border bg-card p-2.5 sm:p-3 hover:bg-accent/40">
            <Checkbox checked={patientAgreed} onCheckedChange={(v) => setPatientAgreed(v === true)} className="mt-0.5" />
            <span className="text-xs sm:text-sm leading-snug">{c.cb2}</span>
          </label>

          <label className="flex cursor-pointer items-start gap-2.5 sm:gap-3 rounded-lg border bg-card p-2.5 sm:p-3 hover:bg-accent/40">
            <Checkbox checked={responsibility} onCheckedChange={(v) => setResponsibility(v === true)} className="mt-0.5" />
            <span className="text-xs sm:text-sm leading-snug">{c.cb3}</span>
          </label>
        </div>

        <DialogFooter>
          <Button
            disabled={!allChecked}
            onClick={accept}
            className="w-full text-sm sm:text-base"
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