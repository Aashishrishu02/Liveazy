import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const mockPrismaService = {
      isHealthy: jest.fn().mockResolvedValue({ ok: true, latencyMs: 5 }),
    };

    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return service info', () => {
      const result = appController.getRoot();
      expect(result.status).toBe('ok');
      expect(result.service).toBe('LIVEAZY API');
    });

    it('should return liveness ok', () => {
      const result = appController.getLiveness();
      expect(result.status).toBe('ok');
    });

    it('should return health check ok', async () => {
      const mockRes = { status: jest.fn() } as any;
      const result = await appController.getHealth(mockRes);
      expect(result.status).toBe('ok');
      expect(result.checks.database).toBe('connected');
    });
  });
});
