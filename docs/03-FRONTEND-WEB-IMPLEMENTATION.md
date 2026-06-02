# SEAS Frontend Web Implementation Plan
## Student Verification & Exam Portal (RTL/Multi-language)

---

## Table of Contents

1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [Design System](#design-system)
4. [Phase 1: Foundation & Setup](#phase-1-foundation--setup)
5. [Phase 2: Authentication & Dashboard](#phase-2-authentication--dashboard)
6. [Phase 3: Verification Flow](#phase-3-verification-flow)
7. [Phase 4: Exam Interface](#phase-4-exam-interface)
8. [Phase 5: Monitoring Dashboard](#phase-5-monitoring-dashboard)
9. [Internationalization (i18n)](#internationalization-i18n)
10. [RTL Support](#rtl-support)

---

## Overview

The frontend web application provides:
- **Student Portal**: Login, face enrollment, exam access, submission
- **Teacher Portal**: Exam management, student monitoring, grading
- **Proctor Dashboard**: Real-time monitoring of active exams
- **RTL Support**: Full right-to-left layout for Arabic
- **Multi-language**: Arabic (default) and English

---

## Technology Stack

| Component | Technology | Version |
|-----------|------------|---------|
| Framework | React | 18.x |
| Language | TypeScript | 5.x |
| Build Tool | Vite | 5.x |
| Styling | Tailwind CSS | 3.x |
| UI Components | Headless UI + Radix | Latest |
| State Management | Zustand | 4.x |
| Server State | TanStack Query | 5.x |
| Forms | React Hook Form + Zod | Latest |
| i18n | react-i18next | 14.x |
| Routing | React Router | 6.x |
| Real-time | Socket.io Client | 4.x |
| Camera | WebRTC API | - |
| Icons | Lucide React | Latest |

---

## Design System

### Color Palette

```css
/* Primary - University Blue */
--primary-50: #eff6ff;
--primary-100: #dbeafe;
--primary-500: #3b82f6;
--primary-600: #2563eb;
--primary-700: #1d4ed8;

/* Success - Green */
--success-500: #22c55e;
--success-600: #16a34a;

/* Warning - Amber */
--warning-500: #f59e0b;
--warning-600: #d97706;

/* Error - Red */
--error-500: #ef4444;
--error-600: #dc2626;

/* Neutral */
--neutral-50: #f9fafb;
--neutral-100: #f3f4f6;
--neutral-200: #e5e7eb;
--neutral-700: #374151;
--neutral-800: #1f2937;
--neutral-900: #111827;
```

### Typography

```css
/* Arabic Font */
--font-arabic: 'Noto Sans Arabic', 'Cairo', sans-serif;

/* English Font */
--font-english: 'Inter', sans-serif;

/* Font Sizes */
--text-xs: 0.75rem;
--text-sm: 0.875rem;
--text-base: 1rem;
--text-lg: 1.125rem;
--text-xl: 1.25rem;
--text-2xl: 1.5rem;
--text-3xl: 1.875rem;
```

### Spacing & Layout

```css
/* RTL-aware spacing using logical properties */
.card {
  padding-inline-start: 1rem;  /* padding-left in LTR, padding-right in RTL */
  padding-inline-end: 1rem;
  margin-block: 1rem;
}
```

---

## Phase 1: Foundation & Setup

### Duration: Week 1

### Phase 1.1: Project Setup
**Duration: 2 days**

#### Task 1.1.1: Initialize React Project
```bash
# Create project with Vite
npm create vite@latest seas-frontend -- --template react-ts
cd seas-frontend

# Install core dependencies
npm install react-router-dom@6 zustand @tanstack/react-query
npm install tailwindcss postcss autoprefixer
npm install @headlessui/react @radix-ui/react-dialog @radix-ui/react-dropdown-menu
npm install react-hook-form @hookform/resolvers zod
npm install react-i18next i18next i18next-http-backend i18next-browser-languagedetector
npm install socket.io-client axios lucide-react
npm install clsx tailwind-merge class-variance-authority

# Dev dependencies
npm install -D @types/node prettier eslint-config-prettier
npx tailwindcss init -p
```

#### Task 1.1.2: Configure Tailwind with RTL
**File: `tailwind.config.js`**
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        arabic: ['Noto Sans Arabic', 'Cairo', 'sans-serif'],
        english: ['Inter', 'sans-serif'],
      },
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    // RTL plugin
    function ({ addUtilities }) {
      addUtilities({
        '.flip-rtl': {
          '[dir="rtl"] &': {
            transform: 'scaleX(-1)',
          },
        },
      });
    },
  ],
};
```

#### Task 1.1.3: Create Project Structure
```
src/
├── assets/
│   └── images/
├── components/
│   ├── ui/                    # Base UI components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   ├── Modal.tsx
│   │   └── ...
│   ├── layout/                # Layout components
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   ├── Footer.tsx
│   │   └── MainLayout.tsx
│   ├── auth/                  # Auth components
│   │   ├── LoginForm.tsx
│   │   └── ProtectedRoute.tsx
│   ├── verification/          # Verification components
│   │   ├── CameraSetup.tsx
│   │   ├── FaceEnrollment.tsx
│   │   ├── LivenessCheck.tsx
│   │   └── VerificationStatus.tsx
│   ├── exam/                  # Exam components
│   │   ├── ExamCard.tsx
│   │   ├── QuestionRenderer.tsx
│   │   ├── Timer.tsx
│   │   └── SubmissionDialog.tsx
│   └── monitoring/            # Monitoring components
│       ├── SessionCard.tsx
│       ├── AlertList.tsx
│       └── LiveFeed.tsx
├── pages/
│   ├── auth/
│   │   └── LoginPage.tsx
│   ├── student/
│   │   ├── DashboardPage.tsx
│   │   ├── EnrollmentPage.tsx
│   │   ├── ExamPage.tsx
│   │   └── ResultsPage.tsx
│   ├── teacher/
│   │   ├── DashboardPage.tsx
│   │   ├── ExamManagementPage.tsx
│   │   └── GradingPage.tsx
│   └── proctor/
│       └── MonitoringPage.tsx
├── hooks/
│   ├── useAuth.ts
│   ├── useCamera.ts
│   ├── useWebSocket.ts
│   └── useTranslation.ts
├── services/
│   ├── api/
│   │   ├── client.ts
│   │   ├── auth.ts
│   │   ├── students.ts
│   │   ├── exams.ts
│   │   └── verification.ts
│   └── socket/
│       └── monitoring.ts
├── stores/
│   ├── authStore.ts
│   ├── examStore.ts
│   └── verificationStore.ts
├── i18n/
│   ├── index.ts
│   └── locales/
│       ├── ar/
│       │   ├── common.json
│       │   ├── auth.json
│       │   ├── exam.json
│       │   └── verification.json
│       └── en/
│           ├── common.json
│           ├── auth.json
│           ├── exam.json
│           └── verification.json
├── types/
│   ├── api.ts
│   ├── auth.ts
│   ├── exam.ts
│   └── verification.ts
├── utils/
│   ├── cn.ts              # Class name utility
│   ├── date.ts
│   └── validation.ts
├── App.tsx
├── main.tsx
└── index.css
```

#### Task 1.1.4: Setup Base Configuration
**File: `src/utils/cn.ts`**
```typescript
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

**File: `src/index.css`**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;500;600;700&display=swap');

@layer base {
  :root {
    --font-arabic: 'Noto Sans Arabic', sans-serif;
    --font-english: 'Inter', sans-serif;
  }

  html {
    @apply antialiased;
  }

  html[dir='rtl'] {
    font-family: var(--font-arabic);
  }

  html[dir='ltr'] {
    font-family: var(--font-english);
  }

  /* RTL-aware scrollbar */
  html[dir='rtl'] ::-webkit-scrollbar {
    direction: ltr;
  }
}

@layer components {
  /* RTL-aware transitions */
  .slide-in-start {
    animation: slideInStart 0.3s ease-out;
  }

  @keyframes slideInStart {
    from {
      opacity: 0;
      transform: translateX(calc(-1rem * var(--direction, 1)));
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  html[dir='rtl'] {
    --direction: -1;
  }

  html[dir='ltr'] {
    --direction: 1;
  }
}
```

**Deliverables:**
- [ ] React project initialized with Vite
- [ ] Tailwind CSS configured with RTL support
- [ ] Project structure created
- [ ] Base utilities set up

---

### Phase 1.2: Base UI Components
**Duration: 3 days**

#### Task 1.2.1: Create Button Component
**File: `src/components/ui/Button.tsx`**
```typescript
import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';
import { Loader2 } from 'lucide-react';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-primary-600 text-white hover:bg-primary-700',
        secondary: 'bg-neutral-100 text-neutral-900 hover:bg-neutral-200',
        outline: 'border border-neutral-300 bg-transparent hover:bg-neutral-50',
        ghost: 'hover:bg-neutral-100',
        danger: 'bg-red-600 text-white hover:bg-red-700',
        success: 'bg-green-600 text-white hover:bg-green-700',
      },
      size: {
        sm: 'h-9 px-3 text-sm',
        md: 'h-10 px-4 text-sm',
        lg: 'h-11 px-6 text-base',
        xl: 'h-12 px-8 text-lg',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      isLoading,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <Loader2 className="me-2 h-4 w-4 animate-spin" />
        )}
        {!isLoading && leftIcon && (
          <span className="me-2">{leftIcon}</span>
        )}
        {children}
        {!isLoading && rightIcon && (
          <span className="ms-2">{rightIcon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants };
```

#### Task 1.2.2: Create Input Component
**File: `src/components/ui/Input.tsx`**
```typescript
import { forwardRef } from 'react';
import { cn } from '@/utils/cn';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, leftIcon, rightIcon, id, ...props }, ref) => {
    const inputId = id || props.name;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="mb-1.5 block text-sm font-medium text-neutral-700"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3 text-neutral-400">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={cn(
              'block w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-neutral-900 placeholder:text-neutral-400',
              'focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500',
              'disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:text-neutral-500',
              leftIcon && 'ps-10',
              rightIcon && 'pe-10',
              error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute inset-y-0 end-0 flex items-center pe-3 text-neutral-400">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p className="mt-1.5 text-sm text-red-600">{error}</p>
        )}
        {hint && !error && (
          <p className="mt-1.5 text-sm text-neutral-500">{hint}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };
```

#### Task 1.2.3: Create Card Component
**File: `src/components/ui/Card.tsx`**
```typescript
import { forwardRef } from 'react';
import { cn } from '@/utils/cn';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'outlined' | 'elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', padding = 'md', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-xl bg-white',
          {
            'border border-neutral-200': variant === 'default' || variant === 'outlined',
            'shadow-lg': variant === 'elevated',
          },
          {
            'p-0': padding === 'none',
            'p-4': padding === 'sm',
            'p-6': padding === 'md',
            'p-8': padding === 'lg',
          },
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

const CardHeader = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('mb-4 flex items-center justify-between', className)}
    {...props}
  />
));

CardHeader.displayName = 'CardHeader';

const CardTitle = forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn('text-lg font-semibold text-neutral-900', className)}
    {...props}
  />
));

