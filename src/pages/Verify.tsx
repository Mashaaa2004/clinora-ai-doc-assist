import { useEffect, useState } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, AlertTriangle, Loader2, Printer } from "lucide-react";
import QRCode from "qrcode";
import { supabase } from "@/integrations/supabase/client";
import { Helmet } from "react-helmet-async";

type Consultation = {
  id: string;
  patient_name: string;
  chosen_diagnosis: string;
  diagnosis: string;
  recommendation: string;
  prescriptions: any;
  lab_tests: any;
  instrumental_tests: any;
  symptoms: any;
  family_advice: string;
  created_at: string;
  language: string;
  user_id: string;
};

const Verify = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  // Backward compatibility: eski QR kodlar `?print=1` parametrisiz yaratilgan.
  // Default: avtomatik print yoqilgan. Faqat `?print=0` bo'lsa o'chiriladi.
  const autoPrint = searchParams.get("print") !== "0";
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Consultation | null>(null);
  const [doctor, setDoctor] = useState<any>(null);
  const [qrVerify, setQrVerify] = useState("");
  const [qrApp, setQrApp] = useState("");

  useEffect(() => {
    (async () => {
      if (!id) { setLoading(false); return; }
      const { data: c } = await supabase
        .from("consultations")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (c) {
        setData(c as any);
        const { data: p } = await supabase
          .from("profiles")
          .select("full_name,hospital,specialty,phone,work_hours,hospital_address,hospital_phone")
          .eq("user_id", (c as any).user_id)
          .maybeSingle();
        if (p) setDoctor(p);
        const origin = window.location.origin;
        try { setQrVerify(await QRCode.toDataURL(`${origin}/verify/${id}`, { width: 220, margin: 1 })); } catch {}
        try { setQrApp(await QRCode.toDataURL(origin, { width: 220, margin: 1 })); } catch {}
      }
      setLoading(false);
    })();
  }, [id]);

  useEffect(() => {
    if (!loading && data && autoPrint) {
      const t = setTimeout(() => window.print(), 600);
      return () => clearTimeout(t);
    }
  }, [loading, data, autoPrint]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-6 text-center">
        <AlertTriangle className="h-12 w-12 text-destructive" />
        <h1 className="text-xl font-semibold">Hujjat topilmadi</h1>
        <p className="text-sm text-muted-foreground">Ushbu QR kod orqali tekshirilayotgan hujjat tizimda mavjud emas.</p>
        <Link to="/" className="text-sm text-primary underline">Bosh sahifa</Link>
      </div>
    );
  }

  const date = new Date(data.created_at).toLocaleString();
  const dx = data.chosen_diagnosis || data.diagnosis || "—";
  const rx: any[] = Array.isArray(data.prescriptions) ? data.prescriptions : [];
  const labs: any[] = Array.isArray(data.lab_tests) ? data.lab_tests : [];
  const instr: any[] = Array.isArray(data.instrumental_tests) ? data.instrumental_tests : [];
  const symptoms: any[] = Array.isArray(data.symptoms) ? data.symptoms : [];

  return (
    <>
      <Helmet>
        <title>Bemor Tavsiyanomasi — Clinora AI</title>
        <meta name="description" content="Bemor tavsiyanomasi, tashxis va retseptni tekshirish. QR kod orqali tasdiqlangan tibbiy hujjat." />
        <link rel="canonical" href={`https://clinora-ai-doc-assist.lovable.app/verify/${id}`} />
        <meta property="og:title" content="Bemor Tavsiyanomasi — Clinora AI" />
        <meta property="og:description" content="Bemor tavsiyanomasi va tashxisni tekshiring." />
        <meta property="og:url" content={`https://clinora-ai-doc-assist.lovable.app/verify/${id}`} />
      </Helmet>
      <div className="min-h-screen bg-muted/30 py-6 print:bg-white print:py-0">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          @page { size: A4 portrait; margin: 0; }
        }
        .a4 { width: 210mm; min-height: 297mm; margin: 0 auto; background: #fff; padding: 12mm 14mm; box-shadow: 0 8px 30px rgba(0,0,0,.08); color: #111827; font-size: 11px; line-height: 1.4; }
        .a4 h2 { font-size: 10px; text-transform: uppercase; letter-spacing: .05em; color: #2176eb; margin: 10px 0 4px; padding-bottom: 2px; border-bottom: 1px dashed #d1d5db; font-weight: 700; }
        .a4 table { width: 100%; border-collapse: collapse; font-size: 10px; }
        .a4 th { background: #eff5ff; color: #1e40af; text-align: left; padding: 4px 7px; font-weight: 600; border-bottom: 1.5px solid #c8dcfb; }
        .a4 td { padding: 4px 7px; border-bottom: 1px solid #eef0f4; vertical-align: top; }
        .dx-pill { display: inline-block; background: #ecfdf5; border: 1px solid #10b981; color: #065f46; padding: 5px 14px; border-radius: 8px; font-weight: 700; font-size: 12px; }
        .family-box { background: #fffbeb; border-left: 3px solid #f59e0b; border-radius: 5px; padding: 7px 11px; }
      `}</style>

      <div className="no-print mx-auto mb-4 flex max-w-[210mm] items-center justify-between px-4">
        <div className="flex items-center gap-2 rounded-full border border-success/30 bg-success/10 px-4 py-2 text-sm">
          <CheckCircle2 className="h-4 w-4 text-success" />
          <span className="font-medium text-success">Hujjat tasdiqlangan</span>
        </div>
        <button onClick={() => window.print()} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:opacity-90">
          <Printer className="h-4 w-4" /> PDF yuklab olish
        </button>
      </div>

      <div className="a4">
        {/* Header */}
        <div className="flex items-start justify-between border-b-2 border-[#2176eb] pb-2">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#2176eb] to-[#4f9bff] font-extrabold text-white">C</div>
            <div>
              <div className="text-base font-extrabold">Clinora AI</div>
              <div className="text-[9px] text-muted-foreground">Tibbiy xulosa va retsept</div>
            </div>
          </div>
          {doctor && (
            <div className="text-right text-[9px] leading-tight">
              <div className="text-[10px] font-bold text-[#2176eb]">{doctor.hospital || "—"}</div>
              {doctor.hospital_address && <div>{doctor.hospital_address}</div>}
              {doctor.hospital_phone && <div>☎ {doctor.hospital_phone}</div>}
            </div>
          )}
        </div>

        {/* Meta */}
        <div className="my-2 flex gap-2">
          <div className="flex-1 rounded-md border border-[#eef0f4] bg-[#f9fafb] px-2 py-1">
            <div className="text-[8px] uppercase text-muted-foreground">Bemor</div>
            <div className="text-[11px] font-semibold">{data.patient_name || "—"}</div>
          </div>
          <div className="flex-1 rounded-md border border-[#eef0f4] bg-[#f9fafb] px-2 py-1">
            <div className="text-[8px] uppercase text-muted-foreground">Sana</div>
            <div className="text-[11px] font-semibold">{date}</div>
          </div>
        </div>

        {symptoms.length > 0 && (
          <>
            <h2>Shikoyatlar</h2>
            <ul className="ml-4 list-disc text-[10px]">
              {symptoms.map((s, i) => <li key={i}>{String(s)}</li>)}
            </ul>
          </>
        )}

        {labs.length > 0 && (
          <>
            <h2>Laboratoriya</h2>
            <table>
              <thead><tr><th style={{ width: 24 }}>№</th><th>Nomi</th><th>Sababi</th><th style={{ width: "32%" }}>Natija</th></tr></thead>
              <tbody>{labs.map((l, i) => (
                <tr key={i}><td>{i + 1}</td><td><strong>{l.name}</strong></td><td>{l.reason || "—"}</td><td>{l.result || "—"}</td></tr>
              ))}</tbody>
            </table>
          </>
        )}

        {instr.length > 0 && (
          <>
            <h2>Apparat tekshiruvlari</h2>
            <table>
              <thead><tr><th style={{ width: 24 }}>№</th><th>Nomi</th><th>Sababi</th><th style={{ width: "32%" }}>Natija</th></tr></thead>
              <tbody>{instr.map((l, i) => (
                <tr key={i}><td>{i + 1}</td><td><strong>{l.name}</strong></td><td>{l.reason || "—"}</td><td>{l.result || "—"}</td></tr>
              ))}</tbody>
            </table>
          </>
        )}

        <h2>Tashxis</h2>
        <div><span className="dx-pill">{dx}</span></div>

        {data.recommendation && (<><h2>Tavsiya</h2><p className="whitespace-pre-wrap text-[10px]">{data.recommendation}</p></>)}

        {rx.length > 0 && (
          <>
            <h2>Retsept</h2>
            <table>
              <thead><tr><th style={{ width: 24 }}>№</th><th>Dori</th><th>Doza</th><th>Tartib</th><th>Davomiyligi</th><th>Izoh</th></tr></thead>
              <tbody>{rx.map((p, i) => (
                <tr key={i}><td>{i + 1}</td><td><strong>{p.name}</strong></td><td>{p.dosage}</td><td>{p.frequency}</td><td>{p.duration}</td><td>{p.notes || "—"}</td></tr>
              ))}</tbody>
            </table>
          </>
        )}

        {data.family_advice && (<><h2>Oila uchun</h2><div className="family-box"><p className="whitespace-pre-wrap text-[10px]">{data.family_advice}</p></div></>)}

        {/* Signature */}
        <div className="mt-6 flex items-end justify-between gap-3">
          {doctor && (
            <div className="text-[10px] leading-tight">
              <div className="text-[11px] font-bold">Dr. {doctor.full_name || "—"}</div>
              {doctor.specialty && <div className="font-medium text-[#2176eb]">{doctor.specialty}</div>}
              {doctor.phone && <div className="text-[9px] text-muted-foreground">☎ {doctor.phone}</div>}
              {doctor.work_hours && <div className="text-[9px] text-muted-foreground">🕒 {doctor.work_hours}</div>}
            </div>
          )}
          <div className="flex gap-3">
            {qrApp && <div className="text-center text-[8px] text-muted-foreground"><img src={qrApp} alt="App" className="mx-auto h-16 w-16" />Clinora AI platformasi</div>}
            {qrVerify && <div className="text-center text-[8px] text-muted-foreground"><img src={qrVerify} alt="Verify" className="mx-auto h-16 w-16" />Hujjatni tekshirish</div>}
          </div>
          <div className="w-[140px] text-center text-[9px] text-muted-foreground">
            <div className="mb-1 h-5 border-b border-[#111827]" />Imzo / muhr
          </div>
        </div>

        <div className="mt-3 border-t border-[#e5e7eb] pt-2 text-center text-[8px] text-muted-foreground">
          Clinora AI · <b className="text-[#2176eb]">Telegram:</b> @clinora_support · <b className="text-[#2176eb]">Instagram:</b> @clinora.ai
          <div className="italic">⚕ Hujjat Clinora AI yordamida tayyorlangan va shifokor tomonidan tasdiqlangan.</div>
        </div>
      </div>
    </div>
  );
};

export default Verify;
