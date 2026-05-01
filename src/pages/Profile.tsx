import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Save, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const ProfilePage = () => {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    specialty: "",
    phone: "",
    work_hours: "",
    hospital: "",
    hospital_phone: "",
    hospital_address: "",
  });

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name || "",
        specialty: profile.specialty || "",
        phone: profile.phone || "",
        work_hours: profile.work_hours || "",
        hospital: profile.hospital || "",
        hospital_phone: profile.hospital_phone || "",
        hospital_address: profile.hospital_address || "",
      });
    }
  }, [profile]);

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    const { error } = await supabase
      .from("profiles")
      .update(form)
      .eq("user_id", user.id);
    setBusy(false);
    if (error) {
      toast.error("Сақлашда хатолик");
      return;
    }
    await refreshProfile();
    toast.success("Маълумотлар сақланди");
    navigate("/app");
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--gradient-soft)" }}>
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-lg">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/app" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Орқага
          </Link>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg shadow-md" style={{ background: "var(--gradient-primary)" }}>
              <Stethoscope className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-sm font-semibold">Профиль</span>
          </div>
        </div>
      </header>

      <main className="container max-w-2xl py-8 md:py-12">
        <div className="rounded-3xl border border-border bg-card p-6 shadow-md md:p-8">
          <h1 className="text-2xl font-semibold">Шифокор маълумотлари</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Бу маълумотлар бемор учун чиқарилган PDF ҳужжатида кўринади.
          </p>

          <form onSubmit={save} className="mt-6 space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label>Исм-шарифи *</Label>
                <Input value={form.full_name} onChange={(e) => set("full_name", e.target.value)} required className="mt-1 rounded-xl" />
              </div>
              <div>
                <Label>Мутахассислиги</Label>
                <Input value={form.specialty} onChange={(e) => set("specialty", e.target.value)} placeholder="Терапевт" className="mt-1 rounded-xl" />
              </div>
              <div>
                <Label>Телефон рақами</Label>
                <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+998 90 123 45 67" className="mt-1 rounded-xl" />
              </div>
              <div className="sm:col-span-2">
                <Label>Иш вақти</Label>
                <Input value={form.work_hours} onChange={(e) => set("work_hours", e.target.value)} placeholder="Душ-Шан 09:00 — 17:00" className="mt-1 rounded-xl" />
              </div>
            </div>

            <div className="my-2 h-px bg-border" />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label>Касалхона / клиника номи *</Label>
                <Input value={form.hospital} onChange={(e) => set("hospital", e.target.value)} required className="mt-1 rounded-xl" />
              </div>
              <div>
                <Label>Касалхона телефони</Label>
                <Input value={form.hospital_phone} onChange={(e) => set("hospital_phone", e.target.value)} placeholder="+998 71 200 00 00" className="mt-1 rounded-xl" />
              </div>
              <div>
                <Label>Манзил</Label>
                <Input value={form.hospital_address} onChange={(e) => set("hospital_address", e.target.value)} placeholder="Тошкент ш., Чилонзор" className="mt-1 rounded-xl" />
              </div>
            </div>

            <Button type="submit" disabled={busy} size="lg" className="mt-2 w-full rounded-2xl shadow-md" style={{ background: "var(--gradient-primary)" }}>
              {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Save className="mr-2 h-5 w-5" /> Сақлаш</>}
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default ProfilePage;