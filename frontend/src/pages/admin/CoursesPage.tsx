import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  BookOpenIcon,
  PlusCircleIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  AcademicCapIcon,
  UsersIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input, { Select, Textarea } from '../../components/ui/Input';
import Modal, { ConfirmModal } from '../../components/ui/Modal';
import { PageLoading } from '../../components/ui/Loading';
import { courseService, Course, CreateCourseData, UpdateCourseData } from '../../services/course.service';
import { teacherService } from '../../services/teacher.service';
import CourseEnrollmentManager from '../../components/admin/CourseEnrollmentManager';
import toast from 'react-hot-toast';

// Validation schemas
const createCourseSchema = z.object({
  code: z.string().min(1, 'Course code is required'),
  nameAr: z.string().min(1, 'Arabic name is required'),
  nameEn: z.string().min(1, 'English name is required'),
  descriptionAr: z.string().optional(),
  descriptionEn: z.string().optional(),
  creditHours: z.coerce.number().min(1, 'Credit hours must be at least 1').max(6, 'Credit hours cannot exceed 6'),
  semester: z.string().min(1, 'Semester is required'),
  academicYear: z.string().min(1, 'Academic year is required'),
  teacherId: z.string().min(1, 'Teacher is required'),
});

const updateCourseSchema = z.object({
  code: z.string().min(1, 'Course code is required'),
  nameAr: z.string().min(1, 'Arabic name is required'),
  nameEn: z.string().min(1, 'English name is required'),
  descriptionAr: z.string().optional(),
  descriptionEn: z.string().optional(),
  creditHours: z.coerce.number().min(1, 'Credit hours must be at least 1').max(6, 'Credit hours cannot exceed 6'),
  semester: z.string().min(1, 'Semester is required'),
  academicYear: z.string().min(1, 'Academic year is required'),
  teacherId: z.string().min(1, 'Teacher is required'),
});

type CreateCourseFormData = z.infer<typeof createCourseSchema>;
type UpdateCourseFormData = z.infer<typeof updateCourseSchema>;

