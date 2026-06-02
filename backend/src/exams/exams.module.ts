import { Module, forwardRef } from '@nestjs/common';
import { ExamsService } from './exams.service';
import { ExamsController } from './exams.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AttemptsModule } from '../attempts/attempts.module';
import { QuestionsModule } from '../questions/questions.module';

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => AttemptsModule),
    QuestionsModule,
  ],
  controllers: [ExamsController],
  providers: [ExamsService],
  exports: [ExamsService],
})
export class ExamsModule {}
