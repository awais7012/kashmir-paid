import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { SITE_LANG } from "@/lib/site-lang";
import type { StoryLanguage } from "@/lib/story-language";

const STORAGE_KEY = "gktv.site-language";

type SiteLanguageContextValue = {
  language: StoryLanguage;
  setLanguage: (language: StoryLanguage) => void;
  toggleLanguage: () => void;
};

const SiteLanguageContext = createContext<SiteLanguageContextValue | null>(null);

export function SiteLanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<StoryLanguage>(SITE_LANG);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "en" || stored === "ur") setLanguageState(stored);
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ur" ? "rtl" : "ltr";
  }, [language]);

  const value = useMemo<SiteLanguageContextValue>(
    () => ({
      language,
      setLanguage: (next) => {
        window.localStorage.setItem(STORAGE_KEY, next);
        setLanguageState(next);
      },
      toggleLanguage: () => {
        const next = language === "en" ? "ur" : "en";
        window.localStorage.setItem(STORAGE_KEY, next);
        setLanguageState(next);
      },
    }),
    [language],
  );

  return <SiteLanguageContext.Provider value={value}>{children}</SiteLanguageContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSiteLanguage(): SiteLanguageContextValue {
  const context = useContext(SiteLanguageContext);
  if (!context) throw new Error("useSiteLanguage must be used within SiteLanguageProvider");
  return context;
}