const AdminCoursesPage: React.FC = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editCourse, setEditCourse] = useState<Course | null>(null);
  const [deleteCourse, setDeleteCourse] = useState<Course | null>(null);
  const [enrollmentCourse, setEnrollmentCourse] = useState<Course | null>(null);

  // Fetch courses
  const { data, isLoading, error } = useQuery({
    queryKey: ['courses', { search: searchQuery, isActive: statusFilter === 'all' ? undefined : statusFilter === 'active', page }],
    queryFn: () => courseService.getCourses({
      search: searchQuery || undefined,
      isActive: statusFilter === 'all' ? undefined : statusFilter === 'active',
      page,
      limit: 20,
    }),
  });

  // Fetch teachers for dropdown
  const { data: teachersData } = useQuery({
    queryKey: ['teachers', 'all'],
    queryFn: () => teacherService.getTeachers({ limit: 100 }),
  });

  // Create course mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateCourseData) => courseService.createCourse(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      setShowAddModal(false);
      toast.success(t('course.createSuccess') || 'Course created successfully');
      createForm.reset();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create course');
    },
  });

  // Update course mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCourseData }) =>
      courseService.updateCourse(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      setEditCourse(null);
      toast.success(t('course.updateSuccess') || 'Course updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update course');
    },
  });

  // Delete course mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => courseService.deleteCourse(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      setDeleteCourse(null);
      toast.success(t('course.deleteSuccess') || 'Course deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete course');
    },
  });

  // Toggle status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      isActive ? courseService.deactivateCourse(id) : courseService.activateCourse(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      toast.success('Course status updated');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update status');
    },
  });

  // Form for creating course
  const createForm = useForm<CreateCourseFormData>({
    resolver: zodResolver(createCourseSchema),
    defaultValues: {
      semester: 'Fall',
      academicYear: new Date().getFullYear().toString(),
      creditHours: 3,
    },
  });

  // Form for editing course
  const editForm = useForm<UpdateCourseFormData>({
    resolver: zodResolver(updateCourseSchema),
  });

  // Handle edit modal open
  const handleEditOpen = (course: Course) => {
    setEditCourse(course);
    editForm.reset({
      code: course.code,
      nameAr: course.nameAr,
      nameEn: course.nameEn,
      descriptionAr: course.descriptionAr || '',
      descriptionEn: course.descriptionEn || '',
      creditHours: course.creditHours,
      semester: course.semester,
      academicYear: course.academicYear,
      teacherId: course.teacherId,
    });
  };

  // Handle create submit
  const onCreateSubmit = (data: CreateCourseFormData) => {
    createMutation.mutate(data);
  };

  // Handle edit submit
  const onEditSubmit = (data: UpdateCourseFormData) => {
    if (editCourse) {
      updateMutation.mutate({ id: editCourse.id, data });
    }
  };

  // Status options
  const statusOptions = [
    { value: 'all', label: t('common.all') || 'All' },
    { value: 'active', label: t('common.active') },
    { value: 'inactive', label: t('common.inactive') },
  ];

  // Teacher options for dropdown
  const teacherOptions = (teachersData?.data || []).map((teacher) => ({
    value: teacher.id,
    label: teacher.nameEn,
  }));

  // Semester options
  const semesterOptions = [
    { value: 'Fall', label: 'Fall' },
    { value: 'Spring', label: 'Spring' },
    { value: 'Summer', label: 'Summer' },
  ];

  // Academic year options
  const currentYear = new Date().getFullYear();
  const academicYearOptions = [
    { value: (currentYear - 1).toString(), label: `${currentYear - 1}` },
    { value: currentYear.toString(), label: `${currentYear}` },
    { value: (currentYear + 1).toString(), label: `${currentYear + 1}` },
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

  const courses = data?.data || [];
  const totalPages = data?.meta?.totalPages || 1;

  // Get teacher name from teacherId
  const getTeacherName = (teacherId: string) => {
    const teacher = (teachersData?.data || []).find(t => t.id === teacherId);
    return teacher?.nameEn || '-';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('course.title')}</h1>
          <p className="text-gray-500 mt-1">
            {data?.meta?.total || 0} {t('course.title')}
          </p>
        </div>
        <Button
          leftIcon={<PlusCircleIcon className="h-5 w-5" />}
          onClick={() => setShowAddModal(true)}
        >
          {t('course.addCourse')}
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

      {/* Courses Grid */}
      {courses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((course) => (
            <Card key={course.id} hoverable>
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <BookOpenIcon className="h-6 w-6 text-purple-600" />
                </div>
                <button
                  onClick={() => toggleStatusMutation.mutate({
                    id: course.id,
                    isActive: course.isActive
                  })}
                  className={`px-2 py-1 text-xs font-medium rounded flex items-center gap-1 ${
                    course.isActive
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {course.isActive ? (
                    <CheckCircleIcon className="h-3 w-3" />
                  ) : (
                    <XCircleIcon className="h-3 w-3" />
                  )}
                  {course.isActive ? t('common.active') : t('common.inactive')}
                </button>
              </div>

              <div className="mb-4">
                <p className="text-sm text-primary-600 font-medium">
                  {course.code}
                </p>
                <h3 className="text-lg font-semibold text-gray-900 mt-1">
                  {course.nameEn}
                </h3>
                <p className="text-sm text-gray-500">
                  {course.nameAr}
                </p>
                {course.descriptionEn && (
                  <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                    {course.descriptionEn}
                  </p>
                )}
              </div>

              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <div className="flex items-center gap-2">
                  <AcademicCapIcon className="h-4 w-4" />
                  <span>{getTeacherName(course.teacherId)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>{course.creditHours} {t('course.creditHours')}</span>
                  <span className="text-xs text-gray-400">{course.semester} {course.academicYear}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEnrollmentCourse(course)}
                  title={t('course.manageStudents')}
                >
                  <UsersIcon className="h-4 w-4 text-primary-600" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleEditOpen(course)}
                >
                  <PencilIcon className="h-4 w-4 me-2" />
                  {t('common.edit')}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeleteCourse(course)}
                >
                  <TrashIcon className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <div className="text-center py-12">
            <BookOpenIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {t('common.noData')}
            </h3>
          </div>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 py-4">
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

      {/* Add Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          createForm.reset();
        }}
        title={t('course.addCourse')}
        size="md"
      >
        <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label={t('course.courseCode')}
              error={createForm.formState.errors.code?.message}
              {...createForm.register('code')}
            />
            <Input
              label={t('course.creditHours')}
              type="number"
              error={createForm.formState.errors.creditHours?.message}
              {...createForm.register('creditHours')}
            />
          </div>
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
          <Textarea
            label={t('course.descriptionEn')}
            rows={2}
            {...createForm.register('descriptionEn')}
          />
          <Textarea
            label={t('course.descriptionAr')}
            rows={2}
            {...createForm.register('descriptionAr')}
          />
          <Select
            label={t('course.assignedTeacher')}
            options={[{ value: '', label: t('common.select') }, ...teacherOptions]}
            error={createForm.formState.errors.teacherId?.message}
            {...createForm.register('teacherId')}
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label={t('course.semester')}
              options={semesterOptions}
              error={createForm.formState.errors.semester?.message}
              {...createForm.register('semester')}
            />
            <Select
              label={t('course.academicYear')}
              options={academicYearOptions}
              error={createForm.formState.errors.academicYear?.message}
              {...createForm.register('academicYear')}
            />
          </div>
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
        isOpen={!!editCourse}
        onClose={() => setEditCourse(null)}
        title={t('course.editCourse')}
        size="md"
      >
        <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label={t('course.courseCode')}
              error={editForm.formState.errors.code?.message}
              {...editForm.register('code')}
            />
            <Input
              label={t('course.creditHours')}
              type="number"
              error={editForm.formState.errors.creditHours?.message}
              {...editForm.register('creditHours')}
            />
          </div>
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
          <Textarea
            label={t('course.descriptionEn')}
            rows={2}
            {...editForm.register('descriptionEn')}
          />
          <Textarea
            label={t('course.descriptionAr')}
            rows={2}
            {...editForm.register('descriptionAr')}
          />
          <Select
            label={t('course.assignedTeacher')}
            options={[{ value: '', label: t('common.select') }, ...teacherOptions]}
            error={editForm.formState.errors.teacherId?.message}
            {...editForm.register('teacherId')}
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label={t('course.semester')}
              options={semesterOptions}
              error={editForm.formState.errors.semester?.message}
              {...editForm.register('semester')}
            />
            <Select
              label={t('course.academicYear')}
              options={academicYearOptions}
              error={editForm.formState.errors.academicYear?.message}
              {...editForm.register('academicYear')}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditCourse(null)}
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
        isOpen={!!deleteCourse}
        onClose={() => setDeleteCourse(null)}
        onConfirm={() => {
          if (deleteCourse) {
            deleteMutation.mutate(deleteCourse.id);
          }
        }}
        title={t('course.deleteCourse')}
        message={`${t('course.deleteConfirm')}: ${deleteCourse?.nameEn} (${deleteCourse?.code})?`}
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
        variant="danger"
      />

      {/* Enrollment Manager Modal */}
      {enrollmentCourse && (
        <CourseEnrollmentManager
          course={enrollmentCourse}
          isOpen={!!enrollmentCourse}
          onClose={() => setEnrollmentCourse(null)}
        />
      )}
    </div>
  );
};

export default AdminCoursesPage;
