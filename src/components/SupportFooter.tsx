import { Instagram, Send } from "lucide-react";

const SupportFooter = () => (
  <footer className="mt-10 border-t border-border/60 bg-background/40">
    <div className="container flex flex-col items-center justify-between gap-3 py-5 text-xs text-muted-foreground md:flex-row">
      <span>© {new Date().getFullYear()} Clinora AI · Шифокорлар учун AI ёрдамчи</span>
      <div className="flex items-center gap-2">
        <span className="hidden sm:inline">Саппорт:</span>
        <a
          href="https://t.me/clinora_support"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 hover:text-primary hover:border-primary/40 transition-colors"
        >
          <Send className="h-3.5 w-3.5" /> Telegram
        </a>
        <a
          href="https://instagram.com/clinora.ai"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 hover:text-primary hover:border-primary/40 transition-colors"
        >
          <Instagram className="h-3.5 w-3.5" /> Instagram
        </a>
      </div>
    </div>
  </footer>
);

export default SupportFooter;
