import { Test, TestingModule } from '@nestjs/testing';
import { ContactSettingsController } from './contact-settings.controller';
import { ContactSettingsService } from './contact-settings.service';

describe('ContactSettingsController', () => {
  let controller: ContactSettingsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ContactSettingsController],
      providers: [
        {
          provide: ContactSettingsService,
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<ContactSettingsController>(ContactSettingsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
