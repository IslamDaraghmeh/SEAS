import { Test, TestingModule } from '@nestjs/testing';
import { ExamsService } from '../../src/exams/exams.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('ExamsService', () => {
  let service: ExamsService;
  let prismaService: PrismaService;

  const mockExam = {
    id: 'exam-123',
    courseId: 'course-123',
    titleAr: 'اختبار',
    titleEn: 'Test Exam',
    descriptionAr: 'وصف الاختبار',
    descriptionEn: 'Test description',
    durationMinutes: 60,
    totalPoints: 100,
    passingScore: 50,
    scheduledAt: new Date(),
    status: 'DRAFT',
    shuffleQuestions: false,
    shuffleOptions: false,
    requireVerification: true,
    verificationInterval: 60,
    showResults: true,
    allowReview: false,
    lockdownMode: 'warning',
    createdAt: new Date(),
    updatedAt: new Date(),
    course: {
      id: 'course-123',
      code: 'CS101',
      nameEn: 'Computer Science',
      teacher: {
        id: 'teacher-123',
        nameEn: 'Dr. Teacher',
      },
    },
    questions: [],
    _count: { questions: 0, attempts: 0 },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExamsService,
        {
          provide: PrismaService,
          useValue: {
            exam: {
              create: jest.fn(),
              findMany: jest.fn(),
              findUnique: jest.fn(),
              findFirst: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
            question: {
              findMany: jest.fn(),
            },
            course: {
              findUnique: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<ExamsService>(ExamsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create an exam', async () => {
      const createExamDto = {
        courseId: 'course-123',
        titleAr: 'اختبار جديد',
        titleEn: 'New Exam',
        durationMinutes: 60,
        scheduledAt: new Date().toISOString(),
      };

      jest.spyOn(prismaService.course, 'findUnique').mockResolvedValue({
        id: 'course-123',
        code: 'CS101',
        nameEn: 'Computer Science',
      } as any);
      jest.spyOn(prismaService.exam, 'create').mockResolvedValue(mockExam as any);

      const result = await service.create(createExamDto as any);

      expect(result).toBeDefined();
      expect(prismaService.exam.create).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return an exam by ID', async () => {
      jest.spyOn(prismaService.exam, 'findUnique').mockResolvedValue(mockExam as any);

      const result = await service.findOne('exam-123');

      expect(result).toBeDefined();
      expect(result.id).toBe('exam-123');
    });

    it('should throw NotFoundException for non-existent exam', async () => {
      jest.spyOn(prismaService.exam, 'findUnique').mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update an exam', async () => {
      const updateExamDto = {
        titleEn: 'Updated Exam Title',
      };

      jest.spyOn(prismaService.exam, 'findUnique').mockResolvedValue(mockExam as any);
      jest.spyOn(prismaService.exam, 'update').mockResolvedValue({
        ...mockExam,
        titleEn: 'Updated Exam Title',
      } as any);

      const result = await service.update('exam-123', updateExamDto as any);

      expect(result.titleEn).toBe('Updated Exam Title');
    });

    it('should throw NotFoundException for non-existent exam', async () => {
      jest.spyOn(prismaService.exam, 'findUnique').mockResolvedValue(null);

      await expect(
        service.update('non-existent', { titleEn: 'Test' } as any),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete an exam', async () => {
      jest.spyOn(prismaService.exam, 'findUnique').mockResolvedValue(mockExam as any);
      jest.spyOn(prismaService.exam, 'delete').mockResolvedValue(mockExam as any);

      const result = await service.remove('exam-123');

      expect(result).toBeDefined();
      expect(prismaService.exam.delete).toHaveBeenCalledWith({
        where: { id: 'exam-123' },
      });
    });

    it('should throw NotFoundException for non-existent exam', async () => {
      jest.spyOn(prismaService.exam, 'findUnique').mockResolvedValue(null);

      await expect(service.remove('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('publish', () => {
    it('should publish an exam in DRAFT status', async () => {
      const examWithQuestions = {
        ...mockExam,
        _count: { questions: 2, attempts: 0 },
      };
      jest.spyOn(prismaService.exam, 'findUnique').mockResolvedValue(examWithQuestions as any);
      jest.spyOn(prismaService.question, 'findMany').mockResolvedValue([
        { id: 'q1', points: 50 },
        { id: 'q2', points: 50 },
      ] as any);
      jest.spyOn(prismaService.exam, 'update').mockResolvedValue({
        ...examWithQuestions,
        status: 'PUBLISHED',
        totalPoints: 100,
      } as any);

      const result = await service.publish('exam-123');

      expect(result.status).toBe('PUBLISHED');
    });

    it('should throw BadRequestException if exam is not in DRAFT status', async () => {
      const publishedExam = { ...mockExam, status: 'PUBLISHED', _count: { questions: 2, attempts: 0 } };
      jest.spyOn(prismaService.exam, 'findUnique').mockResolvedValue(publishedExam as any);

      await expect(service.publish('exam-123')).rejects.toThrow(BadRequestException);
    });
  });
});
