import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Crown, Loader2, LogOut, Save, Search, Shield, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type Profile = {
  id: string;
  user_id: string;
  full_name: string;
  hospital: string;
  phone: string;
};

type PaymentReq = {
  id: string;
  user_id: string;
  plan: string;
  duration_months: number;
  amount: number;
  status: string;
  created_at: string;
};

type Sub = {
  id: string;
  user_id: string;
  plan: string;
  duration_months: number;
  expires_at: string;
  is_active: boolean;
  branding_name: string;
};

const AdminDashboard = () => {
  const { isAdmin, loading, signOut, user } = useAuth();
  const [tab, setTab] = useState<"requests" | "users" | "subs" | "settings">("requests");

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  if (!user) return <Navigate to="/admin/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen" style={{ background: "var(--gradient-soft)" }}>
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-lg">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Бош саҳифа
          </Link>
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">Clinora Admin</span>
          </div>
          <Button variant="ghost" size="sm" onClick={signOut}>
            <LogOut className="h-4 w-4" /> Чиқиш
          </Button>
        </div>
      </header>

      <main className="container max-w-5xl py-8">
        <div className="mb-6 flex flex-wrap gap-2 rounded-2xl border border-border bg-card p-1.5 shadow-sm">
          {([
            ["requests", "Тўлов сўровлари"],
            ["users", "Фойдаланувчилар"],
            ["subs", "Фаол обуналар"],
            ["settings", "Созламалар"],
          ] as const).map(([k, label]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={
                "flex-1 min-w-[120px] rounded-xl px-4 py-2 text-sm font-medium transition " +
                (tab === k ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:bg-muted")
              }
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "requests" && <RequestsPanel />}
        {tab === "users" && <UsersPanel />}
        {tab === "subs" && <SubsPanel />}
        {tab === "settings" && <SettingsPanel />}
      </main>
    </div>
  );
};

/* ============ REQUESTS ============ */
const RequestsPanel = () => {
  const { user } = useAuth();
  const [reqs, setReqs] = useState<(PaymentReq & { profile?: Profile })[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data: requests } = await supabase
      .from("payment_requests")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    const ids = [...new Set((requests ?? []).map((r) => r.user_id))];
    const { data: profs } = ids.length
      ? await supabase.from("profiles").select("id,user_id,full_name,hospital,phone").in("user_id", ids)
      : { data: [] as Profile[] };
    const map = new Map((profs ?? []).map((p) => [p.user_id, p as Profile]));
    setReqs((requests ?? []).map((r: any) => ({ ...r, profile: map.get(r.user_id) })));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const approve = async (r: PaymentReq) => {
    if (!user) return;
    const expires = new Date();
    expires.setMonth(expires.getMonth() + r.duration_months);
    const { error: subErr } = await supabase.from("subscriptions").insert({
      user_id: r.user_id,
      plan: r.plan,
      duration_months: r.duration_months,
      expires_at: expires.toISOString(),
      activated_by: user.id,
      is_active: true,
    });
    if (subErr) { toast.error("Фаоллаштириш хатолик: " + subErr.message); return; }
    await supabase.from("payment_requests").update({ status: "approved" }).eq("id", r.id);
    toast.success("Фаоллаштирилди ✓");
    load();
  };

  const reject = async (r: PaymentReq) => {
    await supabase.from("payment_requests").update({ status: "rejected" }).eq("id", r.id);
    toast.info("Сўров рад этилди");
    load();
  };

  if (loading) return <div className="py-12 text-center"><Loader2 className="inline h-6 w-6 animate-spin text-primary" /></div>;
  if (!reqs.length) return <Empty text="Тўлов сўровлари йўқ" />;

  return (
    <div className="space-y-3">
      {reqs.map((r) => (
        <div key={r.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="font-semibold">{r.profile?.full_name || "Шифокор"}</div>
              <div className="text-xs text-muted-foreground">{r.profile?.hospital} · {r.profile?.phone}</div>
              <div className="mt-2 text-sm">
                <span className="font-medium">{r.plan === "pro" ? "PRO" : "Клиника"}</span>
                {" · "}{r.duration_months} ой · {r.amount.toLocaleString("ru-RU")} сўм
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {new Date(r.created_at).toLocaleString("ru-RU")}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={
                "rounded-full px-3 py-1 text-xs font-semibold " +
                (r.status === "pending" ? "bg-warning/20 text-warning" :
                 r.status === "approved" ? "bg-success/20 text-success" :
                 "bg-destructive/20 text-destructive")
              }>
                {r.status === "pending" ? "Кутилмоқда" : r.status === "approved" ? "Тасдиқланган" : "Рад этилган"}
              </span>
              {r.status === "pending" && (
                <>
                  <Button size="sm" onClick={() => approve(r)} style={{ background: "var(--gradient-primary)" }}>
                    <CheckCircle2 className="h-4 w-4" /> Тасдиқлаш
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => reject(r)}>
                    <XCircle className="h-4 w-4" /> Рад этиш
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

/* ============ USERS (search & manual activate) ============ */
const UsersPanel = () => {
  const { user } = useAuth();
  const [q, setQ] = useState("");
  const [users, setUsers] = useState<Profile[]>([]);
  const [selected, setSelected] = useState<Profile | null>(null);
  const [plan, setPlan] = useState<"pro" | "clinic">("pro");
  const [duration, setDuration] = useState(1);
  const [branding, setBranding] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    let query = supabase.from("profiles").select("id,user_id,full_name,hospital,phone").limit(50).order("created_at", { ascending: false });
    if (q.trim()) {
      query = supabase
        .from("profiles")
        .select("id,user_id,full_name,hospital,phone")
        .or(`full_name.ilike.%${q}%,hospital.ilike.%${q}%,user_id.eq.${q}`)
        .limit(50);
    }
    const { data } = await query;
    setUsers((data as Profile[]) ?? []);
  };

  useEffect(() => { load(); }, []);

  const activate = async () => {
    if (!selected || !user) return;
    setBusy(true);
    const expires = new Date();
    expires.setMonth(expires.getMonth() + duration);
    const { error } = await supabase.from("subscriptions").insert({
      user_id: selected.user_id,
      plan,
      duration_months: duration,
      expires_at: expires.toISOString(),
      activated_by: user.id,
      is_active: true,
      branding_name: plan === "clinic" ? branding : "",
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`${selected.full_name} учун ${plan.toUpperCase()} ${duration} ойга фаоллаштирилди`);
    setSelected(null);
    setBranding("");
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="flex gap-2">
          <Input
            placeholder="Исм, касалхона ёки user ID бўйича қидириш"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load()}
            className="rounded-xl"
          />
          <Button onClick={load}><Search className="h-4 w-4" /> Қидириш</Button>
        </div>
      </div>

      {selected && (
        <div className="rounded-2xl border border-primary/40 bg-card p-5 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold">{selected.full_name}</div>
              <div className="text-xs text-muted-foreground">{selected.hospital} · ID: {selected.user_id.slice(0, 8)}…</div>
            </div>
            <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground">✕</button>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Тариф</Label>
              <div className="mt-1 grid grid-cols-2 gap-2">
                {(["pro", "clinic"] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPlan(p)}
                    className={
                      "rounded-xl border px-3 py-2 text-sm font-semibold " +
                      (plan === p ? "border-primary bg-primary text-primary-foreground" : "border-border")
                    }
                  >
                    {p === "pro" ? "PRO" : "Клиника"}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>Муддати</Label>
              <div className="mt-1 grid grid-cols-4 gap-1">
                {[1, 3, 6, 12].map((m) => (
                  <button
                    key={m}
                    onClick={() => setDuration(m)}
                    className={
                      "rounded-xl border px-2 py-2 text-sm font-semibold " +
                      (duration === m ? "border-primary bg-primary text-primary-foreground" : "border-border")
                    }
                  >
                    {m === 12 ? "1й" : `${m}о`}
                  </button>
                ))}
              </div>
            </div>
          </div>
          {plan === "clinic" && (
            <div className="mt-3">
              <Label>Брендинг номи (клиника)</Label>
              <Input value={branding} onChange={(e) => setBranding(e.target.value)} className="mt-1 rounded-xl" />
            </div>
          )}
          <Button onClick={activate} disabled={busy} className="mt-4 w-full rounded-xl" style={{ background: "var(--gradient-primary)" }}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Crown className="h-4 w-4" /> Фаоллаштириш</>}
          </Button>
        </div>
      )}

      <div className="space-y-2">
        {users.map((u) => (
          <button
            key={u.id}
            onClick={() => setSelected(u)}
            className="w-full rounded-2xl border border-border bg-card p-3 text-left shadow-sm hover:border-primary/50"
          >
            <div className="font-medium">{u.full_name || "Исмсиз"}</div>
            <div className="text-xs text-muted-foreground">{u.hospital || "—"} · {u.phone || "—"}</div>
            <div className="mt-1 font-mono text-[10px] text-muted-foreground">{u.user_id}</div>
          </button>
        ))}
        {!users.length && <Empty text="Фойдаланувчи топилмади" />}
      </div>
    </div>
  );
};

/* ============ ACTIVE SUBS ============ */
const SubsPanel = () => {
  const [subs, setSubs] = useState<(Sub & { profile?: Profile })[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("subscriptions")
      .select("*")
      .order("expires_at", { ascending: false })
      .limit(100);
    const ids = [...new Set((data ?? []).map((s: any) => s.user_id))];
    const { data: profs } = ids.length
      ? await supabase.from("profiles").select("id,user_id,full_name,hospital,phone").in("user_id", ids)
      : { data: [] as Profile[] };
    const map = new Map((profs ?? []).map((p) => [p.user_id, p as Profile]));
    setSubs((data ?? []).map((s: any) => ({ ...s, profile: map.get(s.user_id) })));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const deactivate = async (id: string) => {
    await supabase.from("subscriptions").update({ is_active: false }).eq("id", id);
    toast.info("Обуна тўхтатилди");
    load();
  };

  if (loading) return <div className="py-12 text-center"><Loader2 className="inline h-6 w-6 animate-spin text-primary" /></div>;
  if (!subs.length) return <Empty text="Фаол обуналар йўқ" />;

  return (
    <div className="space-y-2">
      {subs.map((s) => {
        const expired = new Date(s.expires_at) < new Date();
        const active = s.is_active && !expired;
        return (
          <div key={s.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="font-semibold">{s.profile?.full_name || s.user_id.slice(0, 8)}</div>
                <div className="text-xs text-muted-foreground">{s.profile?.hospital}</div>
                <div className="mt-1 text-sm">
                  <span className="font-medium">{s.plan === "pro" ? "PRO" : "Клиника"}</span> · {s.duration_months} ой
                  {s.branding_name && <span> · {s.branding_name}</span>}
                </div>
                <div className="text-xs text-muted-foreground">
                  Тугаши: {new Date(s.expires_at).toLocaleString("ru-RU")}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={
                  "rounded-full px-3 py-1 text-xs font-semibold " +
                  (active ? "bg-success/20 text-success" : "bg-muted text-muted-foreground")
                }>
                  {active ? "Фаол" : expired ? "Муддати тугаган" : "Тўхтатилган"}
                </span>
                {active && (
                  <Button size="sm" variant="outline" onClick={() => deactivate(s.id)}>Тўхтатиш</Button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

/* ============ SETTINGS ============ */
const SettingsPanel = () => {
  const [form, setForm] = useState({
    card_number: "",
    card_holder: "",
    telegram_support: "",
    pro_price_monthly: 250000,
  });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.from("platform_settings").select("*").eq("id", 1).maybeSingle().then(({ data }) => {
      if (data) setForm({
        card_number: data.card_number,
        card_holder: data.card_holder,
        telegram_support: data.telegram_support,
        pro_price_monthly: data.pro_price_monthly,
      });
    });
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.from("platform_settings").update(form).eq("id", 1);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Сақланди");
  };

  return (
    <form onSubmit={save} className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
      <h2 className="text-lg font-semibold">Платформа созламалари</h2>
      <p className="text-xs text-muted-foreground">Бу маълумотлар Pricing саҳифасида ҳаммага кўринади</p>

      <div>
        <Label>Карта рақами</Label>
        <Input value={form.card_number} onChange={(e) => setForm({ ...form, card_number: e.target.value })} className="mt-1 rounded-xl font-mono" />
      </div>
      <div>
        <Label>Карта эгаси (исм)</Label>
        <Input value={form.card_holder} onChange={(e) => setForm({ ...form, card_holder: e.target.value })} className="mt-1 rounded-xl" />
      </div>
      <div>
        <Label>Telegram саппорт (масалан: @clinora_support)</Label>
        <Input value={form.telegram_support} onChange={(e) => setForm({ ...form, telegram_support: e.target.value })} className="mt-1 rounded-xl" />
      </div>
      <div>
        <Label>Pro нархи / 1 ой (сўм)</Label>
        <Input type="number" value={form.pro_price_monthly} onChange={(e) => setForm({ ...form, pro_price_monthly: parseInt(e.target.value) || 0 })} className="mt-1 rounded-xl" />
      </div>

      <Button type="submit" disabled={busy} size="lg" className="w-full rounded-xl" style={{ background: "var(--gradient-primary)" }}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4" /> Сақлаш</>}
      </Button>
    </form>
  );
};

const Empty = ({ text }: { text: string }) => (
  <div className="rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center text-sm text-muted-foreground">
    {text}
  </div>
);

export default AdminDashboard;
