import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { appConfig, whatsappConfig, hermesConfig, validateEnvironment } from './config/environment';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { WhatsAppModule } from './whatsapp/whatsapp.module';
import { HealthModule } from './health/health.module';
import { HermesModule } from './hermes/hermes.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, whatsappConfig, hermesConfig],
      validate: validateEnvironment,
    }),
    HermesModule,
    WhatsAppModule,
    HealthModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}
