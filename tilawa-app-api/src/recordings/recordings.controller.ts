import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
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
