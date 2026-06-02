# SEAS Sprint Plan
## 14-Week Implementation Schedule

---

## Sprint Overview

| Sprint | Weeks | Focus | Deliverables |
|--------|-------|-------|--------------|
| Sprint 1 | 1-2 | Backend Foundation | Auth, DB, Project Setup |
| Sprint 2 | 3-4 | Backend CRUD + Image Setup | Students, Exams, Face Detection |
| Sprint 3 | 5-6 | Core Features | Face Recognition, Frontend Setup |
| Sprint 4 | 7-8 | Exam Flow | Liveness, Verification UI |
| Sprint 5 | 9-10 | Real-time Features | WebSocket, Monitoring, Mobile |
| Sprint 6 | 11-12 | Integration | Edge Deployment, Full Testing |
| Sprint 7 | 13-14 | Polish & Deploy | Bug Fixes, Deployment |

---

## Sprint 1: Backend Foundation
### Weeks 1-2

#### Week 1: Project Setup & Database

| Day | Task | Component | Priority |
|-----|------|-----------|----------|
| Mon | Initialize NestJS project, configure ESLint/Prettier | Backend | P0 |
| Mon | Setup Docker Compose (PostgreSQL, Redis) | Backend | P0 |
| Tue | Design and implement Prisma schema (all tables) | Backend | P0 |
| Tue | Run migrations, generate Prisma client | Backend | P0 |
| Wed | Create configuration module (.env handling) | Backend | P0 |
| Wed | Setup Redis service for caching/sessions | Backend | P1 |
| Thu | Implement PrismaService with connection handling | Backend | P0 |
| Thu | Create base DTOs and response structures | Backend | P1 |
| Fri | Setup Swagger/OpenAPI documentation | Backend | P1 |
| Fri | Create seed data script for testing | Backend | P2 |

**Deliverables:**
- [ ] NestJS project with TypeScript
- [ ] PostgreSQL database with all tables
- [ ] Docker development environment
- [ ] Swagger documentation endpoint

#### Week 2: Authentication Module

| Day | Task | Component | Priority |
|-----|------|-----------|----------|
| Mon | Install Passport, JWT, bcrypt dependencies | Backend | P0 |
| Mon | Create User entity and DTOs | Backend | P0 |
| Tue | Implement AuthService (login, register, hash) | Backend | P0 |
| Tue | Implement JWT strategy with validation | Backend | P0 |
| Wed | Implement Local strategy for login | Backend | P0 |
| Wed | Create JWT and Local guards | Backend | P0 |
| Thu | Implement token refresh mechanism | Backend | P0 |
| Thu | Implement token blocklist (Redis) for logout | Backend | P0 |
| Fri | Create roles decorator and RolesGuard | Backend | P0 |
| Fri | Implement rate limiting (Throttler) | Backend | P1 |

**Deliverables:**
- [ ] POST /api/auth/login
- [ ] POST /api/auth/logout
- [ ] POST /api/auth/refresh
- [ ] GET /api/auth/me
- [ ] Role-based access control working

---

## Sprint 2: Backend CRUD + Image Setup
### Weeks 3-4

#### Week 3: Students & Teachers CRUD

| Day | Task | Component | Priority |
|-----|------|-----------|----------|
| Mon | Create StudentsModule structure | Backend | P0 |
| Mon | Implement StudentsService (create, findAll) | Backend | P0 |
| Tue | Implement StudentsService (findOne, update, delete) | Backend | P0 |
| Tue | Create StudentsController with validation | Backend | P0 |
| Wed | Add pagination and search to students | Backend | P1 |
| Wed | Implement student exams endpoint | Backend | P0 |
| Thu | Implement student grades endpoint | Backend | P0 |
| Thu | Create TeachersModule (CRUD) | Backend | P1 |
| Fri | **Image Processing**: Initialize Python project | Image | P0 |
| Fri | **Image Processing**: Setup FastAPI, install deps | Image | P0 |

**Deliverables:**
- [ ] Full Students CRUD API
- [ ] Teachers CRUD API
- [ ] Python/FastAPI project initialized

#### Week 4: Exams CRUD + Face Detection

