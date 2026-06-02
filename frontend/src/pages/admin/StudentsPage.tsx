import React, { useState, useEffect } from 'react';
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
  IdentificationIcon,
  CheckCircleIcon,
  XCircleIcon,
  CameraIcon,
  EyeIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowsPointingOutIcon,
} from '@heroicons/react/24/outline';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input, { Select } from '../../components/ui/Input';
import Modal, { ConfirmModal } from '../../components/ui/Modal';
import { PageLoading } from '../../components/ui/Loading';
import { studentService, Student, CreateStudentData, UpdateStudentData } from '../../services/student.service';
import verificationService from '../../services/verification.service';
import toast from 'react-hot-toast';

// Validation schemas
const createStudentSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  studentNumber: z.string().min(1, 'Student number is required'),
  nameAr: z.string().min(1, 'Arabic name is required'),
  nameEn: z.string().min(1, 'English name is required'),
  phone: z.string().optional(),
});

const updateStudentSchema = z.object({
  nameAr: z.string().min(1, 'Arabic name is required'),
  nameEn: z.string().min(1, 'English name is required'),
  phone: z.string().optional(),
});

type CreateStudentFormData = z.infer<typeof createStudentSchema>;
type UpdateStudentFormData = z.infer<typeof updateStudentSchema>;

// Challenge labels for display
const CHALLENGE_LABELS = [
  { key: 'front_selfie', labelKey: 'challengeFrontSelfie' },
  { key: 'turn_left', labelKey: 'challengeTurnLeft' },
  { key: 'turn_right', labelKey: 'challengeTurnRight' },
  { key: 'nod', labelKey: 'challengeNod' },
  { key: 'blink', labelKey: 'challengeBlink' },
  { key: 'lip_movement', labelKey: 'challengeLipMovement' },
];

// Face Registration Modal Component
interface FaceRegistrationModalProps {
  student: Student | null;
  onClose: () => void;
  onDelete: () => void;
}

interface ChallengeImage {
  index: number;
  image: string;
}

