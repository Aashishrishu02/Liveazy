import { Test, TestingModule } from '@nestjs/testing';
import { ContactSettingsController } from './contact-settings.controller';

describe('ContactSettingsController', () => {
  let controller: ContactSettingsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ContactSettingsController],
    }).compile();

    controller = module.get<ContactSettingsController>(ContactSettingsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
