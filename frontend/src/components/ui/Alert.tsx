import React from 'react';
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

type AlertVariant = 'success' | 'error' | 'warning' | 'info';

interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  message?: string;
  children?: React.ReactNode;
  onClose?: () => void;
  className?: string;
  showIcon?: boolean;
}

const variantStyles: Record<
  AlertVariant,
  {
    container: string;
    icon: string;
    title: string;
    message: string;
  }
> = {
  success: {
    container: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    icon: 'text-green-600 dark:text-green-400',
    title: 'text-green-800 dark:text-green-300',
    message: 'text-green-700 dark:text-green-400',
  },
  error: {
    container: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
    icon: 'text-red-600 dark:text-red-400',
    title: 'text-red-800 dark:text-red-300',
    message: 'text-red-700 dark:text-red-400',
  },
  warning: {
    container: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
    icon: 'text-yellow-600 dark:text-yellow-400',
    title: 'text-yellow-800 dark:text-yellow-300',
    message: 'text-yellow-700 dark:text-yellow-400',
  },
  info: {
    container: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
    icon: 'text-blue-600 dark:text-blue-400',
    title: 'text-blue-800 dark:text-blue-300',
    message: 'text-blue-700 dark:text-blue-400',
  },
};

const variantIcons: Record<AlertVariant, React.ElementType> = {
  success: CheckCircleIcon,
  error: ExclamationCircleIcon,
  warning: ExclamationTriangleIcon,
  info: InformationCircleIcon,
};

const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  title,
  message,
  children,
  onClose,
  className = '',
  showIcon = true,
}) => {
  const styles = variantStyles[variant];
  const Icon = variantIcons[variant];

  return (
    <div
      className={`rounded-lg border p-4 ${styles.container} ${className}`}
      role="alert"
    >
      <div className="flex">
        {showIcon && !children && (
          <div className="flex-shrink-0">
            <Icon className={`h-5 w-5 ${styles.icon}`} />
          </div>
        )}
        <div className={`${showIcon && !children ? 'ms-3' : ''} flex-1`}>
          {children ? (
            children
          ) : (
            <>
              {title && (
                <h3 className={`text-sm font-medium ${styles.title}`}>{title}</h3>
              )}
              {message && (
                <p className={`text-sm ${styles.message} ${title ? 'mt-1' : ''}`}>
                  {message}
                </p>
              )}
            </>
          )}
        </div>
        {onClose && (
          <div className="ms-auto ps-3">
            <button
              type="button"
              className={`inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 ${styles.icon} hover:bg-opacity-20 hover:bg-gray-500`}
              onClick={onClose}
            >
              <span className="sr-only">Dismiss</span>
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Toast notification component
interface ToastProps {
  variant?: AlertVariant;
  message: string;
  onClose: () => void;
  duration?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export const Toast: React.FC<ToastProps> = ({
  variant = 'info',
  message,
  onClose,
  duration = 5000,
  position = 'top-right',
}) => {
  React.useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const positionStyles = {
    'top-right': 'top-4 end-4',
    'top-left': 'top-4 start-4',
    'bottom-right': 'bottom-4 end-4',
    'bottom-left': 'bottom-4 start-4',
  };

  const styles = variantStyles[variant];
  const Icon = variantIcons[variant];

  return (
    <div
      className={`fixed ${positionStyles[position]} z-50 max-w-sm w-full shadow-lg rounded-lg border animate-slide-in ${styles.container}`}
    >
      <div className="flex items-center p-4">
        <Icon className={`h-5 w-5 flex-shrink-0 ${styles.icon}`} />
        <p className={`ms-3 text-sm font-medium ${styles.message}`}>{message}</p>
        <button
          type="button"
          className={`ms-auto -me-1 ps-3 inline-flex rounded-md p-1.5 focus:outline-none ${styles.icon} hover:bg-opacity-20 hover:bg-gray-500`}
          onClick={onClose}
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

// Banner alert (full-width)
interface BannerProps {
  variant?: AlertVariant;
  message: string;
  onClose?: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const Banner: React.FC<BannerProps> = ({
  variant = 'info',
  message,
  onClose,
  action,
}) => {
  const styles = variantStyles[variant];
  const Icon = variantIcons[variant];

  return (
    <div className={`${styles.container} border-b`}>
      <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center">
            <Icon className={`h-5 w-5 ${styles.icon}`} />
            <p className={`ms-3 text-sm font-medium ${styles.message}`}>
              {message}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {action && (
              <button
                type="button"
                className={`text-sm font-medium underline ${styles.title} hover:opacity-80`}
                onClick={action.onClick}
              >
                {action.label}
              </button>
            )}
            {onClose && (
              <button
                type="button"
                className={`p-1.5 rounded-md ${styles.icon} hover:bg-opacity-20 hover:bg-gray-500`}
                onClick={onClose}
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Alert;
