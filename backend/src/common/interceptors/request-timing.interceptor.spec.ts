import { RequestTimingInterceptor } from './request-timing.interceptor';
import { of } from 'rxjs';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { globalEtagCache } from '../services/etag-cache.service';

describe('RequestTimingInterceptor', () => {
  let interceptor: RequestTimingInterceptor;

  beforeEach(() => {
    interceptor = new RequestTimingInterceptor();
    globalEtagCache.clear();
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  it('should set Server-Timing, X-Response-Time, and ETag headers on successful request', (done) => {
    const headers: Record<string, string> = {};
    const mockReq = { method: 'GET', url: '/categories', originalUrl: '/categories', headers: {} };
    const mockRes = {
      statusCode: 200,
      headersSent: false,
      setHeader: jest.fn((k: string, v: string) => {
        headers[k] = v;
      }),
    };

    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => mockReq,
        getResponse: () => mockRes,
      }),
    } as unknown as ExecutionContext;

    const mockCallHandler = {
      handle: () => of({ success: true }),
    } as CallHandler;

    interceptor.intercept(mockContext, mockCallHandler).subscribe({
      next: (val) => {
        expect(val).toEqual({ success: true });
        expect(mockRes.setHeader).toHaveBeenCalledWith(
          'Server-Timing',
          expect.stringContaining('total;dur='),
        );
        expect(mockRes.setHeader).toHaveBeenCalledWith(
          'X-Response-Time',
          expect.stringMatching(/^\d+ms$/),
        );
        expect(mockRes.setHeader).toHaveBeenCalledWith(
          'ETag',
          expect.stringMatching(/^W\/"/),
        );
        done();
      },
    });
  });
});
