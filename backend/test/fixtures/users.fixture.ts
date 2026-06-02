import * as bcrypt from 'bcrypt';

export const createTestUser = async (overrides = {}) => {
  const passwordHash = await bcrypt.hash('password123', 10);

  return {
    id: 'user-test-123',
    email: 'test@example.com',
    passwordHash,
    role: 'STUDENT',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastLoginAt: null,
    ...overrides,
  };
};

export const createTestStudent = (overrides = {}) => ({
  id: 'student-test-123',
  userId: 'user-test-123',
  studentNumber: 'STU001',
  nameAr: 'طالب اختبار',
  nameEn: 'Test Student',
  phone: '+1234567890',
  faceTemplate: null,
  faceEnrolledAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createTestTeacher = (overrides = {}) => ({
  id: 'teacher-test-123',
  userId: 'user-test-456',
  nameAr: 'مدرس اختبار',
  nameEn: 'Test Teacher',
  department: 'Computer Science',
  phone: '+1234567891',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createTestAdmin = async (overrides = {}) => {
  const passwordHash = await bcrypt.hash('admin123', 10);

  return {
    id: 'user-admin-123',
    email: 'admin@example.com',
    passwordHash,
    role: 'ADMIN',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastLoginAt: null,
    ...overrides,
  };
};
