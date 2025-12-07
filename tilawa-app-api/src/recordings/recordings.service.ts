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
  private readonly baseUrl = process.env.BASE_URL || 'http://localhost:3000';

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
      ...this.toHttpUrls(recording),
      jobId: job.id,
      message: 'Recording uploaded and queued for processing',
    };
  }

  async findOne(id: string) {
    const recording = await this.prisma.recording.findUnique({ where: { id } });
    if (!recording) return null;
    return this.toHttpUrls(recording);
  }

  /**
   * Find all recordings for a user with pagination and filtering.
   */
  async findByUser(
    userId: string,
    options: {
      status?: RecordingStatus;
      limit?: number;
      offset?: number;
    } = {},
  ) {
    const { status, limit = 20, offset = 0 } = options;

    const where: { userId: string; status?: RecordingStatus } = { userId };
    if (status) where.status = status;

    const [recordings, total] = await Promise.all([
      this.prisma.recording.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.recording.count({ where }),
    ]);

    return {
      recordings: recordings.map((r) => this.toHttpUrls(r)),
      total,
      hasMore: offset + limit < total,
    };
  }

  /**
   * Convert filesystem paths to HTTP URLs for frontend access.
   */
  private toHttpUrls<T extends { originalUrl: string; enhancedUrl: string | null }>(
    recording: T,
  ): T {
    return {
      ...recording,
      originalUrl: this.pathToUrl(recording.originalUrl),
      enhancedUrl: recording.enhancedUrl
        ? this.pathToUrl(recording.enhancedUrl)
        : null,
    };
  }

  private pathToUrl(filePath: string): string {
    const filename = path.basename(filePath);
    return `${this.baseUrl}/uploads/${filename}`;
  }

  async getAnalysis(id: string) {
    const rec = await this.prisma.recording.findUnique({ where: { id } });
    if (!rec) return null;
    return rec.analysis;
  }
}
