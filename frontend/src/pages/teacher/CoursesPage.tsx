import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import {
  BookOpenIcon,
  MagnifyingGlassIcon,
  UsersIcon,
  AcademicCapIcon,
} from '@heroicons/react/24/outline';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { PageLoading } from '../../components/ui/Loading';
import { courseService, Course } from '../../services/course.service';
import CourseEnrollmentManager from '../../components/admin/CourseEnrollmentManager';

const TeacherCoursesPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';

  const [searchQuery, setSearchQuery] = useState('');
  const [enrollmentCourse, setEnrollmentCourse] = useState<Course | null>(null);

  // Fetch teacher's courses
  const { data, isLoading, error } = useQuery({
    queryKey: ['teacherCourses', { search: searchQuery }],
    queryFn: () => courseService.getMyCourses({
      search: searchQuery || undefined,
      limit: 50,
    }),
  });

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('teacher.assignedCourses')}</h1>
          <p className="text-gray-500 mt-1">
            {courses.length} {t('course.title')}
          </p>
        </div>
      </div>

      {/* Search */}
      <Card padding="sm">
        <Input
          placeholder={t('common.search')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          leftIcon={<MagnifyingGlassIcon className="h-5 w-5" />}
        />
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
                <span
                  className={`px-2 py-1 text-xs font-medium rounded ${
                    course.isActive
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {course.isActive ? t('common.active') : t('common.inactive')}
                </span>
              </div>

              <div className="mb-4">
                <p className="text-sm text-primary-600 font-medium">
                  {course.code}
                </p>
                <h3 className="text-lg font-semibold text-gray-900 mt-1">
                  {isArabic ? course.nameAr : course.nameEn}
                </h3>
                <p className="text-sm text-gray-500">
                  {isArabic ? course.nameEn : course.nameAr}
                </p>
                {course.descriptionEn && (
                  <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                    {isArabic ? course.descriptionAr : course.descriptionEn}
                  </p>
                )}
              </div>

              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <div className="flex items-center gap-2">
                  <AcademicCapIcon className="h-4 w-4" />
                  <span>{course.creditHours} {t('course.creditHours')}</span>
                </div>
                <div className="text-xs text-gray-400">
                  {course.semester} {course.academicYear}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setEnrollmentCourse(course)}
                  leftIcon={<UsersIcon className="h-4 w-4" />}
                >
                  {t('course.manageStudents')}
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
            <p className="text-gray-500">
              {t('teacher.noCourses') || 'No courses assigned to you'}
            </p>
          </div>
        </Card>
      )}

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

export default TeacherCoursesPage;
