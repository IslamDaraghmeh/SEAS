import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  HomeIcon,
  AcademicCapIcon,
  ChartBarIcon,
  UsersIcon,
  BookOpenIcon,
  PlusCircleIcon,
  EyeIcon,
  XMarkIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  UserIcon,
  RectangleStackIcon,
  PresentationChartLineIcon,
} from '@heroicons/react/24/outline';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  userRole: 'student' | 'teacher' | 'admin';
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, userRole }) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar' || i18n.dir() === 'rtl';

  // Navigation items based on user role
  const getNavItems = (): NavItem[] => {
    const baseRoute = `/${userRole}`;
    switch (userRole) {
      case 'student':
        return [
          { name: t('nav.dashboard'), href: '/student/dashboard', icon: HomeIcon },
          { name: t('nav.exams'), href: '/student/exams', icon: AcademicCapIcon },
          { name: t('nav.results'), href: '/student/results', icon: ChartBarIcon },
          { name: t('nav.faceRegistration'), href: '/student/face-registration', icon: UserCircleIcon },
        ];
      case 'teacher':
        return [
          { name: t('nav.dashboard'), href: '/teacher/dashboard', icon: HomeIcon },
          { name: t('nav.courses'), href: '/teacher/courses', icon: BookOpenIcon },
          { name: t('nav.exams'), href: '/teacher/exams', icon: AcademicCapIcon },
          { name: t('nav.createExam'), href: '/teacher/exams/create', icon: PlusCircleIcon },
          { name: t('nav.questionBank'), href: '/teacher/question-bank', icon: RectangleStackIcon },
          { name: t('nav.monitoring'), href: '/teacher/monitoring', icon: EyeIcon },
        ];
      case 'admin':
        return [
          { name: t('nav.dashboard'), href: '/admin/dashboard', icon: HomeIcon },
          { name: t('nav.students'), href: '/admin/students', icon: UsersIcon },
          { name: t('nav.teachers'), href: '/admin/teachers', icon: UsersIcon },
          { name: t('nav.courses'), href: '/admin/courses', icon: BookOpenIcon },
          { name: t('nav.analytics'), href: '/admin/analytics', icon: PresentationChartLineIcon },
        ];
      default:
        return [];
    }
  };

  // Account navigation items (shared across all roles)
  const getAccountItems = (): NavItem[] => {
    const baseRoute = `/${userRole}`;
    return [
      { name: t('nav.profile'), href: `${baseRoute}/profile`, icon: UserIcon },
      { name: t('nav.settings'), href: `${baseRoute}/settings`, icon: Cog6ToothIcon },
    ];
  };

  const navItems = getNavItems();
  const accountItems = getAccountItems();

  const getRoleBadgeColor = () => {
    switch (userRole) {
      case 'admin':
        return 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800';
      case 'teacher':
        return 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800';
      default:
        return 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800';
    }
  };

  return (
    <>
      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 z-30
          w-72 bg-white dark:bg-gray-800 border-e border-gray-200 dark:border-gray-700
          transition-transform duration-300 ease-in-out
          lg:!translate-x-0
          flex flex-col
        `}
        style={{
          left: isRTL ? 'auto' : '0',
          right: isRTL ? '0' : 'auto',
          transform: isOpen
            ? 'translateX(0)'
            : isRTL
              ? 'translateX(100%)'
              : 'translateX(-100%)',
        }}
      >
        {/* Sidebar Header with SEAS Logo */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <div>
              <h1 className="text-gray-900 dark:text-white font-bold text-lg tracking-tight">SEAS</h1>
              <p className="text-gray-400 dark:text-gray-500 text-[10px] font-medium uppercase tracking-wider">
                {isRTL ? 'نظام الاختبارات' : 'Exam System'}
              </p>
            </div>
          </div>
          {/* Mobile close button */}
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-lg text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Role Badge */}
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
          <span className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-full border ${getRoleBadgeColor()}`}>
            {t(`auth.${userRole}`)}
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 overflow-y-auto">
          {/* Main Navigation */}
          <div className="space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                onClick={onClose}
                className={({ isActive }) =>
                  `group flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 font-medium shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-200'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span className={`p-1.5 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-primary-100 dark:bg-primary-900/50'
                        : 'bg-gray-100 dark:bg-gray-700 group-hover:bg-gray-200 dark:group-hover:bg-gray-600'
                    }`}>
                      <item.icon className="h-5 w-5" />
                    </span>
                    <span className="text-sm">{item.name}</span>
                  </>
                )}
              </NavLink>
            ))}
          </div>

          {/* Divider */}
          <div className="my-4 border-t border-gray-200 dark:border-gray-700" />

          {/* Account Navigation */}
          <div className="space-y-1">
            <p className="px-4 text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
              {t('settings.account')}
            </p>
            {accountItems.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                onClick={onClose}
                className={({ isActive }) =>
                  `group flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 font-medium shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-200'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span className={`p-1.5 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-primary-100 dark:bg-primary-900/50'
                        : 'bg-gray-100 dark:bg-gray-700 group-hover:bg-gray-200 dark:group-hover:bg-gray-600'
                    }`}>
                      <item.icon className="h-5 w-5" />
                    </span>
                    <span className="text-sm">{item.name}</span>
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50">
          <div className="flex items-center justify-center gap-2">
            <div className="w-6 h-6 bg-primary-100 dark:bg-primary-900/50 rounded-md flex items-center justify-center">
              <span className="text-primary-600 dark:text-primary-400 font-bold text-xs">S</span>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                {isRTL ? 'نظام الحضور الذكي للاختبارات' : 'Smart Exam Attendance System'}
              </p>
              <p className="text-[10px] text-gray-300 dark:text-gray-600">v1.0.0</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