| Day | Task | Component | Priority |
|-----|------|-----------|----------|
| Mon | Create ExamsModule structure | Backend | P0 |
| Mon | Implement ExamsService (create, findAll) | Backend | P0 |
| Tue | Implement ExamsService (update, delete, publish) | Backend | P0 |
| Tue | Create QuestionsModule (nested CRUD) | Backend | P0 |
| Wed | Implement question types (MCQ, T/F, Short, Essay) | Backend | P0 |
| Wed | Add exam statistics endpoint | Backend | P1 |
| Thu | **Image Processing**: Implement FaceDetector class | Image | P0 |
| Thu | **Image Processing**: Implement LandmarkExtractor | Image | P0 |
| Fri | **Image Processing**: Create detection API endpoint | Image | P0 |
| Fri | **Image Processing**: Test with sample images | Image | P0 |

**Deliverables:**
- [ ] Full Exams CRUD API
- [ ] Questions CRUD API
- [ ] Face detection endpoint working
- [ ] 68-point landmark extraction

---

## Sprint 3: Core Features
### Weeks 5-6

#### Week 5: Face Recognition + Frontend Setup

| Day | Task | Component | Priority |
|-----|------|-----------|----------|
| Mon | **Image Processing**: Implement FaceEmbedder (FaceNet) | Image | P0 |
| Mon | **Image Processing**: Create embedding extraction API | Image | P0 |
| Tue | **Image Processing**: Implement FaceMatcher class | Image | P0 |
| Tue | **Image Processing**: Create verification endpoint | Image | P0 |
| Wed | **Image Processing**: Implement enrollment flow | Image | P0 |
| Wed | **Backend**: Add face template storage to Student | Backend | P0 |
| Thu | **Frontend**: Initialize React project with Vite | Frontend | P0 |
| Thu | **Frontend**: Configure Tailwind with RTL support | Frontend | P0 |
| Fri | **Frontend**: Create base UI components (Button, Input) | Frontend | P0 |
| Fri | **Frontend**: Setup i18n with Arabic/English | Frontend | P0 |

**Deliverables:**
- [ ] Face embedding extraction (128-dim)
- [ ] Face matching with cosine similarity
- [ ] Enrollment API (5-pose capture)
- [ ] React project with RTL/i18n setup

#### Week 6: Auth UI + Dashboard

| Day | Task | Component | Priority |
|-----|------|-----------|----------|
| Mon | **Frontend**: Create auth store (Zustand) | Frontend | P0 |
| Mon | **Frontend**: Implement API client with interceptors | Frontend | P0 |
| Tue | **Frontend**: Create LoginPage with form validation | Frontend | P0 |
| Tue | **Frontend**: Implement ProtectedRoute component | Frontend | P0 |
| Wed | **Frontend**: Create MainLayout with sidebar | Frontend | P0 |
| Wed | **Frontend**: Implement LanguageSwitcher | Frontend | P0 |
| Thu | **Frontend**: Create StudentDashboard page | Frontend | P0 |
| Thu | **Frontend**: Create ExamCard component | Frontend | P0 |
| Fri | **Frontend**: Create stats cards and dashboard widgets | Frontend | P1 |
| Fri | **Frontend**: Test RTL layout thoroughly | Frontend | P0 |

**Deliverables:**
- [ ] Login page (AR/EN)
- [ ] Student dashboard with stats
- [ ] Exam list on dashboard
- [ ] RTL working correctly

---

## Sprint 4: Exam Flow
### Weeks 7-8

#### Week 7: Liveness Detection

| Day | Task | Component | Priority |
|-----|------|-----------|----------|
| Mon | **Image Processing**: Implement EyeBlinkDetector (EAR) | Image | P0 |
| Mon | **Image Processing**: Test blink detection | Image | P0 |
| Tue | **Image Processing**: Implement HeadPoseValidator | Image | P0 |
| Tue | **Image Processing**: Implement random pose challenges | Image | P0 |
| Wed | **Image Processing**: Implement AntiSpoofingDetector | Image | P0 |
| Wed | **Image Processing**: Integrate MobileNetV2 model | Image | P0 |
| Thu | **Image Processing**: Create LivenessPipeline (3-layer) | Image | P0 |
| Thu | **Image Processing**: Implement combined AND logic | Image | P0 |
| Fri | **Image Processing**: Create liveness API endpoints | Image | P0 |
| Fri | **Image Processing**: Test against photo/video attacks | Image | P0 |

