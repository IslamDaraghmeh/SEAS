import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import {
  QuestionBankService,
  CreateQuestionBankDto,
  UpdateQuestionBankDto,
  AddQuestionsToPoolDto,
  CreateQuestionInBankDto,
} from './question-bank.service';
import { Audit, AuditCreate, AuditUpdate, AuditDelete } from '../audit/audit.decorator';

interface JwtUser {
  sub: string;
  email: string;
  role: string;
}

@ApiTags('Question Banks')
@ApiBearerAuth()
@Controller('question-banks')
@UseGuards(JwtAuthGuard, RolesGuard)
export class QuestionBankController {
  constructor(private questionBankService: QuestionBankService) {}

  @Post()
  @Roles('TEACHER', 'ADMIN')
  @AuditCreate('question-bank')
  @ApiOperation({ summary: 'Create a question bank' })
  create(@CurrentUser() user: JwtUser, @Body() data: CreateQuestionBankDto) {
    return this.questionBankService.create(user.sub, data);
  }

  @Get()
  @Roles('TEACHER', 'ADMIN')
  @ApiOperation({ summary: 'Get all question banks' })
  @ApiQuery({ name: 'courseId', required: false })
  findAll(
    @CurrentUser() user: JwtUser,
    @Query('courseId') courseId?: string,
  ) {
    return this.questionBankService.findAll(user.sub, user.role, courseId);
  }

  @Get('tags')
  @Roles('TEACHER', 'ADMIN')
  @ApiOperation({ summary: 'Get all question tags' })
  getTags() {
    return this.questionBankService.getTags();
  }

  @Post('tags')
  @Roles('TEACHER', 'ADMIN')
  @ApiOperation({ summary: 'Create a question tag' })
  createTag(@Body('name') name: string) {
    return this.questionBankService.createTag(name);
  }

  @Get(':id')
  @Roles('TEACHER', 'ADMIN')
  @ApiOperation({ summary: 'Get a question bank by ID' })
  findOne(@Param('id') id: string) {
    return this.questionBankService.findOne(id);
  }

  @Put(':id')
  @Roles('TEACHER', 'ADMIN')
  @AuditUpdate('question-bank')
  @ApiOperation({ summary: 'Update a question bank' })
  update(@Param('id') id: string, @Body() data: UpdateQuestionBankDto) {
    return this.questionBankService.update(id, data);
  }

  @Delete(':id')
  @Roles('TEACHER', 'ADMIN')
  @AuditDelete('question-bank')
  @ApiOperation({ summary: 'Delete a question bank' })
  delete(@Param('id') id: string) {
    return this.questionBankService.delete(id);
  }

  // Question management endpoints
  @Get(':id/questions')
  @Roles('TEACHER', 'ADMIN')
  @ApiOperation({ summary: 'Get questions in a bank' })
  @ApiQuery({ name: 'tags', required: false, type: String, isArray: true })
  getQuestions(
    @Param('id') id: string,
    @Query('tags') tags?: string | string[],
  ) {
    const tagArray = tags ? (Array.isArray(tags) ? tags : [tags]) : undefined;
    return this.questionBankService.getQuestions(id, tagArray);
  }

  @Post(':id/questions')
  @Roles('TEACHER', 'ADMIN')
  @Audit('ADD_QUESTIONS', 'question-bank')
  @ApiOperation({ summary: 'Add existing questions to bank' })
  addQuestions(@Param('id') id: string, @Body() data: AddQuestionsToPoolDto) {
    return this.questionBankService.addQuestions(id, data);
  }

  @Post(':id/questions/new')
  @Roles('TEACHER', 'ADMIN')
  @AuditCreate('question')
  @ApiOperation({ summary: 'Create a new question in the bank' })
  createQuestionInBank(
    @Param('id') id: string,
    @Body() data: CreateQuestionInBankDto,
  ) {
    return this.questionBankService.createQuestionInBank(id, data);
  }

  @Delete(':id/questions/:questionId')
  @Roles('TEACHER', 'ADMIN')
  @Audit('REMOVE_QUESTION', 'question-bank')
  @ApiOperation({ summary: 'Remove question from bank' })
  removeQuestion(
    @Param('id') id: string,
    @Param('questionId') questionId: string,
  ) {
    return this.questionBankService.removeQuestion(id, questionId);
  }

  @Post(':id/questions/random')
  @Roles('TEACHER', 'ADMIN')
  @ApiOperation({ summary: 'Get random questions from bank' })
  @ApiQuery({ name: 'count', required: true, type: Number })
  @ApiQuery({ name: 'tags', required: false, type: String, isArray: true })
  getRandomQuestions(
    @Param('id') id: string,
    @Query('count') count: string,
    @Query('tags') tags?: string | string[],
  ) {
    const tagArray = tags ? (Array.isArray(tags) ? tags : [tags]) : undefined;
    return this.questionBankService.getRandomQuestions(id, parseInt(count), tagArray);
  }

  @Post(':id/copy-from-exam/:examId')
  @Roles('TEACHER', 'ADMIN')
  @Audit('COPY_FROM_EXAM', 'question-bank')
  @ApiOperation({ summary: 'Copy questions from an exam to the bank' })
  copyFromExam(@Param('id') id: string, @Param('examId') examId: string) {
    return this.questionBankService.copyFromExam(examId, id);
  }

  // Tag management for questions
  @Post('questions/:questionId/tags')
  @Roles('TEACHER', 'ADMIN')
  @ApiOperation({ summary: 'Add tags to a question' })
  addTagsToQuestion(
    @Param('questionId') questionId: string,
    @Body('tagIds') tagIds: string[],
  ) {
    return this.questionBankService.addTagsToQuestion(questionId, tagIds);
  }

  @Delete('questions/:questionId/tags/:tagId')
  @Roles('TEACHER', 'ADMIN')
  @ApiOperation({ summary: 'Remove tag from a question' })
  removeTagFromQuestion(
    @Param('questionId') questionId: string,
    @Param('tagId') tagId: string,
  ) {
    return this.questionBankService.removeTagFromQuestion(questionId, tagId);
  }
}
