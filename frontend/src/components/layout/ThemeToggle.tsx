import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  SunIcon,
  MoonIcon,
  ComputerDesktopIcon,
} from '@heroicons/react/24/outline';
import { useTheme } from '../../contexts/ThemeContext';

interface ThemeToggleProps {
  variant?: 'icon' | 'dropdown';
  className?: string;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({
  variant = 'icon',
  className = '',
}) => {
  const { t } = useTranslation();
  const { theme, setTheme, isDark, toggleTheme } = useTheme();

  if (variant === 'icon') {
    return (
      <button
        onClick={toggleTheme}
        className={`p-2 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 ${className}`}
        aria-label={isDark ? t('theme.light') : t('theme.dark')}
        title={isDark ? t('theme.switchToLight') || 'Switch to light mode' : t('theme.switchToDark') || 'Switch to dark mode'}
      >
        {isDark ? (
          <SunIcon className="h-5 w-5 text-yellow-400" />
        ) : (
          <MoonIcon className="h-5 w-5 text-gray-600" />
        )}
      </button>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-sm text-gray-600 dark:text-gray-300">
        {t('theme.label') || 'Theme'}:
      </span>
      <div className="flex rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden">
        <button
          onClick={() => setTheme('light')}
          className={`px-3 py-1.5 flex items-center gap-1 text-sm transition-colors ${
            theme === 'light'
              ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
              : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
          title={t('theme.light') || 'Light'}
        >
          <SunIcon className="h-4 w-4" />
          <span className="hidden sm:inline">{t('theme.light') || 'Light'}</span>
        </button>
        <button
          onClick={() => setTheme('dark')}
          className={`px-3 py-1.5 flex items-center gap-1 text-sm transition-colors border-l border-r border-gray-200 dark:border-gray-600 ${
            theme === 'dark'
              ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
              : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
          title={t('theme.dark') || 'Dark'}
        >
          <MoonIcon className="h-4 w-4" />
          <span className="hidden sm:inline">{t('theme.dark') || 'Dark'}</span>
        </button>
        <button
          onClick={() => setTheme('system')}
          className={`px-3 py-1.5 flex items-center gap-1 text-sm transition-colors ${
            theme === 'system'
              ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
              : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
          title={t('theme.system') || 'System'}
        >
          <ComputerDesktopIcon className="h-4 w-4" />
          <span className="hidden sm:inline">{t('theme.system') || 'Auto'}</span>
        </button>
      </div>
    </div>
  );
};

export default ThemeToggle;
