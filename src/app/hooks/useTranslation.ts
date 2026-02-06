import { useApp } from '@/app/context/AppContext';
import { translations, TranslationKey, Language } from '@/app/translations';
import { useEffect } from 'react';

export function useTranslation() {
  const { systemSettings, updateSystemSettings } = useApp();
  const currentLanguage = (systemSettings.language || 'ar') as Language;

  // Always keep LTR direction - sidebar on the left
  useEffect(() => {
    document.documentElement.setAttribute('dir', 'ltr');
    document.documentElement.setAttribute('lang', currentLanguage);
    document.body.setAttribute('dir', 'ltr');
  }, [currentLanguage]);

  const t = (key: TranslationKey): string => {
    return translations[currentLanguage][key] || key;
  };

  const changeLanguage = (lang: Language) => {
    updateSystemSettings({ language: lang });
  };

  return {
    t,
    currentLanguage,
    changeLanguage,
    isRTL: false, // Always LTR
  };
}