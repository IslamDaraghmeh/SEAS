# SEAS - Smart Exam Attendance System
## Master Implementation Plan

---

## Project Overview

The Smart Exam Attendance System (SEAS) is a comprehensive examination platform that combines:
- **Hardware**: Raspberry Pi 4 with high-quality camera for face capture
- **AI/ML**: Face recognition (FaceNet) and liveness detection (EAR, head-pose, MobileNetV2)
- **Backend**: NestJS API with PostgreSQL database
- **Frontend Web**: Student verification and exam submission portal (RTL/Multi-language)
- **Mobile App**: Flutter app for exam summaries and grades

---

## Implementation Components

| Component | Document | Description |
|-----------|----------|-------------|
| 1. Backend API | [01-BACKEND-IMPLEMENTATION.md](./01-BACKEND-IMPLEMENTATION.md) | Auth, Students, Exams CRUD, Submissions |
| 2. Image Processing | [02-IMAGE-PROCESSING-IMPLEMENTATION.md](./02-IMAGE-PROCESSING-IMPLEMENTATION.md) | Face recognition, Liveness detection, Monitoring |
| 3. Frontend Web | [03-FRONTEND-WEB-IMPLEMENTATION.md](./03-FRONTEND-WEB-IMPLEMENTATION.md) | Student portal with RTL/i18n support |
| 4. Mobile App | [04-MOBILE-APP-IMPLEMENTATION.md](./04-MOBILE-APP-IMPLEMENTATION.md) | Flutter app for exam summaries |

---

## Technology Stack

### Backend
- **Framework**: NestJS (Node.js)
- **Database**: PostgreSQL 16
- **Cache/Sessions**: Redis
- **Authentication**: JWT + bcrypt
- **Real-time**: WebSocket (Socket.io)
- **File Storage**: MinIO/S3-compatible storage
- **API Documentation**: Swagger/OpenAPI

### Image Processing (Edge + Server)
- **Edge Device**: Raspberry Pi 4 (8GB)
- **Camera**: Raspberry Pi HQ Camera
- **ML Framework**: TensorFlow Lite
- **Face Recognition**: FaceNet (128-dim embeddings)
- **Liveness Detection**: EAR, Head-pose (OpenCV solvePnP), MobileNetV2 CNN
- **Face Detection**: dlib 68-point landmark detector

### Frontend Web
- **Framework**: React 18+ with TypeScript
- **State Management**: Zustand / React Query
- **UI Components**: Tailwind CSS + Headless UI
- **i18n**: react-i18next (AR/EN, default AR)
- **RTL Support**: Native CSS logical properties
- **Real-time**: Socket.io client
- **Camera Access**: WebRTC/MediaDevices API

### Mobile App
- **Framework**: Flutter 3.x
- **State Management**: Riverpod / BLoC
- **API Client**: Dio
- **i18n**: flutter_localizations (AR/EN)
- **Charts**: fl_chart
- **Local Storage**: Hive / SharedPreferences

---

## Project Phases Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           PHASE 1: FOUNDATION                               │
│  Backend Core + Auth + Database Schema + Basic Image Processing Pipeline    │
├─────────────────────────────────────────────────────────────────────────────┤
│                           PHASE 2: CORE FEATURES                            │
│  Students/Exams CRUD + Face Recognition + Liveness Detection + Basic Web UI │
├─────────────────────────────────────────────────────────────────────────────┤
│                           PHASE 3: ADVANCED FEATURES                        │
│  Real-time Monitoring + WebSocket Alerts + Complete Web UI + Mobile App     │
├─────────────────────────────────────────────────────────────────────────────┤
│                           PHASE 4: INTEGRATION & POLISH                     │
│  End-to-end Testing + Performance Optimization + Security Hardening         │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Database Schema Overview

```sql
-- Core Tables
Users (id, email, password_hash, role, created_at, updated_at)
Students (id, user_id, student_number, name_ar, name_en, face_template, enrolled_at)
Teachers (id, user_id, name_ar, name_en, department)
Courses (id, code, name_ar, name_en, teacher_id)
Enrollments (id, student_id, course_id, semester)

-- Exam Tables
Exams (id, course_id, title_ar, title_en, duration_minutes, start_time, end_time, status)
Questions (id, exam_id, type, text_ar, text_en, options, correct_answer, points)
ExamAttempts (id, exam_id, student_id, started_at, submitted_at, score, status)
Answers (id, attempt_id, question_id, answer, is_correct, points_earned)

-- Monitoring Tables
VerificationLogs (id, attempt_id, timestamp, match_score, liveness_passed, status)
Alerts (id, attempt_id, type, severity, message, timestamp, acknowledged)
FaceCaptures (id, attempt_id, timestamp, embedding, spoof_score)
```

