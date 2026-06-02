import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateCourseDto,
  UpdateCourseDto,
  QueryCourseDto,
  EnrollStudentDto,
  UnenrollStudentDto,
} from './dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class CoursesService {
  constructor(private prisma: PrismaService) {}

  async create(createCourseDto: CreateCourseDto) {
    const { teacherId, ...courseData } = createCourseDto;

    // Check if teacher exists
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    // Check if course code already exists
    const existingCourse = await this.prisma.course.findFirst({
      where: {
        OR: [
          { codeAr: courseData.codeAr },
          { codeEn: courseData.codeEn },
        ],
      },
    });

    if (existingCourse) {
      throw new ConflictException('Course code already exists');
    }

    return this.prisma.course.create({
      data: {
        ...courseData,
        teacher: { connect: { id: teacherId } },
      },
      include: {
        teacher: {
          select: {
            id: true,
            nameAr: true,
            nameEn: true,
          },
        },
      },
    });
  }

  async findAll(query: QueryCourseDto) {
    const {
      search,
      teacherId,
      semester,
      isActive,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const skip = (page - 1) * limit;

    const where: Prisma.CourseWhereInput = {};

    // Search filter
    if (search) {
      where.OR = [
        { codeAr: { contains: search, mode: 'insensitive' } },
        { codeEn: { contains: search, mode: 'insensitive' } },
        { nameAr: { contains: search, mode: 'insensitive' } },
        { nameEn: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Teacher filter
    if (teacherId) {
      where.teacherId = teacherId;
    }

    // Semester filter
    if (semester) {
      where.semester = semester;
    }

    // Active status filter
    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    // Build orderBy
    const orderBy: Prisma.CourseOrderByWithRelationInput = {};
    orderBy[sortBy] = sortOrder;

    const [courses, total] = await Promise.all([
      this.prisma.course.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          teacher: {
            select: {
              id: true,
              nameAr: true,
              nameEn: true,
            },
          },
          _count: {
            select: {
              enrollments: true,
              exams: true,
            },
          },
        },
      }),
      this.prisma.course.count({ where }),
    ]);

    return {
      data: courses,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: {
        teacher: {
          select: {
            id: true,
            nameAr: true,
            nameEn: true,
            department: true,
            user: {
              select: {
                email: true,
              },
            },
          },
        },
        enrollments: {
          include: {
            student: {
              select: {
                id: true,
                studentNumber: true,
                nameAr: true,
                nameEn: true,
              },
            },
          },
        },
        _count: {
          select: {
            exams: true,
          },
        },
      },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    return course;
  }

  async findByTeacher(teacherId: string, query: QueryCourseDto) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    return this.findAll({ ...query, teacherId });
  }

  async findByStudent(studentId: string) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const enrollments = await this.prisma.enrollment.findMany({
      where: { studentId },
      include: {
        course: {
          include: {
            teacher: {
              select: {
                id: true,
                nameAr: true,
                nameEn: true,
              },
            },
          },
        },
      },
    });

    return enrollments.map((e) => e.course);
  }

  async update(id: string, updateCourseDto: UpdateCourseDto) {
    const course = await this.prisma.course.findUnique({
      where: { id },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // If teacherId is being updated, verify teacher exists
    if (updateCourseDto.teacherId) {
      const teacher = await this.prisma.teacher.findUnique({
        where: { id: updateCourseDto.teacherId },
      });

      if (!teacher) {
        throw new NotFoundException('Teacher not found');
      }
    }

    return this.prisma.course.update({
      where: { id },
      data: updateCourseDto,
      include: {
        teacher: {
          select: {
            id: true,
            nameAr: true,
            nameEn: true,
          },
        },
      },
    });
  }

  async remove(id: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    await this.prisma.course.delete({ where: { id } });

    return { message: 'Course deleted successfully' };
  }

  async enrollStudents(courseId: string, enrollDto: EnrollStudentDto) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // Check all students exist
    const students = await this.prisma.student.findMany({
      where: { id: { in: enrollDto.studentIds } },
    });

    if (students.length !== enrollDto.studentIds.length) {
      throw new NotFoundException('Some students not found');
    }

    // Check for existing enrollments
    const existingEnrollments = await this.prisma.enrollment.findMany({
      where: {
        courseId,
        studentId: { in: enrollDto.studentIds },
      },
    });

    const existingStudentIds = existingEnrollments.map((e) => e.studentId);
    const newStudentIds = enrollDto.studentIds.filter(
      (id) => !existingStudentIds.includes(id),
    );

    if (newStudentIds.length === 0) {
      return { message: 'All students already enrolled', enrolled: 0 };
    }

    // Create new enrollments
    await this.prisma.enrollment.createMany({
      data: newStudentIds.map((studentId) => ({
        courseId,
        studentId,
      })),
    });

    return {
      message: `Successfully enrolled ${newStudentIds.length} students`,
      enrolled: newStudentIds.length,
      alreadyEnrolled: existingStudentIds.length,
    };
  }

  async unenrollStudents(courseId: string, unenrollDto: UnenrollStudentDto) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    const result = await this.prisma.enrollment.deleteMany({
      where: {
        courseId,
        studentId: { in: unenrollDto.studentIds },
      },
    });

    return {
      message: `Successfully unenrolled ${result.count} students`,
      unenrolled: result.count,
    };
  }

  async getEnrolledStudents(courseId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    const enrollments = await this.prisma.enrollment.findMany({
      where: { courseId },
      include: {
        student: {
          select: {
            id: true,
            studentNumber: true,
            nameAr: true,
            nameEn: true,
            faceEnrolledAt: true,
            user: {
              select: {
                email: true,
                isActive: true,
              },
            },
          },
        },
      },
    });

    return enrollments.map((e) => ({
      ...e.student,
      enrolledAt: e.createdAt,
    }));
  }

  /**
   * Verify that a teacher owns (is assigned to) a specific course
   * Throws ForbiddenException if the teacher is not the course's assigned teacher
   */
  async verifyTeacherOwnership(courseId: string, teacherId: string): Promise<void> {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, teacherId: true },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    if (course.teacherId !== teacherId) {
      throw new ForbiddenException('You can only manage students in your own courses');
    }
  }
}
