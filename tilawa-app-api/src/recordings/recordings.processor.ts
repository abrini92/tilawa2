import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import * as fs from 'fs';
import * as path from 'path';
import { CoreAiService } from '../core-ai/core-ai.service';
import { PrismaService } from '../prisma/prisma.service';
import { RecordingStatus } from '@prisma/client';
import { QUEUE_NAMES } from '../config/bullmq.config';

export interface AudioProcessingJobData {
  recordingId: string;
  userId: string;
  originalPath: string;
  audioBuffer: string; // Base64 encoded
}

@Processor(QUEUE_NAMES.AUDIO_PROCESSING)
export class AudioProcessingProcessor extends WorkerHost {
  private readonly logger = new Logger(AudioProcessingProcessor.name);
  private readonly uploadDir = path.join(process.cwd(), 'uploads');

  constructor(
    private readonly prisma: PrismaService,
    private readonly coreAi: CoreAiService,
  ) {
    super();
  }

  async process(job: Job<AudioProcessingJobData>): Promise<void> {
    const { recordingId, originalPath } = job.data;
    this.logger.log(`Processing recording ${recordingId}`, { jobId: job.id });

    try {
      // Decode audio buffer from base64
      const audioBuffer = Buffer.from(job.data.audioBuffer, 'base64');

      // Update status to PROCESSING
      await this.prisma.recording.update({
        where: { id: recordingId },
        data: { status: RecordingStatus.PROCESSING },
      });

      // Run AI processing in parallel
      const [enhanced, isQuranRes, alignRes] = await Promise.all([
        this.coreAi.enhanceAdaptive(audioBuffer),
        this.coreAi.isQuran(audioBuffer),
        this.coreAi.alignQuran(audioBuffer),
      ]);

      // Save enhanced audio
      const enhancedFilename = `enhanced_${path.basename(originalPath)}.wav`;
      const enhancedPath = path.join(this.uploadDir, enhancedFilename);
      fs.writeFileSync(enhancedPath, enhanced);

      // Extract results
      const isQuran = !!isQuranRes?.is_quran;
      const mainSurah = isQuranRes?.main_surah ?? null;
      const ayahStart = isQuranRes?.ayah_start ?? null;
      const ayahEnd = isQuranRes?.ayah_end ?? null;
      const recitationAccuracy = isQuranRes?.recitation_accuracy ?? null;

      // Update recording with results
      await this.prisma.recording.update({
        where: { id: recordingId },
        data: {
          status: RecordingStatus.DONE,
          enhancedUrl: enhancedPath,
          isQuran,
          mainSurah,
          ayahStart,
          ayahEnd,
          recitationAccuracy,
          analysis: {
            isQuran: isQuranRes,
            align: alignRes,
          },
        },
      });

      this.logger.log(`Recording ${recordingId} processed successfully`, {
        jobId: job.id,
        isQuran,
        mainSurah,
      });
    } catch (error) {
      this.logger.error(`Failed to process recording ${recordingId}`, {
        jobId: job.id,
        error: error instanceof Error ? error.message : String(error),
      });

      // Update status to ERROR
      await this.prisma.recording.update({
        where: { id: recordingId },
        data: { status: RecordingStatus.ERROR },
      });

      throw error; // Re-throw to trigger BullMQ retry
    }
  }
}
