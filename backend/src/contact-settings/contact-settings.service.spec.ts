import { Test, TestingModule } from '@nestjs/testing';
import { ContactSettingsService } from './contact-settings.service';

describe('ContactSettingsService', () => {
  let service: ContactSettingsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ContactSettingsService],
    }).compile();

    service = module.get<ContactSettingsService>(ContactSettingsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
