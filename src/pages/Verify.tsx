import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Stethoscope, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Consultation = {
  id: string;
  patient_name: string;
  chosen_diagnosis: string;
  diagnosis: string;
  recommendation: string;
  prescriptions: any;
  lab_tests: any;
  instrumental_tests: any;
  family_advice: string;
  created_at: string;
  language: string;
};

const Verify = () => {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Consultation | null>(null);
  const [doctor, setDoctor] = useState<{ full_name: string; hospital: string; specialty: string } | null>(null);

  useEffect(() => {
    (async () => {
      if (!id) { setLoading(false); return; }
      const { data: c } = await supabase
        .from("consultations")
        .select("id,patient_name,chosen_diagnosis,diagnosis,recommendation,prescriptions,lab_tests,instrumental_tests,family_advice,created_at,language,user_id")
        .eq("id", id)
        .maybeSingle();
      if (c) {
        setData(c as any);
        const { data: p } = await supabase
          .from("profiles")
          .select("full_name,hospital,specialty")
          .eq("user_id", (c as any).user_id)
          .maybeSingle();
        if (p) setDoctor(p as any);
      }
      setLoading(false);
    })();
  }, [id]);

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
        <p className="text-sm text-muted-foreground">Ushbu QR kod orqali tekshirilayotgan hujjat tizimda mavjud emas yoki o‘chirilgan.</p>
        <Link to="/" className="text-sm text-primary underline">Bosh sahifa</Link>
      </div>
    );
  }

  const date = new Date(data.created_at).toLocaleString();
  const dx = data.chosen_diagnosis || data.diagnosis || "—";
  const rx: any[] = Array.isArray(data.prescriptions) ? data.prescriptions : [];
  const labs: any[] = Array.isArray(data.lab_tests) ? data.lab_tests : [];
  const instr: any[] = Array.isArray(data.instrumental_tests) ? data.instrumental_tests : [];

  return (
    <div className="min-h-screen bg-muted/30 p-4 md:p-8">
      <div className="mx-auto max-w-2xl space-y-4">
        <div className="flex items-center gap-3 rounded-2xl border border-success/30 bg-success/10 p-4">
          <CheckCircle2 className="h-7 w-7 text-success" />
          <div>
            <div className="font-semibold text-success">Hujjat tasdiqlandi</div>
            <div className="text-xs text-muted-foreground">Clinora AI rasmiy reestrida mavjud · {date}</div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Stethoscope className="h-4 w-4" />
            </div>
            <span className="font-semibold">Clinora AI</span>
          </div>

          <div className="space-y-3 text-sm">
            <Row label="Bemor" value={data.patient_name || "—"} />
            <Row label="Sana" value={date} />
            <Row label="Tashxis" value={dx} highlight />
            {doctor && (
              <>
                <Row label="Shifokor" value={`Dr. ${doctor.full_name || "—"}`} />
                {doctor.specialty && <Row label="Mutaxassisligi" value={doctor.specialty} />}
                {doctor.hospital && <Row label="Klinika" value={doctor.hospital} />}
              </>
            )}
          </div>
        </div>

        {rx.length > 0 && (
          <Card title={`Retsept (${rx.length})`}>
            <ul className="space-y-1 text-sm">
              {rx.map((p, i) => (
                <li key={i}>
                  <strong>{p.name}</strong> — {p.dosage}, {p.frequency}, {p.duration}
                </li>
              ))}
            </ul>
          </Card>
        )}

        {labs.length > 0 && (
          <Card title={`Laboratoriya (${labs.length})`}>
            <ul className="space-y-1 text-sm">
              {labs.map((l, i) => (
                <li key={i}>{l.name}{l.result ? ` — ${l.result}` : ""}</li>
              ))}
            </ul>
          </Card>
        )}

        {instr.length > 0 && (
          <Card title={`Apparat tekshiruvlari (${instr.length})`}>
            <ul className="space-y-1 text-sm">
              {instr.map((l, i) => (
                <li key={i}>{l.name}{l.result ? ` — ${l.result}` : ""}</li>
              ))}
            </ul>
          </Card>
        )}

        {data.recommendation && (
          <Card title="Tavsiya"><p className="whitespace-pre-wrap text-sm">{data.recommendation}</p></Card>
        )}

        {data.family_advice && (
          <Card title="Oila uchun"><p className="whitespace-pre-wrap text-sm">{data.family_advice}</p></Card>
        )}

        <p className="text-center text-xs text-muted-foreground">
          ⚕ Hujjat Clinora AI yordamida tayyorlangan va shifokor tomonidan tasdiqlangan.
        </p>
      </div>
    </div>
  );
};

const Row = ({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) => (
  <div className="flex justify-between gap-4 border-b border-border/50 pb-2 last:border-0">
    <span className="text-muted-foreground">{label}</span>
    <span className={highlight ? "font-semibold text-primary" : "font-medium"}>{value}</span>
  </div>
);

const Card = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
    <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-primary">{title}</h2>
    {children}
  </div>
);

export default Verify;