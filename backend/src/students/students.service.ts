import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStudentDto, UpdateStudentDto, QueryStudentDto } from './dto';
import * as bcrypt from 'bcrypt';
import { UserRole, Prisma } from '@prisma/client';

@Injectable()
export class StudentsService {
  constructor(private prisma: PrismaService) {}

  async create(createStudentDto: CreateStudentDto) {
    const { email, password, studentNumber, nameAr, nameEn, phone } =
      createStudentDto;

    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Check if student number already exists
    const existingStudent = await this.prisma.student.findUnique({
      where: { studentNumber },
    });

    if (existingStudent) {
      throw new ConflictException('Student number already registered');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user and student in a transaction
    const student = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          passwordHash: hashedPassword,
          role: UserRole.STUDENT,
        },
      });

      return tx.student.create({
        data: {
          userId: user.id,
          studentNumber,
          nameAr,
          nameEn,
          phone,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              isActive: true,
            },
          },
        },
      });
    });

    return student;
  }

  async findAll(query: QueryStudentDto) {
    const {
      search,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      faceEnrolled,
      isActive,
    } = query;

    const skip = (page - 1) * limit;

    const where: Prisma.StudentWhereInput = {};

    // Search filter
    if (search) {
      where.OR = [
        { nameAr: { contains: search, mode: 'insensitive' } },
        { nameEn: { contains: search, mode: 'insensitive' } },
        { studentNumber: { contains: search, mode: 'insensitive' } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    // Face enrolled filter
    if (faceEnrolled !== undefined) {
      if (faceEnrolled) {
        where.faceEnrolledAt = { not: null };
      } else {
        where.faceEnrolledAt = null;
      }
    }

    // Active status filter
    if (isActive !== undefined) {
      where.user = {
        ...((where.user as Prisma.UserWhereInput) || {}),
        isActive,
      };
    }

    // Build orderBy
    const orderBy: Prisma.StudentOrderByWithRelationInput = {};
    if (sortBy === 'email') {
      orderBy.user = { email: sortOrder };
    } else {
      orderBy[sortBy] = sortOrder;
    }

    const [students, total] = await Promise.all([
      this.prisma.student.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              isActive: true,
            },
          },
          _count: {
            select: {
              enrollments: true,
              examAttempts: true,
            },
          },
        },
      }),
      this.prisma.student.count({ where }),
    ]);

    return {
      data: students,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const student = await this.prisma.student.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            isActive: true,
            lastLoginAt: true,
            createdAt: true,
          },
        },
        enrollments: {
          include: {
            course: {
              select: {
                id: true,
                codeAr: true,
                codeEn: true,
                nameAr: true,
                nameEn: true,
              },
            },
          },
        },
      },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    return student;
  }

  async findByStudentNumber(studentNumber: string) {
    const student = await this.prisma.student.findUnique({
      where: { studentNumber },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            isActive: true,
          },
        },
      },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    return student;
  }

  async findByUserId(userId: string) {
    const student = await this.prisma.student.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            isActive: true,
          },
        },
      },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    return student;
  }

  async update(id: string, updateStudentDto: UpdateStudentDto) {
    const student = await this.prisma.student.findUnique({
      where: { id },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    return this.prisma.student.update({
      where: { id },
      data: updateStudentDto,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            isActive: true,
          },
        },
      },
    });
  }

  async remove(id: string) {
    const student = await this.prisma.student.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    // Delete student and user in a transaction
    await this.prisma.$transaction(async (tx) => {
      await tx.student.delete({ where: { id } });
      await tx.user.delete({ where: { id: student.userId } });
    });

    return { message: 'Student deleted successfully' };
  }

  async deactivate(id: string) {
    const student = await this.prisma.student.findUnique({
      where: { id },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    await this.prisma.user.update({
      where: { id: student.userId },
      data: { isActive: false },
    });

    return { message: 'Student deactivated successfully' };
  }

  async activate(id: string) {
    const student = await this.prisma.student.findUnique({
      where: { id },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    await this.prisma.user.update({
      where: { id: student.userId },
      data: { isActive: true },
    });

    return { message: 'Student activated successfully' };
  }

  async updateFaceTemplate(id: string, faceTemplate: Buffer) {
    const student = await this.prisma.student.findUnique({
      where: { id },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    return this.prisma.student.update({
      where: { id },
      data: {
        faceTemplate,
        faceEnrolledAt: new Date(),
      },
    });
  }

  async getFaceTemplate(id: string) {
    const student = await this.prisma.student.findUnique({
      where: { id },
      select: {
        id: true,
        faceTemplate: true,
        faceEnrolledAt: true,
      },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    return student;
  }
}
