import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { useAuth } from '../../hooks/useAuth';

const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Navbar - only visible on mobile, hidden on desktop */}
      <div className="lg:hidden">
        <Navbar onMenuClick={toggleSidebar} />
      </div>

      <div className="flex">
        {/* Sidebar */}
        <Sidebar
          isOpen={sidebarOpen}
          onClose={closeSidebar}
          userRole={user?.role || 'student'}
        />

        {/* Main Content */}
        <main className="flex-1 min-h-screen">
          {/* Desktop header spacer - matches sidebar header */}
          <div className="hidden lg:block h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
            <div className="h-full px-8 flex items-center justify-end gap-4">
              {/* Import LanguageSwitch and user menu for desktop */}
              <DesktopHeader />
            </div>
          </div>

          {/* Mobile spacer */}
          <div className="lg:hidden h-16" />

          {/* Page content */}
          <div className="p-4 md:p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden backdrop-blur-sm"
          onClick={closeSidebar}
        />
      )}
    </div>
  );
};

// Desktop header component with user menu
import { Menu, Transition } from '@headlessui/react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import LanguageSwitch from './LanguageSwitch';
import ThemeToggle from './ThemeToggle';

const DesktopHeader: React.FC = () => {
  const { t } = useTranslation();
  const { user, logout } = useAuth();

  const getUserInitials = () => {
    const first = user?.firstName?.charAt(0) || '';
    const last = user?.lastName?.charAt(0) || '';
    return (first + last).toUpperCase() || 'U';
  };

  const getRoleColor = () => {
    switch (user?.role) {
      case 'admin':
        return 'bg-red-500';
      case 'teacher':
        return 'bg-blue-500';
      default:
        return 'bg-green-500';
    }
  };

  return (
    <>
      {/* Theme Toggle */}
      <ThemeToggle />

      {/* Language Switch */}
      <LanguageSwitch />

      {/* Divider */}
      <div className="h-8 w-px bg-gray-200 dark:bg-gray-700" />

      {/* User Menu */}
      <Menu as="div" className="relative">
        <Menu.Button className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors">
          {/* User Avatar */}
          <div className="relative">
            <div className={`w-9 h-9 rounded-xl ${getRoleColor()} flex items-center justify-center shadow-sm`}>
              <span className="text-white font-medium text-sm">{getUserInitials()}</span>
            </div>
            <span className="absolute -bottom-0.5 -end-0.5 w-3 h-3 bg-green-400 border-2 border-white dark:border-gray-800 rounded-full" />
          </div>

          {/* User info */}
          <div className="text-start">
            <p className="text-sm font-medium text-gray-900 dark:text-white leading-tight">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight">
              {t(`auth.${user?.role}`)}
            </p>
          </div>

          <ChevronDownIcon className="h-4 w-4 text-gray-400 dark:text-gray-500" />
        </Menu.Button>

        <Transition
          as={React.Fragment}
          enter="transition ease-out duration-200"
          enterFrom="transform opacity-0 scale-95 -translate-y-2"
          enterTo="transform opacity-100 scale-100 translate-y-0"
          leave="transition ease-in duration-150"
          leaveFrom="transform opacity-100 scale-100 translate-y-0"
          leaveTo="transform opacity-0 scale-95 -translate-y-2"
        >
          <Menu.Items className="absolute end-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-2xl shadow-xl ring-1 ring-black/5 dark:ring-gray-700 focus:outline-none z-50 overflow-hidden">
            {/* User info header */}
            <div className="px-4 py-4 bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-700 dark:to-gray-700/50 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl ${getRoleColor()} flex items-center justify-center shadow-sm`}>
                  <span className="text-white font-semibold">{getUserInitials()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
                  <span className="inline-flex items-center mt-1 px-2 py-0.5 text-[10px] font-medium bg-white dark:bg-gray-600 text-gray-600 dark:text-gray-200 rounded-md border border-gray-200 dark:border-gray-500 shadow-sm">
                    {t(`auth.${user?.role}`)}
                  </span>
                </div>
              </div>
            </div>

            {/* Menu items */}
            <div className="p-2">
              <Menu.Item>
                {({ active }) => (
                  <Link
                    to={`/${user?.role}/settings`}
                    className={`flex items-center gap-3 px-3 py-2.5 text-sm rounded-xl transition-colors ${
                      active ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <span className="p-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg">
                      <Cog6ToothIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    </span>
                    {t('nav.settings')}
                  </Link>
                )}
              </Menu.Item>

              <div className="my-2 border-t border-gray-100 dark:border-gray-700" />

              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={logout}
                    className={`flex items-center gap-3 w-full px-3 py-2.5 text-sm rounded-xl transition-colors ${
                      active ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400' : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    <span className={`p-1.5 rounded-lg ${active ? 'bg-red-100 dark:bg-red-900/50' : 'bg-red-50 dark:bg-red-900/30'}`}>
                      <ArrowRightOnRectangleIcon className="h-4 w-4" />
                    </span>
                    {t('auth.logout')}
                  </button>
                )}
              </Menu.Item>
            </div>
          </Menu.Items>
        </Transition>
      </Menu>
    </>
  );
};

export default Layout;
