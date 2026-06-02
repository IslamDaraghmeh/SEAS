import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  UsersIcon,
  PlusCircleIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  XCircleIcon,
  CameraIcon,
} from '@heroicons/react/24/outline';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { SkeletonCard } from '../ui/Loading';
import courseService, { Course, EnrolledStudent } from '../../services/course.service';
import { studentService, Student } from '../../services/student.service';
import toast from 'react-hot-toast';

interface CourseEnrollmentManagerProps {
  course: Course;
  isOpen: boolean;
  onClose: () => void;
}

const CourseEnrollmentManager: React.FC<CourseEnrollmentManagerProps> = ({
  course,
  isOpen,
  onClose,
}) => {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const isArabic = i18n.language === 'ar';

  const [activeTab, setActiveTab] = useState<'enrolled' | 'add'>('enrolled');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

  // Fetch enrolled students
  const { data: enrolledStudents, isLoading: enrolledLoading } = useQuery({
    queryKey: ['enrolledStudents', course.id],
    queryFn: () => courseService.getEnrolledStudents(course.id),
    enabled: isOpen,
  });

  // Fetch all students for enrollment
  const { data: allStudentsData, isLoading: studentsLoading } = useQuery({
    queryKey: ['allStudents'],
    queryFn: () => studentService.getStudents({ limit: 500, isActive: true }),
    enabled: isOpen && activeTab === 'add',
  });

  const allStudents = allStudentsData?.data || [];
  const enrolledIds = new Set(enrolledStudents?.map(s => s.id) || []);
  const availableStudents = allStudents.filter(s => !enrolledIds.has(s.id));

  // Enroll mutation
  const enrollMutation = useMutation({
    mutationFn: (studentIds: string[]) => courseService.enrollStudents(course.id, studentIds),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['enrolledStudents', course.id] });
      setSelectedStudents([]);
      toast.success(`${result.enrolled} ${t('course.studentsEnrolled') || 'students enrolled'}`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to enroll students');
    },
  });

  // Unenroll mutation
  const unenrollMutation = useMutation({
    mutationFn: (studentIds: string[]) => courseService.unenrollStudents(course.id, studentIds),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['enrolledStudents', course.id] });
      setSelectedStudents([]);
      toast.success(`${result.unenrolled} ${t('course.studentsRemoved') || 'students removed'}`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to unenroll students');
    },
  });

  // Filter students by search
  const filteredEnrolled = enrolledStudents?.filter(student =>
    student.nameEn?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.nameAr?.includes(searchQuery) ||
    student.studentNumber?.includes(searchQuery) ||
    student.user?.email?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const filteredAvailable = availableStudents.filter(student =>
    student.nameEn?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.nameAr?.includes(searchQuery) ||
    student.studentNumber?.includes(searchQuery) ||
    student.user?.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle selection
  const toggleSelection = (studentId: string) => {
    setSelectedStudents(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const selectAll = (students: { id: string }[]) => {
    setSelectedStudents(students.map(s => s.id));
  };

  const clearSelection = () => {
    setSelectedStudents([]);
  };

  const handleEnroll = () => {
    if (selectedStudents.length > 0) {
      enrollMutation.mutate(selectedStudents);
    }
  };

  const handleUnenroll = () => {
    if (selectedStudents.length > 0) {
      unenrollMutation.mutate(selectedStudents);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${t('course.manageStudents')} - ${isArabic ? course.nameAr : course.nameEn}`}
      size="xl"
    >
      <div className="space-y-4">
        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => { setActiveTab('enrolled'); setSelectedStudents([]); setSearchQuery(''); }}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'enrolled'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <UsersIcon className="h-4 w-4 inline-block me-2" />
            {t('course.enrolledStudents')} ({enrolledStudents?.length || 0})
          </button>
          <button
            onClick={() => { setActiveTab('add'); setSelectedStudents([]); setSearchQuery(''); }}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'add'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <PlusCircleIcon className="h-4 w-4 inline-block me-2" />
            {t('course.addStudents')}
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <MagnifyingGlassIcon className="h-5 w-5 absolute start-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            type="text"
            placeholder={t('common.search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="ps-10"
          />
        </div>

        {/* Content */}
        {activeTab === 'enrolled' ? (
          <div className="space-y-3">
            {/* Actions Bar */}
            {selectedStudents.length > 0 && (
              <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                <span className="text-sm text-gray-600">
                  {selectedStudents.length} {t('common.selected') || 'selected'}
                </span>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={clearSelection}>
                    {t('common.clear')}
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={handleUnenroll}
                    isLoading={unenrollMutation.isPending}
                    leftIcon={<TrashIcon className="h-4 w-4" />}
                  >
                    {t('course.removeSelected') || 'Remove Selected'}
                  </Button>
                </div>
              </div>
            )}

            {/* Student List */}
            {enrolledLoading ? (
              <div className="space-y-2">
                <SkeletonCard />
                <SkeletonCard />
              </div>
            ) : filteredEnrolled.length > 0 ? (
              <div className="max-h-96 overflow-y-auto border rounded-lg divide-y">
                {filteredEnrolled.map((student) => (
                  <div
                    key={student.id}
                    className={`flex items-center gap-4 p-3 hover:bg-gray-50 cursor-pointer ${
                      selectedStudents.includes(student.id) ? 'bg-primary-50' : ''
                    }`}
                    onClick={() => toggleSelection(student.id)}
                  >
                    <input
                      type="checkbox"
                      checked={selectedStudents.includes(student.id)}
                      onChange={() => toggleSelection(student.id)}
                      className="h-4 w-4 rounded border-gray-300 text-primary-600"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {isArabic ? student.nameAr : student.nameEn}
                      </p>
                      <p className="text-sm text-gray-500">
                        {student.studentNumber} • {student.user?.email}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {student.faceEnrolledAt ? (
                        <span className="flex items-center gap-1 text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                          <CameraIcon className="h-3 w-3" />
                          {t('verification.faceRegistered')}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-yellow-600 bg-yellow-100 px-2 py-1 rounded">
                          <XCircleIcon className="h-3 w-3" />
                          {t('verification.faceNotRegistered')}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <UsersIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>{t('course.noEnrolledStudents') || 'No students enrolled in this course'}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {/* Actions Bar */}
            <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">
                  {filteredAvailable.length} {t('common.available') || 'available'}
                </span>
                {selectedStudents.length > 0 && (
                  <span className="text-sm text-primary-600 font-medium">
                    {selectedStudents.length} {t('common.selected') || 'selected'}
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                {selectedStudents.length > 0 ? (
                  <>
                    <Button variant="ghost" size="sm" onClick={clearSelection}>
                      {t('common.clear')}
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleEnroll}
                      isLoading={enrollMutation.isPending}
                      leftIcon={<PlusCircleIcon className="h-4 w-4" />}
                    >
                      {t('course.enrollSelected') || 'Enroll Selected'}
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => selectAll(filteredAvailable)}
                  >
                    {t('common.selectAll') || 'Select All'}
                  </Button>
                )}
              </div>
            </div>

            {/* Student List */}
            {studentsLoading ? (
              <div className="space-y-2">
                <SkeletonCard />
                <SkeletonCard />
              </div>
            ) : filteredAvailable.length > 0 ? (
              <div className="max-h-96 overflow-y-auto border rounded-lg divide-y">
                {filteredAvailable.map((student) => (
                  <div
                    key={student.id}
                    className={`flex items-center gap-4 p-3 hover:bg-gray-50 cursor-pointer ${
                      selectedStudents.includes(student.id) ? 'bg-primary-50' : ''
                    }`}
                    onClick={() => toggleSelection(student.id)}
                  >
                    <input
                      type="checkbox"
                      checked={selectedStudents.includes(student.id)}
                      onChange={() => toggleSelection(student.id)}
                      className="h-4 w-4 rounded border-gray-300 text-primary-600"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {isArabic ? student.nameAr : student.nameEn}
                      </p>
                      <p className="text-sm text-gray-500">
                        {student.studentNumber} • {student.user?.email}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {student.faceEnrolledAt ? (
                        <span className="flex items-center gap-1 text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                          <CameraIcon className="h-3 w-3" />
                          {t('verification.faceRegistered')}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-yellow-600 bg-yellow-100 px-2 py-1 rounded">
                          <XCircleIcon className="h-3 w-3" />
                          {t('verification.faceNotRegistered')}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <CheckCircleIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>{t('course.allStudentsEnrolled') || 'All students are already enrolled'}</p>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            {t('common.close')}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default CourseEnrollmentManager;
