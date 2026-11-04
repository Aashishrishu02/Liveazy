import { Test, TestingModule } from '@nestjs/testing';
import { CombosService } from './combos.service';
import { PrismaService } from '../prisma/prisma.service';

describe('CombosService', () => {
  let service: CombosService;
  let prisma: {
    comboOffer: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    comboOfferProduct: {
      deleteMany: jest.Mock;
      createMany: jest.Mock;
    };
    $transaction: jest.Mock;
  };

  beforeEach(async () => {
    prisma = {
      comboOffer: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      comboOfferProduct: {
        deleteMany: jest.fn(),
        createMany: jest.fn(),
      },
      $transaction: jest.fn((callback) => callback(prisma)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CombosService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<CombosService>(CombosService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should fetch public combos', async () => {
    prisma.comboOffer.findMany.mockResolvedValue([
      { id: 'c1', title: 'Living Combo', isActive: true },
    ]);
    const res = await service.getPublicCombos();
    expect(res).toHaveLength(1);
    expect(prisma.comboOffer.findMany).toHaveBeenCalled();
  });
});
