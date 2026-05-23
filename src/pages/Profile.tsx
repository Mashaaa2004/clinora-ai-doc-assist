import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Camera, Crown, Loader2, Save, Stethoscope, BarChart3, CalendarDays, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const ProfilePage = () => {
  const { user, profile, refreshProfile, isPro, proExpiresAt } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [monthly, setMonthly] = useState<{ month: string; label: string; count: number }[]>([]);
  const [reportLoading, setReportLoading] = useState(true);
  const [reportTotals, setReportTotals] = useState({ thisMonth: 0, total: 0, avgPerMonth: 0 });
  const docPrefix = user ? user.id.replace(/-/g, "").slice(0, 4).toUpperCase() : "";
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

  // Load doctor's own monthly patient stats (last 6 months).
  useEffect(() => {
    if (!user) return;
    (async () => {
      setReportLoading(true);
      const now = new Date();
      const from = new Date(now.getFullYear(), now.getMonth() - 5, 1);
      const { data } = await supabase
        .from("consultations")
        .select("created_at")
        .eq("user_id", user.id)
        .gte("created_at", from.toISOString())
        .order("created_at", { ascending: true })
        .limit(5000);
      const buckets: { month: string; label: string; count: number }[] = [];
      const MONTHS_UZ = ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        buckets.push({ month: key, label: `${MONTHS_UZ[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`, count: 0 });
      }
      let total = 0;
      (data || []).forEach((r: any) => {
        const d = new Date(r.created_at);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        const b = buckets.find((x) => x.month === key);
        if (b) b.count++;
        total++;
      });
      const thisMonth = buckets[buckets.length - 1]?.count || 0;
      const avg = Math.round(total / 6);
      setMonthly(buckets);
      setReportTotals({ thisMonth, total, avgPerMonth: avg });
      setReportLoading(false);
    })();
  }, [user]);

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const onPickAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!isPro) {
      toast.error("Аватар юклаш фақат Pro фойдаланувчилар учун");
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      toast.error("Расм 3 МБ дан кичик бўлсин");
      return;
    }
    setUploading(true);
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${user.id}/avatar-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true, contentType: file.type });
    if (upErr) {
      setUploading(false);
      toast.error("Расм юкланмади");
      return;
    }
    const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
    await supabase.from("profiles").update({ avatar_url: pub.publicUrl }).eq("user_id", user.id);
    await refreshProfile();
    setUploading(false);
    toast.success("Профиль расми янгиланди");
  };

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
          <div className="flex flex-col items-center gap-3 pb-6 border-b border-border">
            <div className="relative">
              <div
                className="h-24 w-24 overflow-hidden rounded-full border-4 shadow-md"
                style={{ borderColor: isPro ? "hsl(var(--primary))" : "hsl(var(--border))" }}
              >
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Профиль" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-muted text-2xl font-semibold text-muted-foreground">
                    {(form.full_name || "?").charAt(0)}
                  </div>
                )}
              </div>
              <button
                type="button"
                disabled={!isPro || uploading}
                onClick={() => fileRef.current?.click()}
                className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full text-primary-foreground shadow-md disabled:opacity-50"
                style={{ background: "var(--gradient-primary)" }}
              >
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
              </button>
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPickAvatar} />
            </div>
            {isPro ? (
              <div className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <Crown className="h-3.5 w-3.5" /> PRO шифокор
                {proExpiresAt && (
                  <span className="text-muted-foreground">
                    · {new Date(proExpiresAt).toLocaleDateString("ru-RU")} гача
                  </span>
                )}
              </div>
            ) : (
              <Link
                to="/pricing"
                className="text-xs text-muted-foreground underline hover:text-primary"
              >
                Pro олиб расм юкланг
              </Link>
            )}
          </div>

          <h1 className="mt-6 text-2xl font-semibold">Шифокор маълумотлари</h1>
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