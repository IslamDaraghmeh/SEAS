import React, { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { Menu, Transition } from '@headlessui/react';
import { GlobeAltIcon, CheckIcon } from '@heroicons/react/24/outline';
import { LanguageContext } from '../../contexts/LanguageContext';
import { SUPPORTED_LANGUAGES, SupportedLanguage } from '../../i18n';

const languageNames: Record<SupportedLanguage, { native: string; flag: string }> = {
  ar: { native: 'العربية', flag: '🇸🇦' },
  en: { native: 'English', flag: '🇺🇸' },
};

const LanguageSwitch: React.FC = () => {
  const { t } = useTranslation();
  const languageContext = useContext(LanguageContext);

  if (!languageContext) {
    return null;
  }

  const { language, changeLanguage } = languageContext;

  return (
    <Menu as="div" className="relative">
      <Menu.Button className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors">
        <GlobeAltIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
          {languageNames[language].native}
        </span>
      </Menu.Button>

      <Transition
        as={React.Fragment}
        enter="transition ease-out duration-200"
        enterFrom="transform opacity-0 scale-95 -translate-y-2"
        enterTo="transform opacity-100 scale-100 translate-y-0"
        leave="transition ease-in duration-150"
        leaveFrom="transform opacity-100 scale-100 translate-y-0"
        leaveTo="transform opacity-0 scale-95 -translate-y-2"
      >
        <Menu.Items className="absolute end-0 mt-2 w-44 bg-white dark:bg-gray-800 rounded-xl shadow-xl ring-1 ring-black/5 dark:ring-gray-700 focus:outline-none z-50 overflow-hidden">
          <div className="p-1.5">
            {SUPPORTED_LANGUAGES.map((lang) => (
              <Menu.Item key={lang}>
                {({ active }) => (
                  <button
                    onClick={() => changeLanguage(lang)}
                    className={`flex items-center justify-between w-full px-3 py-2.5 text-sm rounded-lg transition-colors ${
                      active ? 'bg-gray-100 dark:bg-gray-700' : ''
                    } ${
                      language === lang ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30' : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-base">{languageNames[lang].flag}</span>
                      <span className="font-medium">{languageNames[lang].native}</span>
                    </div>
                    {language === lang && (
                      <CheckIcon className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                    )}
                  </button>
                )}
              </Menu.Item>
            ))}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
};

// Simple toggle button variant
export const LanguageToggle: React.FC = () => {
  const languageContext = useContext(LanguageContext);

  if (!languageContext) {
    return null;
  }

  const { language, toggleLanguage } = languageContext;

  return (
    <button
      onClick={toggleLanguage}
      className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
    >
      {language === 'ar' ? '🇺🇸 EN' : '🇸🇦 عربي'}
    </button>
  );
};

export default LanguageSwitch;
