import { Test, TestingModule } from '@nestjs/testing';
import { HomepageSectionsService } from './homepage-sections.service';
import { PrismaService } from '../prisma/prisma.service';

describe('HomepageSectionsService', () => {
  let service: HomepageSectionsService;
  let prisma: {
    homepageSection: {
      count: jest.Mock;
      create: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
    };
    homepageSectionItem: {
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
      findFirst: jest.Mock;
    };
    $transaction: jest.Mock;
  };

  beforeEach(async () => {
    prisma = {
      homepageSection: {
        count: jest.fn().mockResolvedValue(1),
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      homepageSectionItem: {
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        findFirst: jest.fn(),
      },
      $transaction: jest.fn((callback) => callback(prisma)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HomepageSectionsService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<HomepageSectionsService>(HomepageSectionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return public sections ordered by sortOrder', async () => {
    prisma.homepageSection.findMany.mockResolvedValue([
      { id: 'sec1', sectionKey: 'HERO', isVisible: true, sortOrder: 0, items: [] },
    ]);
    const res = await service.getPublicSections();
    expect(res).toHaveLength(1);
    expect(res[0].sectionKey).toBe('HERO');
  });
});
