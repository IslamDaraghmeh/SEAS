import api, { PaginatedResponse } from './api';

export interface Teacher {
  id: string;
  userId: string;
  nameAr: string;
  nameEn: string;
  department?: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    email: string;
    isActive: boolean;
    lastLoginAt?: string;
  };
  courses?: Array<{
    id: string;
    code: string;
    nameEn: string;
  }>;
  _count?: {
    courses: number;
  };
}

export interface CreateTeacherData {
  email: string;
  password: string;
  nameAr: string;
  nameEn: string;
  department?: string;
  phone?: string;
}

export interface UpdateTeacherData {
  nameAr?: string;
  nameEn?: string;
  department?: string;
  phone?: string;
}

export interface TeacherFilters {
  search?: string;
  department?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export const teacherService = {
  /**
   * Get all teachers with pagination and filters
   */
  async getTeachers(filters?: TeacherFilters): Promise<PaginatedResponse<Teacher>> {
    const response = await api.get<PaginatedResponse<Teacher>>('/teachers', {
      params: filters,
    });
    return response.data;
  },

  /**
   * Get a teacher by ID
   */
  async getTeacher(id: string): Promise<Teacher> {
    const response = await api.get<Teacher>(`/teachers/${id}`);
    return response.data;
  },

  /**
   * Create a new teacher
   */
  async createTeacher(data: CreateTeacherData): Promise<Teacher> {
    const response = await api.post<Teacher>('/teachers', data);
    return response.data;
  },

  /**
   * Update a teacher
   */
  async updateTeacher(id: string, data: UpdateTeacherData): Promise<Teacher> {
    const response = await api.patch<Teacher>(`/teachers/${id}`, data);
    return response.data;
  },

  /**
   * Delete a teacher
   */
  async deleteTeacher(id: string): Promise<void> {
    await api.delete(`/teachers/${id}`);
  },

  /**
   * Deactivate a teacher account
   */
  async deactivateTeacher(id: string): Promise<Teacher> {
    const response = await api.patch<Teacher>(`/teachers/${id}/deactivate`);
    return response.data;
  },

  /**
   * Activate a teacher account
   */
  async activateTeacher(id: string): Promise<Teacher> {
    const response = await api.patch<Teacher>(`/teachers/${id}/activate`);
    return response.data;
  },
};

export default teacherService;
