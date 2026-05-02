import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, Lock, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const AdminLoginPage = () => {
  const navigate = useNavigate();
  const { user, isAdmin, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user && isAdmin) navigate("/admin", { replace: true });
  }, [user, isAdmin, loading, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setBusy(false);
      toast.error("Email ёки парол нотўғри");
      return;
    }
    // Verify admin role
    const { data: { user: u } } = await supabase.auth.getUser();
    if (!u) {
      setBusy(false);
      toast.error("Сессия топилмади");
      return;
    }
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", u.id)
      .eq("role", "admin");
    setBusy(false);
    if (!roles || roles.length === 0) {
      await supabase.auth.signOut();
      toast.error("Сизда админ ҳуқуқи йўқ");
      return;
    }
    toast.success("Хуш келибсиз, админ");
    navigate("/admin", { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--gradient-soft)" }}>
      <div className="w-full max-w-md p-6">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl shadow-md" style={{ background: "var(--gradient-primary)" }}>
            <Shield className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-semibold">Clinora Admin</span>
        </Link>

        <div className="rounded-3xl border border-border bg-card p-7 shadow-md">
          <h1 className="text-2xl font-semibold">Админ кириш</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Фақат тизим администратори учун
          </p>

          <form onSubmit={submit} className="mt-6 space-y-3">
            <div>
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1 rounded-xl" />
            </div>
            <div>
              <Label>Парол</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="mt-1 rounded-xl" />
            </div>
            <Button type="submit" disabled={busy} size="lg" className="w-full rounded-xl shadow-md" style={{ background: "var(--gradient-primary)" }}>
              {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Lock className="mr-2 h-5 w-5" /> Кириш</>}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;
