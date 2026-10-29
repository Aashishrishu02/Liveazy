import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { PrismaService } from '../prisma/prisma.service';

describe('SettingsService', () => {
  let service: SettingsService;
  let mockPrisma: {
    siteSetting: {
      findFirst: jest.Mock;
      findUnique: jest.Mock;
      upsert: jest.Mock;
      update: jest.Mock;
      create: jest.Mock;
    };
  };

  beforeEach(async () => {
    mockPrisma = {
      siteSetting: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        upsert: jest.fn(),
        update: jest.fn(),
        create: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SettingsService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<SettingsService>(SettingsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getSocialSettings', () => {
    it('should return saved social settings', async () => {
      mockPrisma.siteSetting.findFirst.mockResolvedValue({
        id: 1,
        whatsappNumber: '919876543210',
        facebookUrl: 'https://facebook.com/liveazy',
        instagramUrl: 'https://instagram.com/liveazy',
        updatedAt: new Date(),
      });

      const result = await service.getSocialSettings();
      expect(result).toEqual({
        whatsappNumber: '919876543210',
        facebookUrl: 'https://facebook.com/liveazy',
        instagramUrl: 'https://instagram.com/liveazy',
      });
    });

    it('should create default settings if row does not exist', async () => {
      mockPrisma.siteSetting.findFirst.mockResolvedValue(null);
      mockPrisma.siteSetting.create.mockResolvedValue({
        id: 1,
        whatsappNumber: '919423838109',
        facebookUrl: '',
        instagramUrl: '',
        updatedAt: new Date(),
      });

      const result = await service.getSocialSettings();
      expect(result).toEqual({
        whatsappNumber: '919423838109',
        facebookUrl: '',
        instagramUrl: '',
      });
    });
  });

  describe('updateSocialSettings', () => {
    it('should update valid facebook, instagram and whatsapp fields', async () => {
      mockPrisma.siteSetting.findFirst.mockResolvedValue({ id: 1 });
      mockPrisma.siteSetting.upsert.mockResolvedValue({
        id: 1,
        whatsappNumber: '919876543210',
        facebookUrl: 'https://facebook.com/liveazy',
        instagramUrl: 'https://instagram.com/liveazy',
      });

      const result = await service.updateSocialSettings({
        facebookUrl: 'https://facebook.com/liveazy',
        instagramUrl: 'https://instagram.com/liveazy',
        whatsappNumber: '+91 98765 43210',
      });

      expect(mockPrisma.siteSetting.upsert).toHaveBeenCalledWith({
        where: { id: 1 },
        update: {
          facebookUrl: 'https://facebook.com/liveazy',
          instagramUrl: 'https://instagram.com/liveazy',
          whatsappNumber: '919876543210',
        },
        create: expect.any(Object),
      });

      expect(result).toEqual({
        facebookUrl: 'https://facebook.com/liveazy',
        instagramUrl: 'https://instagram.com/liveazy',
        whatsappNumber: '919876543210',
      });
    });

    it('should allow blank social URLs to hide icons', async () => {
      mockPrisma.siteSetting.findFirst.mockResolvedValue({ id: 1 });
      mockPrisma.siteSetting.upsert.mockResolvedValue({
        id: 1,
        whatsappNumber: '919423838109',
        facebookUrl: '',
        instagramUrl: '',
      });

      const result = await service.updateSocialSettings({
        facebookUrl: '   ',
        instagramUrl: '',
      });

      expect(mockPrisma.siteSetting.upsert).toHaveBeenCalledWith({
        where: { id: 1 },
        update: {
          facebookUrl: '',
          instagramUrl: '',
        },
        create: expect.any(Object),
      });

      expect(result.facebookUrl).toBe('');
      expect(result.instagramUrl).toBe('');
    });

    it('should reject invalid Facebook URLs', async () => {
      await expect(
        service.updateSocialSettings({
          facebookUrl: 'not_a_valid_url',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject invalid WhatsApp numbers', async () => {
      await expect(
        service.updateSocialSettings({
          whatsappNumber: '123',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject when no fields are supplied', async () => {
      await expect(
        service.updateSocialSettings({}),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
