import { useState } from "react";
import { Sparkles, Mic, FlaskConical, Activity, Brain, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useT } from "@/i18n/LanguageContext";

type Props = { onClose: (dontShowAgain: boolean) => void };

const GuideModal = ({ onClose }: Props) => {
  const { t } = useT();
  const [dontShow, setDontShow] = useState(false);

  const steps = [
    { icon: Mic, text: t("guide.s1") },
    { icon: FlaskConical, text: t("guide.s2") },
    { icon: Activity, text: t("guide.s3") },
    { icon: Brain, text: t("guide.s4") },
    { icon: FileText, text: t("guide.s5") },
  ];

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(dontShow); }}>
      <DialogContent className="w-[calc(100vw-1.5rem)] max-w-lg rounded-2xl sm:rounded-3xl p-4 sm:p-6 max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl shadow-md" style={{ background: "var(--gradient-primary)" }}>
            <Sparkles className="h-6 w-6 text-primary-foreground" />
          </div>
          <DialogTitle className="text-center text-lg sm:text-xl">{t("guide.title")}</DialogTitle>
          <DialogDescription className="text-center text-xs sm:text-sm">{t("guide.intro")}</DialogDescription>
        </DialogHeader>

        <ol className="space-y-2 sm:space-y-3 py-1 sm:py-2">
          {steps.map(({ icon: Icon, text }, i) => (
            <li key={i} className="flex items-start gap-2.5 sm:gap-3 rounded-xl sm:rounded-2xl border border-border/70 bg-background/60 p-2.5 sm:p-3">
              <div className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-primary/10 text-primary">
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <div className="text-[10px] sm:text-xs font-semibold text-muted-foreground">{i + 1}</div>
                <p className="text-xs sm:text-sm leading-snug">{text}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="rounded-xl sm:rounded-2xl border border-primary/30 bg-primary/5 p-2.5 sm:p-3 text-xs sm:text-sm">
          {t("guide.tip")}
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
          <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
            <input type="checkbox" checked={dontShow} onChange={(e) => setDontShow(e.target.checked)} className="h-4 w-4 rounded" />
            {t("guide.dontShow")}
          </label>
          <Button onClick={() => onClose(dontShow)} className="w-full sm:w-auto rounded-xl shadow-md" style={{ background: "var(--gradient-primary)" }}>
            {t("guide.start")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GuideModal;