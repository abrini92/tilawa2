import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { CoreAiModule } from '../core-ai/core-ai.module';
import { PrismaModule } from '../prisma/prisma.module';
import { QUEUE_NAMES } from '../config/bullmq.config';
import { RecordingsController } from './recordings.controller';
import { RecordingsService } from './recordings.service';
import { AudioProcessingProcessor } from './recordings.processor';

@Module({
  imports: [
    PrismaModule,
    CoreAiModule,
    BullModule.registerQueue({ name: QUEUE_NAMES.AUDIO_PROCESSING }),
  ],
  controllers: [RecordingsController],
  providers: [RecordingsService, AudioProcessingProcessor],
})
export class RecordingsModule {}
