import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';
import type { Response } from 'express';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  getRoot() {
    return {
      status: 'ok',
      service: 'LIVEAZY API',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('health')
  async getHealth(@Res({ passthrough: true }) res: Response) {
    const dbCheck = await this.prisma.isHealthy();
    const isReady = dbCheck.ok;

    if (!isReady) {
      res.status(HttpStatus.SERVICE_UNAVAILABLE);
    }

    return {
      status: isReady ? 'ok' : 'degraded',
      service: 'LIVEAZY API',
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      checks: {
        server: 'up',
        database: isReady ? 'connected' : 'disconnected',
        dbLatencyMs: dbCheck.latencyMs,
      },
    };
  }

  @Get('health/live')
  getLiveness() {
    return { status: 'ok' };
  }

  @Get('health/ready')
  async getReadiness(@Res({ passthrough: true }) res: Response) {
    const dbCheck = await this.prisma.isHealthy();
    if (!dbCheck.ok) {
      res.status(HttpStatus.SERVICE_UNAVAILABLE);
      return { status: 'not_ready', error: dbCheck.error };
    }
    return { status: 'ready', latencyMs: dbCheck.latencyMs };
  }
}
