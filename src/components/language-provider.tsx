'use client';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { type Language, languageStorageKey, translate } from '@/lib/i18n';

type LanguageContextValue = { language: Language; setLanguage: (value: Language) => void; t: (text: string) => string };
const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, updateLanguage] = useState<Language>('id');
  useEffect(() => {
    try {
      const saved = localStorage.getItem(languageStorageKey);
      if (saved === 'id' || saved === 'en') updateLanguage(saved);
    } catch { /* Browsing without local storage still defaults to Indonesian. */ }
  }, []);
  useEffect(() => {
    document.documentElement.lang = language;
    document.title = language === 'id'
      ? 'RuangBaik — Kebaikan kecil. Dampak besar.'
      : 'RuangBaik — Small steps. Big impact.';
  }, [language]);
  const setLanguage = useCallback((value: Language) => {
    updateLanguage(value);
    try { localStorage.setItem(languageStorageKey, value); } catch { /* Selection still works for this visit. */ }
  }, []);
  const t = useCallback((text: string) => translate(language, text), [language]);
  const value = useMemo(() => ({ language, setLanguage, t }), [language, setLanguage, t]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('LanguageProvider is missing.');
  return context;
}
