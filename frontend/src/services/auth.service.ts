import api from './api';
import { User, RegisterData } from '../contexts/AuthContext';

interface LoginResponse {
  token: string;
  refreshToken?: string;
  user: User;
}

interface RegisterResponse {
  token: string;
  refreshToken?: string;
  user: User;
}

interface VerifyTokenResponse {
  valid: boolean;
  user: User;
}

interface ResetPasswordResponse {
  success: boolean;
  message: string;
}

/**
 * Authentication service for handling auth-related API calls
 */
export const authService = {
  /**
   * Login with email and password
   */
  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await api.post<{ accessToken: string; refreshToken?: string; user: any }>('/auth/login', {
      email,
      password,
    });

    // Store refresh token if provided
    if (response.data.refreshToken) {
      localStorage.setItem('seas_refresh_token', response.data.refreshToken);
    }

    // Map backend response to frontend format
    return {
      token: response.data.accessToken,
      refreshToken: response.data.refreshToken,
      user: {
        id: response.data.user.id,
        email: response.data.user.email,
        firstName: response.data.user.email.split('@')[0], // Use email prefix as name
        lastName: '',
        role: response.data.user.role.toLowerCase() as 'student' | 'teacher' | 'admin',
      },
    };
  },

  /**
   * Register a new user
   */
  async register(data: RegisterData): Promise<RegisterResponse> {
    const response = await api.post<RegisterResponse>('/auth/register', data);

    // Store refresh token if provided
    if (response.data.refreshToken) {
      localStorage.setItem('seas_refresh_token', response.data.refreshToken);
    }

    return response.data;
  },

  /**
   * Logout current user
   */
  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      // Ignore logout errors
      console.error('Logout error:', error);
    } finally {
      // Clear refresh token
      localStorage.removeItem('seas_refresh_token');
    }
  },

  /**
   * Verify current token
   */
  async verifyToken(): Promise<VerifyTokenResponse> {
    const response = await api.get<{ id: string; email: string; role: string }>('/auth/verify');

    // Map backend response to frontend format
    return {
      valid: true,
      user: {
        id: response.data.id,
        email: response.data.email,
        firstName: response.data.email.split('@')[0],
        lastName: '',
        role: response.data.role.toLowerCase() as 'student' | 'teacher' | 'admin',
      },
    };
  },

  /**
   * Refresh access token
   */
  async refreshToken(): Promise<{ token: string }> {
    const refreshToken = localStorage.getItem('seas_refresh_token');

    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await api.post<{ token: string; refreshToken?: string }>(
      '/auth/refresh',
      { refreshToken }
    );

    // Update refresh token if new one provided
    if (response.data.refreshToken) {
      localStorage.setItem('seas_refresh_token', response.data.refreshToken);
    }

    return response.data;
  },

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<ResetPasswordResponse> {
    const response = await api.post<ResetPasswordResponse>(
      '/auth/forgot-password',
      { email }
    );
    return response.data;
  },

  /**
   * Reset password with token
   */
  async resetPassword(
    token: string,
    newPassword: string
  ): Promise<ResetPasswordResponse> {
    const response = await api.post<ResetPasswordResponse>(
      '/auth/reset-password',
      {
        token,
        newPassword,
      }
    );
    return response.data;
  },

  /**
   * Change password (authenticated user)
   */
  async changePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<ResetPasswordResponse> {
    const response = await api.post<ResetPasswordResponse>(
      '/auth/change-password',
      {
        currentPassword,
        newPassword,
      }
    );
    return response.data;
  },

  /**
   * Update user profile
   */
  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await api.put<User>('/auth/profile', data);
    return response.data;
  },

  /**
   * Upload profile avatar
   */
  async uploadAvatar(file: File): Promise<{ avatarUrl: string }> {
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await api.post<{ avatarUrl: string }>(
      '/auth/avatar',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data;
  },
};

export default authService;
