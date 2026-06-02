import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  UsersIcon,
  AcademicCapIcon,
  BookOpenIcon,
  ChartBarIcon,
  UserPlusIcon,
  DocumentPlusIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../hooks/useAuth';
import Card, { StatCard, CardHeader, CardTitle } from '../../components/ui/Card';
import { PageLoading } from '../../components/ui/Loading';
import { adminService, RecentActivity } from '../../services/admin.service';
import { formatDistanceToNow } from 'date-fns';

const getActivityIcon = (type: RecentActivity['type']) => {
  switch (type) {
    case 'student_registered':
      return <UserPlusIcon className="h-5 w-5 text-blue-600" />;
    case 'teacher_registered':
      return <UserPlusIcon className="h-5 w-5 text-green-600" />;
    case 'exam_created':
      return <DocumentPlusIcon className="h-5 w-5 text-purple-600" />;
    case 'exam_completed':
      return <CheckCircleIcon className="h-5 w-5 text-green-600" />;
    default:
      return <UsersIcon className="h-5 w-5 text-primary-600" />;
  }
};

const getActivityBgColor = (type: RecentActivity['type']) => {
  switch (type) {
    case 'student_registered':
      return 'bg-blue-100';
    case 'teacher_registered':
      return 'bg-green-100';
    case 'exam_created':
      return 'bg-purple-100';
    case 'exam_completed':
      return 'bg-green-100';
    default:
      return 'bg-primary-100';
  }
};

const AdminDashboardPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  // Fetch dashboard stats
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => adminService.getDashboardStats(),
    refetchInterval: 60000, // Refresh every minute
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

  const dashboardStats = stats || {
    totalStudents: 0,
    totalTeachers: 0,
    totalCourses: 0,
    totalExams: 0,
    activeExams: 0,
    completedExams: 0,
    passRate: 0,
    recentActivity: [],
  };

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-l from-primary-600 to-primary-700 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">
          {t('dashboard.welcome')}!
        </h1>
        <p className="text-primary-100">{t('common.appName')}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={t('dashboard.totalStudents')}
          value={dashboardStats.totalStudents}
          icon={<UsersIcon className="h-6 w-6" />}
        />
        <StatCard
          title={t('dashboard.totalTeachers')}
          value={dashboardStats.totalTeachers}
          icon={<UsersIcon className="h-6 w-6" />}
        />
        <StatCard
          title={t('dashboard.totalCourses')}
          value={dashboardStats.totalCourses}
          icon={<BookOpenIcon className="h-6 w-6" />}
        />
        <StatCard
          title={t('dashboard.totalExams')}
          value={dashboardStats.totalExams}
          icon={<AcademicCapIcon className="h-6 w-6" />}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to="/admin/students">
          <Card hoverable className="h-full">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <UsersIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{t('nav.students')}</h3>
                <p className="text-sm text-gray-500">
                  {dashboardStats.totalStudents} {t('student.title')}
                </p>
              </div>
            </div>
          </Card>
        </Link>
        <Link to="/admin/teachers">
          <Card hoverable className="h-full">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <UsersIcon className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{t('nav.teachers')}</h3>
                <p className="text-sm text-gray-500">
                  {dashboardStats.totalTeachers} {t('teacher.title')}
                </p>
              </div>
            </div>
          </Card>
        </Link>
        <Link to="/admin/courses">
          <Card hoverable className="h-full">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <BookOpenIcon className="h-8 w-8 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{t('nav.courses')}</h3>
                <p className="text-sm text-gray-500">
                  {dashboardStats.totalCourses} {t('course.title')}
                </p>
              </div>
            </div>
          </Card>
        </Link>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Stats */}
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.overview')}</CardTitle>
          </CardHeader>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <AcademicCapIcon className="h-6 w-6 text-primary-600" />
                <span className="text-gray-700">{t('dashboard.activeExams')}</span>
              </div>
              <span className="text-xl font-bold text-gray-900">
                {dashboardStats.activeExams}
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <ChartBarIcon className="h-6 w-6 text-green-600" />
                <span className="text-gray-700">{t('dashboard.passRate')}</span>
              </div>
              <span className="text-xl font-bold text-green-600">
                {dashboardStats.passRate}%
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <AcademicCapIcon className="h-6 w-6 text-blue-600" />
                <span className="text-gray-700">{t('dashboard.completedExams')}</span>
              </div>
              <span className="text-xl font-bold text-gray-900">
                {dashboardStats.completedExams}
              </span>
            </div>
          </div>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.recentActivity')}</CardTitle>
          </CardHeader>

          <div className="space-y-4">
            {dashboardStats.recentActivity.length > 0 ? (
              dashboardStats.recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-lg"
                >
                  <div
                    className={`w-10 h-10 ${getActivityBgColor(activity.type)} rounded-full flex items-center justify-center`}
                  >
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {activity.description}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                {t('common.noData')}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
