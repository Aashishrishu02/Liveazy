import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { recordPoolTiming, recordDbTiming } from '../common/timing/request-timing.context';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private readonly pool: Pool;
  private isConnected = false;

  constructor(private configService: ConfigService) {
    const connectionString =
      configService.get<string>('DATABASE_URL') || process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not defined');
    }

    const pool = new Pool({
      connectionString,
      max: 10,
      idleTimeoutMillis: 30000, // 30 seconds to avoid stale idle connections on Neon
      connectionTimeoutMillis: 30000, // 30 seconds allows Neon compute wake-up buffer
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000,
    });

    pool.on('error', (err) => {
      // Prevent unhandled error event from crashing the process when Neon compute suspends
      this.logger.warn(`PostgreSQL pool idle client error: ${err.message}`);
    });

    // Instrument pool connection acquisition and individual SQL query duration
    const origConnect = pool.connect.bind(pool);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (pool as any).connect = async (...args: any[]) => {
      const start = performance.now();
      try {
        const client = await (origConnect as any)(...args);
        if (client && typeof client.query === 'function') {
          const origQuery = client.query.bind(client);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          client.query = (...qArgs: any[]) => {
            const qStart = performance.now();
            const result = (origQuery as any)(...qArgs);
            if (result && typeof result.then === 'function') {
              return result.finally(() => {
                recordDbTiming(performance.now() - qStart);
              });
            }
            recordDbTiming(performance.now() - qStart);
            return result;
          };
        }
        return client;
      } finally {
        recordPoolTiming(performance.now() - start);
      }
    };

    const adapter = new PrismaPg(pool);
    super({ adapter });
    this.pool = pool;
  }

  async onModuleInit() {
    const start = performance.now();
    try {
      await this.$connect();
      const client = await this.pool.connect();
      try {
        await client.query('SELECT 1');
      } finally {
        client.release();
      }
      this.isConnected = true;
      const duration = Math.round(performance.now() - start);
      this.logger.log(`Prisma connected and PostgreSQL connection pool initialized in ${duration}ms`);
    } catch (error) {
      this.isConnected = false;
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Initial database connection pre-warm warning (will reconnect on request): ${message}`);
    }
  }

  async isHealthy(): Promise<{ ok: boolean; latencyMs: number; error?: string }> {
    const start = performance.now();
    try {
      const client = await this.pool.connect();
      try {
        await client.query('SELECT 1');
      } finally {
        client.release();
      }
      this.isConnected = true;
      return { ok: true, latencyMs: Math.round(performance.now() - start) };
    } catch (err) {
      this.isConnected = false;
      const errorMsg = err instanceof Error ? err.message : 'Database check failed';
      return { ok: false, latencyMs: Math.round(performance.now() - start), error: errorMsg };
    }
  }

  async onModuleDestroy() {
    try {
      await this.$disconnect();
    } catch (err) {
      this.logger.error('Error disconnecting Prisma client', err);
    }
    try {
      await this.pool.end();
    } catch (err) {
      this.logger.error('Error ending PostgreSQL pool', err);
    }
  }
}