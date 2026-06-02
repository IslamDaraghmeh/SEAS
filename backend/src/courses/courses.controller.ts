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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { CoursesService } from './courses.service';
import {
  CreateCourseDto,
  UpdateCourseDto,
  QueryCourseDto,
  CourseResponseDto,
  CourseListResponseDto,
  EnrollStudentDto,
  UnenrollStudentDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Courses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new course' })
  @ApiResponse({
    status: 201,
    description: 'Course created successfully',
    type: CourseResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 409, description: 'Course code already exists' })
  create(@Body() createCourseDto: CreateCourseDto) {
    return this.coursesService.create(createCourseDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Get all courses with pagination and filters' })
  @ApiResponse({
    status: 200,
    description: 'List of courses',
    type: CourseListResponseDto,
  })
  findAll(@Query() query: QueryCourseDto) {
    return this.coursesService.findAll(query);
  }

  @Get('my-courses')
  @Roles(UserRole.TEACHER)
  @ApiOperation({ summary: 'Get courses for the current teacher' })
  @ApiResponse({
    status: 200,
    description: 'List of teacher courses',
    type: CourseListResponseDto,
  })
  getMyCoursesAsTeacher(
    @CurrentUser('teacher') teacher: { id: string },
    @Query() query: QueryCourseDto,
  ) {
    return this.coursesService.findByTeacher(teacher.id, query);
  }

  @Get('student/:studentId')
  @Roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT)
  @ApiOperation({ summary: 'Get courses for a student' })
  @ApiParam({ name: 'studentId', description: 'Student UUID' })
  @ApiResponse({
    status: 200,
    description: 'List of student courses',
  })
  getStudentCourses(@Param('studentId', ParseUUIDPipe) studentId: string) {
    return this.coursesService.findByStudent(studentId);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Get a course by ID' })
  @ApiParam({ name: 'id', description: 'Course UUID' })
  @ApiResponse({
    status: 200,
    description: 'Course details',
    type: CourseResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Course not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.coursesService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update a course' })
  @ApiParam({ name: 'id', description: 'Course UUID' })
  @ApiResponse({
    status: 200,
    description: 'Course updated successfully',
    type: CourseResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Course not found' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCourseDto: UpdateCourseDto,
  ) {
    return this.coursesService.update(id, updateCourseDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a course' })
  @ApiParam({ name: 'id', description: 'Course UUID' })
  @ApiResponse({ status: 200, description: 'Course deleted successfully' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.coursesService.remove(id);
  }

  @Post(':id/enroll')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Enroll students in a course' })
  @ApiParam({ name: 'id', description: 'Course UUID' })
  @ApiResponse({ status: 200, description: 'Students enrolled successfully' })
  @ApiResponse({ status: 404, description: 'Course or students not found' })
  @ApiResponse({ status: 403, description: 'Teacher can only manage their own courses' })
  async enrollStudents(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() enrollDto: EnrollStudentDto,
    @CurrentUser('role') role: UserRole,
    @CurrentUser('teacher') teacher: { id: string } | null,
  ) {
    // Teachers can only enroll students in their own courses
    if (role === UserRole.TEACHER && teacher) {
      await this.coursesService.verifyTeacherOwnership(id, teacher.id);
    }
    return this.coursesService.enrollStudents(id, enrollDto);
  }

  @Post(':id/unenroll')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Unenroll students from a course' })
  @ApiParam({ name: 'id', description: 'Course UUID' })
  @ApiResponse({ status: 200, description: 'Students unenrolled successfully' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  @ApiResponse({ status: 403, description: 'Teacher can only manage their own courses' })
  async unenrollStudents(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() unenrollDto: UnenrollStudentDto,
    @CurrentUser('role') role: UserRole,
    @CurrentUser('teacher') teacher: { id: string } | null,
  ) {
    // Teachers can only unenroll students from their own courses
    if (role === UserRole.TEACHER && teacher) {
      await this.coursesService.verifyTeacherOwnership(id, teacher.id);
    }
    return this.coursesService.unenrollStudents(id, unenrollDto);
  }

  @Get(':id/students')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Get enrolled students for a course' })
  @ApiParam({ name: 'id', description: 'Course UUID' })
  @ApiResponse({ status: 200, description: 'List of enrolled students' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  @ApiResponse({ status: 403, description: 'Teacher can only view their own courses' })
  async getEnrolledStudents(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('role') role: UserRole,
    @CurrentUser('teacher') teacher: { id: string } | null,
  ) {
    // Teachers can only view enrolled students in their own courses
    if (role === UserRole.TEACHER && teacher) {
      await this.coursesService.verifyTeacherOwnership(id, teacher.id);
    }
    return this.coursesService.getEnrolledStudents(id);
  }
}