CardTitle.displayName = 'CardTitle';

const CardContent = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('text-neutral-600', className)} {...props} />
));

CardContent.displayName = 'CardContent';

export { Card, CardHeader, CardTitle, CardContent };
```

#### Task 1.2.4: Create Modal Component
**File: `src/components/ui/Modal.tsx`**
```typescript
import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X } from 'lucide-react';
import { cn } from '@/utils/cn';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  children: React.ReactNode;
  showCloseButton?: boolean;
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-4xl',
};

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  size = 'md',
  children,
  showCloseButton = true,
}: ModalProps) {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel
                className={cn(
                  'w-full transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all',
                  sizeClasses[size]
                )}
              >
                {(title || showCloseButton) && (
                  <div className="mb-4 flex items-start justify-between">
                    <div>
                      {title && (
                        <Dialog.Title className="text-lg font-semibold text-neutral-900">
                          {title}
                        </Dialog.Title>
                      )}
                      {description && (
                        <Dialog.Description className="mt-1 text-sm text-neutral-500">
                          {description}
                        </Dialog.Description>
                      )}
                    </div>
                    {showCloseButton && (
                      <button
                        onClick={onClose}
                        className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                )}
                {children}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
```

**Deliverables:**
- [ ] Button component with variants
- [ ] Input component with validation states
- [ ] Card component with header/content
- [ ] Modal component with transitions
- [ ] Select, Checkbox, Radio components
- [ ] Alert/Toast component

---

## Phase 2: Authentication & Dashboard

### Duration: Week 2

### Phase 2.1: Authentication
**Duration: 2 days**

#### Task 2.1.1: Create Auth Store
**File: `src/stores/authStore.ts`**
```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi } from '@/services/api/auth';

interface User {
  id: string;
  email: string;
  role: 'STUDENT' | 'TEACHER' | 'ADMIN' | 'PROCTOR';
  student?: {
    id: string;
    studentNumber: string;
    nameAr: string;
    nameEn: string;
    faceEnrolledAt?: string;
  };
  teacher?: {
    id: string;
    nameAr: string;
    nameEn: string;
    department?: string;
  };
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.login({ email, password });
          set({
            user: response.user,
            accessToken: response.accessToken,
            refreshToken: response.refreshToken,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error: any) {
          set({
            error: error.message || 'Login failed',
            isLoading: false,
          });
          throw error;
        }
      },

      logout: async () => {
        try {
          const { accessToken } = get();
          if (accessToken) {
            await authApi.logout(accessToken);
          }
        } finally {
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
          });
        }
      },

      refreshAccessToken: async () => {
        const { refreshToken } = get();
        if (!refreshToken) throw new Error('No refresh token');

        try {
          const response = await authApi.refresh(refreshToken);
          set({ accessToken: response.accessToken });
        } catch (error) {
          // Refresh failed, logout
          get().logout();
          throw error;
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
```

#### Task 2.1.2: Create Login Page
**File: `src/pages/auth/LoginPage.tsx`**
```typescript
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';

import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';

const loginSchema = z.object({
  email: z.string().email('auth.errors.invalidEmail'),
  password: z.string().min(6, 'auth.errors.passwordTooShort'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginPage() {
  const { t } = useTranslation('auth');
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);

  const { login, isLoading, error, clearError } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data.email, data.password);
      const from = (location.state as any)?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    } catch (error) {
      // Error is handled in store
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 p-4">
      <div className="absolute end-4 top-4">
        <LanguageSwitcher />
      </div>

      <Card className="w-full max-w-md" padding="lg">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-100">
            <span className="text-2xl font-bold text-primary-600">SEAS</span>
          </div>
          <h1 className="text-2xl font-bold text-neutral-900">
            {t('login.title')}
          </h1>
          <p className="mt-2 text-neutral-500">
            {t('login.subtitle')}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-600">
            {t(`errors.${error}`, error)}
            <button
              onClick={clearError}
              className="ms-2 font-medium underline hover:no-underline"
            >
              {t('common.dismiss')}
            </button>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Input
            {...register('email')}
            type="email"
            label={t('login.email')}
            placeholder={t('login.emailPlaceholder')}
            error={errors.email && t(errors.email.message!)}
            leftIcon={<Mail className="h-5 w-5" />}
            autoComplete="email"
          />

          <Input
            {...register('password')}
            type={showPassword ? 'text' : 'password'}
            label={t('login.password')}
            placeholder={t('login.passwordPlaceholder')}
            error={errors.password && t(errors.password.message!)}
            leftIcon={<Lock className="h-5 w-5" />}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="focus:outline-none"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            }
            autoComplete="current-password"
          />

          <Button
            type="submit"
            className="w-full"
            size="lg"
            isLoading={isLoading}
          >
            {t('login.submit')}
          </Button>
        </form>

        {/* Footer */}
        <p className="mt-6 text-center text-sm text-neutral-500">
          {t('login.needHelp')}{' '}
          <a href="#" className="font-medium text-primary-600 hover:underline">
            {t('login.contactSupport')}
          </a>
        </p>
      </Card>
    </div>
  );
}
```

#### Task 2.1.3: Create Protected Route
**File: `src/components/auth/ProtectedRoute.tsx`**
```typescript
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('STUDENT' | 'TEACHER' | 'ADMIN' | 'PROCTOR')[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const location = useLocation();
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}
```

**Deliverables:**
- [ ] Auth store with Zustand
- [ ] Login page with form validation
- [ ] Protected route component
- [ ] Token refresh mechanism

---

### Phase 2.2: Student Dashboard
**Duration: 3 days**

#### Task 2.2.1: Create Dashboard Layout
**File: `src/components/layout/MainLayout.tsx`**
```typescript
import { Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

export function MainLayout() {
  const { i18n } = useTranslation();

  return (
    <div
      dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}
      className="flex min-h-screen bg-neutral-50"
    >
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Header />
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
```

#### Task 2.2.2: Create Student Dashboard
**File: `src/pages/student/DashboardPage.tsx`**
```typescript
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import {
  BookOpen,
  CheckCircle,
  Clock,
  AlertCircle,
  Trophy,
} from 'lucide-react';

import { useAuthStore } from '@/stores/authStore';
import { studentsApi } from '@/services/api/students';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { ExamCard } from '@/components/exam/ExamCard';
import { VerificationStatus } from '@/components/verification/VerificationStatus';

export function StudentDashboardPage() {
  const { t, i18n } = useTranslation(['dashboard', 'common']);
  const { user } = useAuthStore();
  const isRtl = i18n.language === 'ar';

  const studentId = user?.student?.id;

  const { data: exams, isLoading: examsLoading } = useQuery({
    queryKey: ['student-exams', studentId],
    queryFn: () => studentsApi.getExams(studentId!),
    enabled: !!studentId,
  });

  const { data: grades } = useQuery({
    queryKey: ['student-grades', studentId],
    queryFn: () => studentsApi.getGrades(studentId!),
    enabled: !!studentId,
  });

  // Separate exams by status
  const upcomingExams = exams?.filter((e) =>
    new Date(e.startTime) > new Date() && e.attempts.length === 0
  ) || [];

  const activeExams = exams?.filter((e) => {
    const now = new Date();
    return (
      new Date(e.startTime) <= now &&
      new Date(e.endTime) >= now &&
      (!e.attempts[0] || e.attempts[0].status === 'IN_PROGRESS')
    );
  }) || [];

  const completedExams = exams?.filter((e) =>
    e.attempts[0]?.status === 'GRADED'
  ) || [];

  // Stats
  const stats = [
    {
      label: t('dashboard:stats.totalExams'),
      value: exams?.length || 0,
      icon: BookOpen,
      color: 'text-blue-600 bg-blue-100',
    },
    {
      label: t('dashboard:stats.completed'),
      value: completedExams.length,
      icon: CheckCircle,
      color: 'text-green-600 bg-green-100',
    },
    {
      label: t('dashboard:stats.upcoming'),
      value: upcomingExams.length,
      icon: Clock,
      color: 'text-amber-600 bg-amber-100',
    },
    {
      label: t('dashboard:stats.averageScore'),
      value: grades?.length
        ? `${Math.round(grades.reduce((acc, g) => acc + (g.totalScore / g.totalPoints) * 100, 0) / grades.length)}%`
        : '-',
      icon: Trophy,
      color: 'text-purple-600 bg-purple-100',
    },
  ];

  const studentName = isRtl ? user?.student?.nameAr : user?.student?.nameEn;

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">
            {t('dashboard:welcome', { name: studentName })}
          </h1>
          <p className="mt-1 text-neutral-500">
            {t('dashboard:welcomeSubtitle')}
          </p>
        </div>
        <VerificationStatus
          isEnrolled={!!user?.student?.faceEnrolledAt}
        />
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <div className="flex items-center gap-4">
              <div className={`rounded-lg p-3 ${stat.color}`}>
                <stat.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-neutral-500">{stat.label}</p>
                <p className="text-2xl font-semibold text-neutral-900">
                  {stat.value}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Active Exams Alert */}
      {activeExams.length > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            <div>
              <h3 className="font-medium text-amber-800">
                {t('dashboard:activeExams.title')}
              </h3>
              <p className="mt-1 text-sm text-amber-700">
                {t('dashboard:activeExams.description', {
                  count: activeExams.length,
                })}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Exams Sections */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming Exams */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-600" />
              {t('dashboard:sections.upcoming')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingExams.length === 0 ? (
              <p className="text-center text-neutral-500">
                {t('dashboard:noUpcomingExams')}
              </p>
            ) : (
              <div className="space-y-3">
                {upcomingExams.slice(0, 3).map((exam) => (
                  <ExamCard key={exam.id} exam={exam} variant="compact" />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              {t('dashboard:sections.recentResults')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {completedExams.length === 0 ? (
              <p className="text-center text-neutral-500">
                {t('dashboard:noCompletedExams')}
              </p>
            ) : (
              <div className="space-y-3">
                {completedExams.slice(0, 3).map((exam) => (
                  <ExamCard
                    key={exam.id}
                    exam={exam}
                    variant="compact"
                    showScore
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

**Deliverables:**
- [ ] Main layout with sidebar
- [ ] Student dashboard with stats
- [ ] Exam cards component
- [ ] Verification status indicator

---

## Phase 3: Verification Flow

### Duration: Week 3-4

### Phase 3.1: Camera Integration
**Duration: 2 days**

#### Task 3.1.1: Create Camera Hook
**File: `src/hooks/useCamera.ts`**
```typescript
import { useState, useRef, useCallback, useEffect } from 'react';

interface UseCameraOptions {
  width?: number;
  height?: number;
  facingMode?: 'user' | 'environment';
}

interface CameraState {
  isInitialized: boolean;
  isActive: boolean;
  error: string | null;
  stream: MediaStream | null;
}

export function useCamera(options: UseCameraOptions = {}) {
  const { width = 1280, height = 720, facingMode = 'user' } = options;

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [state, setState] = useState<CameraState>({
    isInitialized: false,
    isActive: false,
    error: null,
    stream: null,
  });

  const startCamera = useCallback(async () => {
    try {
      const constraints: MediaStreamConstraints = {
        video: {
          width: { ideal: width },
          height: { ideal: height },
          facingMode,
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setState({
        isInitialized: true,
        isActive: true,
        error: null,
        stream,
      });
    } catch (error: any) {
      let errorMessage = 'Failed to access camera';

      if (error.name === 'NotAllowedError') {
        errorMessage = 'Camera access denied. Please allow camera access.';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No camera found on this device.';
      } else if (error.name === 'NotReadableError') {
        errorMessage = 'Camera is in use by another application.';
      }

      setState({
        isInitialized: false,
        isActive: false,
        error: errorMessage,
        stream: null,
      });
    }
  }, [width, height, facingMode]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setState((prev) => ({
      ...prev,
      isActive: false,
      stream: null,
    }));
  }, []);

  const captureFrame = useCallback((): string | null => {
    if (!videoRef.current || !canvasRef.current) return null;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Mirror the image for user-facing camera
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0);

    return canvas.toDataURL('image/jpeg', 0.9);
  }, [facingMode]);

  const captureFrameAsBlob = useCallback(async (): Promise<Blob | null> => {
    if (!videoRef.current || !canvasRef.current) return null;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0);

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.9);
    });
  }, [facingMode]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return {
    videoRef,
    canvasRef,
    ...state,
    startCamera,
    stopCamera,
    captureFrame,
    captureFrameAsBlob,
  };
}
```

#### Task 3.1.2: Create Camera Setup Component
**File: `src/components/verification/CameraSetup.tsx`**
```typescript
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Camera, CheckCircle, AlertCircle, Sun, RefreshCw } from 'lucide-react';

import { useCamera } from '@/hooks/useCamera';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { cn } from '@/utils/cn';

interface CameraSetupProps {
  onReady: () => void;
}

export function CameraSetup({ onReady }: CameraSetupProps) {
  const { t } = useTranslation('verification');
  const {
    videoRef,
    canvasRef,
    isInitialized,
    isActive,
    error,
    startCamera,
    stopCamera,
  } = useCamera();

  const [lightingQuality, setLightingQuality] = useState<'good' | 'poor' | 'checking'>('checking');

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  // Check lighting quality periodically
  useEffect(() => {
    if (!isActive) return;

    const checkLighting = () => {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');

      if (!video) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(video, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Calculate average brightness
      let totalBrightness = 0;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        totalBrightness += (r + g + b) / 3;
      }

      const avgBrightness = totalBrightness / (data.length / 4);

      // Good lighting is between 80 and 200 (on 0-255 scale)
      setLightingQuality(
        avgBrightness >= 80 && avgBrightness <= 200 ? 'good' : 'poor'
      );
    };

    const interval = setInterval(checkLighting, 2000);
    return () => clearInterval(interval);
  }, [isActive, videoRef]);

  const isReady = isActive && lightingQuality === 'good';

  return (
    <Card className="mx-auto max-w-2xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-100">
            <Camera className="h-6 w-6 text-primary-600" />
          </div>
          <h2 className="text-xl font-semibold text-neutral-900">
            {t('cameraSetup.title')}
          </h2>
          <p className="mt-2 text-neutral-500">
            {t('cameraSetup.description')}
          </p>
        </div>

        {/* Camera Preview */}
        <div className="relative aspect-video overflow-hidden rounded-xl bg-neutral-900">
          {error ? (
            <div className="flex h-full flex-col items-center justify-center p-6 text-center">
              <AlertCircle className="mb-4 h-12 w-12 text-red-500" />
              <p className="text-white">{error}</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={startCamera}
                leftIcon={<RefreshCw className="h-4 w-4" />}
              >
                {t('cameraSetup.retry')}
              </Button>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="h-full w-full object-cover"
                style={{ transform: 'scaleX(-1)' }} // Mirror
              />
              <canvas ref={canvasRef} className="hidden" />

              {/* Face Guide Overlay */}
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="h-48 w-48 rounded-full border-4 border-white/50 border-dashed" />
              </div>
            </>
          )}
        </div>

        {/* Status Indicators */}
        <div className="grid gap-3 sm:grid-cols-2">
          {/* Camera Status */}
          <div
            className={cn(
              'flex items-center gap-3 rounded-lg p-3',
              isActive ? 'bg-green-50' : 'bg-neutral-100'
            )}
          >
            {isActive ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <AlertCircle className="h-5 w-5 text-neutral-400" />
            )}
            <span
              className={cn(
                'text-sm font-medium',
                isActive ? 'text-green-700' : 'text-neutral-500'
              )}
            >
              {isActive
                ? t('cameraSetup.cameraReady')
                : t('cameraSetup.cameraNotReady')}
            </span>
          </div>

          {/* Lighting Status */}
          <div
            className={cn(
              'flex items-center gap-3 rounded-lg p-3',
              lightingQuality === 'good'
                ? 'bg-green-50'
                : lightingQuality === 'poor'
                ? 'bg-amber-50'
                : 'bg-neutral-100'
            )}
          >
            <Sun
              className={cn(
                'h-5 w-5',
                lightingQuality === 'good'
                  ? 'text-green-600'
                  : lightingQuality === 'poor'
                  ? 'text-amber-600'
                  : 'text-neutral-400'
              )}
            />
            <span
              className={cn(
                'text-sm font-medium',
                lightingQuality === 'good'
                  ? 'text-green-700'
                  : lightingQuality === 'poor'
                  ? 'text-amber-700'
                  : 'text-neutral-500'
              )}
            >
              {lightingQuality === 'good'
                ? t('cameraSetup.lightingGood')
                : lightingQuality === 'poor'
                ? t('cameraSetup.lightingPoor')
                : t('cameraSetup.checkingLighting')}
            </span>
          </div>
        </div>

        {/* Instructions */}
        <ul className="space-y-2 text-sm text-neutral-600">
          <li className="flex items-start gap-2">
            <span className="mt-1 block h-1.5 w-1.5 rounded-full bg-neutral-400" />
            {t('cameraSetup.instruction1')}
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 block h-1.5 w-1.5 rounded-full bg-neutral-400" />
            {t('cameraSetup.instruction2')}
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 block h-1.5 w-1.5 rounded-full bg-neutral-400" />
            {t('cameraSetup.instruction3')}
          </li>
        </ul>

        {/* Continue Button */}
        <Button
          onClick={onReady}
          disabled={!isReady}
          className="w-full"
          size="lg"
        >
          {t('cameraSetup.continue')}
        </Button>
      </div>
    </Card>
  );
}
```

**Deliverables:**
- [ ] Camera hook with capture functions
- [ ] Camera setup component
- [ ] Lighting quality detection
- [ ] Face guide overlay

---

### Phase 3.2: Face Enrollment
**Duration: 3 days**

#### Task 3.2.1: Create Face Enrollment Component
**File: `src/components/verification/FaceEnrollment.tsx`**
```typescript
import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import {
  Camera,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';

import { useCamera } from '@/hooks/useCamera';
import { verificationApi } from '@/services/api/verification';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { cn } from '@/utils/cn';

interface FaceEnrollmentProps {
  studentId: string;
  onComplete: () => void;
  onBack: () => void;
}

type Pose = 'front' | 'left' | 'right' | 'up' | 'down';

const POSES: Pose[] = ['front', 'left', 'right', 'up', 'down'];

const POSE_INSTRUCTIONS = {
  front: 'Look straight at the camera',
  left: 'Turn your head slightly to the LEFT',
  right: 'Turn your head slightly to the RIGHT',
  up: 'Tilt your head slightly UP',
  down: 'Tilt your head slightly DOWN',
};

export function FaceEnrollment({
  studentId,
  onComplete,
  onBack,
}: FaceEnrollmentProps) {
  const { t, i18n } = useTranslation('verification');
  const isRtl = i18n.language === 'ar';

  const { videoRef, canvasRef, isActive, captureFrame } = useCamera();

  const [currentPoseIndex, setCurrentPoseIndex] = useState(0);
  const [capturedImages, setCapturedImages] = useState<Record<Pose, string | null>>({
    front: null,
    left: null,
    right: null,
    up: null,
    down: null,
  });
  const [isCapturing, setIsCapturing] = useState(false);

  const currentPose = POSES[currentPoseIndex];
  const isLastPose = currentPoseIndex === POSES.length - 1;
  const allCaptured = POSES.every((pose) => capturedImages[pose] !== null);

  // Capture mutation
  const captureMutation = useMutation({
    mutationFn: async ({ pose, image }: { pose: Pose; image: string }) => {
      // Extract base64 data
      const base64 = image.split(',')[1];
      return verificationApi.captureEnrollment({
        studentId,
        pose,
        image: base64,
      });
    },
    onSuccess: (data, { pose, image }) => {
      if (data.success) {
        setCapturedImages((prev) => ({ ...prev, [pose]: image }));
        if (!isLastPose) {
          setCurrentPoseIndex((prev) => prev + 1);
        }
      }
    },
  });

  // Complete enrollment mutation
  const completeMutation = useMutation({
    mutationFn: async () => {
      const images = POSES.map((pose) => {
        const dataUrl = capturedImages[pose]!;
        return dataUrl.split(',')[1];
      });
      return verificationApi.completeEnrollment({ studentId, images });
    },
    onSuccess: () => {
      onComplete();
    },
  });

  const handleCapture = useCallback(() => {
    if (isCapturing) return;

    setIsCapturing(true);

    // Countdown effect
    setTimeout(() => {
      const frame = captureFrame();
      if (frame) {
        captureMutation.mutate({ pose: currentPose, image: frame });
      }
      setIsCapturing(false);
    }, 500);
  }, [captureFrame, currentPose, captureMutation, isCapturing]);

  const handleRetake = (pose: Pose) => {
    setCapturedImages((prev) => ({ ...prev, [pose]: null }));
    setCurrentPoseIndex(POSES.indexOf(pose));
  };

  const handleComplete = () => {
    if (allCaptured) {
      completeMutation.mutate();
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={onBack}
          leftIcon={isRtl ? <ChevronRight /> : <ChevronLeft />}
        >
          {t('common:back')}
        </Button>
        <div className="text-center">
          <h2 className="text-xl font-semibold text-neutral-900">
            {t('enrollment.title')}
          </h2>
          <p className="text-sm text-neutral-500">
            {t('enrollment.step', {
              current: currentPoseIndex + 1,
              total: POSES.length,
            })}
          </p>
        </div>
        <div className="w-24" /> {/* Spacer */}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Camera Preview */}
        <div className="lg:col-span-2">
          <Card padding="none" className="overflow-hidden">
            <div className="relative aspect-video bg-neutral-900">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="h-full w-full object-cover"
                style={{ transform: 'scaleX(-1)' }}
              />
              <canvas ref={canvasRef} className="hidden" />

              {/* Pose Guide */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div
                  className={cn(
                    'h-64 w-48 rounded-full border-4 transition-all',
                    isCapturing
                      ? 'border-green-500 bg-green-500/20'
                      : 'border-white/50 border-dashed'
                  )}
                />
              </div>

              {/* Pose Instruction */}
              <div className="absolute bottom-4 inset-x-4">
                <div className="rounded-lg bg-black/70 px-4 py-3 text-center">
                  <p className="text-lg font-medium text-white">
                    {t(`enrollment.poses.${currentPose}`)}
                  </p>
                </div>
              </div>
            </div>

            {/* Capture Button */}
            <div className="p-4">
              <Button
                onClick={handleCapture}
                disabled={!isActive || isCapturing || captureMutation.isPending}
                isLoading={captureMutation.isPending}
                className="w-full"
                size="lg"
                leftIcon={<Camera className="h-5 w-5" />}
              >
                {isCapturing
                  ? t('enrollment.capturing')
                  : t('enrollment.capture')}
              </Button>
            </div>
          </Card>
        </div>

        {/* Captured Images */}
        <div>
          <Card>
            <h3 className="mb-4 font-medium text-neutral-900">
              {t('enrollment.capturedImages')}
            </h3>
            <div className="space-y-3">
              {POSES.map((pose, index) => (
                <div
                  key={pose}
                  className={cn(
                    'flex items-center gap-3 rounded-lg border p-2',
                    currentPoseIndex === index
                      ? 'border-primary-500 bg-primary-50'
                      : capturedImages[pose]
                      ? 'border-green-200 bg-green-50'
                      : 'border-neutral-200'
                  )}
                >
                  {/* Thumbnail */}
                  <div className="h-12 w-12 overflow-hidden rounded-lg bg-neutral-200">
                    {capturedImages[pose] ? (
                      <img
                        src={capturedImages[pose]!}
                        alt={pose}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-neutral-400">
                        <Camera className="h-5 w-5" />
                      </div>
                    )}
                  </div>

                  {/* Pose Label */}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-neutral-900">
                      {t(`enrollment.poses.${pose}`)}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {capturedImages[pose]
                        ? t('enrollment.captured')
                        : t('enrollment.notCaptured')}
                    </p>
                  </div>

                  {/* Status/Action */}
                  {capturedImages[pose] ? (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRetake(pose)}
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : currentPoseIndex === index ? (
                    <span className="text-xs font-medium text-primary-600">
                      {t('enrollment.current')}
                    </span>
                  ) : null}
                </div>
              ))}
            </div>

            {/* Complete Button */}
            <Button
              onClick={handleComplete}
              disabled={!allCaptured || completeMutation.isPending}
              isLoading={completeMutation.isPending}
              className="mt-4 w-full"
              variant={allCaptured ? 'success' : 'secondary'}
            >
              {t('enrollment.complete')}
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
```

**Deliverables:**
- [ ] Face enrollment flow (5 poses)
- [ ] Real-time capture feedback
- [ ] Progress tracking
- [ ] Retake functionality

---

### Phase 3.3: Liveness Check
**Duration: 2 days**

#### Task 3.3.1: Create Liveness Check Component
**File: `src/components/verification/LivenessCheck.tsx`**
```typescript
import { useEffect, useRef, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import {
  Eye,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  CheckCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';

import { useCamera } from '@/hooks/useCamera';
import { verificationApi } from '@/services/api/verification';
import { Card } from '@/components/ui/Card';
import { cn } from '@/utils/cn';

interface LivenessCheckProps {
  attemptId: string;
  onComplete: () => void;
  onFail: (reason: string) => void;
}

type LivenessStep = 'blink' | 'head_pose' | 'anti_spoof' | 'complete' | 'failed';

const STEP_ICONS = {
  blink: Eye,
  look_left: ArrowLeft,
  look_right: ArrowRight,
  look_up: ArrowUp,
  look_down: ArrowDown,
};

export function LivenessCheck({
  attemptId,
  onComplete,
  onFail,
}: LivenessCheckProps) {
  const { t } = useTranslation('verification');

  const { videoRef, canvasRef, isActive, captureFrame } = useCamera();
  const frameIntervalRef = useRef<number | null>(null);

  const [currentStep, setCurrentStep] = useState<LivenessStep>('blink');
  const [instruction, setInstruction] = useState('');
  const [blinkCount, setBlinkCount] = useState(0);
  const [completedPoses, setCompletedPoses] = useState<string[]>([]);
  const [retryCount, setRetryCount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  // Process frame mutation
  const processFrameMutation = useMutation({
    mutationFn: async (imageBase64: string) => {
      return verificationApi.processLivenessFrame({
        attemptId,
        image: imageBase64,
      });
    },
    onSuccess: (data) => {
      setCurrentStep(data.currentStep);
      setInstruction(data.instruction || '');
      setBlinkCount(data.blinkCount);
      setCompletedPoses(data.completedPoses || []);
      setRetryCount(data.retryCount);

      if (data.currentStep === 'complete') {
        if (frameIntervalRef.current) {
          clearInterval(frameIntervalRef.current);
        }
        onComplete();
      } else if (data.currentStep === 'failed') {
        if (frameIntervalRef.current) {
          clearInterval(frameIntervalRef.current);
        }
        onFail(data.failureReason || 'Liveness check failed');
      }
    },
  });

  // Start processing frames
  useEffect(() => {
    if (!isActive) return;

    frameIntervalRef.current = window.setInterval(() => {
      if (isProcessing || processFrameMutation.isPending) return;

      const frame = captureFrame();
      if (frame) {
        const base64 = frame.split(',')[1];
        processFrameMutation.mutate(base64);
      }
    }, 100); // Process at ~10 FPS

    return () => {
      if (frameIntervalRef.current) {
        clearInterval(frameIntervalRef.current);
      }
    };
  }, [isActive, captureFrame, processFrameMutation]);

  // Get step status
  const getStepStatus = (step: string) => {
    if (currentStep === 'complete') return 'complete';
    if (step === 'blink') {
      return blinkCount >= 1 ? 'complete' : currentStep === 'blink' ? 'active' : 'pending';
    }
    if (completedPoses.includes(step)) return 'complete';
    if (currentStep === 'head_pose' && instruction.toLowerCase().includes(step.replace('look_', ''))) {
      return 'active';
    }
    return 'pending';
  };

  const steps = [
    { id: 'blink', label: t('liveness.steps.blink') },
    { id: 'look_left', label: t('liveness.steps.lookLeft') },
    { id: 'look_right', label: t('liveness.steps.lookRight') },
  ];

  return (
    <Card className="mx-auto max-w-2xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-xl font-semibold text-neutral-900">
            {t('liveness.title')}
          </h2>
          <p className="mt-2 text-neutral-500">
            {t('liveness.description')}
          </p>
        </div>

        {/* Camera Preview with Instruction */}
        <div className="relative aspect-video overflow-hidden rounded-xl bg-neutral-900">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="h-full w-full object-cover"
            style={{ transform: 'scaleX(-1)' }}
          />
          <canvas ref={canvasRef} className="hidden" />

          {/* Face Guide */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className={cn(
                'h-64 w-48 rounded-full border-4 transition-all',
                currentStep === 'complete'
                  ? 'border-green-500 bg-green-500/20'
                  : 'border-primary-500 border-dashed animate-pulse'
              )}
            />
          </div>

          {/* Instruction Overlay */}
          <div className="absolute bottom-4 inset-x-4">
            <div className="rounded-lg bg-black/80 px-4 py-3 text-center">
              {currentStep === 'complete' ? (
                <div className="flex items-center justify-center gap-2 text-green-400">
                  <CheckCircle className="h-5 w-5" />
                  <span className="text-lg font-medium">
                    {t('liveness.success')}
                  </span>
                </div>
              ) : currentStep === 'failed' ? (
                <div className="flex items-center justify-center gap-2 text-red-400">
                  <AlertCircle className="h-5 w-5" />
                  <span className="text-lg font-medium">
                    {t('liveness.failed')}
                  </span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-3 text-white">
                  {processFrameMutation.isPending && (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  )}
                  <span className="text-lg font-medium">
                    {instruction || t('liveness.preparing')}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center gap-4">
          {steps.map((step) => {
            const status = getStepStatus(step.id);
            const Icon = STEP_ICONS[step.id as keyof typeof STEP_ICONS] || Eye;

            return (
              <div
                key={step.id}
                className={cn(
                  'flex flex-col items-center gap-2',
                  status === 'active' && 'text-primary-600',
                  status === 'complete' && 'text-green-600',
                  status === 'pending' && 'text-neutral-300'
                )}
              >
                <div
                  className={cn(
                    'flex h-12 w-12 items-center justify-center rounded-full',
                    status === 'active' && 'bg-primary-100',
                    status === 'complete' && 'bg-green-100',
                    status === 'pending' && 'bg-neutral-100'
                  )}
                >
                  {status === 'complete' ? (
                    <CheckCircle className="h-6 w-6" />
                  ) : (
                    <Icon className="h-6 w-6" />
                  )}
                </div>
                <span className="text-xs font-medium">{step.label}</span>
              </div>
            );
          })}
        </div>

        {/* Retry Info */}
        {retryCount > 0 && (
          <div className="rounded-lg bg-amber-50 p-3 text-center text-sm text-amber-700">
            {t('liveness.retryInfo', { count: retryCount, max: 3 })}
          </div>
        )}
      </div>
    </Card>
  );
}
```

**Deliverables:**
- [ ] Liveness check UI with steps
- [ ] Real-time frame processing
- [ ] Progress indicators
- [ ] Retry handling

---

## Phase 4: Exam Interface

### Duration: Week 5-6

### Phase 4.1: Exam Page
**Duration: 3 days**

#### Task 4.1.1: Create Exam Timer
**File: `src/components/exam/Timer.tsx`**
```typescript
import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Clock, AlertTriangle } from 'lucide-react';
import { cn } from '@/utils/cn';

interface TimerProps {
  initialSeconds: number;
  onTimeUp: () => void;
  warningThreshold?: number; // seconds
}

export function Timer({
  initialSeconds,
  onTimeUp,
  warningThreshold = 300, // 5 minutes
}: TimerProps) {
  const { t } = useTranslation('exam');
  const [seconds, setSeconds] = useState(initialSeconds);

  useEffect(() => {
    if (seconds <= 0) {
      onTimeUp();
      return;
    }

    const interval = setInterval(() => {
      setSeconds((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [seconds, onTimeUp]);

  const formatTime = useCallback((totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const isWarning = seconds <= warningThreshold && seconds > 60;
  const isCritical = seconds <= 60;

  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-lg px-4 py-2 font-mono text-lg font-semibold',
        isCritical
          ? 'animate-pulse bg-red-100 text-red-700'
          : isWarning
          ? 'bg-amber-100 text-amber-700'
          : 'bg-neutral-100 text-neutral-700'
      )}
    >
      {isCritical ? (
        <AlertTriangle className="h-5 w-5" />
      ) : (
        <Clock className="h-5 w-5" />
      )}
      <span>{formatTime(seconds)}</span>
    </div>
  );
}
```

#### Task 4.1.2: Create Question Renderer
**File: `src/components/exam/QuestionRenderer.tsx`**
```typescript
import { useTranslation } from 'react-i18next';
import { cn } from '@/utils/cn';

interface Question {
  id: string;
  type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER' | 'ESSAY';
  textAr: string;
  textEn: string;
  options?: Array<{
    id: string;
    textAr: string;
    textEn: string;
  }>;
  points: number;
}

interface QuestionRendererProps {
  question: Question;
  questionNumber: number;
  answer: any;
  onAnswerChange: (answer: any) => void;
  isSubmitted?: boolean;
}

export function QuestionRenderer({
  question,
  questionNumber,
  answer,
  onAnswerChange,
  isSubmitted,
}: QuestionRendererProps) {
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  const questionText = isRtl ? question.textAr : question.textEn;

  const renderInput = () => {
    switch (question.type) {
      case 'MULTIPLE_CHOICE':
        return (
          <div className="space-y-3">
            {question.options?.map((option) => (
              <label
                key={option.id}
                className={cn(
                  'flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors',
                  answer === option.id
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-neutral-200 hover:bg-neutral-50',
                  isSubmitted && 'cursor-not-allowed opacity-60'
                )}
              >
                <input
                  type="radio"
                  name={`question-${question.id}`}
                  value={option.id}
                  checked={answer === option.id}
                  onChange={() => onAnswerChange(option.id)}
                  disabled={isSubmitted}
                  className="h-4 w-4 text-primary-600"
                />
                <span className="text-neutral-700">
                  {isRtl ? option.textAr : option.textEn}
                </span>
              </label>
            ))}
          </div>
        );

      case 'TRUE_FALSE':
        return (
          <div className="flex gap-4">
            {['true', 'false'].map((value) => (
              <label
                key={value}
                className={cn(
                  'flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border p-4 transition-colors',
                  answer === value
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-neutral-200 hover:bg-neutral-50',
                  isSubmitted && 'cursor-not-allowed opacity-60'
                )}
              >
                <input
                  type="radio"
                  name={`question-${question.id}`}
                  value={value}
                  checked={answer === value}
                  onChange={() => onAnswerChange(value)}
                  disabled={isSubmitted}
                  className="h-4 w-4 text-primary-600"
                />
                <span className="font-medium text-neutral-700">
                  {value === 'true' ? 'صحيح / True' : 'خطأ / False'}
                </span>
              </label>
            ))}
          </div>
        );

      case 'SHORT_ANSWER':
        return (
          <input
            type="text"
            value={answer || ''}
            onChange={(e) => onAnswerChange(e.target.value)}
            disabled={isSubmitted}
            className={cn(
              'w-full rounded-lg border border-neutral-300 px-4 py-3',
              'focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500',
              isSubmitted && 'cursor-not-allowed opacity-60'
            )}
            placeholder={isRtl ? 'اكتب إجابتك هنا...' : 'Type your answer here...'}
          />
        );

      case 'ESSAY':
        return (
          <textarea
            value={answer || ''}
            onChange={(e) => onAnswerChange(e.target.value)}
            disabled={isSubmitted}
            rows={6}
            className={cn(
              'w-full rounded-lg border border-neutral-300 px-4 py-3',
              'focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500',
              isSubmitted && 'cursor-not-allowed opacity-60'
            )}
            placeholder={isRtl ? 'اكتب إجابتك هنا...' : 'Type your answer here...'}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-6">
      {/* Question Header */}
      <div className="mb-4 flex items-start justify-between">
        <h3 className="text-lg font-medium text-neutral-900">
          <span className="text-primary-600">{questionNumber}.</span>{' '}
          {questionText}
        </h3>
        <span className="rounded-full bg-primary-100 px-3 py-1 text-sm font-medium text-primary-700">
          {question.points} {isRtl ? 'نقطة' : 'pts'}
        </span>
      </div>

      {/* Answer Input */}
      <div className="mt-4">{renderInput()}</div>
    </div>
  );
}
```

#### Task 4.1.3: Create Exam Page
**File: `src/pages/student/ExamPage.tsx`**
```typescript
import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ChevronLeft,
  ChevronRight,
  Send,
  AlertTriangle,
  Shield,
} from 'lucide-react';

import { useAuthStore } from '@/stores/authStore';
import { examsApi } from '@/services/api/exams';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Timer } from '@/components/exam/Timer';
import { QuestionRenderer } from '@/components/exam/QuestionRenderer';
import { VerificationStatus } from '@/components/verification/VerificationStatus';
import { cn } from '@/utils/cn';

export function ExamPage() {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation(['exam', 'common']);
  const queryClient = useQueryClient();
  const isRtl = i18n.language === 'ar';

  const { user } = useAuthStore();
  const studentId = user?.student?.id;

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const autoSaveRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch exam data
  const { data: examData, isLoading } = useQuery({
    queryKey: ['exam-attempt', examId, studentId],
    queryFn: () => examsApi.startExam(examId!, studentId!),
    enabled: !!examId && !!studentId,
    refetchOnWindowFocus: false,
  });

  const { attempt, questions, timeRemaining } = examData || {};

  // Save answer mutation
  const saveAnswerMutation = useMutation({
    mutationFn: (data: { questionId: string; answer: any }) =>
      examsApi.saveAnswer(attempt!.id, data),
  });

  // Submit exam mutation
  const submitMutation = useMutation({
    mutationFn: () => examsApi.submitExam(attempt!.id),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['student-exams'] });
      navigate(`/exam/${examId}/result`, { state: { result } });
    },
  });

  // Auto-save every 15 seconds
  useEffect(() => {
    if (!attempt) return;

    autoSaveRef.current = setInterval(() => {
      // Save all unsaved answers
      Object.entries(answers).forEach(([questionId, answer]) => {
        saveAnswerMutation.mutate({ questionId, answer });
      });
    }, 15000);

    return () => {
      if (autoSaveRef.current) {
        clearInterval(autoSaveRef.current);
      }
    };
  }, [attempt, answers]);

  const handleAnswerChange = useCallback((questionId: string, answer: any) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));

    // Debounced save
    saveAnswerMutation.mutate({ questionId, answer });
  }, [saveAnswerMutation]);

  const handleTimeUp = useCallback(() => {
    // Auto-submit when time is up
    submitMutation.mutate();
  }, [submitMutation]);

  const handleSubmit = () => {
    setShowSubmitModal(true);
  };

  const confirmSubmit = () => {
    submitMutation.mutate();
  };

  if (isLoading || !questions) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const answeredCount = Object.keys(answers).length;
  const totalQuestions = questions.length;

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Top Bar */}
      <div className="sticky top-0 z-10 border-b border-neutral-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          {/* Timer */}
          <Timer
            initialSeconds={timeRemaining || 0}
            onTimeUp={handleTimeUp}
          />

          {/* Progress */}
          <div className="hidden text-center sm:block">
            <p className="text-sm text-neutral-500">
              {t('exam:progress', {
                answered: answeredCount,
                total: totalQuestions,
              })}
            </p>
            <div className="mt-1 h-2 w-48 overflow-hidden rounded-full bg-neutral-200">
              <div
                className="h-full bg-primary-500 transition-all"
                style={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
              />
            </div>
          </div>

          {/* Verification Status */}
          <VerificationStatus compact />
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-5xl px-4 py-6">
        <div className="grid gap-6 lg:grid-cols-4">
          {/* Question */}
          <div className="lg:col-span-3">
            <QuestionRenderer
              question={currentQuestion}
              questionNumber={currentQuestionIndex + 1}
              answer={answers[currentQuestion.id]}
              onAnswerChange={(answer) =>
                handleAnswerChange(currentQuestion.id, answer)
              }
            />

            {/* Navigation */}
            <div className="mt-6 flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => setCurrentQuestionIndex((i) => i - 1)}
                disabled={currentQuestionIndex === 0}
                leftIcon={isRtl ? <ChevronRight /> : <ChevronLeft />}
              >
                {t('exam:previous')}
              </Button>

              {currentQuestionIndex === totalQuestions - 1 ? (
                <Button
                  onClick={handleSubmit}
                  leftIcon={<Send className="h-4 w-4" />}
                >
                  {t('exam:submit')}
                </Button>
              ) : (
                <Button
                  onClick={() => setCurrentQuestionIndex((i) => i + 1)}
                  rightIcon={isRtl ? <ChevronLeft /> : <ChevronRight />}
                >
                  {t('exam:next')}
                </Button>
              )}
            </div>
          </div>

          {/* Question Navigator */}
          <div className="hidden lg:block">
            <Card className="sticky top-24">
              <h3 className="mb-4 font-medium text-neutral-900">
                {t('exam:questions')}
              </h3>
              <div className="grid grid-cols-5 gap-2">
                {questions.map((q, index) => (
                  <button
                    key={q.id}
                    onClick={() => setCurrentQuestionIndex(index)}
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-lg text-sm font-medium transition-colors',
                      currentQuestionIndex === index
                        ? 'bg-primary-600 text-white'
                        : answers[q.id]
                        ? 'bg-green-100 text-green-700'
                        : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                    )}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>

              {/* Submit Button */}
              <Button
                onClick={handleSubmit}
                className="mt-6 w-full"
                variant="success"
                leftIcon={<Send className="h-4 w-4" />}
              >
                {t('exam:submitExam')}
              </Button>
            </Card>
          </div>
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      <Modal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        title={t('exam:submitModal.title')}
      >
        <div className="space-y-4">
          {answeredCount < totalQuestions && (
            <div className="flex items-start gap-3 rounded-lg bg-amber-50 p-4">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <div>
                <p className="font-medium text-amber-800">
                  {t('exam:submitModal.warning')}
                </p>
                <p className="mt-1 text-sm text-amber-700">
                  {t('exam:submitModal.unanswered', {
                    count: totalQuestions - answeredCount,
                  })}
                </p>
              </div>
            </div>
          )}

          <p className="text-neutral-600">
            {t('exam:submitModal.confirmation')}
          </p>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setShowSubmitModal(false)}
            >
              {t('common:cancel')}
            </Button>
            <Button
              onClick={confirmSubmit}
              isLoading={submitMutation.isPending}
            >
              {t('exam:submitModal.confirm')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
```

**Deliverables:**
- [ ] Exam timer with warnings
- [ ] Question renderer for all types
- [ ] Question navigation
- [ ] Auto-save functionality
- [ ] Submit confirmation modal

---

## Phase 5: Monitoring Dashboard

### Duration: Week 7

### Phase 5.1: Proctor Dashboard
**Duration: 3 days**

*Note: Implementation details for proctor dashboard follow similar patterns to the student interface, with WebSocket integration for real-time monitoring.*

**Deliverables:**
- [ ] Real-time session grid
- [ ] Alert list with notifications
- [ ] Session detail view
- [ ] Acknowledge alerts functionality

---

## Internationalization (i18n)

### Configuration
**File: `src/i18n/index.ts`**
```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'ar', // Default to Arabic
    supportedLngs: ['ar', 'en'],

    ns: ['common', 'auth', 'dashboard', 'exam', 'verification'],
    defaultNS: 'common',

    interpolation: {
      escapeValue: false,
    },

    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },

    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
  });

export default i18n;
```

### Sample Translation Files

**File: `public/locales/ar/common.json`**
```json
{
  "appName": "نظام الحضور الذكي للامتحانات",
  "back": "رجوع",
  "cancel": "إلغاء",
  "confirm": "تأكيد",
  "save": "حفظ",
  "delete": "حذف",
  "edit": "تعديل",
  "loading": "جاري التحميل...",
  "error": "حدث خطأ",
  "success": "تم بنجاح",
  "dismiss": "إغلاق"
}
```

**File: `public/locales/en/common.json`**
```json
{
  "appName": "Smart Exam Attendance System",
  "back": "Back",
  "cancel": "Cancel",
  "confirm": "Confirm",
  "save": "Save",
  "delete": "Delete",
  "edit": "Edit",
  "loading": "Loading...",
  "error": "An error occurred",
  "success": "Success",
  "dismiss": "Dismiss"
}
```

---

## RTL Support

### Key Principles

1. **Use CSS Logical Properties**
   ```css
   /* Instead of */
   margin-left: 1rem;
   padding-right: 1rem;

   /* Use */
   margin-inline-start: 1rem;
   padding-inline-end: 1rem;
   ```

2. **Use Tailwind RTL Classes**
   ```jsx
   <div className="ms-4 me-2 ps-3 pe-3">
     {/* ms = margin-start, me = margin-end */}
     {/* ps = padding-start, pe = padding-end */}
   </div>
   ```

3. **Icon Flipping**
   ```jsx
   // Icons that should flip in RTL
   <ChevronLeft className="rtl:rotate-180" />
   <ChevronRight className="rtl:rotate-180" />
   ```

4. **Direction Attribute**
   ```jsx
   <div dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
     {/* Content */}
   </div>
   ```

---

## Task Summary

### Phase 1: Foundation (Week 1)
| Task | Status | Duration |
|------|--------|----------|
| 1.1.1 Initialize React Project | [ ] | 1 day |
| 1.1.2 Configure Tailwind with RTL | [ ] | 0.5 day |
| 1.1.3 Create Project Structure | [ ] | 0.5 day |
| 1.2.1-4 Base UI Components | [ ] | 3 days |

### Phase 2: Authentication & Dashboard (Week 2)
| Task | Status | Duration |
|------|--------|----------|
| 2.1.1 Create Auth Store | [ ] | 0.5 day |
| 2.1.2 Create Login Page | [ ] | 1 day |
| 2.1.3 Create Protected Route | [ ] | 0.5 day |
| 2.2.1 Create Dashboard Layout | [ ] | 1 day |
| 2.2.2 Create Student Dashboard | [ ] | 2 days |

### Phase 3: Verification Flow (Week 3-4)
| Task | Status | Duration |
|------|--------|----------|
| 3.1.1 Create Camera Hook | [ ] | 1 day |
| 3.1.2 Create Camera Setup | [ ] | 1 day |
| 3.2.1 Create Face Enrollment | [ ] | 3 days |
| 3.3.1 Create Liveness Check | [ ] | 2 days |

### Phase 4: Exam Interface (Week 5-6)
| Task | Status | Duration |
|------|--------|----------|
| 4.1.1 Create Exam Timer | [ ] | 0.5 day |
| 4.1.2 Create Question Renderer | [ ] | 1.5 days |
| 4.1.3 Create Exam Page | [ ] | 2 days |
| 4.1.4 Create Results Page | [ ] | 1 day |

### Phase 5: Monitoring Dashboard (Week 7)
| Task | Status | Duration |
|------|--------|----------|
| 5.1.1 Create Session Grid | [ ] | 1 day |
| 5.1.2 Create Alert List | [ ] | 1 day |
| 5.1.3 Create Session Detail | [ ] | 1 day |
