import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class EtagCacheService {
  private readonly etags = new Map<string, { etag: string; updatedAt: number }>();

  get(key: string): string | undefined {
    return this.etags.get(key)?.etag;
  }

  set(key: string, etag: string): void {
    this.etags.set(key, { etag, updatedAt: Date.now() });
  }

  computeEtag(payload: unknown): string {
    const json = typeof payload === 'string' ? payload : JSON.stringify(payload);
    const hash = crypto.createHash('md5').update(json).digest('base64').substring(0, 27);
    return `W/"${json.length.toString(16)}-${hash}"`;
  }

  setPayload(key: string, payload: unknown): string {
    const etag = this.computeEtag(payload);
    this.set(key, etag);
    return etag;
  }

  invalidate(prefixOrKeyword: string): void {
    const needle = prefixOrKeyword.toLowerCase();
    for (const key of this.etags.keys()) {
      if (key.toLowerCase().includes(needle)) {
        this.etags.delete(key);
      }
    }
  }

  clear(): void {
    this.etags.clear();
  }
}

// Global singleton for use in interceptors and services
export const globalEtagCache = new EtagCacheService();
