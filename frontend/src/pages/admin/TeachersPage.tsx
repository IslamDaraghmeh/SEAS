import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  UsersIcon,
  PlusCircleIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  EnvelopeIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input, { Select } from '../../components/ui/Input';
import Modal, { ConfirmModal } from '../../components/ui/Modal';
import { PageLoading } from '../../components/ui/Loading';
import { teacherService, Teacher, CreateTeacherData, UpdateTeacherData } from '../../services/teacher.service';
import toast from 'react-hot-toast';

// Validation schemas
const createTeacherSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  nameAr: z.string().min(1, 'Arabic name is required'),
  nameEn: z.string().min(1, 'English name is required'),
  department: z.string().optional(),
  phone: z.string().optional(),
});

const updateTeacherSchema = z.object({
  nameAr: z.string().min(1, 'Arabic name is required'),
  nameEn: z.string().min(1, 'English name is required'),
  department: z.string().optional(),
  phone: z.string().optional(),
});

type CreateTeacherFormData = z.infer<typeof createTeacherSchema>;
type UpdateTeacherFormData = z.infer<typeof updateTeacherSchema>;

const AdminTeachersPage: React.FC = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editTeacher, setEditTeacher] = useState<Teacher | null>(null);
  const [deleteTeacher, setDeleteTeacher] = useState<Teacher | null>(null);

  // Fetch teachers
  const { data, isLoading, error } = useQuery({
    queryKey: ['teachers', { search: searchQuery, isActive: statusFilter === 'all' ? undefined : statusFilter === 'active', page }],
    queryFn: () => teacherService.getTeachers({
      search: searchQuery || undefined,
      isActive: statusFilter === 'all' ? undefined : statusFilter === 'active',
      page,
      limit: 20,
    }),
  });

  // Create teacher mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateTeacherData) => teacherService.createTeacher(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      setShowAddModal(false);
      toast.success(t('teacher.createSuccess') || 'Teacher created successfully');
      createForm.reset();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create teacher');
    },
  });

  // Update teacher mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTeacherData }) =>
      teacherService.updateTeacher(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      setEditTeacher(null);
      toast.success(t('teacher.updateSuccess') || 'Teacher updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update teacher');
    },
  });

  // Delete teacher mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => teacherService.deleteTeacher(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      setDeleteTeacher(null);
      toast.success(t('teacher.deleteSuccess') || 'Teacher deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete teacher');
    },
  });

  // Toggle status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      isActive ? teacherService.deactivateTeacher(id) : teacherService.activateTeacher(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      toast.success('Teacher status updated');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update status');
    },
  });

  // Form for creating teacher
  const createForm = useForm<CreateTeacherFormData>({
    resolver: zodResolver(createTeacherSchema),
  });

  // Form for editing teacher
  const editForm = useForm<UpdateTeacherFormData>({
    resolver: zodResolver(updateTeacherSchema),
  });

  // Handle edit modal open
  const handleEditOpen = (teacher: Teacher) => {
    setEditTeacher(teacher);
    editForm.reset({
      nameAr: teacher.nameAr,
      nameEn: teacher.nameEn,
      department: teacher.department || '',
      phone: teacher.phone || '',
    });
  };

  // Handle create submit
  const onCreateSubmit = (data: CreateTeacherFormData) => {
    createMutation.mutate(data);
  };

  // Handle edit submit
  const onEditSubmit = (data: UpdateTeacherFormData) => {
    if (editTeacher) {
      updateMutation.mutate({ id: editTeacher.id, data });
    }
  };

  // Status options
  const statusOptions = [
    { value: 'all', label: t('common.all') || 'All' },
    { value: 'active', label: t('common.active') },
    { value: 'inactive', label: t('common.inactive') },
  ];

  if (isLoading) {
    return <PageLoading />;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">{t('common.error')}</p>
      </div>
    );
  }

  const teachers = data?.data || [];
  const totalPages = data?.meta?.totalPages || 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('teacher.title')}</h1>
          <p className="text-gray-500 mt-1">
            {data?.meta?.total || 0} {t('teacher.title')}
          </p>
        </div>
        <Button
          leftIcon={<PlusCircleIcon className="h-5 w-5" />}
          onClick={() => setShowAddModal(true)}
        >
          {t('teacher.addTeacher')}
        </Button>
      </div>

      {/* Filters */}
      <Card padding="sm">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder={t('common.search')}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              leftIcon={<MagnifyingGlassIcon className="h-5 w-5" />}
            />
          </div>
          <div className="w-full sm:w-48">
            <Select
              options={statusOptions}
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>
      </Card>

      {/* Teachers Table */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-start py-3 px-4 text-sm font-medium text-gray-500">
                  {t('common.name')}
                </th>
                <th className="text-start py-3 px-4 text-sm font-medium text-gray-500">
                  {t('common.email')}
                </th>
                <th className="text-start py-3 px-4 text-sm font-medium text-gray-500">
                  {t('teacher.department')}
                </th>
                <th className="text-start py-3 px-4 text-sm font-medium text-gray-500">
                  {t('common.phone')}
                </th>
                <th className="text-start py-3 px-4 text-sm font-medium text-gray-500">
                  {t('teacher.assignedCourses')}
                </th>
                <th className="text-start py-3 px-4 text-sm font-medium text-gray-500">
                  {t('common.status')}
                </th>
                <th className="text-start py-3 px-4 text-sm font-medium text-gray-500">
                  {t('common.actions')}
                </th>
              </tr>
            </thead>
            <tbody>
              {teachers.map((teacher) => (
                <tr
                  key={teacher.id}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-green-700 font-medium">
                          {teacher.nameEn?.charAt(0) || 'T'}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {teacher.nameEn}
                        </p>
                        <p className="text-sm text-gray-500">
                          {teacher.nameAr}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {teacher.user?.email}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {teacher.department || '-'}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {teacher.phone || '-'}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {teacher._count?.courses || 0}
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => toggleStatusMutation.mutate({
                        id: teacher.id,
                        isActive: teacher.user?.isActive || false
                      })}
                      className={`px-2 py-1 text-xs font-medium rounded flex items-center gap-1 ${
                        teacher.user?.isActive
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {teacher.user?.isActive ? (
                        <CheckCircleIcon className="h-3 w-3" />
                      ) : (
                        <XCircleIcon className="h-3 w-3" />
                      )}
                      {teacher.user?.isActive ? t('common.active') : t('common.inactive')}
                    </button>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditOpen(teacher)}
                      >
                        <PencilIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteTeacher(teacher)}
                      >
                        <TrashIcon className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {teachers.length === 0 && (
          <div className="text-center py-12">
            <UsersIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {t('common.noData')}
            </h3>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 py-4 border-t border-gray-100">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              {t('common.previous')}
            </Button>
            <span className="text-sm text-gray-600">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
            >
              {t('common.next')}
            </Button>
          </div>
        )}
      </Card>

      {/* Add Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          createForm.reset();
        }}
        title={t('teacher.addTeacher')}
        size="md"
      >
        <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
          <Input
            label={t('common.email')}
            type="email"
            leftIcon={<EnvelopeIcon className="h-5 w-5" />}
            error={createForm.formState.errors.email?.message}
            {...createForm.register('email')}
          />
          <Input
            label={t('auth.password')}
            type="password"
            error={createForm.formState.errors.password?.message}
            {...createForm.register('password')}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label={t('common.nameAr')}
              error={createForm.formState.errors.nameAr?.message}
              {...createForm.register('nameAr')}
            />
            <Input
              label={t('common.nameEn')}
              error={createForm.formState.errors.nameEn?.message}
              {...createForm.register('nameEn')}
            />
          </div>
          <Input
            label={t('teacher.department')}
            {...createForm.register('department')}
          />
          <Input
            label={t('common.phone')}
            {...createForm.register('phone')}
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowAddModal(false);
                createForm.reset();
              }}
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" isLoading={createMutation.isPending}>
              {t('common.save')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={!!editTeacher}
        onClose={() => setEditTeacher(null)}
        title={t('teacher.editTeacher')}
        size="md"
      >
        <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label={t('common.nameAr')}
              error={editForm.formState.errors.nameAr?.message}
              {...editForm.register('nameAr')}
            />
            <Input
              label={t('common.nameEn')}
              error={editForm.formState.errors.nameEn?.message}
              {...editForm.register('nameEn')}
            />
          </div>
          <Input
            label={t('teacher.department')}
            {...editForm.register('department')}
          />
          <Input
            label={t('common.phone')}
            {...editForm.register('phone')}
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditTeacher(null)}
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" isLoading={updateMutation.isPending}>
              {t('common.save')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={!!deleteTeacher}
        onClose={() => setDeleteTeacher(null)}
        onConfirm={() => {
          if (deleteTeacher) {
            deleteMutation.mutate(deleteTeacher.id);
          }
        }}
        title={t('teacher.deleteTeacher')}
        message={`${t('teacher.deleteConfirm')}: ${deleteTeacher?.nameEn}?`}
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
        variant="danger"
      />
    </div>
  );
};

export default AdminTeachersPage;
