import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Loader2, Mail, Stethoscope, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/hooks/useAuth";
import { useT } from "@/i18n/LanguageContext";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { Helmet } from "react-helmet-async";

type Audience = "doctor" | "admin";

const AuthPage = () => {
  const navigate = useNavigate();
  const { user, role, loading, refreshStatus } = useAuth();
  const { t } = useT();
  const [audience, setAudience] = useState<Audience>("doctor");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [hospital, setHospital] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (loading || !user) return;
    if (role === "admin") navigate("/admin", { replace: true });
    else navigate("/app", { replace: true });
  }, [user, role, loading, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup" && audience !== "admin") {
        if (!fullName.trim() || !hospital.trim()) {
          toast.error(t("auth.required"));
          setBusy(false);
          return;
        }
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/app`,
            data: { full_name: fullName.trim(), hospital: hospital.trim(), role: "doctor" },
          },
        });
        if (error) { toast.error(error.message); return; }
        toast.success(t("auth.created"));
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) { toast.error(error.message); return; }
        await refreshStatus();
      }
    } finally { setBusy(false); }
  };

  const google = async () => {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: `${window.location.origin}/app`,
    });
    if (result.error) { toast.error(t("auth.googleFail")); setBusy(false); }
  };

  return (
    <>
      <Helmet>
        <title>Kirish — Clinora AI</title>
        <meta name="description" content="Clinora AI platformasiga kirish: bemor, shifokor yoki admin sifatida." />
        <link rel="canonical" href="https://clinora-ai-doc-assist.lovable.app/auth" />
        <meta property="og:title" content="Clinora Platform Login" />
        <meta property="og:description" content="Clinora AI platformasiga kirish: bemor, shifokor yoki admin." />
        <meta property="og:url" content="https://clinora-ai-doc-assist.lovable.app/auth" />
      </Helmet>
      <div className="min-h-screen" style={{ background: "var(--gradient-soft)" }}>
        <div className="container flex min-h-screen items-center justify-center py-10">
          <div className="w-full max-w-md">
            <div className="mb-4 flex justify-end"><LanguageSwitcher /></div>
            <Link to="/" className="mb-8 flex items-center justify-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl shadow-md" style={{ background: "var(--gradient-primary)" }}>
                <span className="font-display text-base font-extrabold leading-none text-primary-foreground">C</span>
              </div>
              <span className="text-xl font-semibold">Clinora AI</span>
            </Link>

            <div className="rounded-3xl border border-border bg-card p-6 shadow-md sm:p-7">
              <h1 className="text-2xl font-semibold text-foreground">
                {mode === "signin" ? t("auth.signin") : t("auth.signup")}
              </h1>

              <DoctorAdminAuthBlock
                  audience={audience}
                  mode={mode} setMode={setMode}
                  email={email} setEmail={setEmail}
                  password={password} setPassword={setPassword}
                  fullName={fullName} setFullName={setFullName}
                  hospital={hospital} setHospital={setHospital}
                  busy={busy}
                  submit={submit}
                  google={google}
                  t={t}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

const DoctorAdminAuthBlock = (p: any) => {
  const isAdmin = p.audience === "admin";
  return (
    <div className="mt-5">
      <p className="mb-4 text-sm text-muted-foreground">
        {isAdmin ? "Admin paneliga email orqali kiring" : (p.mode === "signin" ? p.t("auth.signinDesc") : p.t("auth.signupDesc"))}
      </p>

      {!isAdmin && (
        <>
          <Button type="button" variant="outline" className="w-full rounded-xl" onClick={p.google} disabled={p.busy}>
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.83z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.83C6.71 7.31 9.14 5.38 12 5.38z"/></svg>
            {p.t("auth.google")}
          </Button>
          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" /> {p.t("auth.or")} <div className="h-px flex-1 bg-border" />
          </div>
        </>
      )}

      <form onSubmit={p.submit} className="space-y-3">
        {p.mode === "signup" && !isAdmin && (
          <>
            <div>
              <Label htmlFor="fn">{p.t("auth.fullName")}</Label>
              <Input id="fn" value={p.fullName} onChange={(e: any) => p.setFullName(e.target.value)} placeholder={p.t("auth.fullNamePh")} required className="rounded-xl mt-1" />
            </div>
            <div>
              <Label htmlFor="h">{p.t("auth.hospital")}</Label>
              <Input id="h" value={p.hospital} onChange={(e: any) => p.setHospital(e.target.value)} placeholder={p.t("auth.hospitalPh")} required className="rounded-xl mt-1" />
            </div>
          </>
        )}
        <div>
          <Label htmlFor="em">{p.t("auth.email")}</Label>
          <Input id="em" type="email" value={p.email} onChange={(e: any) => p.setEmail(e.target.value)} required className="rounded-xl mt-1" />
        </div>
        <div>
          <Label htmlFor="pw">{p.t("auth.password")}</Label>
          <Input id="pw" type="password" value={p.password} onChange={(e: any) => p.setPassword(e.target.value)} required minLength={6} className="rounded-xl mt-1" />
        </div>
        <Button type="submit" disabled={p.busy} size="lg" className="w-full rounded-xl shadow-md" style={{ background: "var(--gradient-primary)" }}>
          {p.busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Mail className="mr-2 h-5 w-5" /> {isAdmin ? "Admin sifatida kirish" : (p.mode === "signin" ? p.t("auth.signin") : p.t("auth.signup"))}</>}
        </Button>
      </form>

      {!isAdmin && (
        <div className="mt-5 text-center text-sm text-muted-foreground">
          {p.mode === "signin" ? (
            <>{p.t("auth.noAcc")}{" "}
              <button onClick={() => p.setMode("signup")} className="font-medium text-primary hover:underline">{p.t("auth.signupLink")}</button>
            </>
          ) : (
            <>{p.t("auth.hasAcc")}{" "}
              <button onClick={() => p.setMode("signin")} className="font-medium text-primary hover:underline">{p.t("auth.signinLink")}</button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default AuthPage;