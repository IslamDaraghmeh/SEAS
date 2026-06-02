import api, { PaginatedResponse } from './api';

export interface Student {
  id: string;
  userId: string;
  studentNumber: string;
  nameAr: string;
  nameEn: string;
  phone?: string;
  faceEnrolledAt?: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    email: string;
    isActive: boolean;
    lastLoginAt?: string;
  };
  enrollments?: Array<{
    id: string;
    courseId: string;
    course?: {
      code: string;
      nameEn: string;
    };
  }>;
}

export interface CreateStudentData {
  email: string;
  password: string;
  studentNumber: string;
  nameAr: string;
  nameEn: string;
  phone?: string;
}

export interface UpdateStudentData {
  nameAr?: string;
  nameEn?: string;
  phone?: string;
}

export interface StudentFilters {
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export const studentService = {
  /**
   * Get all students with pagination and filters
   */
  async getStudents(filters?: StudentFilters): Promise<PaginatedResponse<Student>> {
    const response = await api.get<PaginatedResponse<Student>>('/students', {
      params: filters,
    });
    return response.data;
  },

  /**
   * Get a student by ID
   */
  async getStudent(id: string): Promise<Student> {
    const response = await api.get<Student>(`/students/${id}`);
    return response.data;
  },

  /**
   * Get a student by student number
   */
  async getStudentByNumber(studentNumber: string): Promise<Student> {
    const response = await api.get<Student>(`/students/number/${studentNumber}`);
    return response.data;
  },

  /**
   * Create a new student
   */
  async createStudent(data: CreateStudentData): Promise<Student> {
    const response = await api.post<Student>('/students', data);
    return response.data;
  },

  /**
   * Update a student
   */
  async updateStudent(id: string, data: UpdateStudentData): Promise<Student> {
    const response = await api.patch<Student>(`/students/${id}`, data);
    return response.data;
  },

  /**
   * Delete a student
   */
  async deleteStudent(id: string): Promise<void> {
    await api.delete(`/students/${id}`);
  },

  /**
   * Deactivate a student account
   */
  async deactivateStudent(id: string): Promise<Student> {
    const response = await api.patch<Student>(`/students/${id}/deactivate`);
    return response.data;
  },

  /**
   * Activate a student account
   */
  async activateStudent(id: string): Promise<Student> {
    const response = await api.patch<Student>(`/students/${id}/activate`);
    return response.data;
  },
};

export default studentService;
