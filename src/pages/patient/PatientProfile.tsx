import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const PatientProfile = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({
    full_name: "",
    phone: "",
    date_of_birth: "",
    gender: "",
    language: "uz",
    blood_type: "",
    allergies: "",
    chronic_conditions: "",
  });

  useEffect(() => {
    if (!user) return;
    supabase.from("patient_profiles").select("*").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => {
        if (data) setF({
          full_name: data.full_name || "",
          phone: data.phone || "",
          date_of_birth: data.date_of_birth || "",
          gender: data.gender || "",
          language: data.language || "uz",
          blood_type: data.blood_type || "",
          allergies: (data.allergies || []).join(", "),
          chronic_conditions: (data.chronic_conditions || []).join(", "),
        });
        setLoading(false);
      });
  }, [user]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    const payload = {
      user_id: user.id,
      full_name: f.full_name.trim(),
      phone: f.phone.trim(),
      date_of_birth: f.date_of_birth || null,
      gender: f.gender,
      language: f.language,
      blood_type: f.blood_type.trim(),
      allergies: f.allergies.split(",").map((s) => s.trim()).filter(Boolean),
      chronic_conditions: f.chronic_conditions.split(",").map((s) => s.trim()).filter(Boolean),
    };
    const { error } = await supabase.from("patient_profiles").upsert(payload, { onConflict: "user_id" });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Saqlandi");
  };

  return (
    <>
      <Helmet><title>Mening profilim — Clinora AI</title></Helmet>
      <div className="min-h-screen" style={{ background: "var(--gradient-soft)" }}>
        <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-lg">
          <div className="container flex h-14 items-center">
            <Link to="/patient" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" /> Orqaga
            </Link>
          </div>
        </header>
        <main className="container max-w-xl px-4 py-6">
          <h1 className="text-xl font-semibold">Mening profilim</h1>
          {loading ? (
            <div className="py-12 text-center"><Loader2 className="inline h-6 w-6 animate-spin text-primary" /></div>
          ) : (
            <form onSubmit={save} className="mt-4 space-y-3 rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div>
                <Label>Ism va familiya</Label>
                <Input value={f.full_name} onChange={(e) => setF({ ...f, full_name: e.target.value })} className="mt-1 rounded-xl" required />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Tug'ilgan sana</Label>
                  <Input type="date" value={f.date_of_birth} onChange={(e) => setF({ ...f, date_of_birth: e.target.value })} className="mt-1 rounded-xl" />
                </div>
                <div>
                  <Label>Jins</Label>
                  <select value={f.gender} onChange={(e) => setF({ ...f, gender: e.target.value })} className="mt-1 h-10 w-full rounded-xl border border-input bg-background px-3 text-sm">
                    <option value="">—</option>
                    <option value="male">Erkak</option>
                    <option value="female">Ayol</option>
                  </select>
                </div>
              </div>
              <div>
                <Label>Telefon</Label>
                <Input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} placeholder="+998..." className="mt-1 rounded-xl" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Til</Label>
                  <select value={f.language} onChange={(e) => setF({ ...f, language: e.target.value })} className="mt-1 h-10 w-full rounded-xl border border-input bg-background px-3 text-sm">
                    <option value="uz">O'zbek</option>
                    <option value="ru">Русский</option>
                    <option value="en">English</option>
                  </select>
                </div>
                <div>
                  <Label>Qon guruhi</Label>
                  <Input value={f.blood_type} onChange={(e) => setF({ ...f, blood_type: e.target.value })} placeholder="A+, O-, ..." className="mt-1 rounded-xl" />
                </div>
              </div>
              <div>
                <Label>Allergiyalar (vergul bilan)</Label>
                <Input value={f.allergies} onChange={(e) => setF({ ...f, allergies: e.target.value })} placeholder="penitsillin, chang..." className="mt-1 rounded-xl" />
              </div>
              <div>
                <Label>Surunkali kasalliklar (vergul bilan)</Label>
                <Input value={f.chronic_conditions} onChange={(e) => setF({ ...f, chronic_conditions: e.target.value })} placeholder="diabet, gipertoniya..." className="mt-1 rounded-xl" />
              </div>
              <Button type="submit" disabled={busy} className="w-full rounded-xl shadow-md" style={{ background: "var(--gradient-primary)" }}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="mr-2 h-4 w-4" /> Saqlash</>}
              </Button>
            </form>
          )}
        </main>
      </div>
    </>
  );
};

export default PatientProfile;