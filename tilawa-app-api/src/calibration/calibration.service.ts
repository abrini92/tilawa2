import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CoreAiService } from '../core-ai/core-ai.service';

@Injectable()
export class CalibrationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly coreAi: CoreAiService,
  ) {}

  async calibrateUser(
    userId: string,
    recitations: Express.Multer.File[],
    noise?: Express.Multer.File,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const recitationBuffers = recitations.map((f) => f.buffer);
    const noiseBuffer = noise ? noise.buffer : undefined;

    const aiResult = await this.coreAi.calibrate(recitationBuffers, noiseBuffer);

    const calibration = await this.prisma.calibrationProfile.create({
      data: {
        userId,
        voiceProfile: aiResult.voice_profile ?? {},
        noiseProfile: aiResult.noise_profile ?? {},
        recommendedParams: aiResult.recommended_params ?? {},
      },
    });

    return calibration;
  }
}
