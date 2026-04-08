 
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Check } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';

const languages = [
  { code: 'fr', name: 'Français', flag: '🇫🇷', dir: 'ltr' },
  { code: 'ar', name: 'العربية', flag: '🇹🇳', dir: 'rtl' },
  { code: 'en', name: 'English', flag: '🇬🇧', dir: 'ltr' },
];

export const LanguageSelector = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { language, setLanguage, dir } = useLanguage();

  const currentLang = languages.find(l => l.code === language);

  useEffect(() => {
    document.documentElement.dir = dir;
    document.documentElement.lang = language;
  }, [language, dir]);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 bg-white border-2 border-gray-200 hover:border-primary-500 rounded-xl px-6 py-3 transition-all shadow-sm"
      >
        <Globe size={24} className="text-gray-600" />
        <span className="font-bold text-xl">{currentLang?.flag} {currentLang?.name}</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full mt-2 right-0 bg-white rounded-xl shadow-2xl border-2 border-gray-100 min-w-[250px] z-50"
          >
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  setLanguage(lang.code);
                  setIsOpen(false);
                }}
                className={`flex items-center justify-between w-full px-6 py-4 hover:bg-gray-50 first:rounded-t-xl last:rounded-b-xl transition-all ${
                  language === lang.code ? 'bg-primary-50' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{lang.flag}</span>
                  <span className="font-bold text-xl">{lang.name}</span>
                </div>
                {language === lang.code && (
                  <Check size={20} className="text-primary-500" />
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};