import { Test, TestingModule } from '@nestjs/testing';
import { ContactEnquiriesService } from './contact-enquiries.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ContactEnquiriesService', () => {
  let service: ContactEnquiriesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContactEnquiriesService,
        {
          provide: PrismaService,
          useValue: {
            contactEnquiry: {
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

    service = module.get<ContactEnquiriesService>(ContactEnquiriesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
