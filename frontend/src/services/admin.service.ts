import api from './api';

export interface RecentActivity {
  id: string;
  type: 'student_registered' | 'teacher_registered' | 'exam_created' | 'exam_completed';
  description: string;
  timestamp: string;
}

export interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalCourses: number;
  totalExams: number;
  activeExams: number;
  completedExams: number;
  passRate: number;
  recentActivity: RecentActivity[];
}

export const adminService = {
  /**
   * Get dashboard statistics
   */
  async getDashboardStats(): Promise<DashboardStats> {
    const response = await api.get<DashboardStats>('/admin/stats');
    return response.data;
  },
};

export default adminService;
