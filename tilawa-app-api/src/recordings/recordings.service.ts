import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { RecordingStatus } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { QUEUE_NAMES } from '../config/bullmq.config';
import { AudioProcessingJobData } from './recordings.processor';

@Injectable()
export class RecordingsService {
  private readonly logger = new Logger(RecordingsService.name);
  private readonly uploadDir = path.join(process.cwd(), 'uploads');

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(QUEUE_NAMES.AUDIO_PROCESSING)
    private readonly audioQueue: Queue<AudioProcessingJobData>,
  ) {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  /**
   * Handle file upload and queue for async processing.
   * Returns immediately with UPLOADED status.
   */
  async handleUpload(userId: string, file: Express.Multer.File) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const originalFilename = `${Date.now()}_${file.originalname}`;
    const originalPath = path.join(this.uploadDir, 'original_' + originalFilename);
    fs.writeFileSync(originalPath, file.buffer);

    // Create recording with UPLOADED status (not PROCESSING yet)
    const recording = await this.prisma.recording.create({
      data: {
        userId,
        status: RecordingStatus.UPLOADED,
        originalUrl: originalPath,
      },
    });

    // Queue the job for async processing
    const job = await this.audioQueue.add(
      'process-recording',
      {
        recordingId: recording.id,
        userId,
        originalPath,
        audioBuffer: file.buffer.toString('base64'),
      },
      {
        attempts: 3, // Retry up to 3 times
        backoff: {
          type: 'exponential',
          delay: 5000, // Start with 5s delay
        },
        removeOnComplete: {
          age: 3600, // Keep completed jobs for 1 hour
          count: 1000, // Keep last 1000 completed jobs
        },
        removeOnFail: {
          age: 86400, // Keep failed jobs for 24 hours
        },
      },
    );

    this.logger.log(`Recording ${recording.id} queued for processing`, {
      jobId: job.id,
      userId,
    });

    return {
      ...recording,
      jobId: job.id,
      message: 'Recording uploaded and queued for processing',
    };
  }

  async findOne(id: string) {
    return this.prisma.recording.findUnique({ where: { id } });
  }

  async getAnalysis(id: string) {
    const rec = await this.prisma.recording.findUnique({ where: { id } });
    if (!rec) return null;
    return rec.analysis;
  }
}
