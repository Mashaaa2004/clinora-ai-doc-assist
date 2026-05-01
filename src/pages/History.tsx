import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, FileText, Loader2, Search, Stethoscope, Trash2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type Consultation = {
  id: string;
  patient_name: string;
  diagnosis: string;
  recommendation: string;
  symptoms: string[];
  prescriptions: { name: string; dosage: string; frequency: string; duration: string; notes?: string }[];
  created_at: string;
};

const HistoryPage = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("consultations")
      .select("id,patient_name,diagnosis,recommendation,symptoms,prescriptions,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setLoading(false);
    if (error) {
      toast.error("Юкланмади");
      return;
    }
    setItems((data ?? []) as any);
  };

  useEffect(() => { load(); }, [user]);

  const remove = async (id: string) => {
    if (!confirm("Ўчирилсинми?")) return;
    const { error } = await supabase.from("consultations").delete().eq("id", id);
    if (error) { toast.error("Ўчмади"); return; }
    setItems((prev) => prev.filter((x) => x.id !== id));
    toast.success("Ўчирилди");
  };

  const filtered = items.filter((x) =>
    !q.trim() ||
    x.patient_name.toLowerCase().includes(q.toLowerCase()) ||
    x.diagnosis.toLowerCase().includes(q.toLowerCase()),
  );

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
            <span className="text-sm font-semibold">Беморлар тарихи</span>
          </div>
        </div>
      </header>

      <main className="container max-w-3xl py-8 md:py-12">
        <div className="rounded-3xl border border-border bg-card p-6 shadow-md md:p-8">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold">Беморлар тарихи</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Сиз кўрган ҳар бир бемор бу ерда сақланади.
              </p>
            </div>
            <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
              {items.length}
            </span>
          </div>

          <div className="mt-5 relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Бемор ёки ташхис бўйича қидириш..."
              className="rounded-xl pl-9"
            />
          </div>

          <div className="mt-6 space-y-3">
            {loading && (
              <div className="flex items-center justify-center py-10 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            )}

            {!loading && filtered.length === 0 && (
              <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
                <FileText className="mx-auto mb-3 h-8 w-8 opacity-40" />
                Ҳозирча ёзувлар йўқ. Биринчи беморни қабул қилиб, тасдиқлаганингиздан сўнг шу ерда сақланади.
              </div>
            )}

            {!loading && filtered.map((x) => {
              const open = openId === x.id;
              return (
                <div key={x.id} className="rounded-2xl border border-border bg-background/60">
                  <button
                    onClick={() => setOpenId(open ? null : x.id)}
                    className="flex w-full items-center justify-between gap-3 p-4 text-left"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium truncate">{x.patient_name || "Бемор"}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {x.diagnosis || "—"} · {new Date(x.created_at).toLocaleDateString("ru-RU")}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {new Date(x.created_at).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </button>

                  {open && (
                    <div className="border-t border-border/70 px-4 py-4 space-y-3 text-sm">
                      {x.symptoms?.length > 0 && (
                        <div>
                          <div className="mb-1 text-xs uppercase text-muted-foreground">Симптомлар</div>
                          <ul className="list-disc pl-5 space-y-0.5">
                            {x.symptoms.map((s, i) => <li key={i}>{s}</li>)}
                          </ul>
                        </div>
                      )}
                      <div>
                        <div className="mb-1 text-xs uppercase text-muted-foreground">Ташхис</div>
                        <p>{x.diagnosis || "—"}</p>
                      </div>
                      <div>
                        <div className="mb-1 text-xs uppercase text-muted-foreground">Тавсия</div>
                        <p className="whitespace-pre-wrap">{x.recommendation || "—"}</p>
                      </div>
                      {x.prescriptions?.length > 0 && (
                        <div>
                          <div className="mb-1 text-xs uppercase text-muted-foreground">Рецепт</div>
                          <ol className="space-y-2">
                            {x.prescriptions.map((p, i) => (
                              <li key={i} className="rounded-xl bg-muted/40 p-3">
                                <div className="font-medium">{i + 1}. {p.name}</div>
                                <div className="text-xs text-muted-foreground">
                                  {p.dosage} · {p.frequency} · {p.duration}{p.notes ? ` · ${p.notes}` : ""}
                                </div>
                              </li>
                            ))}
                          </ol>
                        </div>
                      )}
                      <div className="pt-2 flex justify-end">
                        <Button variant="outline" size="sm" onClick={() => remove(x.id)} className="rounded-xl text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" /> Ўчириш
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
};

export default HistoryPage;
