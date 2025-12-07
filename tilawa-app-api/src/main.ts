import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Error starting Nest application', err);
});
