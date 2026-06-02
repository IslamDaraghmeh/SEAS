import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  UserCircleIcon,
  EnvelopeIcon,
  PhoneIcon,
  AcademicCapIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  CheckCircleIcon,
  PencilIcon,
  CameraIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../hooks/useAuth';
import Card, { CardHeader, CardTitle } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { PageLoading } from '../../components/ui/Loading';
import Modal from '../../components/ui/Modal';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { format, isValid } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

interface ProfileData {
  id: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
  student?: {
    id: string;
    studentNumber: string;
    nameAr: string;
    nameEn: string;
    phone?: string;
    faceEnrolledAt?: string;
  };
  teacher?: {
    id: string;
    nameAr: string;
    nameEn: string;
    department?: string;
    phone?: string;
  };
  admin?: {
    id: string;
    nameAr: string;
    nameEn: string;
  };
}

const ProfilePage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user, updateUser } = useAuth();
  const queryClient = useQueryClient();
  const locale = i18n.language === 'ar' ? ar : enUS;
  const isRTL = i18n.language === 'ar';

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    nameAr: '',
    nameEn: '',
    phone: '',
    department: '',
  });

  // Fetch profile data
  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const response = await api.get<ProfileData>('/auth/me');
      return response.data;
    },
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: typeof editForm) => {
      const response = await api.put('/auth/profile', data);
      return response.data;
    },
    onSuccess: () => {
      toast.success(t('profile.updateSuccess'));
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      setIsEditModalOpen(false);
    },
    onError: () => {
      toast.error(t('profile.updateFailed'));
    },
  });

  const handleEditProfile = () => {
    const roleData = profile?.student || profile?.teacher || profile?.admin;
    setEditForm({
      nameAr: roleData?.nameAr || '',
      nameEn: roleData?.nameEn || '',
      phone: (profile?.student?.phone || profile?.teacher?.phone) || '',
      department: profile?.teacher?.department || '',
    });
    setIsEditModalOpen(true);
  };

  const handleSubmitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(editForm);
  };

  const formatDate = (dateValue: string | undefined) => {
    if (!dateValue) return '-';
    const date = new Date(dateValue);
    if (!isValid(date)) return '-';
    return format(date, 'PPp', { locale });
  };

  if (isLoading) {
    return <PageLoading />;
  }

  const roleData = profile?.student || profile?.teacher || profile?.admin;
  const displayName = isRTL ? roleData?.nameAr : roleData?.nameEn;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('nav.profile')}</h1>
        <p className="text-gray-500 mt-1">{t('profile.subtitle')}</p>
      </div>

      {/* Profile Card */}
      <Card>
        <div className="flex flex-col md:flex-row md:items-start gap-6">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white text-4xl font-bold shadow-lg">
                {displayName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase()}
              </div>
              {profile?.student?.faceEnrolledAt && (
                <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1.5 border-4 border-white">
                  <CheckCircleIcon className="h-4 w-4 text-white" />
                </div>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{displayName || user?.email}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                    profile?.role === 'ADMIN'
                      ? 'bg-red-100 text-red-700'
                      : profile?.role === 'TEACHER'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-green-100 text-green-700'
                  }`}>
                    {t(`auth.${profile?.role?.toLowerCase()}`)}
                  </span>
                  {profile?.isActive ? (
                    <span className="px-2 py-0.5 text-xs font-medium bg-green-50 text-green-700 rounded">
                      {t('common.active')}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 text-xs font-medium bg-red-50 text-red-700 rounded">
                      {t('common.inactive')}
                    </span>
                  )}
                </div>
              </div>
              <Button
                variant="outline"
                leftIcon={<PencilIcon className="h-4 w-4" />}
                onClick={handleEditProfile}
              >
                {t('profile.editProfile')}
              </Button>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">{t('common.email')}</p>
                  <p className="text-sm font-medium text-gray-900">{profile?.email}</p>
                </div>
              </div>

              {(profile?.student?.phone || profile?.teacher?.phone) && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <PhoneIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">{t('common.phone')}</p>
                    <p className="text-sm font-medium text-gray-900">
                      {profile?.student?.phone || profile?.teacher?.phone}
                    </p>
                  </div>
                </div>
              )}

              {profile?.student?.studentNumber && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <AcademicCapIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">{t('auth.studentId')}</p>
                    <p className="text-sm font-medium text-gray-900">{profile.student.studentNumber}</p>
                  </div>
                </div>
              )}

              {profile?.teacher?.department && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <BuildingOfficeIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">{t('teacher.department')}</p>
                    <p className="text-sm font-medium text-gray-900">{profile.teacher.department}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <CalendarIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">{t('profile.memberSince')}</p>
                  <p className="text-sm font-medium text-gray-900">
                    {formatDate(profile?.createdAt)}
                  </p>
                </div>
              </div>

              {profile?.lastLoginAt && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <CalendarIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">{t('profile.lastLogin')}</p>
                    <p className="text-sm font-medium text-gray-900">
                      {formatDate(profile.lastLoginAt)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Additional Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Names Card */}
        <Card>
          <CardHeader>
            <CardTitle>{t('profile.names')}</CardTitle>
          </CardHeader>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">{t('common.nameAr')}</p>
              <p className="text-lg font-medium text-gray-900" dir="rtl">
                {roleData?.nameAr || '-'}
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">{t('common.nameEn')}</p>
              <p className="text-lg font-medium text-gray-900" dir="ltr">
                {roleData?.nameEn || '-'}
              </p>
            </div>
          </div>
        </Card>

        {/* Face Registration Status (Students only) */}
        {profile?.student && (
          <Card>
            <CardHeader>
              <CardTitle>{t('verification.faceRegistration')}</CardTitle>
            </CardHeader>
            <div className="text-center py-6">
              {profile.student.faceEnrolledAt ? (
                <>
                  <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircleIcon className="h-8 w-8 text-green-600" />
                  </div>
                  <p className="text-green-700 font-medium">{t('verification.faceRegistered')}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {t('verification.registeredAt')}: {formatDate(profile.student.faceEnrolledAt)}
                  </p>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 mx-auto mb-4 bg-yellow-100 rounded-full flex items-center justify-center">
                    <CameraIcon className="h-8 w-8 text-yellow-600" />
                  </div>
                  <p className="text-yellow-700 font-medium">{t('verification.faceNotRegistered')}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {t('verification.faceRegistrationRequired')}
                  </p>
                </>
              )}
            </div>
          </Card>
        )}
      </div>

      {/* Edit Profile Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={t('profile.editProfile')}
      >
        <form onSubmit={handleSubmitEdit} className="space-y-4">
          <Input
            label={t('common.nameAr')}
            value={editForm.nameAr}
            onChange={(e) => setEditForm({ ...editForm, nameAr: e.target.value })}
            dir="rtl"
          />
          <Input
            label={t('common.nameEn')}
            value={editForm.nameEn}
            onChange={(e) => setEditForm({ ...editForm, nameEn: e.target.value })}
          />
          {(profile?.student || profile?.teacher) && (
            <Input
              label={t('common.phone')}
              value={editForm.phone}
              onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
              type="tel"
            />
          )}
          {profile?.teacher && (
            <Input
              label={t('teacher.department')}
              value={editForm.department}
              onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
            />
          )}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditModalOpen(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              isLoading={updateProfileMutation.isPending}
            >
              {t('common.save')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ProfilePage;
