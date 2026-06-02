import {
  Controller,
  Get,
  Post,
  Put,
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
import { ExamsService } from './exams.service';
import { AttemptsService } from '../attempts/attempts.service';
import { QuestionsService } from '../questions/questions.service';
import {
  CreateExamDto,
  UpdateExamDto,
  QueryExamDto,
  ExamResponseDto,
  ExamListResponseDto,
  ExamWithQuestionsResponseDto,
} from './dto';
import { CreateQuestionDto, UpdateQuestionDto } from '../questions/dto';
import { SubmitAnswerDto, SubmitAllAnswersDto } from '../attempts/dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Exams')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('exams')
export class ExamsController {
  constructor(
    private readonly examsService: ExamsService,
    private readonly attemptsService: AttemptsService,
    private readonly questionsService: QuestionsService,
  ) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Create a new exam' })
  @ApiResponse({
    status: 201,
    description: 'Exam created successfully',
    type: ExamResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  create(@Body() createExamDto: CreateExamDto) {
    return this.examsService.create(createExamDto);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all exams with pagination and filters' })
  @ApiResponse({
    status: 200,
    description: 'List of exams',
    type: ExamListResponseDto,
  })
  findAll(@Query() query: QueryExamDto) {
    return this.examsService.findAll(query);
  }

  @Get('my-exams')
  @Roles(UserRole.TEACHER)
  @ApiOperation({ summary: 'Get exams for the current teacher' })
  @ApiResponse({
    status: 200,
    description: 'List of teacher exams',
    type: ExamListResponseDto,
  })
  getMyExamsAsTeacher(
    @CurrentUser('teacher') teacher: { id: string },
    @Query() query: QueryExamDto,
  ) {
    return this.examsService.findByTeacher(teacher.id, query);
  }

  @Get('student')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Get available exams for the current student' })
  @ApiResponse({
    status: 200,
    description: 'List of available exams',
  })
  getMyExamsAsStudent(@CurrentUser('student') student: { id: string }) {
    return this.examsService.findForStudent(student.id);
  }

  @Get('available')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Get available/published exams for student' })
  @ApiResponse({
    status: 200,
    description: 'List of available exams',
  })
  getAvailableExams(
    @CurrentUser('student') student: { id: string },
    @Query() query: QueryExamDto,
  ) {
    return this.examsService.findAvailableForStudent(student.id, query);
  }

  @Get('results')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Get exam results for current student' })
  @ApiResponse({
    status: 200,
    description: 'List of exam results',
  })
  getMyResults(
    @CurrentUser('student') student: { id: string },
    @Query() query: QueryExamDto,
  ) {
    return this.examsService.findStudentResults(student.id, query);
  }

  @Get('teacher')
  @Roles(UserRole.TEACHER)
  @ApiOperation({ summary: 'Get exams for the current teacher (alias for my-exams)' })
  @ApiResponse({
    status: 200,
    description: 'List of teacher exams',
    type: ExamListResponseDto,
  })
  getTeacherExams(
    @CurrentUser('teacher') teacher: { id: string },
    @Query() query: QueryExamDto,
  ) {
    return this.examsService.findByTeacher(teacher.id, query);
  }

  @Get('course/:courseId')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Get exams for a specific course' })
  @ApiParam({ name: 'courseId', description: 'Course UUID' })
  @ApiResponse({
    status: 200,
    description: 'List of course exams',
    type: ExamListResponseDto,
  })
  findByCourse(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Query() query: QueryExamDto,
  ) {
    return this.examsService.findByCourse(courseId, query);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Get an exam by ID with questions' })
  @ApiParam({ name: 'id', description: 'Exam UUID' })
  @ApiResponse({
    status: 200,
    description: 'Exam details with questions',
    type: ExamWithQuestionsResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Exam not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.examsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Update an exam' })
  @ApiParam({ name: 'id', description: 'Exam UUID' })
  @ApiResponse({
    status: 200,
    description: 'Exam updated successfully',
    type: ExamResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Exam not found' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateExamDto: UpdateExamDto,
  ) {
    return this.examsService.update(id, updateExamDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Delete an exam' })
  @ApiParam({ name: 'id', description: 'Exam UUID' })
  @ApiResponse({ status: 200, description: 'Exam deleted successfully' })
  @ApiResponse({ status: 404, description: 'Exam not found' })
  @ApiResponse({ status: 400, description: 'Cannot delete exam with attempts' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.examsService.remove(id);
  }

  @Patch(':id/publish')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Publish a draft exam' })
  @ApiParam({ name: 'id', description: 'Exam UUID' })
  @ApiResponse({ status: 200, description: 'Exam published successfully' })
  @ApiResponse({ status: 400, description: 'Invalid exam status' })
  publish(@Param('id', ParseUUIDPipe) id: string) {
    return this.examsService.publish(id);
  }

  @Patch(':id/activate')
  @Roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.PROCTOR)
  @ApiOperation({ summary: 'Activate a published exam' })
  @ApiParam({ name: 'id', description: 'Exam UUID' })
  @ApiResponse({ status: 200, description: 'Exam activated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid exam status' })
  activate(@Param('id', ParseUUIDPipe) id: string) {
    return this.examsService.activate(id);
  }

  @Patch(':id/complete')
  @Roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.PROCTOR)
  @ApiOperation({ summary: 'Complete an active exam' })
  @ApiParam({ name: 'id', description: 'Exam UUID' })
  @ApiResponse({ status: 200, description: 'Exam completed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid exam status' })
  complete(@Param('id', ParseUUIDPipe) id: string) {
    return this.examsService.complete(id);
  }

  @Patch(':id/cancel')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Cancel an exam' })
  @ApiParam({ name: 'id', description: 'Exam UUID' })
  @ApiResponse({ status: 200, description: 'Exam cancelled successfully' })
  @ApiResponse({ status: 400, description: 'Cannot cancel completed exam' })
  cancel(@Param('id', ParseUUIDPipe) id: string) {
    return this.examsService.cancel(id);
  }

  @Get(':id/statistics')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Get exam statistics' })
  @ApiParam({ name: 'id', description: 'Exam UUID' })
  @ApiResponse({ status: 200, description: 'Exam statistics' })
  @ApiResponse({ status: 404, description: 'Exam not found' })
  getStatistics(@Param('id') id: string) {
    return this.examsService.getStatistics(id);
  }

  // ============= STUDENT EXAM TAKING ENDPOINTS =============

  @Get(':id/take')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Get exam details for taking (student view)' })
  @ApiParam({ name: 'id', description: 'Exam ID' })
  @ApiResponse({ status: 200, description: 'Exam details for taking' })
  getExamForTaking(
    @Param('id') id: string,
    @CurrentUser('student') student: { id: string },
  ) {
    return this.examsService.getExamForStudent(id, student.id);
  }

  @Post(':id/start')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Start an exam attempt' })
  @ApiParam({ name: 'id', description: 'Exam ID' })
  @ApiResponse({ status: 201, description: 'Exam attempt started' })
  startExam(
    @Param('id') id: string,
    @CurrentUser('student') student: { id: string },
  ) {
    return this.attemptsService.startAttempt(student.id, { examId: id });
  }

  @Post(':id/submit')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Submit exam with all answers' })
  @ApiParam({ name: 'id', description: 'Exam ID' })
  @ApiResponse({ status: 200, description: 'Exam submitted successfully' })
  submitExam(
    @Param('id') id: string,
    @CurrentUser('student') student: { id: string },
    @Body() submitDto: SubmitAllAnswersDto,
  ) {
    return this.examsService.submitExamWithAnswers(id, student.id, submitDto);
  }

  @Post(':id/save-answer')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Auto-save an answer during exam' })
  @ApiParam({ name: 'id', description: 'Exam ID' })
  @ApiResponse({ status: 200, description: 'Answer saved' })
  saveAnswer(
    @Param('id') id: string,
    @CurrentUser('student') student: { id: string },
    @Body() answerDto: SubmitAnswerDto,
  ) {
    return this.examsService.saveAnswer(id, student.id, answerDto);
  }

  @Get(':id/full')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Get exam with all questions for editing' })
  @ApiParam({ name: 'id', description: 'Exam ID' })
  @ApiResponse({ status: 200, description: 'Full exam details with questions' })
  getExamFull(@Param('id') id: string) {
    return this.examsService.findOne(id);
  }

  @Get(':id/results')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Get all results for an exam' })
  @ApiParam({ name: 'id', description: 'Exam ID' })
  @ApiResponse({ status: 200, description: 'Exam results' })
  getExamResults(@Param('id') id: string, @Query() query: QueryExamDto) {
    return this.examsService.getExamResults(id, query);
  }

  @Get('results/:resultId')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Get specific exam result details' })
  @ApiParam({ name: 'resultId', description: 'Result/Attempt ID' })
  @ApiResponse({ status: 200, description: 'Result details' })
  getResultDetails(
    @Param('resultId') resultId: string,
    @CurrentUser('student') student: { id: string },
  ) {
    return this.attemptsService.findOne(resultId);
  }

  // Also support PUT for update (frontend uses PUT)
  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Update an exam (PUT)' })
  @ApiParam({ name: 'id', description: 'Exam ID' })
  @ApiResponse({ status: 200, description: 'Exam updated successfully' })
  updatePut(@Param('id') id: string, @Body() updateExamDto: UpdateExamDto) {
    return this.examsService.update(id, updateExamDto);
  }

  // Also support POST for publish (frontend uses POST)
  @Post(':id/publish')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Publish a draft exam (POST)' })
  @ApiParam({ name: 'id', description: 'Exam ID' })
  @ApiResponse({ status: 200, description: 'Exam published successfully' })
  publishPost(@Param('id') id: string) {
    return this.examsService.publish(id);
  }

  // ============= QUESTION MANAGEMENT ENDPOINTS =============

  @Get(':examId/questions')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Get all questions for an exam' })
  @ApiParam({ name: 'examId', description: 'Exam ID' })
  @ApiResponse({ status: 200, description: 'List of questions' })
  getQuestions(@Param('examId') examId: string) {
    return this.questionsService.findByExam(examId);
  }

  @Post(':examId/questions')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Add a question to an exam' })
  @ApiParam({ name: 'examId', description: 'Exam ID' })
  @ApiResponse({ status: 201, description: 'Question created' })
  addQuestion(
    @Param('examId') examId: string,
    @Body() createQuestionDto: CreateQuestionDto,
  ) {
    return this.questionsService.create({ ...createQuestionDto, examId });
  }

  @Put(':examId/questions/:questionId')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Update a question' })
  @ApiParam({ name: 'examId', description: 'Exam ID' })
  @ApiParam({ name: 'questionId', description: 'Question ID' })
  @ApiResponse({ status: 200, description: 'Question updated' })
  updateQuestion(
    @Param('examId') examId: string,
    @Param('questionId') questionId: string,
    @Body() updateQuestionDto: UpdateQuestionDto,
  ) {
    return this.questionsService.update(questionId, updateQuestionDto);
  }

  @Patch(':examId/questions/:questionId')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Update a question (PATCH)' })
  @ApiParam({ name: 'examId', description: 'Exam ID' })
  @ApiParam({ name: 'questionId', description: 'Question ID' })
  @ApiResponse({ status: 200, description: 'Question updated' })
  patchQuestion(
    @Param('examId') examId: string,
    @Param('questionId') questionId: string,
    @Body() updateQuestionDto: UpdateQuestionDto,
  ) {
    return this.questionsService.update(questionId, updateQuestionDto);
  }

  @Delete(':examId/questions/:questionId')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Delete a question' })
  @ApiParam({ name: 'examId', description: 'Exam ID' })
  @ApiParam({ name: 'questionId', description: 'Question ID' })
  @ApiResponse({ status: 200, description: 'Question deleted' })
  deleteQuestion(
    @Param('examId') examId: string,
    @Param('questionId') questionId: string,
  ) {
    return this.questionsService.remove(questionId);
  }

  @Post(':examId/questions/reorder')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Reorder questions in an exam' })
  @ApiParam({ name: 'examId', description: 'Exam ID' })
  @ApiResponse({ status: 200, description: 'Questions reordered' })
  reorderQuestions(
    @Param('examId') examId: string,
    @Body() body: { questionIds: string[] },
  ) {
    return this.questionsService.reorder(examId, body.questionIds);
  }

  @Get(':examId/results/export')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Export exam results' })
  @ApiParam({ name: 'examId', description: 'Exam ID' })
  @ApiResponse({ status: 200, description: 'Exported data' })
  exportResults(
    @Param('examId') examId: string,
    @Query('format') format: string,
  ) {
    return this.examsService.exportResults(examId, format || 'json');
  }

  // ============= GRADING ENDPOINTS =============

  @Get(':examId/attempts')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Get all attempts for an exam that need grading' })
  @ApiParam({ name: 'examId', description: 'Exam ID' })
  @ApiResponse({ status: 200, description: 'List of attempts' })
  getAttemptsForGrading(
    @Param('examId') examId: string,
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.attemptsService.findByExam(examId, { status, page, limit });
  }

  @Get('attempts/:attemptId/grading')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Get attempt details for grading' })
  @ApiParam({ name: 'attemptId', description: 'Attempt ID' })
  @ApiResponse({ status: 200, description: 'Attempt details with answers' })
  getAttemptForGrading(@Param('attemptId') attemptId: string) {
    return this.attemptsService.getForGrading(attemptId);
  }

  @Patch('attempts/:attemptId/answers/:answerId/grade')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Grade a specific answer' })
  @ApiParam({ name: 'attemptId', description: 'Attempt ID' })
  @ApiParam({ name: 'answerId', description: 'Answer ID' })
  @ApiResponse({ status: 200, description: 'Answer graded' })
  gradeAnswer(
    @Param('attemptId') attemptId: string,
    @Param('answerId') answerId: string,
    @Body() body: { pointsAwarded: number; feedback?: string },
  ) {
    return this.attemptsService.gradeAnswer(attemptId, answerId, body);
  }

  @Post('attempts/:attemptId/finalize')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Finalize grading for an attempt' })
  @ApiParam({ name: 'attemptId', description: 'Attempt ID' })
  @ApiResponse({ status: 200, description: 'Grading finalized' })
  finalizeGrading(@Param('attemptId') attemptId: string) {
    return this.attemptsService.finalizeGrading(attemptId);
  }
}
