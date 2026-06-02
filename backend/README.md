# SEAS Backend API

Smart Exam Attendance System - NestJS Backend

## Prerequisites

- Node.js 18+
- PostgreSQL 16
- Redis 7
- Docker (optional, for local development)

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Start Database Services

Using Docker Compose:

```bash
docker-compose up -d
```

This will start:
- PostgreSQL on port 5432
- Redis on port 6379
- Adminer (DB UI) on port 8080

### 3. Configure Environment

Copy the example environment file:

```bash
cp .env.example .env
```

Update the values in `.env` as needed.

### 4. Setup Database

Generate Prisma client:

```bash
npm run prisma:generate
```

Run migrations:

```bash
npm run prisma:migrate
```

Seed the database (optional, for development):

```bash
npm run prisma:seed
```

### 5. Start the Server

Development mode:

```bash
npm run start:dev
```

Production mode:

```bash
npm run build
npm run start:prod
```

## API Documentation

Once the server is running, access the Swagger documentation at:

- http://localhost:3000/api/docs

## Test Credentials (After Seeding)

| Role    | Email              | Password   |
|---------|-------------------|------------|
| Admin   | admin@aaup.edu    | admin123   |
| Teacher | teacher@aaup.edu  | teacher123 |
| Proctor | proctor@aaup.edu  | proctor123 |
| Student | student1@aaup.edu | student1   |

## Available Scripts

| Script                  | Description                        |
|------------------------|-----------------------------------|
| `npm run start:dev`    | Start in development mode         |
| `npm run start:debug`  | Start with debugger               |
| `npm run build`        | Build for production              |
| `npm run start:prod`   | Start production build            |
| `npm run lint`         | Run ESLint                        |
| `npm run format`       | Format code with Prettier         |
| `npm run test`         | Run unit tests                    |
| `npm run test:e2e`     | Run end-to-end tests              |
| `npm run prisma:studio`| Open Prisma Studio                |
| `npm run prisma:migrate`| Run database migrations          |
| `npm run prisma:seed`  | Seed database                     |

## Project Structure

```
backend/
├── prisma/
│   ├── schema.prisma    # Database schema
│   └── seed.ts          # Database seeder
├── src/
│   ├── auth/            # Authentication module
│   ├── students/        # Student management
│   ├── teachers/        # Teacher management
│   ├── courses/         # Course management
│   ├── exams/           # Exam management
│   ├── questions/       # Question management
│   ├── attempts/        # Exam attempts
│   ├── verification/    # Face verification
│   ├── monitoring/      # Real-time monitoring
│   ├── health/          # Health checks
│   ├── prisma/          # Prisma service
│   ├── redis/           # Redis service
│   ├── common/          # Shared utilities
│   ├── app.module.ts    # Root module
│   └── main.ts          # Application entry
├── docker-compose.yml   # Local dev services
└── package.json
```

## API Endpoints Overview

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh token
- `GET /api/auth/me` - Get current user

### Students
- `GET /api/students` - List students
- `POST /api/students` - Create student
- `GET /api/students/:id` - Get student
- `PATCH /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student

### Teachers
- `GET /api/teachers` - List teachers
- `POST /api/teachers` - Create teacher
- `GET /api/teachers/:id` - Get teacher
- `PATCH /api/teachers/:id` - Update teacher
- `DELETE /api/teachers/:id` - Delete teacher

### Courses
- `GET /api/courses` - List courses
- `POST /api/courses` - Create course
- `GET /api/courses/:id` - Get course
- `PATCH /api/courses/:id` - Update course
- `DELETE /api/courses/:id` - Delete course
- `POST /api/courses/:id/enroll` - Enroll students
- `GET /api/courses/:id/students` - Get enrolled students

### Exams
- `GET /api/exams` - List exams
- `POST /api/exams` - Create exam
- `GET /api/exams/:id` - Get exam
- `PATCH /api/exams/:id` - Update exam
- `DELETE /api/exams/:id` - Delete exam
- `PATCH /api/exams/:id/publish` - Publish exam
- `PATCH /api/exams/:id/activate` - Activate exam
- `PATCH /api/exams/:id/complete` - Complete exam

### Questions
- `GET /api/questions/exam/:examId` - Get exam questions
- `POST /api/questions` - Create question
- `PATCH /api/questions/:id` - Update question
- `DELETE /api/questions/:id` - Delete question

### Exam Attempts
- `POST /api/attempts/start` - Start exam attempt
- `POST /api/attempts/:id/answer` - Submit answer
- `POST /api/attempts/:id/submit` - Submit exam
- `GET /api/attempts/my-attempts` - Get student attempts

### Verification
- `POST /api/verification/log` - Log verification
- `POST /api/verification/enroll` - Enroll face
- `GET /api/verification/alerts/unresolved` - Get alerts

### Health
- `GET /api/health` - Health check
- `GET /api/health/live` - Liveness probe
- `GET /api/health/ready` - Readiness probe

## WebSocket Events

Connect to `/monitoring` namespace for real-time updates:

### Client Events
- `joinExamRoom` - Join exam monitoring room
- `studentJoinExam` - Student joins exam
- `studentActivity` - Log student activity
- `verificationResult` - Send verification result

### Server Events
- `examUpdate` - Exam data update
- `studentOnline` - Student came online
- `studentOffline` - Student went offline
- `studentActivity` - Student activity notification
- `verificationUpdate` - Verification result update
- `newAlert` - New alert notification
