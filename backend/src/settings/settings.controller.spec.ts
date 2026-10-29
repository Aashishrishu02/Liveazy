import { Test, TestingModule } from '@nestjs/testing';
import { ValidationPipe } from '@nestjs/common';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';
import { UpdateSocialSettingsDto } from './dto/update-social-settings.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminEmailGuard } from '../auth/guards/admin-email.guard';

describe('SettingsController', () => {
  let controller: SettingsController;
  let mockService: {
    getSocialSettings: jest.Mock;
    getWhatsAppSettings: jest.Mock;
    updateSocialSettings: jest.Mock;
    updateWhatsAppSettings: jest.Mock;
  };

  beforeEach(async () => {
    mockService = {
      getSocialSettings: jest.fn(),
      getWhatsAppSettings: jest.fn(),
      updateSocialSettings: jest.fn(),
      updateWhatsAppSettings: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SettingsController],
      providers: [
        {
          provide: SettingsService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<SettingsController>(SettingsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return social settings from service', async () => {
    mockService.getSocialSettings.mockResolvedValue({
      facebookUrl: 'https://facebook.com/liveazy',
      instagramUrl: 'https://instagram.com/liveazy',
      whatsappNumber: '919423838109',
    });

    const res = await controller.getSocialSettings();
    expect(res).toEqual({
      facebookUrl: 'https://facebook.com/liveazy',
      instagramUrl: 'https://instagram.com/liveazy',
      whatsappNumber: '919423838109',
    });
    expect(mockService.getSocialSettings).toHaveBeenCalled();
  });

  it('should delegate social settings update to service', async () => {
    const payload = {
      facebookUrl: 'https://facebook.com/liveazy',
      instagramUrl: 'https://instagram.com/liveazy',
      whatsappNumber: '919423838109',
    };
    mockService.updateSocialSettings.mockResolvedValue(payload);

    const res = await controller.updateSocialSettings(payload);
    expect(res).toEqual(payload);
    expect(mockService.updateSocialSettings).toHaveBeenCalledWith(payload);
  });

  it('should protect updateSocialSettings with JwtAuthGuard and AdminEmailGuard', () => {
    const guards = Reflect.getMetadata('__guards__', SettingsController.prototype.updateSocialSettings);
    expect(guards).toBeDefined();
    expect(guards).toContain(JwtAuthGuard);
    expect(guards).toContain(AdminEmailGuard);
  });

  it('should protect updateWhatsAppSettings with JwtAuthGuard and AdminEmailGuard', () => {
    const guards = Reflect.getMetadata('__guards__', SettingsController.prototype.updateWhatsAppSettings);
    expect(guards).toBeDefined();
    expect(guards).toContain(JwtAuthGuard);
    expect(guards).toContain(AdminEmailGuard);
  });

  it('should retain fields through ValidationPipe whitelist', async () => {
    const pipe = new ValidationPipe({ whitelist: true, transform: true });
    const input = {
      facebookUrl: 'https://facebook.com/liveazy',
      instagramUrl: '',
      whatsappNumber: '919423838109',
    };
    const transformed = await pipe.transform(input, {
      type: 'body',
      metatype: UpdateSocialSettingsDto,
    });
    expect(transformed).toEqual({
      facebookUrl: 'https://facebook.com/liveazy',
      instagramUrl: '',
      whatsappNumber: '919423838109',
    });
  });
});
