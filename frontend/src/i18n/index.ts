import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import arTranslations from './locales/ar.json';
import enTranslations from './locales/en.json';

// Supported languages
export const SUPPORTED_LANGUAGES = ['ar', 'en'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

// RTL languages
export const RTL_LANGUAGES: SupportedLanguage[] = ['ar'];

// Check if language is RTL
export const isRTL = (lang: string): boolean => {
  return RTL_LANGUAGES.includes(lang as SupportedLanguage);
};

// Get direction for language
export const getDirection = (lang: string): 'rtl' | 'ltr' => {
  return isRTL(lang) ? 'rtl' : 'ltr';
};

// Get stored language or default to Arabic
const getInitialLanguage = (): SupportedLanguage => {
  const stored = localStorage.getItem('language');
  if (stored && SUPPORTED_LANGUAGES.includes(stored as SupportedLanguage)) {
    return stored as SupportedLanguage;
  }
  return 'ar'; // Default to Arabic
};

// Initialize i18next
i18n
  .use(initReactI18next)
  .init({
    resources: {
      ar: { translation: arTranslations },
      en: { translation: enTranslations },
    },
    lng: getInitialLanguage(),
    fallbackLng: 'ar',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

// Update document direction when language changes
i18n.on('languageChanged', (lng) => {
  const direction = getDirection(lng);
  document.documentElement.setAttribute('dir', direction);
  document.documentElement.setAttribute('lang', lng);
  localStorage.setItem('language', lng);
});

// Set initial direction
const initialDirection = getDirection(i18n.language);
document.documentElement.setAttribute('dir', initialDirection);
document.documentElement.setAttribute('lang', i18n.language);

export default i18n;
