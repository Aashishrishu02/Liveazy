import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import type { Request, Response } from 'express';
import {
  runWithTimingContext,
  getTimingContext,
  type RequestTimingState,
} from '../timing/request-timing.context';
import { globalEtagCache } from '../services/etag-cache.service';

@Injectable()
export class RequestTimingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();

    const start = performance.now();
    const method = req.method;
    const url = req.originalUrl || req.url;
    const routeKey = `${method}:${url}`;

    const state: RequestTimingState = {
      start,
      dbTimeMs: 0,
      dbQueries: 0,
      poolTimeMs: 0,
      transformTimeMs: 0,
    };

    return runWithTimingContext(state, () => {
      return next.handle().pipe(
        tap({
          next: (data: unknown) => {
            const duration = Math.round(performance.now() - start);
            const statusCode = res.statusCode;
            const currentTiming = getTimingContext() || state;

            const dbDur = Math.round(currentTiming.dbTimeMs);
            const poolDur = Math.round(currentTiming.poolTimeMs);
            const queries = currentTiming.dbQueries;

            // Generate and register ETag for successful GET responses
            if (method === 'GET' && statusCode >= 200 && statusCode < 300 && data !== undefined) {
              const etag = globalEtagCache.setPayload(routeKey, data);
              if (!res.headersSent) {
                res.setHeader('ETag', etag);
              }
            }

            if (!res.headersSent) {
              const timingParts = [
                `db;dur=${dbDur};desc="Database"`,
                `total;dur=${duration};desc="Total"`,
              ];
              if (poolDur > 0) {
                timingParts.unshift(`pool;dur=${poolDur};desc="Pool"`);
              }
              res.setHeader('Server-Timing', timingParts.join(', '));
              res.setHeader('X-Response-Time', `${duration}ms`);
            }

            // Clean log entry with granular timing breakdown and zero sensitive data
            const queryBreakdown = queries > 0 ? ` (db: ${dbDur}ms, queries: ${queries})` : '';
            this.logger.log(`${method} ${url} ${statusCode} - ${duration}ms${queryBreakdown}`);
          },
          error: (err) => {
            const duration = Math.round(performance.now() - start);
            const statusCode = err?.status || res.statusCode || 500;
            const msg = err instanceof Error ? err.message : String(err);

            this.logger.warn(
              `${method} ${url} ${statusCode} - ${duration}ms - Error: ${msg}`,
            );
          },
        }),
      );
    });
  }
}
