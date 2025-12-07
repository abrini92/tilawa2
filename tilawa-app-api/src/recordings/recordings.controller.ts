import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { RecordingStatus } from '@prisma/client';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { RecordingsService } from './recordings.service';

@Controller('recordings')
export class RecordingsController {
  constructor(private readonly recordingsService: RecordingsService) {}

  /**
   * Upload a recording for processing.
   * Rate limited: 2/sec, 5/10sec, 10/min (stricter than global)
   */
  @Post()
  @Throttle({
    short: { ttl: 1000, limit: 2 },
    medium: { ttl: 10000, limit: 5 },
    long: { ttl: 60000, limit: 10 },
  })
  @UseInterceptors(FileInterceptor('file', {
    limits: {
      fileSize: 100 * 1024 * 1024, // 100MB max
    },
  }))
  async uploadRecording(
    @Body('userId') userId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.recordingsService.handleUpload(userId, file);
  }

  /**
   * List recordings for a user with optional filtering.
   * GET /recordings?userId=X&status=DONE&limit=20&offset=0
   */
  @Get()
  async listRecordings(
    @Query('userId') userId: string,
    @Query('status') status?: RecordingStatus,
    @Query('limit') limit = '20',
    @Query('offset') offset = '0',
  ) {
    if (!userId) {
      throw new BadRequestException('userId is required');
    }

    return this.recordingsService.findByUser(userId, {
      status,
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
    });
  }

  @Get(':id')
  async getRecording(@Param('id') id: string) {
    const rec = await this.recordingsService.findOne(id);
    if (!rec) throw new NotFoundException();
    return rec;
  }

  @Get(':id/analysis')
  async getRecordingAnalysis(@Param('id') id: string) {
    const analysis = await this.recordingsService.getAnalysis(id);
    if (!analysis) throw new NotFoundException();
    return analysis;
  }
}
