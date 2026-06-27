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
import { TeachersService } from './teachers.service';
import {
  CreateTeacherDto,
  UpdateTeacherDto,
  QueryTeacherDto,
  TeacherResponseDto,
  TeacherListResponseDto,
  ResetPasswordDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Teachers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('teachers')
export class TeachersController {
  constructor(private readonly teachersService: TeachersService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new teacher' })
  @ApiResponse({
    status: 201,
    description: 'Teacher created successfully',
    type: TeacherResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  create(@Body() createTeacherDto: CreateTeacherDto) {
    return this.teachersService.create(createTeacherDto);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all teachers with pagination and filters' })
  @ApiResponse({
    status: 200,
    description: 'List of teachers',
    type: TeacherListResponseDto,
  })
  findAll(@Query() query: QueryTeacherDto) {
    return this.teachersService.findAll(query);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get a teacher by ID' })
  @ApiParam({ name: 'id', description: 'Teacher UUID' })
  @ApiResponse({
    status: 200,
    description: 'Teacher details',
    type: TeacherResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Teacher not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.teachersService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update a teacher' })
  @ApiParam({ name: 'id', description: 'Teacher UUID' })
  @ApiResponse({
    status: 200,
    description: 'Teacher updated successfully',
    type: TeacherResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Teacher not found' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTeacherDto: UpdateTeacherDto,
  ) {
    return this.teachersService.update(id, updateTeacherDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a teacher' })
  @ApiParam({ name: 'id', description: 'Teacher UUID' })
  @ApiResponse({ status: 200, description: 'Teacher deleted successfully' })
  @ApiResponse({ status: 404, description: 'Teacher not found' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.teachersService.remove(id);
  }

  @Patch(':id/reset-password')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Reset a teacher password' })
  @ApiParam({ name: 'id', description: 'Teacher UUID' })
  @ApiResponse({
    status: 200,
    description: 'Teacher password reset successfully',
  })
  @ApiResponse({ status: 404, description: 'Teacher not found' })
  resetPassword(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() resetPasswordDto: ResetPasswordDto,
  ) {
    return this.teachersService.resetPassword(id, resetPasswordDto.password);
  }

  @Patch(':id/deactivate')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Deactivate a teacher account' })
  @ApiParam({ name: 'id', description: 'Teacher UUID' })
  @ApiResponse({ status: 200, description: 'Teacher deactivated successfully' })
  @ApiResponse({ status: 404, description: 'Teacher not found' })
  deactivate(@Param('id', ParseUUIDPipe) id: string) {
    return this.teachersService.deactivate(id);
  }

  @Patch(':id/activate')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Activate a teacher account' })
  @ApiParam({ name: 'id', description: 'Teacher UUID' })
  @ApiResponse({ status: 200, description: 'Teacher activated successfully' })
  @ApiResponse({ status: 404, description: 'Teacher not found' })
  activate(@Param('id', ParseUUIDPipe) id: string) {
    return this.teachersService.activate(id);
  }
}
