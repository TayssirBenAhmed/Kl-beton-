import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getTranslation } from '../locales/dictionary';

const useLanguageStore = create(
  persist(
    (set) => ({
      language: 'fr',
      setLanguage: (lang) => {
        set({ language: lang });
        document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.lang = lang;
      },
    }),
    {
      name: 'language-storage',
    }
  )
);

export const useLanguage = () => {
  const { language, setLanguage } = useLanguageStore();

  const t = (key) => getTranslation(language, key);

  return {
    language,
    setLanguage,
    t,
    dir: language === 'ar' ? 'rtl' : 'ltr'
  };
};