---

## API Endpoints Overview

### Authentication
```
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/refresh
GET    /api/auth/me
```

### Students
```
GET    /api/students
GET    /api/students/:id
POST   /api/students
PUT    /api/students/:id
DELETE /api/students/:id
POST   /api/students/:id/enroll-face
GET    /api/students/:id/exams
GET    /api/students/:id/grades
```

### Exams
```
GET    /api/exams
GET    /api/exams/:id
POST   /api/exams
PUT    /api/exams/:id
DELETE /api/exams/:id
GET    /api/exams/:id/questions
POST   /api/exams/:id/questions
PUT    /api/exams/:id/questions/:qid
DELETE /api/exams/:id/questions/:qid
```

### Exam Sessions
```
POST   /api/exams/:id/start
POST   /api/exams/:id/submit
POST   /api/exams/:id/save-progress
GET    /api/exams/:id/attempt
```

### Verification
```
POST   /api/verification/capture
POST   /api/verification/verify
POST   /api/verification/liveness-check
GET    /api/verification/status/:attemptId
```

### Monitoring (Teacher/Proctor)
```
GET    /api/monitoring/sessions
GET    /api/monitoring/sessions/:id
GET    /api/monitoring/alerts
POST   /api/monitoring/alerts/:id/acknowledge
WS     /ws/monitoring
```

---

## Security Requirements

1. **Authentication**: JWT with 8-hour expiry, Redis blocklist for revocation
2. **Password Security**: bcrypt with cost factor 12
3. **Data Encryption**:
   - At rest: AES-256 for face templates
   - In transit: TLS 1.3
4. **Access Control**: Role-Based (Student, Teacher, Admin, Proctor)
5. **Face Templates**: Store only 128-dim embeddings, discard raw images
6. **Audit Logging**: All verification events logged with timestamps

---

## Non-Functional Requirements

| Requirement | Target |
|-------------|--------|
| Face Recognition TAR | ≥ 95% |
| Face Recognition FAR | ≤ 1% |
| Verification Latency | ≤ 2 seconds |
| Enrollment Time | ≤ 5 minutes |
| Platform Uptime | ≥ 99.5% |
| WebSocket Alert Latency | < 200ms |

---

## Folder Structure

```
seas-project/
├── backend/                    # NestJS Backend
│   ├── src/
│   │   ├── auth/
│   │   ├── students/
│   │   ├── teachers/
│   │   ├── exams/
│   │   ├── questions/
│   │   ├── attempts/
│   │   ├── verification/
│   │   ├── monitoring/
│   │   ├── common/
│   │   └── config/
│   └── prisma/
│
├── image-processing/           # Python Image Processing Service
│   ├── services/
│   │   ├── face_detection/
│   │   ├── face_recognition/
│   │   ├── liveness_detection/
│   │   └── monitoring/
│   ├── models/
│   └── api/
│
├── frontend-web/               # React Frontend
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── i18n/
│   │   └── styles/
│   └── public/
│
├── mobile-app/                 # Flutter Mobile App
│   ├── lib/
│   │   ├── models/
│   │   ├── providers/
│   │   ├── screens/
│   │   ├── services/
│   │   ├── widgets/
│   │   └── l10n/
│   └── assets/
│
├── edge-client/                # Raspberry Pi Client
│   ├── camera/
│   ├── inference/
│   └── communication/
│
├── docker/
├── docs/
└── scripts/
```

---

## Development Timeline Summary

| Phase | Duration | Key Deliverables |
|-------|----------|------------------|
| Phase 1 | Weeks 1-3 | Auth, DB Schema, Basic API, Face Detection |
| Phase 2 | Weeks 4-7 | Full CRUD, Face Recognition, Liveness, Basic UI |
| Phase 3 | Weeks 8-11 | Real-time Monitoring, Complete Web, Mobile App |
| Phase 4 | Weeks 12-14 | Integration, Testing, Optimization, Deployment |

---

## Getting Started

1. Review individual component plans in detail
2. Set up development environment
3. Initialize project repositories
4. Begin Phase 1 implementation

**Next Steps**: Read the detailed implementation plans for each component:
- [Backend Implementation](./01-BACKEND-IMPLEMENTATION.md)
- [Image Processing Implementation](./02-IMAGE-PROCESSING-IMPLEMENTATION.md)
- [Frontend Web Implementation](./03-FRONTEND-WEB-IMPLEMENTATION.md)
- [Mobile App Implementation](./04-MOBILE-APP-IMPLEMENTATION.md)
