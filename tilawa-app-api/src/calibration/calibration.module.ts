import { Module } from '@nestjs/common';
import { CoreAiModule } from '../core-ai/core-ai.module';
import { PrismaModule } from '../prisma/prisma.module';
import { CalibrationController } from './calibration.controller';
import { CalibrationService } from './calibration.service';

@Module({
  imports: [PrismaModule, CoreAiModule],
  controllers: [CalibrationController],
  providers: [CalibrationService],
})
export class CalibrationModule {}
