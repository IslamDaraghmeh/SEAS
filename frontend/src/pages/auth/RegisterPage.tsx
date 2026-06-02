import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  EnvelopeIcon,
  LockClosedIcon,
  UserIcon,
  IdentificationIcon,
  EyeIcon,
  EyeSlashIcon,
} from '@heroicons/react/24/outline';
import { useAuth, RegisterData } from '../../contexts/AuthContext';
import Button from '../../components/ui/Button';
import Input, { Select } from '../../components/ui/Input';
import Alert from '../../components/ui/Alert';
import { LanguageToggle } from '../../components/layout/LanguageSwitch';

// Validation schema
const registerSchema = z
  .object({
    firstName: z.string().min(2, 'validation.minLength'),
    lastName: z.string().min(2, 'validation.minLength'),
    email: z.string().email('errors.invalidEmail'),
    password: z.string().min(8, 'errors.invalidPassword'),
    confirmPassword: z.string(),
    role: z.enum(['student', 'teacher']),
    studentId: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'errors.passwordMismatch',
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

const RegisterPage: React.FC = () => {
  const { t } = useTranslation();
  const { register: registerUser, isLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'student',
    },
  });

  const selectedRole = watch('role');

  const onSubmit = async (data: RegisterFormData) => {
    setError(null);
    try {
      const registerData: RegisterData = {
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        studentId: data.role === 'student' ? data.studentId : undefined,
      };
      await registerUser(registerData);
    } catch (err) {
      setError(t('auth.registerError'));
    }
  };

  const roleOptions = [
    { value: 'student', label: t('auth.student') },
    { value: 'teacher', label: t('auth.teacher') },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex flex-col">
      {/* Header */}
      <header className="p-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">S</span>
          </div>
          <span className="text-xl font-bold text-gray-900">
            {t('common.appNameShort')}
          </span>
        </div>
        <LanguageToggle />
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4 py-8">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <UserIcon className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">
                {t('auth.registerTitle')}
              </h1>
              <p className="text-gray-500 mt-2">{t('auth.registerSubtitle')}</p>
            </div>

            {/* Error Alert */}
            {error && (
              <Alert
                variant="error"
                message={error}
                onClose={() => setError(null)}
                className="mb-6"
              />
            )}

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label={t('auth.firstName')}
                  placeholder={t('auth.firstName')}
                  leftIcon={<UserIcon className="h-5 w-5" />}
                  error={errors.firstName ? t(errors.firstName.message as string, { min: 2 }) : undefined}
                  {...register('firstName')}
                />
                <Input
                  label={t('auth.lastName')}
                  placeholder={t('auth.lastName')}
                  error={errors.lastName ? t(errors.lastName.message as string, { min: 2 }) : undefined}
                  {...register('lastName')}
                />
              </div>

              {/* Email */}
              <Input
                label={t('auth.email')}
                type="email"
                placeholder="example@university.edu"
                leftIcon={<EnvelopeIcon className="h-5 w-5" />}
                error={errors.email ? t(errors.email.message as string) : undefined}
                {...register('email')}
              />

              {/* Role Selection */}
              <Select
                label={t('auth.selectRole')}
                options={roleOptions}
                error={errors.role ? t(errors.role.message as string) : undefined}
                {...register('role')}
              />

              {/* Student ID (conditional) */}
              {selectedRole === 'student' && (
                <Input
                  label={t('auth.studentId')}
                  placeholder="20241234567"
                  leftIcon={<IdentificationIcon className="h-5 w-5" />}
                  error={errors.studentId ? t(errors.studentId.message as string) : undefined}
                  {...register('studentId')}
                />
              )}

              {/* Password */}
              <div className="relative">
                <Input
                  label={t('auth.password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="********"
                  leftIcon={<LockClosedIcon className="h-5 w-5" />}
                  error={errors.password ? t(errors.password.message as string) : undefined}
                  {...register('password')}
                />
                <button
                  type="button"
                  className="absolute end-3 top-9 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>

              {/* Confirm Password */}
              <div className="relative">
                <Input
                  label={t('auth.confirmPassword')}
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="********"
                  leftIcon={<LockClosedIcon className="h-5 w-5" />}
                  error={
                    errors.confirmPassword
                      ? t(errors.confirmPassword.message as string)
                      : undefined
                  }
                  {...register('confirmPassword')}
                />
                <button
                  type="button"
                  className="absolute end-3 top-9 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                fullWidth
                size="lg"
                isLoading={isLoading}
              >
                {t('auth.register')}
              </Button>
            </form>

            {/* Login Link */}
            <p className="mt-8 text-center text-gray-600">
              {t('auth.hasAccount')}{' '}
              <Link
                to="/login"
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                {t('auth.login')}
              </Link>
            </p>
          </div>

          {/* Footer */}
          <p className="text-center text-sm text-gray-500 mt-8">
            {t('common.appName')}
          </p>
        </div>
      </main>
    </div>
  );
};

export default RegisterPage;
