import api, { PaginatedResponse } from './api';

export interface Course {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  descriptionAr?: string;
  descriptionEn?: string;
  creditHours: number;
  semester: string;
  academicYear: string;
  isActive: boolean;
  teacherId: string;
  teacher?: {
    id: string;
    user: {
      email: string;
    };
  };
  createdAt: string;
  updatedAt: string;
}

export interface CourseFilters {
  search?: string;
  semester?: string;
  academicYear?: string;
  isActive?: boolean;
  teacherId?: string;
  page?: number;
  limit?: number;
}

export interface CreateCourseData {
  code: string;
  nameAr: string;
  nameEn: string;
  descriptionAr?: string;
  descriptionEn?: string;
  creditHours: number;
  semester: string;
  academicYear: string;
  teacherId: string;
}

export interface UpdateCourseData {
  code?: string;
  nameAr?: string;
  nameEn?: string;
  descriptionAr?: string;
  descriptionEn?: string;
  creditHours?: number;
  semester?: string;
  academicYear?: string;
  teacherId?: string;
  isActive?: boolean;
}

export const courseService = {
  /**
   * Get all courses (admin/teacher)
   */
  async getCourses(filters?: CourseFilters): Promise<PaginatedResponse<Course>> {
    const response = await api.get<PaginatedResponse<Course>>('/courses', {
      params: filters,
    });
    return response.data;
  },

  /**
   * Get teacher's courses
   */
  async getMyCourses(filters?: CourseFilters): Promise<PaginatedResponse<Course>> {
    const response = await api.get<PaginatedResponse<Course>>('/courses/my-courses', {
      params: filters,
    });
    return response.data;
  },

  /**
   * Get course by ID
   */
  async getCourse(courseId: string): Promise<Course> {
    const response = await api.get<Course>(`/courses/${courseId}`);
    return response.data;
  },

  /**
   * Get student's enrolled courses
   */
  async getStudentCourses(studentId: string): Promise<Course[]> {
    const response = await api.get<Course[]>(`/courses/student/${studentId}`);
    return response.data;
  },

  /**
   * Create a new course
   */
  async createCourse(data: CreateCourseData): Promise<Course> {
    const response = await api.post<Course>('/courses', data);
    return response.data;
  },

  /**
   * Update a course
   */
  async updateCourse(id: string, data: UpdateCourseData): Promise<Course> {
    const response = await api.patch<Course>(`/courses/${id}`, data);
    return response.data;
  },

  /**
   * Delete a course
   */
  async deleteCourse(id: string): Promise<void> {
    await api.delete(`/courses/${id}`);
  },

  /**
   * Activate a course
   */
  async activateCourse(id: string): Promise<Course> {
    const response = await api.patch<Course>(`/courses/${id}`, { isActive: true });
    return response.data;
  },

  /**
   * Deactivate a course
   */
  async deactivateCourse(id: string): Promise<Course> {
    const response = await api.patch<Course>(`/courses/${id}`, { isActive: false });
    return response.data;
  },

  // ============= ENROLLMENT MANAGEMENT =============

  /**
   * Get enrolled students for a course
   */
  async getEnrolledStudents(courseId: string): Promise<EnrolledStudent[]> {
    const response = await api.get<EnrolledStudent[]>(`/courses/${courseId}/students`);
    return response.data;
  },

  /**
   * Enroll students in a course
   */
  async enrollStudents(courseId: string, studentIds: string[]): Promise<EnrollmentResult> {
    const response = await api.post<EnrollmentResult>(`/courses/${courseId}/enroll`, { studentIds });
    return response.data;
  },

  /**
   * Unenroll students from a course
   */
  async unenrollStudents(courseId: string, studentIds: string[]): Promise<{ message: string; unenrolled: number }> {
    const response = await api.post<{ message: string; unenrolled: number }>(`/courses/${courseId}/unenroll`, { studentIds });
    return response.data;
  },
};

// Enrollment types
export interface EnrolledStudent {
  id: string;
  studentNumber: string;
  nameAr: string;
  nameEn: string;
  faceEnrolledAt: string | null;
  enrolledAt: string;
  user: {
    email: string;
    isActive: boolean;
  };
}

export interface EnrollmentResult {
  message: string;
  enrolled: number;
  alreadyEnrolled: number;
}

export default courseService;
