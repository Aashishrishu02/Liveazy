import { Test, TestingModule } from '@nestjs/testing';
import { CustomerStoriesService } from './customer-stories.service';
import { PrismaService } from '../prisma/prisma.service';

describe('CustomerStoriesService', () => {
  let service: CustomerStoriesService;
  let prisma: {
    customerStory: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    feedback: {
      findMany: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      customerStory: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      feedback: {
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomerStoriesService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<CustomerStoriesService>(CustomerStoriesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return curated stories when available', async () => {
    prisma.customerStory.findMany.mockResolvedValue([
      { id: 's1', customerName: 'Rohan Sharma', story: 'Great service!', isActive: true },
    ]);
    const res = await service.getPublicStories();
    expect(res).toHaveLength(1);
    expect(res[0].customerName).toBe('Rohan Sharma');
  });
});
