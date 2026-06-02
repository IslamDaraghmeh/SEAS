import { useContext } from 'react';
import { LanguageContext, LanguageContextType } from '../contexts/LanguageContext';

/**
 * Hook to access language context
 * @returns LanguageContextType
 * @throws Error if used outside of LanguageProvider
 */
export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);

  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }

  return context;
};

export default useLanguage;
