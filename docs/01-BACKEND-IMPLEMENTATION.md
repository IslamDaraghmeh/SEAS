# SEAS Backend Implementation Plan
## NestJS API with Authentication, Students, Exams CRUD & Submissions

---

## Table of Contents

1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [Phase 1: Foundation](#phase-1-foundation)
4. [Phase 2: Core CRUD Operations](#phase-2-core-crud-operations)
5. [Phase 3: Exam Workflow](#phase-3-exam-workflow)
6. [Phase 4: Integration & Optimization](#phase-4-integration--optimization)
7. [Database Schema](#database-schema)
8. [API Specifications](#api-specifications)
9. [Security Implementation](#security-implementation)

---

## Overview

The backend serves as the central API for the SEAS platform, providing:
- User authentication and authorization
- Student and teacher management
- Exam creation, management, and submission
- Real-time monitoring via WebSocket
- Integration with image processing service

---

## Technology Stack

| Component | Technology | Version |
|-----------|------------|---------|
| Runtime | Node.js | 20.x LTS |
| Framework | NestJS | 10.x |
| Database | PostgreSQL | 16.x |
| ORM | Prisma | 5.x |
| Cache | Redis | 7.x |
| Auth | Passport.js + JWT | - |
| Validation | class-validator | - |
| Documentation | Swagger/OpenAPI | 3.x |
| Testing | Jest | 29.x |
| WebSocket | Socket.io | 4.x |

---

## Phase 1: Foundation

### Duration: Week 1-2

### Phase 1.1: Project Setup
**Duration: 2 days**

#### Task 1.1.1: Initialize NestJS Project
```bash
# Project initialization
nest new seas-backend
cd seas-backend

# Install core dependencies
npm install @nestjs/config @nestjs/swagger
npm install @prisma/client
npm install -D prisma
```

**Deliverables:**
- [ ] NestJS project initialized with TypeScript
- [ ] ESLint + Prettier configured
- [ ] Environment configuration setup (.env)
- [ ] Basic project structure created

#### Task 1.1.2: Configure Development Environment
**File: `src/config/configuration.ts`**
```typescript
export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  database: {
    url: process.env.DATABASE_URL,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
  },
});
```

**Deliverables:**
- [ ] Configuration module setup
- [ ] Environment variables defined
- [ ] Docker Compose for local development

#### Task 1.1.3: Docker Development Setup
**File: `docker-compose.yml`**
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: seas
      POSTGRES_PASSWORD: seas_password
      POSTGRES_DB: seas_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

**Deliverables:**
- [ ] Docker Compose file created
- [ ] PostgreSQL container running
- [ ] Redis container running

---

### Phase 1.2: Database Schema Design
**Duration: 3 days**

#### Task 1.2.1: Initialize Prisma
```bash
npx prisma init
```

#### Task 1.2.2: Define Core Schema
**File: `prisma/schema.prisma`**
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ==================== ENUMS ====================

enum UserRole {
  STUDENT
  TEACHER
  ADMIN
  PROCTOR
}

enum ExamStatus {
  DRAFT
  PUBLISHED
  ACTIVE
  COMPLETED
  CANCELLED
}

enum AttemptStatus {
  NOT_STARTED
  IN_PROGRESS
  SUBMITTED
  GRADED
  FLAGGED
}

enum QuestionType {
  MULTIPLE_CHOICE
  TRUE_FALSE
  SHORT_ANSWER
  ESSAY
}

enum AlertSeverity {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

enum AlertType {
  FACE_MISMATCH
  MULTIPLE_FACES
  NO_FACE_DETECTED
  LIVENESS_FAILED
  PROLONGED_ABSENCE
  HEAD_ROTATION
  SUSPICIOUS_BEHAVIOR
}

// ==================== USER MANAGEMENT ====================

model User {
  id            String    @id @default(uuid())
  email         String    @unique
  passwordHash  String    @map("password_hash")
  role          UserRole  @default(STUDENT)
  isActive      Boolean   @default(true) @map("is_active")
  lastLoginAt   DateTime? @map("last_login_at")
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")

  student       Student?
  teacher       Teacher?
  refreshTokens RefreshToken[]

  @@map("users")
}

model RefreshToken {
  id        String   @id @default(uuid())
  token     String   @unique
  userId    String   @map("user_id")
  expiresAt DateTime @map("expires_at")
  createdAt DateTime @default(now()) @map("created_at")
  revokedAt DateTime? @map("revoked_at")

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("refresh_tokens")
}

model Student {
  id              String    @id @default(uuid())
  userId          String    @unique @map("user_id")
  studentNumber   String    @unique @map("student_number")
  nameAr          String    @map("name_ar")
  nameEn          String    @map("name_en")
  faceTemplate    Bytes?    @map("face_template")
  faceEnrolledAt  DateTime? @map("face_enrolled_at")
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")

  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  enrollments     Enrollment[]
  examAttempts    ExamAttempt[]

  @@map("students")
}

model Teacher {
  id          String   @id @default(uuid())
  userId      String   @unique @map("user_id")
  nameAr      String   @map("name_ar")
  nameEn      String   @map("name_en")
  department  String?
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  courses     Course[]

  @@map("teachers")
}

// ==================== COURSE MANAGEMENT ====================

model Course {
  id          String   @id @default(uuid())
  code        String   @unique
  nameAr      String   @map("name_ar")
  nameEn      String   @map("name_en")
  description String?
  teacherId   String   @map("teacher_id")
  semester    String
  isActive    Boolean  @default(true) @map("is_active")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  teacher     Teacher  @relation(fields: [teacherId], references: [id])
  enrollments Enrollment[]
  exams       Exam[]

  @@map("courses")
}

model Enrollment {
  id          String   @id @default(uuid())
  studentId   String   @map("student_id")
  courseId    String   @map("course_id")
  enrolledAt  DateTime @default(now()) @map("enrolled_at")

  student     Student  @relation(fields: [studentId], references: [id], onDelete: Cascade)
  course      Course   @relation(fields: [courseId], references: [id], onDelete: Cascade)

  @@unique([studentId, courseId])
  @@map("enrollments")
}

// ==================== EXAM MANAGEMENT ====================

model Exam {
  id              String     @id @default(uuid())
  courseId        String     @map("course_id")
  titleAr         String     @map("title_ar")
  titleEn         String     @map("title_en")
  descriptionAr   String?    @map("description_ar")
  descriptionEn   String?    @map("description_en")
  durationMinutes Int        @map("duration_minutes")
  totalPoints     Int        @default(0) @map("total_points")
  passingScore    Int        @default(50) @map("passing_score")
  startTime       DateTime   @map("start_time")
  endTime         DateTime   @map("end_time")
  status          ExamStatus @default(DRAFT)
  shuffleQuestions Boolean   @default(false) @map("shuffle_questions")
  showResults     Boolean    @default(true) @map("show_results")
  allowReview     Boolean    @default(false) @map("allow_review")
  createdAt       DateTime   @default(now()) @map("created_at")
  updatedAt       DateTime   @updatedAt @map("updated_at")

  course          Course     @relation(fields: [courseId], references: [id])
  questions       Question[]
  attempts        ExamAttempt[]

  @@map("exams")
}

model Question {
  id            String       @id @default(uuid())
  examId        String       @map("exam_id")
  type          QuestionType
  textAr        String       @map("text_ar")
  textEn        String       @map("text_en")
  options       Json?        // For multiple choice: [{id, textAr, textEn}]
  correctAnswer Json         @map("correct_answer")
  points        Int          @default(1)
  orderIndex    Int          @default(0) @map("order_index")
  createdAt     DateTime     @default(now()) @map("created_at")
  updatedAt     DateTime     @updatedAt @map("updated_at")

  exam          Exam         @relation(fields: [examId], references: [id], onDelete: Cascade)
  answers       Answer[]

  @@map("questions")
}

// ==================== EXAM ATTEMPTS & ANSWERS ====================

model ExamAttempt {
  id              String        @id @default(uuid())
  examId          String        @map("exam_id")
  studentId       String        @map("student_id")
  startedAt       DateTime?     @map("started_at")
  submittedAt     DateTime?     @map("submitted_at")
  score           Int?
  percentage      Float?
  status          AttemptStatus @default(NOT_STARTED)
  ipAddress       String?       @map("ip_address")
  userAgent       String?       @map("user_agent")
  createdAt       DateTime      @default(now()) @map("created_at")
  updatedAt       DateTime      @updatedAt @map("updated_at")

  exam            Exam          @relation(fields: [examId], references: [id])
  student         Student       @relation(fields: [studentId], references: [id])
  answers         Answer[]
  verificationLogs VerificationLog[]
  alerts          Alert[]
  faceCaptures    FaceCapture[]

  @@unique([examId, studentId])
  @@map("exam_attempts")
}

model Answer {
  id            String   @id @default(uuid())
  attemptId     String   @map("attempt_id")
  questionId    String   @map("question_id")
  answer        Json?
  isCorrect     Boolean? @map("is_correct")
  pointsEarned  Int?     @map("points_earned")
  answeredAt    DateTime @default(now()) @map("answered_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  attempt       ExamAttempt @relation(fields: [attemptId], references: [id], onDelete: Cascade)
  question      Question    @relation(fields: [questionId], references: [id])

  @@unique([attemptId, questionId])
  @@map("answers")
}

// ==================== VERIFICATION & MONITORING ====================

model VerificationLog {
  id              String   @id @default(uuid())
  attemptId       String   @map("attempt_id")
  timestamp       DateTime @default(now())
  matchScore      Float    @map("match_score")
  livenessScore   Float    @map("liveness_score")
  blinkDetected   Boolean  @map("blink_detected")
  headPoseValid   Boolean  @map("head_pose_valid")
  spoofScore      Float    @map("spoof_score")
  isVerified      Boolean  @map("is_verified")
  failureReason   String?  @map("failure_reason")

  attempt         ExamAttempt @relation(fields: [attemptId], references: [id], onDelete: Cascade)

  @@map("verification_logs")
}

model Alert {
  id              String        @id @default(uuid())
  attemptId       String        @map("attempt_id")
  type            AlertType
  severity        AlertSeverity
  message         String
  metadata        Json?
  timestamp       DateTime      @default(now())
  acknowledgedAt  DateTime?     @map("acknowledged_at")
  acknowledgedBy  String?       @map("acknowledged_by")

  attempt         ExamAttempt   @relation(fields: [attemptId], references: [id], onDelete: Cascade)

  @@map("alerts")
}

model FaceCapture {
  id          String   @id @default(uuid())
  attemptId   String   @map("attempt_id")
  embedding   Bytes
  spoofScore  Float    @map("spoof_score")
  capturedAt  DateTime @default(now()) @map("captured_at")

  attempt     ExamAttempt @relation(fields: [attemptId], references: [id], onDelete: Cascade)

  @@map("face_captures")
}
```

**Deliverables:**
- [ ] Complete Prisma schema defined
- [ ] All relationships established
- [ ] Indexes for performance
- [ ] Migration generated and applied

#### Task 1.2.3: Run Migrations
```bash
npx prisma migrate dev --name init
npx prisma generate
```

---

### Phase 1.3: Authentication Module
**Duration: 3 days**

#### Task 1.3.1: Install Auth Dependencies
```bash
npm install @nestjs/passport @nestjs/jwt passport passport-jwt passport-local bcrypt
npm install -D @types/passport-jwt @types/passport-local @types/bcrypt
npm install ioredis @nestjs/throttler
```

#### Task 1.3.2: Create Auth Module Structure
```
src/auth/
├── auth.module.ts
├── auth.controller.ts
├── auth.service.ts
├── strategies/
│   ├── jwt.strategy.ts
│   └── local.strategy.ts
├── guards/
│   ├── jwt-auth.guard.ts
│   ├── local-auth.guard.ts
│   └── roles.guard.ts
├── decorators/
│   ├── current-user.decorator.ts
│   ├── roles.decorator.ts
│   └── public.decorator.ts
└── dto/
    ├── login.dto.ts
    ├── register.dto.ts
    └── token-response.dto.ts
```

#### Task 1.3.3: Implement Auth Service
**File: `src/auth/auth.service.ts`**
```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { User, UserRole } from '@prisma/client';

@Injectable()
export class AuthService {
  private readonly BCRYPT_ROUNDS = 12;
  private readonly TOKEN_BLOCKLIST_PREFIX = 'token:blocked:';

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private redisService: RedisService,
  ) {}

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (user && await bcrypt.compare(password, user.passwordHash)) {
      return user;
    }
    return null;
  }

  async login(user: User) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = await this.generateRefreshToken(user.id);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  }

  async logout(userId: string, token: string) {
    // Add token to blocklist
    const decoded = this.jwtService.decode(token) as any;
    const ttl = decoded.exp - Math.floor(Date.now() / 1000);

    if (ttl > 0) {
      await this.redisService.set(
        `${this.TOKEN_BLOCKLIST_PREFIX}${token}`,
        'blocked',
        ttl,
      );
    }

    // Revoke all refresh tokens
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async isTokenBlocked(token: string): Promise<boolean> {
    const blocked = await this.redisService.get(
      `${this.TOKEN_BLOCKLIST_PREFIX}${token}`,
    );
    return blocked !== null;
  }

  async refreshAccessToken(refreshToken: string) {
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!storedToken || storedToken.revokedAt || storedToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const payload = {
      sub: storedToken.user.id,
      email: storedToken.user.email,
      role: storedToken.user.role
    };

    return {
      accessToken: this.jwtService.sign(payload),
    };
  }

  private async generateRefreshToken(userId: string): Promise<string> {
    const token = require('crypto').randomBytes(64).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

    await this.prisma.refreshToken.create({
      data: {
        token,
        userId,
        expiresAt,
      },
    });

    return token;
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.BCRYPT_ROUNDS);
  }
}
```

#### Task 1.3.4: Implement JWT Strategy
**File: `src/auth/strategies/jwt.strategy.ts`**
```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthService } from '../auth.service';
import { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: any) {
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);

    // Check if token is blocklisted
    if (await this.authService.isTokenBlocked(token)) {
      throw new UnauthorizedException('Token has been revoked');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        student: true,
        teacher: true,
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException();
    }

    return user;
  }
}
```

#### Task 1.3.5: Implement Guards and Decorators
**File: `src/auth/guards/roles.guard.ts`**
```typescript
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.includes(user.role);
  }
}
```

**File: `src/auth/decorators/roles.decorator.ts`**
```typescript
import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@prisma/client';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
```

**Deliverables:**
- [ ] Auth module fully implemented
- [ ] JWT authentication working
- [ ] Token refresh mechanism
- [ ] Token blocklist for logout
- [ ] Role-based guards
- [ ] Rate limiting configured

---

## Phase 2: Core CRUD Operations

### Duration: Week 3-4

### Phase 2.1: Students Module
**Duration: 2 days**

#### Task 2.1.1: Create Students Module Structure
```
src/students/
├── students.module.ts
├── students.controller.ts
├── students.service.ts
├── dto/
│   ├── create-student.dto.ts
│   ├── update-student.dto.ts
│   └── student-response.dto.ts
└── entities/
    └── student.entity.ts
```

#### Task 2.1.2: Implement Students Service
**File: `src/students/students.service.ts`**
```typescript
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class StudentsService {
  constructor(
    private prisma: PrismaService,
    private authService: AuthService,
  ) {}

  async create(createStudentDto: CreateStudentDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createStudentDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const existingStudent = await this.prisma.student.findUnique({
      where: { studentNumber: createStudentDto.studentNumber },
    });

    if (existingStudent) {
      throw new ConflictException('Student number already exists');
    }

    const passwordHash = await this.authService.hashPassword(createStudentDto.password);

    return this.prisma.student.create({
      data: {
        studentNumber: createStudentDto.studentNumber,
        nameAr: createStudentDto.nameAr,
        nameEn: createStudentDto.nameEn,
        user: {
          create: {
            email: createStudentDto.email,
            passwordHash,
            role: 'STUDENT',
          },
        },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
      },
    });
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    search?: string;
    courseId?: string;
  }) {
    const { skip = 0, take = 20, search, courseId } = params;

    const where: Prisma.StudentWhereInput = {};

    if (search) {
      where.OR = [
        { nameAr: { contains: search, mode: 'insensitive' } },
        { nameEn: { contains: search, mode: 'insensitive' } },
        { studentNumber: { contains: search, mode: 'insensitive' } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (courseId) {
      where.enrollments = {
        some: { courseId },
      };
    }

    const [students, total] = await Promise.all([
      this.prisma.student.findMany({
        where,
        skip,
        take,
        include: {
          user: {
            select: { id: true, email: true, role: true, isActive: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.student.count({ where }),
    ]);

    return {
      data: students,
      meta: {
        total,
        skip,
        take,
        hasMore: skip + take < total,
      },
    };
  }

  async findOne(id: string) {
    const student = await this.prisma.student.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, email: true, role: true, isActive: true, lastLoginAt: true },
        },
        enrollments: {
          include: {
            course: {
              select: { id: true, code: true, nameAr: true, nameEn: true },
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

  async update(id: string, updateStudentDto: UpdateStudentDto) {
    const student = await this.findOne(id);

    const data: Prisma.StudentUpdateInput = {};

    if (updateStudentDto.nameAr) data.nameAr = updateStudentDto.nameAr;
    if (updateStudentDto.nameEn) data.nameEn = updateStudentDto.nameEn;

    if (updateStudentDto.email) {
      const existingUser = await this.prisma.user.findFirst({
        where: {
          email: updateStudentDto.email,
          NOT: { id: student.user.id },
        },
      });

      if (existingUser) {
        throw new ConflictException('Email already exists');
      }

      data.user = {
        update: { email: updateStudentDto.email },
      };
    }

    return this.prisma.student.update({
      where: { id },
      data,
      include: {
        user: {
          select: { id: true, email: true, role: true },
        },
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    // Cascade delete will handle related records
    return this.prisma.student.delete({
      where: { id },
    });
  }

  async enrollFace(id: string, faceTemplate: Buffer) {
    await this.findOne(id);

    return this.prisma.student.update({
      where: { id },
      data: {
        faceTemplate,
        faceEnrolledAt: new Date(),
      },
    });
  }

  async getStudentExams(studentId: string) {
    const student = await this.findOne(studentId);

    const enrolledCourseIds = student.enrollments.map(e => e.course.id);

    return this.prisma.exam.findMany({
      where: {
        courseId: { in: enrolledCourseIds },
        status: { in: ['PUBLISHED', 'ACTIVE', 'COMPLETED'] },
      },
      include: {
        course: {
          select: { id: true, code: true, nameAr: true, nameEn: true },
        },
        attempts: {
          where: { studentId },
          select: {
            id: true,
            status: true,
            score: true,
            percentage: true,
            startedAt: true,
            submittedAt: true,
          },
        },
      },
      orderBy: { startTime: 'desc' },
    });
  }

  async getStudentGrades(studentId: string) {
    await this.findOne(studentId);

    const attempts = await this.prisma.examAttempt.findMany({
      where: {
        studentId,
        status: 'GRADED',
      },
      include: {
        exam: {
          include: {
            course: {
              select: { id: true, code: true, nameAr: true, nameEn: true },
            },
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
    });

    const courseGrades = attempts.reduce((acc, attempt) => {
      const courseId = attempt.exam.course.id;
      if (!acc[courseId]) {
        acc[courseId] = {
          course: attempt.exam.course,
          exams: [],
          totalScore: 0,
          totalPoints: 0,
        };
      }
      acc[courseId].exams.push({
        examId: attempt.exam.id,
        title: { ar: attempt.exam.titleAr, en: attempt.exam.titleEn },
        score: attempt.score,
        totalPoints: attempt.exam.totalPoints,
        percentage: attempt.percentage,
        submittedAt: attempt.submittedAt,
      });
      acc[courseId].totalScore += attempt.score || 0;
      acc[courseId].totalPoints += attempt.exam.totalPoints;
      return acc;
    }, {} as Record<string, any>);

    return Object.values(courseGrades);
  }
}
```

#### Task 2.1.3: Implement Students Controller
**File: `src/students/students.controller.ts`**
```typescript
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { StudentsService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Students')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Create a new student' })
  create(@Body() createStudentDto: CreateStudentDto) {
    return this.studentsService.create(createStudentDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.PROCTOR)
  @ApiOperation({ summary: 'Get all students' })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'courseId', required: false, type: String })
  findAll(
    @Query('skip') skip?: number,
    @Query('take') take?: number,
    @Query('search') search?: string,
    @Query('courseId') courseId?: string,
  ) {
    return this.studentsService.findAll({
      skip: skip ? +skip : undefined,
      take: take ? +take : undefined,
      search,
      courseId,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a student by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.studentsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Update a student' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateStudentDto: UpdateStudentDto,
  ) {
    return this.studentsService.update(id, updateStudentDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a student' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.studentsService.remove(id);
  }

  @Get(':id/exams')
  @ApiOperation({ summary: 'Get student exams' })
  getExams(@Param('id', ParseUUIDPipe) id: string) {
    return this.studentsService.getStudentExams(id);
  }

  @Get(':id/grades')
  @ApiOperation({ summary: 'Get student grades' })
  getGrades(@Param('id', ParseUUIDPipe) id: string) {
    return this.studentsService.getStudentGrades(id);
  }
}
```

**Deliverables:**
- [ ] Students CRUD fully implemented
- [ ] Face enrollment endpoint
- [ ] Student exams endpoint
- [ ] Student grades endpoint
- [ ] Pagination and search
- [ ] Swagger documentation

---

### Phase 2.2: Exams Module
**Duration: 3 days**

#### Task 2.2.1: Create Exams Module Structure
```
src/exams/
├── exams.module.ts
├── exams.controller.ts
├── exams.service.ts
├── dto/
│   ├── create-exam.dto.ts
│   ├── update-exam.dto.ts
│   └── exam-response.dto.ts
└── entities/
    └── exam.entity.ts
```

#### Task 2.2.2: Implement DTOs
**File: `src/exams/dto/create-exam.dto.ts`**
```typescript
import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsInt,
  IsDateString,
  IsOptional,
  IsBoolean,
  IsUUID,
  Min,
  Max,
} from 'class-validator';

export class CreateExamDto {
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  courseId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  titleAr: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  titleEn: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  descriptionAr?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  descriptionEn?: string;

  @ApiProperty()
  @IsInt()
  @Min(5)
  @Max(300)
  durationMinutes: number;

  @ApiProperty()
  @IsDateString()
  startTime: string;

  @ApiProperty()
  @IsDateString()
  endTime: string;

  @ApiProperty({ required: false, default: 50 })
  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  passingScore?: number;

  @ApiProperty({ required: false, default: false })
  @IsBoolean()
  @IsOptional()
  shuffleQuestions?: boolean;

  @ApiProperty({ required: false, default: true })
  @IsBoolean()
  @IsOptional()
  showResults?: boolean;

  @ApiProperty({ required: false, default: false })
  @IsBoolean()
  @IsOptional()
  allowReview?: boolean;
}
```

#### Task 2.2.3: Implement Exams Service
**File: `src/exams/exams.service.ts`**
```typescript
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExamDto } from './dto/create-exam.dto';
import { UpdateExamDto } from './dto/update-exam.dto';
import { ExamStatus, Prisma, UserRole } from '@prisma/client';

@Injectable()
export class ExamsService {
  constructor(private prisma: PrismaService) {}

  async create(createExamDto: CreateExamDto, teacherId: string) {
    // Verify the teacher owns the course
    const course = await this.prisma.course.findFirst({
      where: {
        id: createExamDto.courseId,
        teacherId,
      },
    });

    if (!course) {
      throw new ForbiddenException('You do not have access to this course');
    }

    // Validate times
    const startTime = new Date(createExamDto.startTime);
    const endTime = new Date(createExamDto.endTime);

    if (startTime >= endTime) {
      throw new BadRequestException('End time must be after start time');
    }

    return this.prisma.exam.create({
      data: {
        courseId: createExamDto.courseId,
        titleAr: createExamDto.titleAr,
        titleEn: createExamDto.titleEn,
        descriptionAr: createExamDto.descriptionAr,
        descriptionEn: createExamDto.descriptionEn,
        durationMinutes: createExamDto.durationMinutes,
        startTime,
        endTime,
        passingScore: createExamDto.passingScore ?? 50,
        shuffleQuestions: createExamDto.shuffleQuestions ?? false,
        showResults: createExamDto.showResults ?? true,
        allowReview: createExamDto.allowReview ?? false,
        status: 'DRAFT',
      },
      include: {
        course: {
          select: { id: true, code: true, nameAr: true, nameEn: true },
        },
      },
    });
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    courseId?: string;
    status?: ExamStatus;
    teacherId?: string;
  }) {
    const { skip = 0, take = 20, courseId, status, teacherId } = params;

    const where: Prisma.ExamWhereInput = {};

    if (courseId) where.courseId = courseId;
    if (status) where.status = status;
    if (teacherId) {
      where.course = { teacherId };
    }

    const [exams, total] = await Promise.all([
      this.prisma.exam.findMany({
        where,
        skip,
        take,
        include: {
          course: {
            select: { id: true, code: true, nameAr: true, nameEn: true },
          },
          _count: {
            select: { questions: true, attempts: true },
          },
        },
        orderBy: { startTime: 'desc' },
      }),
      this.prisma.exam.count({ where }),
    ]);

    return {
      data: exams,
      meta: { total, skip, take, hasMore: skip + take < total },
    };
  }

  async findOne(id: string, includeQuestions = false) {
    const exam = await this.prisma.exam.findUnique({
      where: { id },
      include: {
        course: {
          select: { id: true, code: true, nameAr: true, nameEn: true, teacherId: true },
        },
        questions: includeQuestions
          ? { orderBy: { orderIndex: 'asc' } }
          : false,
        _count: {
          select: { questions: true, attempts: true },
        },
      },
    });

    if (!exam) {
      throw new NotFoundException('Exam not found');
    }

    return exam;
  }

  async update(id: string, updateExamDto: UpdateExamDto, teacherId: string) {
    const exam = await this.findOne(id);

    // Verify ownership
    if (exam.course.teacherId !== teacherId) {
      throw new ForbiddenException('You do not have access to this exam');
    }

    // Cannot update completed or active exams
    if (['ACTIVE', 'COMPLETED'].includes(exam.status)) {
      throw new BadRequestException('Cannot update an active or completed exam');
    }

    const data: Prisma.ExamUpdateInput = {};

    if (updateExamDto.titleAr) data.titleAr = updateExamDto.titleAr;
    if (updateExamDto.titleEn) data.titleEn = updateExamDto.titleEn;
    if (updateExamDto.descriptionAr !== undefined) data.descriptionAr = updateExamDto.descriptionAr;
    if (updateExamDto.descriptionEn !== undefined) data.descriptionEn = updateExamDto.descriptionEn;
    if (updateExamDto.durationMinutes) data.durationMinutes = updateExamDto.durationMinutes;
    if (updateExamDto.startTime) data.startTime = new Date(updateExamDto.startTime);
    if (updateExamDto.endTime) data.endTime = new Date(updateExamDto.endTime);
    if (updateExamDto.passingScore !== undefined) data.passingScore = updateExamDto.passingScore;
    if (updateExamDto.shuffleQuestions !== undefined) data.shuffleQuestions = updateExamDto.shuffleQuestions;
    if (updateExamDto.showResults !== undefined) data.showResults = updateExamDto.showResults;
    if (updateExamDto.allowReview !== undefined) data.allowReview = updateExamDto.allowReview;
    if (updateExamDto.status) data.status = updateExamDto.status;

    return this.prisma.exam.update({
      where: { id },
      data,
      include: {
        course: {
          select: { id: true, code: true, nameAr: true, nameEn: true },
        },
      },
    });
  }

  async remove(id: string, teacherId: string) {
    const exam = await this.findOne(id);

    if (exam.course.teacherId !== teacherId) {
      throw new ForbiddenException('You do not have access to this exam');
    }

    if (exam.status !== 'DRAFT') {
      throw new BadRequestException('Can only delete draft exams');
    }

    return this.prisma.exam.delete({ where: { id } });
  }

  async publish(id: string, teacherId: string) {
    const exam = await this.findOne(id, true);

    if (exam.course.teacherId !== teacherId) {
      throw new ForbiddenException('You do not have access to this exam');
    }

    if (exam.status !== 'DRAFT') {
      throw new BadRequestException('Can only publish draft exams');
    }

    if (!exam.questions || exam.questions.length === 0) {
      throw new BadRequestException('Cannot publish exam without questions');
    }

    // Calculate total points
    const totalPoints = exam.questions.reduce((sum, q) => sum + q.points, 0);

    return this.prisma.exam.update({
      where: { id },
      data: {
        status: 'PUBLISHED',
        totalPoints,
      },
    });
  }

  async getExamStatistics(id: string, teacherId: string) {
    const exam = await this.findOne(id);

    if (exam.course.teacherId !== teacherId) {
      throw new ForbiddenException('You do not have access to this exam');
    }

    const attempts = await this.prisma.examAttempt.findMany({
      where: { examId: id, status: 'GRADED' },
      select: { score: true, percentage: true },
    });

    if (attempts.length === 0) {
      return {
        examId: id,
        totalAttempts: 0,
        gradedAttempts: 0,
        averageScore: null,
        averagePercentage: null,
        highestScore: null,
        lowestScore: null,
        passRate: null,
      };
    }

    const scores = attempts.map(a => a.score || 0);
    const percentages = attempts.map(a => a.percentage || 0);
    const passed = attempts.filter(a => (a.percentage || 0) >= exam.passingScore).length;

    return {
      examId: id,
      totalAttempts: await this.prisma.examAttempt.count({ where: { examId: id } }),
      gradedAttempts: attempts.length,
      averageScore: scores.reduce((a, b) => a + b, 0) / scores.length,
      averagePercentage: percentages.reduce((a, b) => a + b, 0) / percentages.length,
      highestScore: Math.max(...scores),
      lowestScore: Math.min(...scores),
      passRate: (passed / attempts.length) * 100,
    };
  }
}
```

**Deliverables:**
- [ ] Exams CRUD fully implemented
- [ ] Exam publishing workflow
- [ ] Statistics endpoint
- [ ] Access control for teachers
- [ ] Validation for exam times

---

### Phase 2.3: Questions Module
**Duration: 2 days**

#### Task 2.3.1: Implement Questions Service
**File: `src/questions/questions.service.ts`**
```typescript
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';

@Injectable()
export class QuestionsService {
  constructor(private prisma: PrismaService) {}

  async create(examId: string, createQuestionDto: CreateQuestionDto, teacherId: string) {
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
      include: { course: true },
    });

    if (!exam) {
      throw new NotFoundException('Exam not found');
    }

    if (exam.course.teacherId !== teacherId) {
      throw new ForbiddenException('You do not have access to this exam');
    }

    if (exam.status !== 'DRAFT') {
      throw new BadRequestException('Cannot add questions to published exam');
    }

    // Get the next order index
    const lastQuestion = await this.prisma.question.findFirst({
      where: { examId },
      orderBy: { orderIndex: 'desc' },
    });

    const orderIndex = (lastQuestion?.orderIndex ?? -1) + 1;

    // Validate options for multiple choice
    if (createQuestionDto.type === 'MULTIPLE_CHOICE') {
      if (!createQuestionDto.options || createQuestionDto.options.length < 2) {
        throw new BadRequestException('Multiple choice questions require at least 2 options');
      }
    }

    return this.prisma.question.create({
      data: {
        examId,
        type: createQuestionDto.type,
        textAr: createQuestionDto.textAr,
        textEn: createQuestionDto.textEn,
        options: createQuestionDto.options,
        correctAnswer: createQuestionDto.correctAnswer,
        points: createQuestionDto.points ?? 1,
        orderIndex,
      },
    });
  }

  async findAllByExam(examId: string) {
    return this.prisma.question.findMany({
      where: { examId },
      orderBy: { orderIndex: 'asc' },
    });
  }

  async findOne(id: string) {
    const question = await this.prisma.question.findUnique({
      where: { id },
      include: {
        exam: {
          include: { course: true },
        },
      },
    });

    if (!question) {
      throw new NotFoundException('Question not found');
    }

    return question;
  }

  async update(id: string, updateQuestionDto: UpdateQuestionDto, teacherId: string) {
    const question = await this.findOne(id);

    if (question.exam.course.teacherId !== teacherId) {
      throw new ForbiddenException('You do not have access to this question');
    }

    if (question.exam.status !== 'DRAFT') {
      throw new BadRequestException('Cannot update questions in published exam');
    }

    return this.prisma.question.update({
      where: { id },
      data: {
        type: updateQuestionDto.type,
        textAr: updateQuestionDto.textAr,
        textEn: updateQuestionDto.textEn,
        options: updateQuestionDto.options,
        correctAnswer: updateQuestionDto.correctAnswer,
        points: updateQuestionDto.points,
        orderIndex: updateQuestionDto.orderIndex,
      },
    });
  }

  async remove(id: string, teacherId: string) {
    const question = await this.findOne(id);

    if (question.exam.course.teacherId !== teacherId) {
      throw new ForbiddenException('You do not have access to this question');
    }

    if (question.exam.status !== 'DRAFT') {
      throw new BadRequestException('Cannot delete questions from published exam');
    }

    return this.prisma.question.delete({ where: { id } });
  }

  async reorder(examId: string, questionIds: string[], teacherId: string) {
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
      include: { course: true, questions: true },
    });

    if (!exam) {
      throw new NotFoundException('Exam not found');
    }

    if (exam.course.teacherId !== teacherId) {
      throw new ForbiddenException('You do not have access to this exam');
    }

    if (exam.status !== 'DRAFT') {
      throw new BadRequestException('Cannot reorder questions in published exam');
    }

    // Update order indices
    const updates = questionIds.map((id, index) =>
      this.prisma.question.update({
        where: { id },
        data: { orderIndex: index },
      }),
    );

    await this.prisma.$transaction(updates);

    return this.findAllByExam(examId);
  }
}
```

**Deliverables:**
- [ ] Questions CRUD implemented
- [ ] Question reordering
- [ ] Validation for question types
- [ ] Access control

---

## Phase 3: Exam Workflow

### Duration: Week 5-6

### Phase 3.1: Exam Attempts Module
**Duration: 3 days**

#### Task 3.1.1: Implement Attempts Service
**File: `src/attempts/attempts.service.ts`**
```typescript
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SubmitAnswerDto } from './dto/submit-answer.dto';
import { ExamStatus, AttemptStatus } from '@prisma/client';

@Injectable()
export class AttemptsService {
  constructor(private prisma: PrismaService) {}

  async startExam(examId: string, studentId: string, ipAddress?: string, userAgent?: string) {
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
      include: {
        course: {
          include: {
            enrollments: {
              where: { studentId },
            },
          },
        },
        questions: {
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    if (!exam) {
      throw new NotFoundException('Exam not found');
    }

    // Check enrollment
    if (exam.course.enrollments.length === 0) {
      throw new ForbiddenException('You are not enrolled in this course');
    }

    // Check exam status and timing
    const now = new Date();

    if (exam.status !== 'PUBLISHED' && exam.status !== 'ACTIVE') {
      throw new BadRequestException('Exam is not available');
    }

    if (now < exam.startTime) {
      throw new BadRequestException('Exam has not started yet');
    }

    if (now > exam.endTime) {
      throw new BadRequestException('Exam has ended');
    }

    // Check for existing attempt
    let attempt = await this.prisma.examAttempt.findUnique({
      where: {
        examId_studentId: { examId, studentId },
      },
    });

    if (attempt) {
      if (attempt.status === 'SUBMITTED' || attempt.status === 'GRADED') {
        throw new BadRequestException('You have already submitted this exam');
      }

      // Check if time expired
      if (attempt.startedAt) {
        const expiryTime = new Date(attempt.startedAt);
        expiryTime.setMinutes(expiryTime.getMinutes() + exam.durationMinutes);

        if (now > expiryTime) {
          throw new BadRequestException('Your exam time has expired');
        }
      }

      return {
        attempt,
        questions: this.formatQuestionsForStudent(exam.questions, exam.shuffleQuestions),
        timeRemaining: this.calculateTimeRemaining(attempt.startedAt, exam.durationMinutes),
      };
    }

    // Create new attempt
    attempt = await this.prisma.examAttempt.create({
      data: {
        examId,
        studentId,
        startedAt: now,
        status: 'IN_PROGRESS',
        ipAddress,
        userAgent,
      },
    });

    // Activate exam if this is the first attempt
    if (exam.status === 'PUBLISHED') {
      await this.prisma.exam.update({
        where: { id: examId },
        data: { status: 'ACTIVE' },
      });
    }

    return {
      attempt,
      questions: this.formatQuestionsForStudent(exam.questions, exam.shuffleQuestions),
      timeRemaining: exam.durationMinutes * 60, // seconds
    };
  }

  async saveAnswer(attemptId: string, studentId: string, submitAnswerDto: SubmitAnswerDto) {
    const attempt = await this.prisma.examAttempt.findUnique({
      where: { id: attemptId },
      include: { exam: true },
    });

    if (!attempt) {
      throw new NotFoundException('Attempt not found');
    }

    if (attempt.studentId !== studentId) {
      throw new ForbiddenException('This is not your exam attempt');
    }

    if (attempt.status !== 'IN_PROGRESS') {
      throw new BadRequestException('Exam is not in progress');
    }

    // Check time
    const timeRemaining = this.calculateTimeRemaining(attempt.startedAt, attempt.exam.durationMinutes);
    if (timeRemaining <= 0) {
      throw new BadRequestException('Exam time has expired');
    }

    // Upsert answer
    return this.prisma.answer.upsert({
      where: {
        attemptId_questionId: {
          attemptId,
          questionId: submitAnswerDto.questionId,
        },
      },
      create: {
        attemptId,
        questionId: submitAnswerDto.questionId,
        answer: submitAnswerDto.answer,
      },
      update: {
        answer: submitAnswerDto.answer,
        updatedAt: new Date(),
      },
    });
  }

  async submitExam(attemptId: string, studentId: string) {
    const attempt = await this.prisma.examAttempt.findUnique({
      where: { id: attemptId },
      include: {
        exam: {
          include: { questions: true },
        },
        answers: true,
      },
    });

    if (!attempt) {
      throw new NotFoundException('Attempt not found');
    }

    if (attempt.studentId !== studentId) {
      throw new ForbiddenException('This is not your exam attempt');
    }

    if (attempt.status !== 'IN_PROGRESS') {
      throw new BadRequestException('Exam is not in progress');
    }

    // Grade the exam
    let totalScore = 0;
    const answerUpdates = [];

    for (const question of attempt.exam.questions) {
      const answer = attempt.answers.find(a => a.questionId === question.id);

      if (answer) {
        const isCorrect = this.checkAnswer(question, answer.answer);
        const pointsEarned = isCorrect ? question.points : 0;
        totalScore += pointsEarned;

        answerUpdates.push(
          this.prisma.answer.update({
            where: { id: answer.id },
            data: { isCorrect, pointsEarned },
          }),
        );
      }
    }

    const percentage = (totalScore / attempt.exam.totalPoints) * 100;

    // Update attempt and answers in transaction
    await this.prisma.$transaction([
      ...answerUpdates,
      this.prisma.examAttempt.update({
        where: { id: attemptId },
        data: {
          status: 'GRADED',
          submittedAt: new Date(),
          score: totalScore,
          percentage,
        },
      }),
    ]);

    return {
      attemptId,
      score: totalScore,
      totalPoints: attempt.exam.totalPoints,
      percentage,
      passed: percentage >= attempt.exam.passingScore,
    };
  }

  async getAttemptDetails(attemptId: string, userId: string, userRole: string) {
    const attempt = await this.prisma.examAttempt.findUnique({
      where: { id: attemptId },
      include: {
        exam: {
          include: {
            course: true,
            questions: { orderBy: { orderIndex: 'asc' } },
          },
        },
        answers: true,
        student: true,
      },
    });

    if (!attempt) {
      throw new NotFoundException('Attempt not found');
    }

    // Access control
    const isOwner = attempt.student.userId === userId;
    const isTeacher = attempt.exam.course.teacherId === userId;

    if (!isOwner && !isTeacher && !['ADMIN', 'PROCTOR'].includes(userRole)) {
      throw new ForbiddenException('Access denied');
    }

    // If student and exam doesn't allow review, hide correct answers
    const hideAnswers = isOwner && !attempt.exam.allowReview && attempt.status === 'GRADED';

    return {
      ...attempt,
      exam: {
        ...attempt.exam,
        questions: attempt.exam.questions.map(q => ({
          ...q,
          correctAnswer: hideAnswers ? undefined : q.correctAnswer,
        })),
      },
    };
  }

  private formatQuestionsForStudent(questions: any[], shuffle: boolean) {
    let formatted = questions.map(q => ({
      id: q.id,
      type: q.type,
      textAr: q.textAr,
      textEn: q.textEn,
      options: q.options,
      points: q.points,
    }));

    if (shuffle) {
      formatted = this.shuffleArray(formatted);
    }

    return formatted;
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  private calculateTimeRemaining(startedAt: Date | null, durationMinutes: number): number {
    if (!startedAt) return durationMinutes * 60;

    const now = new Date();
    const expiryTime = new Date(startedAt);
    expiryTime.setMinutes(expiryTime.getMinutes() + durationMinutes);

    const remaining = Math.floor((expiryTime.getTime() - now.getTime()) / 1000);
    return Math.max(0, remaining);
  }

  private checkAnswer(question: any, answer: any): boolean {
    if (!answer) return false;

    switch (question.type) {
      case 'MULTIPLE_CHOICE':
      case 'TRUE_FALSE':
        return JSON.stringify(answer) === JSON.stringify(question.correctAnswer);
      case 'SHORT_ANSWER':
        const correctAnswers = Array.isArray(question.correctAnswer)
          ? question.correctAnswer
          : [question.correctAnswer];
        return correctAnswers.some(
          (correct: string) => correct.toLowerCase().trim() === String(answer).toLowerCase().trim(),
        );
      case 'ESSAY':
        // Essays require manual grading
        return false;
      default:
        return false;
    }
  }
}
```

**Deliverables:**
- [ ] Start exam endpoint
- [ ] Save answer endpoint (auto-save)
- [ ] Submit exam endpoint
- [ ] Auto-grading for objective questions
- [ ] Time management
- [ ] Access control

---

### Phase 3.2: WebSocket Gateway for Real-time
**Duration: 2 days**

#### Task 3.2.1: Implement Monitoring Gateway
**File: `src/monitoring/monitoring.gateway.ts`**
```typescript
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { WsJwtGuard } from '../auth/guards/ws-jwt.guard';
import { MonitoringService } from './monitoring.service';

@WebSocketGateway({
  namespace: '/monitoring',
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
})
export class MonitoringGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private monitoringService: MonitoringService) {}

  async handleConnection(client: Socket) {
    try {
      const user = await this.monitoringService.authenticateSocket(client);
      if (!user || !['TEACHER', 'PROCTOR', 'ADMIN'].includes(user.role)) {
        client.disconnect();
        return;
      }
      client.data.user = user;
      console.log(`Proctor connected: ${user.id}`);
    } catch (error) {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`Proctor disconnected: ${client.data?.user?.id}`);
  }

  @SubscribeMessage('subscribe:exam')
  async handleSubscribeExam(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { examId: string },
  ) {
    const room = `exam:${data.examId}`;
    client.join(room);

    // Send current session status
    const sessions = await this.monitoringService.getExamSessions(data.examId);
    client.emit('exam:sessions', sessions);
  }

  @SubscribeMessage('unsubscribe:exam')
  handleUnsubscribeExam(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { examId: string },
  ) {
    client.leave(`exam:${data.examId}`);
  }

  // Called by verification service when verification completes
  async emitVerificationEvent(attemptId: string, event: any) {
    const attempt = await this.monitoringService.getAttemptWithExam(attemptId);
    if (attempt) {
      this.server.to(`exam:${attempt.examId}`).emit('verification:result', {
        attemptId,
        studentId: attempt.studentId,
        ...event,
      });
    }
  }

  // Called when an alert is raised
  async emitAlert(alert: any) {
    const attempt = await this.monitoringService.getAttemptWithExam(alert.attemptId);
    if (attempt) {
      this.server.to(`exam:${attempt.examId}`).emit('alert:new', alert);
    }
  }
}
```

**Deliverables:**
- [ ] WebSocket gateway implemented
- [ ] Room-based subscription per exam
- [ ] Real-time verification events
- [ ] Real-time alert broadcasting
- [ ] Authentication for WebSocket

---

## Phase 4: Integration & Optimization

### Duration: Week 7-8

### Phase 4.1: API Documentation
**Duration: 1 day**

#### Task 4.1.1: Configure Swagger
**File: `src/main.ts`**
```typescript
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle('SEAS API')
    .setDescription('Smart Exam Attendance System API')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Auth', 'Authentication endpoints')
    .addTag('Students', 'Student management')
    .addTag('Exams', 'Exam management')
    .addTag('Questions', 'Question management')
    .addTag('Attempts', 'Exam attempts')
    .addTag('Verification', 'Face verification')
    .addTag('Monitoring', 'Proctor monitoring')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT || 3000);
}
bootstrap();
```

**Deliverables:**
- [ ] Swagger documentation complete
- [ ] All endpoints documented
- [ ] Request/response schemas defined

---

### Phase 4.2: Testing
**Duration: 3 days**

#### Task 4.2.1: Unit Tests
```typescript
// Example: src/students/students.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { StudentsService } from './students.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';

describe('StudentsService', () => {
  let service: StudentsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    student: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudentsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: AuthService, useValue: { hashPassword: jest.fn() } },
      ],
    }).compile();

    service = module.get<StudentsService>(StudentsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new student', async () => {
      // Test implementation
    });

    it('should throw ConflictException if email exists', async () => {
      // Test implementation
    });
  });
});
```

#### Task 4.2.2: Integration Tests
```typescript
// Example: test/students.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('StudentsController (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Login to get token
    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'password' });

    authToken = loginResponse.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/api/students (GET)', () => {
    it('should return paginated students', () => {
      return request(app.getHttpServer())
        .get('/api/students')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('meta');
        });
    });
  });
});
```

**Deliverables:**
- [ ] Unit tests for all services
- [ ] E2E tests for all endpoints
- [ ] Test coverage > 80%

---

### Phase 4.3: Performance & Security
**Duration: 2 days**

#### Task 4.3.1: Rate Limiting
```typescript
// src/app.module.ts
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,
        limit: 3,
      },
      {
        name: 'medium',
        ttl: 10000,
        limit: 20,
      },
      {
        name: 'long',
        ttl: 60000,
        limit: 100,
      },
    ]),
  ],
})
export class AppModule {}
```

#### Task 4.3.2: Helmet Security Headers
```typescript
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(helmet());
  // ...
}
```

**Deliverables:**
- [ ] Rate limiting configured
- [ ] Security headers added
- [ ] Database indexes optimized
- [ ] Query performance validated

---

## Task Summary

### Phase 1: Foundation (Week 1-2)
| Task ID | Task | Status | Dependencies |
|---------|------|--------|--------------|
| 1.1.1 | Initialize NestJS Project | [ ] | - |
| 1.1.2 | Configure Development Environment | [ ] | 1.1.1 |
| 1.1.3 | Docker Development Setup | [ ] | 1.1.1 |
| 1.2.1 | Initialize Prisma | [ ] | 1.1.3 |
| 1.2.2 | Define Core Schema | [ ] | 1.2.1 |
| 1.2.3 | Run Migrations | [ ] | 1.2.2 |
| 1.3.1 | Install Auth Dependencies | [ ] | 1.2.3 |
| 1.3.2 | Create Auth Module Structure | [ ] | 1.3.1 |
| 1.3.3 | Implement Auth Service | [ ] | 1.3.2 |
| 1.3.4 | Implement JWT Strategy | [ ] | 1.3.3 |
| 1.3.5 | Implement Guards and Decorators | [ ] | 1.3.4 |

### Phase 2: Core CRUD (Week 3-4)
| Task ID | Task | Status | Dependencies |
|---------|------|--------|--------------|
| 2.1.1 | Create Students Module Structure | [ ] | Phase 1 |
| 2.1.2 | Implement Students Service | [ ] | 2.1.1 |
| 2.1.3 | Implement Students Controller | [ ] | 2.1.2 |
| 2.2.1 | Create Exams Module Structure | [ ] | Phase 1 |
| 2.2.2 | Implement Exams DTOs | [ ] | 2.2.1 |
| 2.2.3 | Implement Exams Service | [ ] | 2.2.2 |
| 2.3.1 | Implement Questions Service | [ ] | 2.2.3 |

### Phase 3: Exam Workflow (Week 5-6)
| Task ID | Task | Status | Dependencies |
|---------|------|--------|--------------|
| 3.1.1 | Implement Attempts Service | [ ] | Phase 2 |
| 3.2.1 | Implement Monitoring Gateway | [ ] | 3.1.1 |

### Phase 4: Integration (Week 7-8)
| Task ID | Task | Status | Dependencies |
|---------|------|--------|--------------|
| 4.1.1 | Configure Swagger | [ ] | Phase 3 |
| 4.2.1 | Unit Tests | [ ] | Phase 3 |
| 4.2.2 | Integration Tests | [ ] | 4.2.1 |
| 4.3.1 | Rate Limiting | [ ] | Phase 3 |
| 4.3.2 | Security Headers | [ ] | Phase 3 |

---

## Environment Variables

```env
# Application
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://seas:seas_password@localhost:5432/seas_db

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=8h

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000

# Image Processing Service
IMAGE_PROCESSING_URL=http://localhost:8000
```

---

## Deployment Checklist

- [ ] Production database configured
- [ ] Redis configured with persistence
- [ ] Environment variables set
- [ ] TLS/SSL certificates configured
- [ ] Database migrations applied
- [ ] Seed data loaded (if needed)
- [ ] API documentation accessible
- [ ] Monitoring/logging configured
- [ ] Backup strategy in place
