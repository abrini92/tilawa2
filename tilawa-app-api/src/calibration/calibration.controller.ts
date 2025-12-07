import {
  Body,
  Controller,
  Post,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { CalibrationService } from './calibration.service';

@Controller('calibration')
export class CalibrationController {
  constructor(private readonly calibrationService: CalibrationService) {}

  @Post()
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'files', maxCount: 5 },
      { name: 'noise_file', maxCount: 1 },
    ]),
  )
  async calibrate(
    @Body('userId') userId: string,
    @UploadedFiles()
    files: {
      files?: Express.Multer.File[];
      noise_file?: Express.Multer.File[];
    },
  ) {
    const recitations = files.files ?? [];
    const noise = files.noise_file?.[0];

    return this.calibrationService.calibrateUser(userId, recitations, noise);
  }
}
