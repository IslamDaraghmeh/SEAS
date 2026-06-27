import { PrismaClient, UserRole, ExamStatus, QuestionType } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

// Generate consistent UUIDs for seeding (so upsert works properly)
const SEED_COURSE_ID = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
const SEED_EXAM_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

async function main() {
  console.log('Seeding database...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@aaup.edu' },
    update: {},
    create: {
      email: 'admin@aaup.edu',
      passwordHash: adminPassword,
      role: UserRole.ADMIN,
    },
  });
  await prisma.admin.upsert({
    where: { userId: admin.id },
    update: {},
    create: {
      userId: admin.id,
      nameAr: 'مدير النظام',
      nameEn: 'System Administrator',
    },
  });
  console.log('Admin user created:', admin.email);

  // Create teacher
  const teacherPassword = await bcrypt.hash('teacher123', 10);
  const teacherUser = await prisma.user.upsert({
    where: { email: 'teacher@aaup.edu' },
    update: {},
    create: {
      email: 'teacher@aaup.edu',
      passwordHash: teacherPassword,
      role: UserRole.TEACHER,
    },
  });

  const teacher = await prisma.teacher.upsert({
    where: { userId: teacherUser.id },
    update: {},
    create: {
      userId: teacherUser.id,
      nameAr: 'د. أحمد محمد',
      nameEn: 'Dr. Ahmad Mohammad',
      department: 'Computer Science',
    },
  });
  console.log('Teacher created:', teacher.nameEn);

  // Create proctor
  const proctorPassword = await bcrypt.hash('proctor123', 10);
  await prisma.user.upsert({
    where: { email: 'proctor@aaup.edu' },
    update: {},
    create: {
      email: 'proctor@aaup.edu',
      passwordHash: proctorPassword,
      role: UserRole.PROCTOR,
    },
  });
  console.log('Proctor user created');

  // Create students
  const students = [];
  for (let i = 1; i <= 5; i++) {
    const studentPassword = await bcrypt.hash(`student${i}`, 10);
    const studentUser = await prisma.user.upsert({
      where: { email: `student${i}@aaup.edu` },
      update: {},
      create: {
        email: `student${i}@aaup.edu`,
        passwordHash: studentPassword,
        role: UserRole.STUDENT,
      },
    });

    const student = await prisma.student.upsert({
      where: { userId: studentUser.id },
      update: {},
      create: {
        userId: studentUser.id,
        studentNumber: `2024100${i}`,
        nameAr: `طالب ${i}`,
        nameEn: `Student ${i}`,
      },
    });
    students.push(student);
    console.log('Student created:', student.nameEn);
  }

  // Create course with proper UUID
  const course = await prisma.course.upsert({
    where: { id: SEED_COURSE_ID },
    update: {},
    create: {
      id: SEED_COURSE_ID,
      code: 'CS101',
      codeAr: 'حسب101',
      codeEn: 'CS101',
      nameAr: 'مقدمة في علم الحاسوب',
      nameEn: 'Introduction to Computer Science',
      descriptionAr: 'مقدمة شاملة في علم الحاسوب',
      descriptionEn: 'Comprehensive introduction to computer science',
      semester: '2024-1',
      teacher: { connect: { id: teacher.id } },
    },
  });
  console.log('Course created:', course.nameEn);

  // Enroll students in the course
  for (const student of students) {
    await prisma.enrollment.upsert({
      where: {
        studentId_courseId: {
          studentId: student.id,
          courseId: course.id,
        },
      },
      update: {},
      create: {
        studentId: student.id,
        courseId: course.id,
      },
    });
  }
  console.log('Students enrolled in course');

  // Create exam with proper UUID
  const exam = await prisma.exam.upsert({
    where: { id: SEED_EXAM_ID },
    update: {},
    create: {
      id: SEED_EXAM_ID,
      courseId: course.id,
      titleAr: 'امتحان نصف الفصل',
      titleEn: 'Midterm Exam',
      descriptionAr: 'امتحان يغطي الوحدات 1-5',
      descriptionEn: 'Exam covering chapters 1-5',
      durationMinutes: 60,
      totalPoints: 100,
      passingScore: 50,
      scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      status: ExamStatus.DRAFT,
      shuffleQuestions: true,
      shuffleOptions: true,
      requireVerification: true,
      verificationInterval: 60,
      instructionsAr: 'ممنوع استخدام الآلة الحاسبة',
      instructionsEn: 'Calculators are not allowed',
    },
  });
  console.log('Exam created:', exam.titleEn);

  // Create questions
  const questions = [
    {
      textAr: 'ما هو ناتج 2 + 2؟',
      textEn: 'What is 2 + 2?',
      type: QuestionType.MULTIPLE_CHOICE,
      points: 20,
      order: 0,
      options: [
        { textAr: '3', textEn: '3', isCorrect: false, order: 0 },
        { textAr: '4', textEn: '4', isCorrect: true, order: 1 },
        { textAr: '5', textEn: '5', isCorrect: false, order: 2 },
        { textAr: '6', textEn: '6', isCorrect: false, order: 3 },
      ],
    },
    {
      textAr: 'هل JavaScript لغة برمجة؟',
      textEn: 'Is JavaScript a programming language?',
      type: QuestionType.TRUE_FALSE,
      points: 20,
      order: 1,
      options: [
        { textAr: 'صحيح', textEn: 'True', isCorrect: true, order: 0 },
        { textAr: 'خطأ', textEn: 'False', isCorrect: false, order: 1 },
      ],
    },
    {
      textAr: 'ما هو مخترع الويب؟',
      textEn: 'Who invented the World Wide Web?',
      type: QuestionType.SHORT_ANSWER,
      points: 20,
      order: 2,
      correctAnswer: 'Tim Berners-Lee',
    },
    {
      textAr: 'اشرح مفهوم البرمجة الكائنية',
      textEn: 'Explain the concept of Object-Oriented Programming',
      type: QuestionType.ESSAY,
      points: 40,
      order: 3,
    },
  ];

  for (const q of questions) {
    const { options, ...questionData } = q;
    await prisma.question.create({
      data: {
        ...questionData,
        examId: exam.id,
        options: options
          ? {
              create: options,
            }
          : undefined,
      },
    });
  }
  console.log('Questions created');

  console.log('Database seeded successfully!');
  console.log('\nTest Credentials:');
  console.log('Admin: admin@aaup.edu / admin123');
  console.log('Teacher: teacher@aaup.edu / teacher123');
  console.log('Proctor: proctor@aaup.edu / proctor123');
  console.log('Student: student1@aaup.edu / student1');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
