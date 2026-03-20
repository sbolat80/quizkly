import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import en, { type TranslationKeys } from './en';
import tr from './tr';

export type UILanguage = 'en' | 'tr';

const translations = { en, tr } as const;

const STORAGE_KEY = 'inkzy-ui-lang';

export function getSavedUILanguage(): UILanguage {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'en' || saved === 'tr') return saved;
  } catch {}
  return 'en';
}

export function saveUILanguage(lang: UILanguage) {
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {}
}

interface I18nContextType {
  lang: UILanguage;
  t: (key: TranslationKeys) => string;
  setLang: (lang: UILanguage) => void;
}

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<UILanguage>(getSavedUILanguage);

  const setLang = useCallback((newLang: UILanguage) => {
    setLangState(newLang);
    saveUILanguage(newLang);
  }, []);

  const t = useCallback((key: TranslationKeys) => {
    return translations[lang][key] ?? key;
  }, [lang]);

  const value = useMemo(() => ({ lang, t, setLang }), [lang, t, setLang]);

  return React.createElement(I18nContext.Provider, { value }, children);
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
