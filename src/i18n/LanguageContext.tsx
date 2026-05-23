import { createContext, useContext, useEffect, useState, ReactNode, useMemo } from "react";
import { Lang, TRANSLATIONS } from "./translations";

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
};

const LanguageContext = createContext<Ctx | undefined>(undefined);

const STORAGE_KEY = "clinora:lang";

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLangState] = useState<Lang>("uz");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Lang | null;
    if (saved && ["uz", "ru", "en", "kk", "ky", "tr"].includes(saved)) {
      setLangState(saved);
    }
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem(STORAGE_KEY, l);
  };

  const t = useMemo(() => {
    const dict = TRANSLATIONS[lang];
    return (key: string) => dict[key] ?? TRANSLATIONS.uz[key] ?? key;
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useT = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useT must be inside LanguageProvider");
  return ctx;
};