const FaceRegistrationModal: React.FC<FaceRegistrationModalProps> = ({ student, onClose, onDelete }) => {
  const { t } = useTranslation();
  const [challengeImages, setChallengeImages] = useState<ChallengeImage[]>([]);
  const [totalChallenges, setTotalChallenges] = useState(0);
  const [isLoadingImage, setIsLoadingImage] = useState(false);
  const [fullscreenIndex, setFullscreenIndex] = useState<number | null>(null);

  useEffect(() => {
    if (student?.id && student.faceEnrolledAt) {
      setIsLoadingImage(true);
      verificationService.getFaceRegistrationImage(student.id)
        .then((data) => {
          setChallengeImages(data.challengeImages || []);
          setTotalChallenges(data.totalChallenges || 0);
        })
        .catch((error) => {
          console.error('Failed to load face images:', error);
          setChallengeImages([]);
          setTotalChallenges(0);
        })
        .finally(() => {
          setIsLoadingImage(false);
        });
    } else {
      setChallengeImages([]);
      setTotalChallenges(0);
    }
  }, [student?.id, student?.faceEnrolledAt]);

  // Handle keyboard navigation for fullscreen viewer
  useEffect(() => {
    if (fullscreenIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setFullscreenIndex(null);
      } else if (e.key === 'ArrowLeft') {
        setFullscreenIndex((prev) =>
          prev !== null && prev > 0 ? prev - 1 : challengeImages.length - 1
        );
      } else if (e.key === 'ArrowRight') {
        setFullscreenIndex((prev) =>
          prev !== null && prev < challengeImages.length - 1 ? prev + 1 : 0
        );
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fullscreenIndex, challengeImages.length]);

  if (!student) return null;

  const getChallengeLabel = (index: number) => {
    if (index < CHALLENGE_LABELS.length) {
      return t(`verification.${CHALLENGE_LABELS[index].labelKey}`) || CHALLENGE_LABELS[index].key;
    }
    return `Challenge ${index + 1}`;
  };

  const goToPrevImage = () => {
    setFullscreenIndex((prev) =>
      prev !== null && prev > 0 ? prev - 1 : challengeImages.length - 1
    );
  };

  const goToNextImage = () => {
    setFullscreenIndex((prev) =>
      prev !== null && prev < challengeImages.length - 1 ? prev + 1 : 0
    );
  };

  return (
    <>
      {/* Fullscreen Image Viewer */}
      {fullscreenIndex !== null && challengeImages[fullscreenIndex] && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center"
          onClick={() => setFullscreenIndex(null)}
        >
          {/* Close button */}
          <button
            onClick={() => setFullscreenIndex(null)}
            className="absolute top-4 right-4 p-2 text-white hover:bg-white/20 rounded-full transition-colors z-10"
          >
            <XMarkIcon className="h-8 w-8" />
          </button>

          {/* Image counter */}
          <div className="absolute top-4 left-4 text-white text-lg font-medium">
            {fullscreenIndex + 1} / {challengeImages.length}
          </div>

          {/* Challenge label */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-lg font-medium bg-black/50 px-4 py-2 rounded-lg">
            {getChallengeLabel(fullscreenIndex)}
          </div>

          {/* Previous button */}
          {challengeImages.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); goToPrevImage(); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 text-white hover:bg-white/20 rounded-full transition-colors"
            >
              <ChevronLeftIcon className="h-10 w-10" />
            </button>
          )}

          {/* Main image */}
          <img
            src={challengeImages[fullscreenIndex].image}
            alt={getChallengeLabel(fullscreenIndex)}
            className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Next button */}
          {challengeImages.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); goToNextImage(); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 text-white hover:bg-white/20 rounded-full transition-colors"
            >
              <ChevronRightIcon className="h-10 w-10" />
            </button>
          )}

          {/* Thumbnail strip */}
          {challengeImages.length > 1 && (
            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-2 bg-black/50 p-2 rounded-lg">
              {challengeImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={(e) => { e.stopPropagation(); setFullscreenIndex(idx); }}
                  className={`w-12 h-12 rounded overflow-hidden border-2 transition-all ${
                    idx === fullscreenIndex ? 'border-white scale-110' : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img.image} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <Modal
        isOpen={!!student}
        onClose={onClose}
        title={t('verification.faceRegistrationDetails')}
        size="lg"
      >
        <div className="space-y-4">
          {/* Student Info */}
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
              <span className="text-2xl text-primary-700 font-bold">
                {student.nameEn?.charAt(0) || 'S'}
              </span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{student.nameEn}</h3>
              <p className="text-sm text-gray-500">{student.nameAr}</p>
              <p className="text-sm text-gray-500">{student.studentNumber}</p>
            </div>
          </div>

          {/* Challenge Images Grid */}
          <div className="border rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <CameraIcon className="h-5 w-5" />
              {t('verification.capturedChallenges') || 'Captured Challenge Images'}
              {totalChallenges > 0 && (
                <span className="text-sm text-gray-500">({totalChallenges} {t('verification.challenges') || 'challenges'})</span>
              )}
            </h4>

            {isLoadingImage ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : challengeImages.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {challengeImages.map((challenge, idx) => (
                  <div key={challenge.index} className="flex flex-col items-center">
                    <button
                      onClick={() => setFullscreenIndex(idx)}
                      className="relative w-full group"
                    >
                      <img
                        src={challenge.image}
                        alt={getChallengeLabel(challenge.index)}
                        className="w-full aspect-square object-cover rounded-lg border-2 border-gray-200 group-hover:border-primary-400 transition-colors"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors rounded-lg flex items-center justify-center">
                        <ArrowsPointingOutIcon className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </button>
                    <span className="mt-2 text-xs font-medium text-gray-600 text-center">
                      {getChallengeLabel(challenge.index)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 bg-gray-50 rounded-lg flex flex-col items-center justify-center text-gray-400 text-center">
                <CameraIcon className="h-12 w-12 mb-2" />
                <span className="text-sm">{t('verification.imageNotAvailable')}</span>
                <span className="text-xs mt-1">{t('verification.reRegisterForImage') || 'Student needs to re-register for images'}</span>
              </div>
            )}
          </div>

          {/* Registration Status */}
          <div className="border rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">
              {t('verification.registrationDetails')}
            </h4>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">{t('common.status')}:</span>
                <span className="px-2 py-1 text-sm font-medium rounded bg-green-100 text-green-700 flex items-center gap-1">
                  <CheckCircleIcon className="h-4 w-4" />
                  {t('verification.faceRegistered')}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-600">{t('verification.registeredAt')}:</span>
                <span className="text-gray-900">
                  {student.faceEnrolledAt && !isNaN(new Date(student.faceEnrolledAt).getTime())
                    ? new Date(student.faceEnrolledAt).toLocaleString()
                    : '-'}
                </span>
              </div>

              {totalChallenges > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">{t('verification.totalChallenges') || 'Total Challenges'}:</span>
                  <span className="text-gray-900">{totalChallenges}</span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between gap-3 pt-4 border-t">
            <Button
              variant="danger"
              onClick={onDelete}
              leftIcon={<TrashIcon className="h-4 w-4" />}
            >
              {t('verification.adminDeleteFace') || 'Delete Face Registration'}
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
            >
              {t('common.close')}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

const AdminStudentsPage: React.FC = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [deleteStudent, setDeleteStudent] = useState<Student | null>(null);
  const [viewFaceStudent, setViewFaceStudent] = useState<Student | null>(null);
  const [deleteFaceStudent, setDeleteFaceStudent] = useState<Student | null>(null);

  // Fetch students
  const { data, isLoading, error } = useQuery({
    queryKey: ['students', { search: searchQuery, isActive: statusFilter === 'all' ? undefined : statusFilter === 'active', page }],
    queryFn: () => studentService.getStudents({
      search: searchQuery || undefined,
      isActive: statusFilter === 'all' ? undefined : statusFilter === 'active',
      page,
      limit: 20,
    }),
  });

  // Create student mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateStudentData) => studentService.createStudent(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setShowAddModal(false);
      toast.success(t('student.createSuccess') || 'Student created successfully');
      createForm.reset();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create student');
    },
  });

  // Update student mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateStudentData }) =>
      studentService.updateStudent(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setEditStudent(null);
      toast.success(t('student.updateSuccess') || 'Student updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update student');
    },
  });

  // Delete student mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => studentService.deleteStudent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setDeleteStudent(null);
      toast.success(t('student.deleteSuccess') || 'Student deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete student');
    },
  });

  // Toggle status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      isActive ? studentService.deactivateStudent(id) : studentService.activateStudent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success('Student status updated');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update status');
    },
  });

  // Delete face registration mutation (Admin only)
  const deleteFaceMutation = useMutation({
    mutationFn: (studentId: string) => verificationService.adminDeleteFace(studentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setDeleteFaceStudent(null);
      setViewFaceStudent(null);
      toast.success(t('verification.faceDeleted') || 'Face registration deleted');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete face registration');
    },
  });

  // Form for creating student
  const createForm = useForm<CreateStudentFormData>({
    resolver: zodResolver(createStudentSchema),
  });

  // Form for editing student
  const editForm = useForm<UpdateStudentFormData>({
    resolver: zodResolver(updateStudentSchema),
  });

  // Handle edit modal open
  const handleEditOpen = (student: Student) => {
    setEditStudent(student);
    editForm.reset({
      nameAr: student.nameAr,
      nameEn: student.nameEn,
      phone: student.phone || '',
    });
  };

  // Handle create submit
  const onCreateSubmit = (data: CreateStudentFormData) => {
    createMutation.mutate(data);
  };

  // Handle edit submit
  const onEditSubmit = (data: UpdateStudentFormData) => {
    if (editStudent) {
      updateMutation.mutate({ id: editStudent.id, data });
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

  const students = data?.data || [];
  const totalPages = data?.meta?.totalPages || 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('student.title')}</h1>
          <p className="text-gray-500 mt-1">
            {data?.meta?.total || 0} {t('student.title')}
          </p>
        </div>
        <Button
          leftIcon={<PlusCircleIcon className="h-5 w-5" />}
          onClick={() => setShowAddModal(true)}
        >
          {t('student.addStudent')}
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

      {/* Students Table */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-start py-3 px-4 text-sm font-medium text-gray-500">
                  {t('common.name')}
                </th>
                <th className="text-start py-3 px-4 text-sm font-medium text-gray-500">
                  {t('auth.studentId')}
                </th>
                <th className="text-start py-3 px-4 text-sm font-medium text-gray-500">
                  {t('common.email')}
                </th>
                <th className="text-start py-3 px-4 text-sm font-medium text-gray-500">
                  {t('common.phone')}
                </th>
                <th className="text-start py-3 px-4 text-sm font-medium text-gray-500">
                  {t('common.status')}
                </th>
                <th className="text-start py-3 px-4 text-sm font-medium text-gray-500">
                  {t('verification.faceRegistration')}
                </th>
                <th className="text-start py-3 px-4 text-sm font-medium text-gray-500">
                  {t('common.actions')}
                </th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr
                  key={student.id}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                        <span className="text-primary-700 font-medium">
                          {student.nameEn?.charAt(0) || 'S'}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {student.nameEn}
                        </p>
                        <p className="text-sm text-gray-500">
                          {student.nameAr}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {student.studentNumber}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {student.user?.email}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {student.phone || '-'}
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => toggleStatusMutation.mutate({
                        id: student.id,
                        isActive: student.user?.isActive || false
                      })}
                      className={`px-2 py-1 text-xs font-medium rounded flex items-center gap-1 ${
                        student.user?.isActive
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {student.user?.isActive ? (
                        <CheckCircleIcon className="h-3 w-3" />
                      ) : (
                        <XCircleIcon className="h-3 w-3" />
                      )}
                      {student.user?.isActive ? t('common.active') : t('common.inactive')}
                    </button>
                  </td>
                  <td className="py-3 px-4">
                    {student.faceEnrolledAt ? (
                      <button
                        onClick={() => setViewFaceStudent(student)}
                        className="px-2 py-1 text-xs font-medium rounded flex items-center gap-1 bg-green-100 text-green-700 hover:bg-green-200"
                      >
                        <CameraIcon className="h-3 w-3" />
                        {t('verification.faceRegistered')}
                      </button>
                    ) : (
                      <span className="px-2 py-1 text-xs font-medium rounded flex items-center gap-1 bg-yellow-100 text-yellow-700">
                        <XCircleIcon className="h-3 w-3" />
                        {t('verification.faceNotRegistered')}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditOpen(student)}
                      >
                        <PencilIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteStudent(student)}
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

        {students.length === 0 && (
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
        title={t('student.addStudent')}
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
          <Input
            label={t('auth.studentId')}
            leftIcon={<IdentificationIcon className="h-5 w-5" />}
            error={createForm.formState.errors.studentNumber?.message}
            {...createForm.register('studentNumber')}
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
        isOpen={!!editStudent}
        onClose={() => setEditStudent(null)}
        title={t('student.editStudent')}
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
            label={t('common.phone')}
            {...editForm.register('phone')}
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditStudent(null)}
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
        isOpen={!!deleteStudent}
        onClose={() => setDeleteStudent(null)}
        onConfirm={() => {
          if (deleteStudent) {
            deleteMutation.mutate(deleteStudent.id);
          }
        }}
        title={t('student.deleteStudent')}
        message={`${t('student.deleteConfirm')}: ${deleteStudent?.nameEn}?`}
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
        variant="danger"
      />

      {/* Face Registration Details Modal */}
      <FaceRegistrationModal
        student={viewFaceStudent}
        onClose={() => setViewFaceStudent(null)}
        onDelete={() => setDeleteFaceStudent(viewFaceStudent)}
      />

      {/* Delete Face Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteFaceStudent}
        onClose={() => setDeleteFaceStudent(null)}
        onConfirm={() => {
          if (deleteFaceStudent) {
            deleteFaceMutation.mutate(deleteFaceStudent.id);
          }
        }}
        title={t('verification.adminDeleteFace') || 'Delete Face Registration'}
        message={`${t('verification.confirmAdminDelete') || 'Are you sure you want to delete the face registration for'} ${deleteFaceStudent?.nameEn}?`}
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
        isLoading={deleteFaceMutation.isPending}
        variant="danger"
      />
    </div>
  );
};

export default AdminStudentsPage;
