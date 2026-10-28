import { ConditionalRequestMiddleware } from './conditional-request.middleware';
import { globalEtagCache } from '../services/etag-cache.service';
import type { Request, Response, NextFunction } from 'express';

describe('ConditionalRequestMiddleware', () => {
  let middleware: ConditionalRequestMiddleware;

  beforeEach(() => {
    middleware = new ConditionalRequestMiddleware();
    globalEtagCache.clear();
  });

  it('should call next() when no If-None-Match header is present', () => {
    const req = { method: 'GET', url: '/products', headers: {} } as Request;
    const res = { setHeader: jest.fn(), status: jest.fn(), end: jest.fn() } as unknown as Response;
    const next = jest.fn() as NextFunction;

    middleware.use(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should immediately return HTTP 304 when If-None-Match matches cached ETag', () => {
    const routeKey = 'GET:/products';
    const testEtag = globalEtagCache.setPayload(routeKey, [{ id: '1' }]);

    const req = {
      method: 'GET',
      url: '/products',
      originalUrl: '/products',
      headers: { 'if-none-match': testEtag },
    } as Request;
    const res = {
      status: jest.fn().mockReturnThis(),
      setHeader: jest.fn(),
      end: jest.fn(),
    } as unknown as Response;
    const next = jest.fn() as NextFunction;

    middleware.use(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(304);
    expect(res.setHeader).toHaveBeenCalledWith('ETag', testEtag);
    expect(res.end).toHaveBeenCalled();
  });
});
