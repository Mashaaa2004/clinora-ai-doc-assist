import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useT } from "@/i18n/LanguageContext";
import { LANG_LABELS, Lang } from "@/i18n/translations";

const LanguageSwitcher = ({ compact = false }: { compact?: boolean }) => {
  const { lang, setLang } = useT();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="rounded-full">
          <Globe className="h-4 w-4" />
          {!compact && <span className="ml-1.5 text-xs uppercase">{lang}</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {(Object.keys(LANG_LABELS) as Lang[]).map((l) => (
          <DropdownMenuItem
            key={l}
            onClick={() => setLang(l)}
            className={l === lang ? "font-semibold text-primary" : ""}
          >
            {LANG_LABELS[l]} ({l.toUpperCase()})
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSwitcher;