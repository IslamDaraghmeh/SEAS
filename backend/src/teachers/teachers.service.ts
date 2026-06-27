import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTeacherDto, UpdateTeacherDto, QueryTeacherDto } from './dto';
import * as bcrypt from 'bcrypt';
import { UserRole, Prisma } from '@prisma/client';

@Injectable()
export class TeachersService {
  constructor(private prisma: PrismaService) {}

  async create(createTeacherDto: CreateTeacherDto) {
    const { email, password, nameAr, nameEn, department, phone } =
      createTeacherDto;

    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user and teacher in a transaction
    const teacher = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          passwordHash: hashedPassword,
          role: UserRole.TEACHER,
        },
      });

      return tx.teacher.create({
        data: {
          userId: user.id,
          nameAr,
          nameEn,
          department,
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

    return teacher;
  }

  async findAll(query: QueryTeacherDto) {
    const {
      search,
      department,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      isActive,
    } = query;

    const skip = (page - 1) * limit;

    const where: Prisma.TeacherWhereInput = {};

    // Search filter
    if (search) {
      where.OR = [
        { nameAr: { contains: search, mode: 'insensitive' } },
        { nameEn: { contains: search, mode: 'insensitive' } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    // Department filter
    if (department) {
      where.department = { contains: department, mode: 'insensitive' };
    }

    // Active status filter
    if (isActive !== undefined) {
      where.user = {
        ...((where.user as Prisma.UserWhereInput) || {}),
        isActive,
      };
    }

    // Build orderBy
    const orderBy: Prisma.TeacherOrderByWithRelationInput = {};
    if (sortBy === 'email') {
      orderBy.user = { email: sortOrder };
    } else {
      orderBy[sortBy] = sortOrder;
    }

    const [teachers, total] = await Promise.all([
      this.prisma.teacher.findMany({
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
              courses: true,
            },
          },
        },
      }),
      this.prisma.teacher.count({ where }),
    ]);

    return {
      data: teachers,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const teacher = await this.prisma.teacher.findUnique({
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
        courses: {
          select: {
            id: true,
            codeAr: true,
            codeEn: true,
            nameAr: true,
            nameEn: true,
          },
        },
      },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    return teacher;
  }

  async findByUserId(userId: string) {
    const teacher = await this.prisma.teacher.findUnique({
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

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    return teacher;
  }

  async update(id: string, updateTeacherDto: UpdateTeacherDto) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    return this.prisma.teacher.update({
      where: { id },
      data: updateTeacherDto,
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
    const teacher = await this.prisma.teacher.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    // Delete teacher and user in a transaction
    await this.prisma.$transaction(async (tx) => {
      await tx.teacher.delete({ where: { id } });
      await tx.user.delete({ where: { id: teacher.userId } });
    });

    return { message: 'Teacher deleted successfully' };
  }

  async resetPassword(id: string, password: string) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await this.prisma.user.update({
      where: { id: teacher.userId },
      data: { passwordHash: hashedPassword },
    });

    return { message: 'Teacher password reset successfully' };
  }

  async deactivate(id: string) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    await this.prisma.user.update({
      where: { id: teacher.userId },
      data: { isActive: false },
    });

    return { message: 'Teacher deactivated successfully' };
  }

  async activate(id: string) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    await this.prisma.user.update({
      where: { id: teacher.userId },
      data: { isActive: true },
    });

    return { message: 'Teacher activated successfully' };
  }
}
