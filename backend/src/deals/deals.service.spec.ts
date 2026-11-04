import { Test, TestingModule } from '@nestjs/testing';
import { DealsService } from './deals.service';
import { PrismaService } from '../prisma/prisma.service';

describe('DealsService', () => {
  let service: DealsService;
  let prisma: {
    deal: {
      findFirst: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    dealProduct: {
      deleteMany: jest.Mock;
      createMany: jest.Mock;
    };
    $transaction: jest.Mock;
  };

  beforeEach(async () => {
    prisma = {
      deal: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      dealProduct: {
        deleteMany: jest.fn(),
        createMany: jest.fn(),
      },
      $transaction: jest.fn((callback) => callback(prisma)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DealsService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<DealsService>(DealsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return current deal when active', async () => {
    const mockDeal = {
      id: 'd1',
      title: 'Monsoon Deal',
      startsAt: new Date(Date.now() - 10000),
      endsAt: new Date(Date.now() + 100000),
      isActive: true,
    };
    prisma.deal.findFirst.mockResolvedValue(mockDeal);

    const res = await service.getCurrentDeal();
    expect(res.status).toBe('ACTIVE');
    expect(res.deal).toEqual(mockDeal);
  });
});