**Deliverables:**
- [ ] Eye blink detection (EAR threshold 0.21)
- [ ] Head pose challenges (±15° tolerance)
- [ ] Anti-spoofing CNN (spoof score < 0.4)
- [ ] Combined liveness pipeline

#### Week 8: Verification UI + Mobile Start

| Day | Task | Component | Priority |
|-----|------|-----------|----------|
| Mon | **Frontend**: Create useCamera hook | Frontend | P0 |
| Mon | **Frontend**: Create CameraSetup component | Frontend | P0 |
| Tue | **Frontend**: Create FaceEnrollment component (5 poses) | Frontend | P0 |
| Tue | **Frontend**: Implement capture and quality check | Frontend | P0 |
| Wed | **Frontend**: Create LivenessCheck component | Frontend | P0 |
| Wed | **Frontend**: Implement step progress UI | Frontend | P0 |
| Thu | **Mobile**: Initialize Flutter project | Mobile | P0 |
| Thu | **Mobile**: Setup Riverpod, go_router, Dio | Mobile | P0 |
| Fri | **Mobile**: Create app theme with Arabic font | Mobile | P0 |
| Fri | **Mobile**: Setup i18n (AR default, EN) | Mobile | P0 |

**Deliverables:**
- [ ] Camera setup page with lighting check
- [ ] Face enrollment flow (5 poses)
- [ ] Liveness check UI with instructions
- [ ] Flutter project initialized

---

## Sprint 5: Real-time Features
### Weeks 9-10

#### Week 9: Exam Taking + WebSocket

| Day | Task | Component | Priority |
|-----|------|-----------|----------|
| Mon | **Backend**: Create AttemptsModule | Backend | P0 |
| Mon | **Backend**: Implement startExam, saveAnswer | Backend | P0 |
| Tue | **Backend**: Implement submitExam with auto-grading | Backend | P0 |
| Tue | **Backend**: Create WebSocket gateway | Backend | P0 |
| Wed | **Backend**: Implement room-based subscriptions | Backend | P0 |
| Wed | **Backend**: Create alert broadcasting | Backend | P0 |
| Thu | **Frontend**: Create ExamPage with timer | Frontend | P0 |
| Thu | **Frontend**: Create QuestionRenderer (all types) | Frontend | P0 |
| Fri | **Frontend**: Implement auto-save (every 15s) | Frontend | P0 |
| Fri | **Frontend**: Create submit confirmation modal | Frontend | P0 |

**Deliverables:**
- [ ] Exam attempt flow (start → save → submit)
- [ ] Auto-grading for objective questions
- [ ] WebSocket gateway for real-time events
- [ ] Exam taking UI with timer

#### Week 10: Monitoring + Mobile Core

| Day | Task | Component | Priority |
|-----|------|-----------|----------|
| Mon | **Image Processing**: Create SessionManager | Image | P0 |
| Mon | **Image Processing**: Create AlertService | Image | P0 |
| Tue | **Frontend**: Create ProctorDashboard | Frontend | P0 |
| Tue | **Frontend**: Implement session grid with status | Frontend | P0 |
| Wed | **Frontend**: Create AlertList component | Frontend | P0 |
| Wed | **Frontend**: Implement WebSocket client | Frontend | P0 |
| Thu | **Mobile**: Create auth flow (login/logout) | Mobile | P0 |
| Thu | **Mobile**: Create DashboardScreen with stats | Mobile | P0 |
| Fri | **Mobile**: Create ExamsScreen with tabs | Mobile | P0 |
| Fri | **Mobile**: Create ExamCard widget | Mobile | P0 |

**Deliverables:**
- [ ] Proctor monitoring dashboard
- [ ] Real-time session status updates
- [ ] Alert notifications
- [ ] Mobile dashboard and exams list

---

## Sprint 6: Integration
### Weeks 11-12

#### Week 11: Edge Deployment + Mobile Grades

