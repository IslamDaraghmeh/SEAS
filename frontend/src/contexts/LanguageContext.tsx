import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES, SupportedLanguage, getDirection, isRTL } from '../i18n';

// Types
export interface LanguageContextType {
  language: SupportedLanguage;
  direction: 'rtl' | 'ltr';
  isRTL: boolean;
  changeLanguage: (lang: SupportedLanguage) => void;
  toggleLanguage: () => void;
}

// Create context
export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Provider component
interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const { i18n } = useTranslation();
  const [language, setLanguage] = useState<SupportedLanguage>(
    (i18n.language as SupportedLanguage) || 'ar'
  );
  const [direction, setDirection] = useState<'rtl' | 'ltr'>(getDirection(language));

  // Update document attributes when language changes
  useEffect(() => {
    const dir = getDirection(language);
    setDirection(dir);
    document.documentElement.setAttribute('dir', dir);
    document.documentElement.setAttribute('lang', language);
  }, [language]);

  // Listen for i18n language changes
  useEffect(() => {
    const handleLanguageChange = (lng: string) => {
      if (SUPPORTED_LANGUAGES.includes(lng as SupportedLanguage)) {
        setLanguage(lng as SupportedLanguage);
      }
    };

    i18n.on('languageChanged', handleLanguageChange);

    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [i18n]);

  // Change language function
  const changeLanguage = useCallback(
    (lang: SupportedLanguage) => {
      if (SUPPORTED_LANGUAGES.includes(lang)) {
        i18n.changeLanguage(lang);
        setLanguage(lang);
        localStorage.setItem('language', lang);
      }
    },
    [i18n]
  );

  // Toggle between Arabic and English
  const toggleLanguage = useCallback(() => {
    const newLang: SupportedLanguage = language === 'ar' ? 'en' : 'ar';
    changeLanguage(newLang);
  }, [language, changeLanguage]);

  const value: LanguageContextType = {
    language,
    direction,
    isRTL: isRTL(language),
    changeLanguage,
    toggleLanguage,
  };

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
};

export default LanguageContext;
