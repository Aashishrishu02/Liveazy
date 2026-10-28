import { Test, TestingModule } from '@nestjs/testing';
import { ContactSettingsService } from './contact-settings.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ContactSettingsService', () => {
  let service: ContactSettingsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContactSettingsService,
        {
          provide: PrismaService,
          useValue: {
            contactSetting: {
              findFirst: jest.fn(),
              upsert: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<ContactSettingsService>(ContactSettingsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
