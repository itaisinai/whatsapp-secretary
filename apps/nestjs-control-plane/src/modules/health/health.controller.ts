import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  check(): { status: string; timestamp: string } {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('ready')
  ready(): { ready: boolean } {
    return {
      ready: true,
    };
  }

  @Get('live')
  live(): { alive: boolean } {
    return {
      alive: true,
    };
  }
}
