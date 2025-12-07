import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bullmq';
import { CalibrationModule } from './calibration/calibration.module';
import { CoreAiModule } from './core-ai/core-ai.module';
import { PrismaModule } from './prisma/prisma.module';
import { RecordingsModule } from './recordings/recordings.module';
import { UsersModule } from './users/users.module';
import { throttlerConfig } from './config/throttler.config';
import { bullmqConfig, QUEUE_NAMES } from './config/bullmq.config';

@Module({
  imports: [
    // Rate limiting - global guard
    ThrottlerModule.forRoot(throttlerConfig),

    // BullMQ for async job processing
    BullModule.forRoot({
      connection: bullmqConfig.connection,
    }),
    BullModule.registerQueue(
      { name: QUEUE_NAMES.AUDIO_PROCESSING },
      { name: QUEUE_NAMES.QURAN_ALIGNMENT },
    ),

    // App modules
    PrismaModule,
    CoreAiModule,
    UsersModule,
    CalibrationModule,
    RecordingsModule,
  ],
  providers: [
    // Apply rate limiting globally
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
