// contexts/LanguageContext.tsx
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

export type Language = 'ru' | 'kz' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

type Translations = Record<string, unknown>;

const loadTranslations = async (lang: Language): Promise<Translations> => {
  try {
    const imported = await import(`@/locales/${lang}.json`);
    return imported.default as Translations;
  } catch (error) {
    console.error(`Failed to load translations for ${lang}`, error);
    const fallback = await import('@/locales/ru.json');
    return fallback.default as Translations;
  }
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [language, setLanguage] = useState<Language>('ru');
  const [translations, setTranslations] = useState<Translations | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const pathParts = pathname.split('/');
    const langFromPath = pathParts[1] as Language;
    if (langFromPath && ['ru', 'kz', 'en'].includes(langFromPath)) {
      setLanguage(langFromPath);
      localStorage.setItem('language', langFromPath);
    }
  }, [pathname]);

  useEffect(() => {
    setIsLoading(true);
    loadTranslations(language).then((trans) => {
      setTranslations(trans);
      setIsLoading(false);
    });
  }, [language]);

  const setLanguageWithRedirect = (lang: Language) => {
    if (lang === language) return;

    const pathParts = pathname.split('/');
    if (pathParts[1] && ['ru', 'kz', 'en'].includes(pathParts[1])) {
      pathParts.splice(1, 1);
    }
    const newPath = `/${lang}${pathParts.join('/')}`;
    window.location.href = newPath;
  };

  const t = (key: string): string => {
    if (isLoading || !translations) return key;

    const keys = key.split('.');
    let value: unknown = translations;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in (value as Record<string, unknown>)) {
        value = (value as Record<string, unknown>)[k];
      } else {
        console.warn(`Translation key not found: ${key}`);
        return key;
      }
    }

    return typeof value === 'string' ? value : key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: setLanguageWithRedirect, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};