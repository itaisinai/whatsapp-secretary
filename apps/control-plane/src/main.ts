import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');

  try {
    const app = await NestFactory.create(AppModule, { rawBody: true });
    app.enableShutdownHooks();
    const port = Number(process.env.PORT ?? 3000);
    await app.listen(port, '0.0.0.0');
    logger.log(`Control plane listening on port ${port}`);
  } catch (error) {
    logger.error('Failed to start application', error);
    process.exit(1);
  }
}

void bootstrap();
