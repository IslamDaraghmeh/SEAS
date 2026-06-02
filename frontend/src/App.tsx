import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Layout from './components/layout/Layout';
import Loading from './components/ui/Loading';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// Student Pages
import StudentDashboardPage from './pages/student/DashboardPage';
import StudentExamsPage from './pages/student/ExamsPage';
import StudentExamPage from './pages/student/ExamPage';
import StudentResultsPage from './pages/student/ResultsPage';
import FaceRegistrationPage from './pages/student/FaceRegistrationPage';

// Teacher Pages
import TeacherDashboardPage from './pages/teacher/DashboardPage';
import TeacherExamsPage from './pages/teacher/ExamsPage';
import TeacherCoursesPage from './pages/teacher/CoursesPage';
import CreateExamPage from './pages/teacher/CreateExamPage';
import MonitoringPage from './pages/teacher/MonitoringPage';
import ExamResultsPage from './pages/teacher/ExamResultsPage';
import GradingPage from './pages/teacher/GradingPage';
import QuestionBankPage from './pages/teacher/QuestionBankPage';

// Admin Pages
import AdminDashboardPage from './pages/admin/DashboardPage';
import AdminStudentsPage from './pages/admin/StudentsPage';
import AdminTeachersPage from './pages/admin/TeachersPage';
import AdminCoursesPage from './pages/admin/CoursesPage';
import AnalyticsDashboard from './pages/admin/AnalyticsDashboard';

// Common Pages (shared across roles)
import { ProfilePage, SettingsPage } from './pages/common';

// Protected Route Component
interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <Loading fullScreen />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to appropriate dashboard based on role
    const dashboardRoutes: Record<string, string> = {
      student: '/student/dashboard',
      teacher: '/teacher/dashboard',
      admin: '/admin/dashboard',
    };
    return <Navigate to={dashboardRoutes[user.role] || '/login'} replace />;
  }

  return <>{children}</>;
};

// Public Route Component (redirects authenticated users)
interface PublicRouteProps {
  children: React.ReactNode;
}

const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <Loading fullScreen />;
  }

  if (user) {
    const dashboardRoutes: Record<string, string> = {
      student: '/student/dashboard',
      teacher: '/teacher/dashboard',
      admin: '/admin/dashboard',
    };
    return <Navigate to={dashboardRoutes[user.role] || '/student/dashboard'} replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        }
      />

      {/* Student Routes */}
      <Route
        path="/student"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<StudentDashboardPage />} />
        <Route path="exams" element={<StudentExamsPage />} />
        <Route path="exams/:examId" element={<StudentExamPage />} />
        <Route path="results" element={<StudentResultsPage />} />
        <Route path="face-registration" element={<FaceRegistrationPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      {/* Teacher Routes */}
      <Route
        path="/teacher"
        element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<TeacherDashboardPage />} />
        <Route path="courses" element={<TeacherCoursesPage />} />
        <Route path="exams" element={<TeacherExamsPage />} />
        <Route path="exams/create" element={<CreateExamPage />} />
        <Route path="exams/:examId/edit" element={<CreateExamPage />} />
        <Route path="exams/:examId/results" element={<ExamResultsPage />} />
        <Route path="exams/:examId/grade/:attemptId" element={<GradingPage />} />
        <Route path="monitoring" element={<MonitoringPage />} />
        <Route path="monitoring/:examId" element={<MonitoringPage />} />
        <Route path="question-bank" element={<QuestionBankPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      {/* Admin Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboardPage />} />
        <Route path="students" element={<AdminStudentsPage />} />
        <Route path="teachers" element={<AdminTeachersPage />} />
        <Route path="courses" element={<AdminCoursesPage />} />
        <Route path="analytics" element={<AnalyticsDashboard />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      {/* Default Redirect */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
