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
    // Phase 1: No external dependencies yet, always ready
    // Phase 2: Will check Hermes gateway availability
    return { ready: true };
  }

  @Get('live')
  live(): { alive: boolean } {
    // Liveness check: process is running
    return { alive: true };
  }
}
