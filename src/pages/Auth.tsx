import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Stethoscope, Loader2, Mail } from "lucide-react";
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

const AuthPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useT();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [hospital, setHospital] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) navigate("/app", { replace: true });
  }, [user, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
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
            data: { full_name: fullName.trim(), hospital: hospital.trim() },
          },
        });
        if (error) {
          toast.error(error.message);
          return;
        }
        toast.success(t("auth.created"));
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          toast.error(error.message);
          return;
        }
      }
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: `${window.location.origin}/app`,
    });
    if (result.error) {
      toast.error(t("auth.googleFail"));
      setBusy(false);
    }
  };

  return (
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

          <div className="rounded-3xl border border-border bg-card p-7 shadow-md">
            <h1 className="text-2xl font-semibold text-foreground">
              {mode === "signin" ? t("auth.signinTitle") : t("auth.signupTitle")}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {mode === "signin" ? t("auth.signinDesc") : t("auth.signupDesc")}
            </p>

            <Button
              type="button"
              variant="outline"
              className="mt-5 w-full rounded-xl"
              onClick={google}
              disabled={busy}
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.83z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.83C6.71 7.31 9.14 5.38 12 5.38z"/></svg>
              {t("auth.google")}
            </Button>

            <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
              <div className="h-px flex-1 bg-border" />
              {t("auth.or")}
              <div className="h-px flex-1 bg-border" />
            </div>

            <form onSubmit={submit} className="space-y-3">
              {mode === "signup" && (
                <>
                  <div>
                    <Label htmlFor="fn">{t("auth.fullName")}</Label>
                    <Input id="fn" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder={t("auth.fullNamePh")} required className="rounded-xl mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="h">{t("auth.hospital")}</Label>
                    <Input id="h" value={hospital} onChange={(e) => setHospital(e.target.value)} placeholder={t("auth.hospitalPh")} required className="rounded-xl mt-1" />
                  </div>
                </>
              )}
              <div>
                <Label htmlFor="em">{t("auth.email")}</Label>
                <Input id="em" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="rounded-xl mt-1" />
              </div>
              <div>
                <Label htmlFor="pw">{t("auth.password")}</Label>
                <Input id="pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="rounded-xl mt-1" />
              </div>
              <Button type="submit" disabled={busy} size="lg" className="w-full rounded-xl shadow-md" style={{ background: "var(--gradient-primary)" }}>
                {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Mail className="mr-2 h-5 w-5" /> {mode === "signin" ? t("auth.signin") : t("auth.signup")}</>}
              </Button>
            </form>

            <div className="mt-5 text-center text-sm text-muted-foreground">
              {mode === "signin" ? (
                <>{t("auth.noAcc")}{" "}
                  <button onClick={() => setMode("signup")} className="font-medium text-primary hover:underline">{t("auth.signupLink")}</button>
                </>
              ) : (
                <>{t("auth.hasAcc")}{" "}
                  <button onClick={() => setMode("signin")} className="font-medium text-primary hover:underline">{t("auth.signinLink")}</button>
                </>
              )}
            </div>
            <div className="mt-4 text-center">
              <Link to="/admin/login" className="text-xs text-muted-foreground hover:text-primary">
                {t("auth.admin")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
