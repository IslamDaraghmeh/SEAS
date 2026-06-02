import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
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
import { AttemptsService } from './attempts.service';
import {
  StartAttemptDto,
  SubmitAnswerDto,
  SubmitAllAnswersDto,
  GradeAttemptDto,
  QueryAttemptDto,
  AttemptResponseDto,
  AttemptListResponseDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Exam Attempts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('attempts')
export class AttemptsController {
  constructor(private readonly attemptsService: AttemptsService) {}

  @Post('start')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Start a new exam attempt' })
  @ApiResponse({
    status: 201,
    description: 'Exam attempt started',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Exam not found' })
  start(
    @CurrentUser('student') student: { id: string },
    @Body() startAttemptDto: StartAttemptDto,
  ) {
    return this.attemptsService.startAttempt(student.id, startAttemptDto);
  }

  @Post(':id/answer')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Submit an answer for a question' })
  @ApiParam({ name: 'id', description: 'Attempt UUID' })
  @ApiResponse({ status: 200, description: 'Answer submitted' })
  submitAnswer(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('student') student: { id: string },
    @Body() submitAnswerDto: SubmitAnswerDto,
  ) {
    return this.attemptsService.submitAnswer(id, student.id, submitAnswerDto);
  }

  @Post(':id/answers')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Submit all answers at once' })
  @ApiParam({ name: 'id', description: 'Attempt UUID' })
  @ApiResponse({ status: 200, description: 'All answers submitted' })
  submitAllAnswers(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('student') student: { id: string },
    @Body() submitDto: SubmitAllAnswersDto,
  ) {
    return this.attemptsService.submitAllAnswers(id, student.id, submitDto);
  }

  @Post(':id/submit')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Submit the exam attempt for grading' })
  @ApiParam({ name: 'id', description: 'Attempt UUID' })
  @ApiResponse({ status: 200, description: 'Attempt submitted' })
  submit(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('student') student: { id: string },
  ) {
    return this.attemptsService.submitAttempt(id, student.id);
  }

  @Post(':id/grade')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Grade essay/short answer questions' })
  @ApiParam({ name: 'id', description: 'Attempt UUID' })
  @ApiResponse({ status: 200, description: 'Attempt graded' })
  grade(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() gradeDto: GradeAttemptDto,
  ) {
    return this.attemptsService.gradeAttempt(id, gradeDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Get all attempts with filters' })
  @ApiResponse({
    status: 200,
    description: 'List of attempts',
    type: AttemptListResponseDto,
  })
  findAll(@Query() query: QueryAttemptDto) {
    return this.attemptsService.findAll(query);
  }

  @Get('my-attempts')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Get current student attempts' })
  @ApiResponse({
    status: 200,
    description: 'List of student attempts',
  })
  getMyAttempts(@CurrentUser('student') student: { id: string }) {
    return this.attemptsService.getStudentAttempts(student.id);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT)
  @ApiOperation({ summary: 'Get attempt details' })
  @ApiParam({ name: 'id', description: 'Attempt UUID' })
  @ApiResponse({
    status: 200,
    description: 'Attempt details',
    type: AttemptResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Attempt not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.attemptsService.findOne(id);
  }

  @Get(':id/continue')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Continue an in-progress attempt' })
  @ApiParam({ name: 'id', description: 'Attempt UUID' })
  @ApiResponse({ status: 200, description: 'Attempt with questions' })
  continueAttempt(@Param('id', ParseUUIDPipe) id: string) {
    return this.attemptsService.getAttemptWithQuestions(id);
  }
}
