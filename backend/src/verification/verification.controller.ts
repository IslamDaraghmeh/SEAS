import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseUUIDPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiConsumes,
} from '@nestjs/swagger';
import { VerificationService } from './verification.service';
import {
  VerificationResultDto,
  VerificationLogResponseDto,
  FaceEnrollDto,
  FaceEnrollResponseDto,
  CreateAlertDto,
  AlertResponseDto,
  ResolveAlertDto,
  VerifyChallengeDto,
  ChallengeResultDto,
  VerifyLipMovementDto,
  LipMovementResultDto,
  VerifyNodDto,
  NodResultDto,
  VerifyBlinkDto,
  BlinkResultDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Verification')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('verification')
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  @Post('log')
  @Roles(UserRole.STUDENT, UserRole.PROCTOR)
  @ApiOperation({ summary: 'Log a verification result' })
  @ApiResponse({
    status: 201,
    description: 'Verification logged',
    type: VerificationLogResponseDto,
  })
  logVerification(@Body() verificationResult: VerificationResultDto) {
    return this.verificationService.logVerification(verificationResult);
  }

  @Post('enroll')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Enroll student face' })
  @ApiResponse({
    status: 201,
    description: 'Face enrolled successfully',
    type: FaceEnrollResponseDto,
  })
  enrollFace(@Body() enrollDto: FaceEnrollDto) {
    return this.verificationService.enrollFace(enrollDto);
  }

  @Get('logs/:attemptId')
  @Roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.PROCTOR)
  @ApiOperation({ summary: 'Get verification logs for an attempt' })
  @ApiParam({ name: 'attemptId', description: 'Attempt UUID' })
  @ApiResponse({
    status: 200,
    description: 'Verification logs',
    type: [VerificationLogResponseDto],
  })
  getVerificationLogs(@Param('attemptId', ParseUUIDPipe) attemptId: string) {
    return this.verificationService.getVerificationLogs(attemptId);
  }

  @Get('latest/:attemptId')
  @Roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.PROCTOR, UserRole.STUDENT)
  @ApiOperation({ summary: 'Get latest verification for an attempt' })
  @ApiParam({ name: 'attemptId', description: 'Attempt UUID' })
  @ApiResponse({
    status: 200,
    description: 'Latest verification',
    type: VerificationLogResponseDto,
  })
  getLatestVerification(@Param('attemptId', ParseUUIDPipe) attemptId: string) {
    return this.verificationService.getLatestVerification(attemptId);
  }

  @Get('attempt/:attemptId/status')
  @Roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.PROCTOR, UserRole.STUDENT)
  @ApiOperation({ summary: 'Get verification status for an attempt (whether student has been verified)' })
  @ApiParam({ name: 'attemptId', description: 'Attempt UUID' })
  @ApiResponse({
    status: 200,
    description: 'Verification status',
  })
  async getVerificationStatus(@Param('attemptId', ParseUUIDPipe) attemptId: string) {
    return this.verificationService.getVerificationStatus(attemptId);
  }

  @Post('alerts')
  @Roles(UserRole.PROCTOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new alert' })
  @ApiResponse({
    status: 201,
    description: 'Alert created',
    type: AlertResponseDto,
  })
  createAlert(@Body() alertDto: CreateAlertDto) {
    return this.verificationService.createAlert(alertDto);
  }

  @Get('alerts/attempt/:attemptId')
  @Roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.PROCTOR)
  @ApiOperation({ summary: 'Get alerts for an attempt' })
  @ApiParam({ name: 'attemptId', description: 'Attempt UUID' })
  @ApiResponse({
    status: 200,
    description: 'List of alerts',
    type: [AlertResponseDto],
  })
  getAlerts(@Param('attemptId', ParseUUIDPipe) attemptId: string) {
    return this.verificationService.getAlerts(attemptId);
  }

  @Get('alerts/unresolved')
  @Roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.PROCTOR)
  @ApiOperation({ summary: 'Get all unresolved alerts' })
  @ApiQuery({ name: 'examId', required: false, description: 'Filter by exam ID' })
  @ApiResponse({
    status: 200,
    description: 'List of unresolved alerts',
    type: [AlertResponseDto],
  })
  getUnresolvedAlerts(@Query('examId') examId?: string) {
    return this.verificationService.getUnresolvedAlerts(examId);
  }

  @Patch('alerts/:id/resolve')
  @Roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.PROCTOR)
  @ApiOperation({ summary: 'Resolve an alert' })
  @ApiParam({ name: 'id', description: 'Alert UUID' })
  @ApiResponse({
    status: 200,
    description: 'Alert resolved',
    type: AlertResponseDto,
  })
  resolveAlert(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @Body() resolveDto: ResolveAlertDto,
  ) {
    return this.verificationService.resolveAlert(id, userId, resolveDto);
  }

  @Get('stats/:examId')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Get verification statistics for an exam' })
  @ApiParam({ name: 'examId', description: 'Exam UUID' })
  @ApiResponse({
    status: 200,
    description: 'Verification statistics',
  })
  getVerificationStats(@Param('examId') examId: string) {
    return this.verificationService.getVerificationStats(examId);
  }

  // ============= STUDENT FACE REGISTRATION =============

  @Post('register')
  @Roles(UserRole.STUDENT)
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Register face for verification (student) - single image' })
  @ApiResponse({ status: 201, description: 'Face registered successfully' })
  async registerFace(
    @CurrentUser('student') student: { id: string },
    @UploadedFile() file: any,
  ) {
    return this.verificationService.registerStudentFace(student.id, file);
  }

  @Post('register-multiple')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Register face with multiple images for better accuracy' })
  @ApiResponse({ status: 201, description: 'Faces registered successfully' })
  async registerMultipleFaces(
    @CurrentUser('student') student: { id: string },
    @Body() body: { images: string[] },
  ) {
    return this.verificationService.registerMultipleFaces(student.id, body.images);
  }

  @Post('verify-pose')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Verify that captured image matches expected pose' })
  @ApiResponse({ status: 200, description: 'Pose verification result' })
  async verifyPose(
    @Body() body: { image: string; expectedPose: string },
  ) {
    return this.verificationService.verifyPose(body.image, body.expectedPose);
  }

  @Post('reference-image')
  @Roles(UserRole.STUDENT)
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload reference image for face verification' })
  @ApiResponse({ status: 201, description: 'Reference image uploaded' })
  async uploadReferenceImage(
    @CurrentUser('student') student: { id: string },
    @UploadedFile() file: any,
  ) {
    return this.verificationService.registerStudentFace(student.id, file);
  }

  @Get('status')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Check if student has registered face' })
  @ApiResponse({ status: 200, description: 'Registration status' })
  async getRegistrationStatus(@CurrentUser('student') student: { id: string }) {
    return this.verificationService.getRegistrationStatus(student.id);
  }

  @Get('face-image/:studentId')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Get student face registration image (Admin/Teacher only)' })
  @ApiParam({ name: 'studentId', description: 'Student UUID' })
  @ApiResponse({ status: 200, description: 'Face registration image and details' })
  async getFaceRegistrationImage(@Param('studentId', ParseUUIDPipe) studentId: string) {
    return this.verificationService.getFaceRegistrationImage(studentId);
  }

  @Get('face-status/all')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Get face registration status for all students' })
  @ApiResponse({ status: 200, description: 'List of students with face registration status' })
  async getAllStudentsFaceStatus() {
    return this.verificationService.getAllStudentsFaceStatus();
  }

  @Delete('face/:studentId')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete registered face (Admin only)' })
  @ApiParam({ name: 'studentId', description: 'Student UUID' })
  @ApiResponse({ status: 200, description: 'Face deleted' })
  async deleteFace(
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @CurrentUser('id') adminId: string,
  ) {
    return this.verificationService.deleteFace(studentId, adminId);
  }

  // ============= REAL-TIME VERIFICATION =============

  @Post('verify')
  @Roles(UserRole.STUDENT)
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Verify face during exam' })
  @ApiResponse({ status: 200, description: 'Verification result' })
  async verifyFace(
    @CurrentUser('student') student: { id: string },
    @UploadedFile() file: any,
    @Body() body: { attemptId: string },
  ) {
    console.log('Verification request received:', { studentId: student.id, attemptId: body?.attemptId, hasFile: !!file });
    return this.verificationService.verifyFace(student.id, body?.attemptId, file);
  }

  // ============= SESSION MANAGEMENT =============

  @Post('session/start')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Start verification session' })
  @ApiResponse({ status: 201, description: 'Session started' })
  async startSession(
    @CurrentUser('student') student: { id: string },
    @Body() body: { attemptId: string },
  ) {
    return this.verificationService.startSession(student.id, body.attemptId);
  }

  @Post('session/:sessionId/end')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'End verification session' })
  @ApiParam({ name: 'sessionId', description: 'Session ID' })
  @ApiResponse({ status: 200, description: 'Session ended' })
  async endSession(@Param('sessionId') sessionId: string) {
    return this.verificationService.endSession(sessionId);
  }

  @Get('session/:sessionId')
  @Roles(UserRole.STUDENT, UserRole.TEACHER, UserRole.PROCTOR)
  @ApiOperation({ summary: 'Get session status' })
  @ApiParam({ name: 'sessionId', description: 'Session ID' })
  @ApiResponse({ status: 200, description: 'Session status' })
  async getSessionStatus(@Param('sessionId') sessionId: string) {
    return this.verificationService.getSessionStatus(sessionId);
  }

  // ============= MONITORING ENDPOINTS =============

  @Get('exam/:examId/logs')
  @Roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.PROCTOR)
  @ApiOperation({ summary: 'Get verification logs for an exam' })
  @ApiParam({ name: 'examId', description: 'Exam ID' })
  @ApiResponse({ status: 200, description: 'Verification logs' })
  async getExamVerificationLogs(@Param('examId') examId: string) {
    return this.verificationService.getExamVerificationLogs(examId);
  }

  // ============= MANUAL VERIFICATION =============

  @Post('manual-verify/:verificationLogId')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Manually verify or reject a failed verification' })
  @ApiParam({ name: 'verificationLogId', description: 'Verification Log ID' })
  @ApiResponse({ status: 200, description: 'Manual verification result' })
  async manuallyVerify(
    @Param('verificationLogId', ParseUUIDPipe) verificationLogId: string,
    @CurrentUser('teacher') teacher: { id: string },
    @Body() body: { approved: boolean; notes?: string },
  ) {
    return this.verificationService.manuallyVerify(
      verificationLogId,
      teacher.id,
      body.approved,
      body.notes,
    );
  }

  @Get('log/:verificationLogId/image')
  @Roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.PROCTOR)
  @ApiOperation({ summary: 'Get verification log with captured image' })
  @ApiParam({ name: 'verificationLogId', description: 'Verification Log ID' })
  @ApiResponse({ status: 200, description: 'Verification log with image' })
  async getVerificationLogWithImage(
    @Param('verificationLogId', ParseUUIDPipe) verificationLogId: string,
  ) {
    return this.verificationService.getVerificationLogWithImage(verificationLogId);
  }

  @Get('exam/:examId/live')
  @Roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.PROCTOR)
  @ApiOperation({ summary: 'Get live verification stream data' })
  @ApiParam({ name: 'examId', description: 'Exam ID' })
  @ApiResponse({ status: 200, description: 'Live monitoring data' })
  async getLiveMonitoringData(@Param('examId') examId: string) {
    return this.verificationService.getLiveMonitoringData(examId);
  }

  @Get('student/:studentId/history')
  @Roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.PROCTOR)
  @ApiOperation({ summary: 'Get student verification history' })
  @ApiParam({ name: 'studentId', description: 'Student ID' })
  @ApiResponse({ status: 200, description: 'Verification history' })
  async getStudentHistory(@Param('studentId') studentId: string) {
    return this.verificationService.getStudentHistory(studentId);
  }

  // ============= LIVENESS CHALLENGE VERIFICATION =============

  @Post('verify-challenge')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Verify a liveness challenge' })
  @ApiResponse({
    status: 200,
    description: 'Challenge verification result',
    type: ChallengeResultDto,
  })
  async verifyChallenge(@Body() dto: VerifyChallengeDto) {
    return this.verificationService.verifyChallenge(dto);
  }

  @Post('verify-lip-movement')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Verify lip movement (say hello challenge)' })
  @ApiResponse({
    status: 200,
    description: 'Lip movement detection result',
    type: LipMovementResultDto,
  })
  async verifyLipMovement(@Body() dto: VerifyLipMovementDto) {
    return this.verificationService.verifyLipMovement(dto.images);
  }

  @Post('verify-nod')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Verify head nod' })
  @ApiResponse({
    status: 200,
    description: 'Nod detection result',
    type: NodResultDto,
  })
  async verifyNod(@Body() dto: VerifyNodDto) {
    return this.verificationService.verifyNod(dto.images);
  }

  @Post('verify-blink')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Verify eye blink' })
  @ApiResponse({
    status: 200,
    description: 'Blink detection result',
    type: BlinkResultDto,
  })
  async verifyBlink(@Body() dto: VerifyBlinkDto) {
    return this.verificationService.verifyBlink(dto.images);
  }

  // ============= FLAGGING AND ALERTS =============

  @Post('alert')
  @Roles(UserRole.STUDENT, UserRole.PROCTOR)
  @ApiOperation({ summary: 'Report suspicious activity' })
  @ApiResponse({ status: 201, description: 'Alert created' })
  async reportAlert(@Body() alertDto: CreateAlertDto) {
    return this.verificationService.createAlert(alertDto);
  }

  @Post('alert/:alertId/clear')
  @Roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.PROCTOR)
  @ApiOperation({ summary: 'Clear/resolve an alert' })
  @ApiParam({ name: 'alertId', description: 'Alert ID' })
  @ApiResponse({ status: 200, description: 'Alert cleared' })
  async clearAlert(
    @Param('alertId') alertId: string,
    @CurrentUser('id') userId: string,
    @Body() resolveDto: ResolveAlertDto,
  ) {
    return this.verificationService.resolveAlert(alertId, userId, resolveDto);
  }

  @Post('flag')
  @Roles(UserRole.PROCTOR, UserRole.TEACHER)
  @ApiOperation({ summary: 'Flag student for review' })
  @ApiResponse({ status: 201, description: 'Student flagged' })
  async flagStudent(
    @Body() body: { studentId: string; attemptId: string; reason: string },
  ) {
    return this.verificationService.flagStudent(
      body.studentId,
      body.attemptId,
      body.reason,
    );
  }

  @Get('exam/:examId/flagged')
  @Roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.PROCTOR)
  @ApiOperation({ summary: 'Get flagged students for an exam' })
  @ApiParam({ name: 'examId', description: 'Exam ID' })
  @ApiResponse({ status: 200, description: 'Flagged students' })
  async getFlaggedStudents(@Param('examId') examId: string) {
    return this.verificationService.getFlaggedStudents(examId);
  }
}
