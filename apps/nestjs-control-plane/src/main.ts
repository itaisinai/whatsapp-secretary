import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  try {
    const app = await NestFactory.create(AppModule, {
      logger: ['error', 'warn', 'log', 'debug', 'verbose'],
    });

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    app.enableCors({
      origin: true,
      credentials: true,
    });

    const configService = app.get(ConfigService);
    const port = configService.get<number>('app.port', 3000);

    await app.listen(port);

    logger.log(`🚀 NestJS Control Plane running on: http://localhost:${port}`);
    logger.log(`📊 Health check: http://localhost:${port}/health`);
    logger.log(`🤖 Hermes API: http://localhost:${port}/hermes`);
    logger.log(`Environment: ${configService.get('app.nodeEnv')}`);
  } catch (error) {
    logger.error('Failed to start application', error);
    process.exit(1);
  }
}

bootstrap();
