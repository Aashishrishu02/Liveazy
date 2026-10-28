import { Test, TestingModule } from '@nestjs/testing';
import { FaqsService } from './faqs.service';
import { PrismaService } from '../prisma/prisma.service';

describe('FaqsService', () => {
  let service: FaqsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FaqsService,
        {
          provide: PrismaService,
          useValue: {
            fAQ: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<FaqsService>(FaqsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