| Day | Task | Component | Priority |
|-----|------|-----------|----------|
| Mon | **Image Processing**: Convert models to TFLite | Image | P0 |
| Mon | **Image Processing**: Create edge client structure | Image | P0 |
| Tue | **Image Processing**: Implement Pi camera integration | Image | P0 |
| Tue | **Image Processing**: Create WebSocket communication | Image | P0 |
| Wed | **Image Processing**: Test on Raspberry Pi 4 | Image | P0 |
| Wed | **Image Processing**: Optimize for 2s verification | Image | P0 |
| Thu | **Mobile**: Create GradesScreen with chart | Mobile | P0 |
| Thu | **Mobile**: Create CourseGradeCard widget | Mobile | P0 |
| Fri | **Mobile**: Create SettingsScreen | Mobile | P0 |
| Fri | **Mobile**: Implement language switching | Mobile | P0 |

**Deliverables:**
- [ ] TFLite models running on Pi
- [ ] Edge client with continuous verification
- [ ] Mobile grades with performance chart
- [ ] Mobile settings with language switch

#### Week 12: Full Integration Testing

| Day | Task | Component | Priority |
|-----|------|-----------|----------|
| Mon | End-to-end testing: Student enrollment flow | All | P0 |
| Mon | End-to-end testing: Exam taking with verification | All | P0 |
| Tue | End-to-end testing: Proctor monitoring | All | P0 |
| Tue | End-to-end testing: Mobile app flows | All | P0 |
| Wed | Performance testing: API response times | Backend | P0 |
| Wed | Performance testing: Verification latency | Image | P0 |
| Thu | Security testing: Auth flows | Backend | P0 |
| Thu | Security testing: Face spoofing attempts | Image | P0 |
| Fri | Bug fixes from testing | All | P0 |
| Fri | Documentation updates | All | P1 |

**Deliverables:**
- [ ] All flows tested end-to-end
- [ ] Performance benchmarks met
- [ ] Security vulnerabilities fixed
- [ ] Documentation complete

---

## Sprint 7: Polish & Deploy
### Weeks 13-14

#### Week 13: Bug Fixes & Optimization

| Day | Task | Component | Priority |
|-----|------|-----------|----------|
| Mon | Fix critical bugs from testing | All | P0 |
| Tue | Fix critical bugs from testing | All | P0 |
| Wed | UI/UX improvements based on feedback | Frontend/Mobile | P1 |
| Thu | Performance optimizations | All | P1 |
| Fri | Code cleanup and refactoring | All | P2 |

#### Week 14: Deployment

| Day | Task | Component | Priority |
|-----|------|-----------|----------|
| Mon | Setup production database | Backend | P0 |
| Mon | Configure production environment | Backend | P0 |
| Tue | Deploy backend to server | Backend | P0 |
| Tue | Deploy image processing service | Image | P0 |
| Wed | Deploy frontend to CDN/hosting | Frontend | P0 |
| Wed | Configure domain and SSL | All | P0 |
| Thu | Build and publish mobile app | Mobile | P0 |
| Thu | Setup monitoring and logging | All | P1 |
| Fri | Final testing in production | All | P0 |
| Fri | Launch! | All | P0 |

**Deliverables:**
- [ ] Production deployment complete
- [ ] All services running and monitored
- [ ] Mobile app published
- [ ] System ready for use

---

## Daily Standup Template

```markdown
## Date: [DATE]

### Yesterday
- [ ] Task completed
- [ ] Task completed

### Today
- [ ] Task planned
- [ ] Task planned

### Blockers
- None / [Describe blocker]

### Notes
- [Any relevant notes]
```

---

## Risk Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| ML model accuracy issues | Medium | High | Start testing early, have fallback thresholds |
| Pi performance problems | Medium | Medium | Profile early, optimize TFLite models |
| RTL layout bugs | Low | Medium | Test Arabic layout from day 1 |
| API integration issues | Low | Medium | Use Swagger/OpenAPI contracts |
| Timeline delays | Medium | High | MVP scope defined, can cut mobile |

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Face Recognition TAR | ≥ 95% | Controlled testing with 25 users |
| Face Recognition FAR | ≤ 1% | Imposter testing |
| Liveness APCER | ≤ 2% | Photo/video attack testing |
| Verification Latency | ≤ 2s | End-to-end timing on Pi |
| API Response Time | ≤ 200ms | Load testing |
| Mobile App Size | ≤ 50MB | Build output |
| Web Lighthouse Score | ≥ 90 | Lighthouse audit |
