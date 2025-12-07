import { Module } from '@nestjs/common';
import { CoreAiService } from './core-ai.service';

@Module({
  providers: [CoreAiService],
  exports: [CoreAiService],
})
export class CoreAiModule {}
