import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bullmq';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
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
    AuthModule,
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
    // Apply JWT auth globally (use @Public() to skip)
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
