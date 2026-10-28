import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import { globalEtagCache } from '../services/etag-cache.service';

@Injectable()
export class ConditionalRequestMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction): void {
    if (req.method === 'GET' || req.method === 'HEAD') {
      const ifNoneMatch = req.headers['if-none-match'];
      if (ifNoneMatch) {
        const routeKey = `${req.method}:${req.originalUrl || req.url}`;
        const cachedEtag = globalEtagCache.get(routeKey);

        if (cachedEtag && (ifNoneMatch === cachedEtag || ifNoneMatch === '*')) {
          res.status(304);
          res.setHeader('ETag', cachedEtag);
          res.setHeader('Server-Timing', 'etag;dur=0;desc="ETag Match", total;dur=0');
          res.setHeader('X-Response-Time', '0ms');
          this.logger.log(`${req.method} ${req.originalUrl || req.url} 304 - 0ms [fast ETag 304]`);
          res.end();
          return;
        }
      }
    }
    next();
  }
}
