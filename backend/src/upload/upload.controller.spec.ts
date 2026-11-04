import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { BannersService } from '../banners/banners.service';

describe('UploadController', () => {
  let controller: UploadController;
  let uploadService: { uploadImage: jest.Mock; uploadBanner: jest.Mock; uploadPromoBanner: jest.Mock };

  beforeEach(async () => {
    uploadService = {
      uploadImage: jest.fn().mockResolvedValue({ secure_url: 'https://cloudinary.com/test-image.jpg' }),
      uploadBanner: jest.fn().mockResolvedValue({ secure_url: 'https://cloudinary.com/banner.jpg' }),
      uploadPromoBanner: jest.fn().mockResolvedValue({ secure_url: 'https://cloudinary.com/promo.jpg' }),
    };

    const bannersService = {
      createBanner: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UploadController],
      providers: [
        { provide: UploadService, useValue: uploadService },
        { provide: BannersService, useValue: bannersService },
      ],
    }).compile();

    controller = module.get<UploadController>(UploadController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should upload an image and return secure_url', async () => {
    const mockFile = {
      buffer: Buffer.from('fake-image-data'),
      mimetype: 'image/png',
      originalname: 'test.png',
      size: 1024,
    };

    const result = await controller.uploadImage(mockFile, 'combos');

    expect(uploadService.uploadImage).toHaveBeenCalledWith(mockFile, 'liveazy/combos');
    expect(result).toEqual({
      success: true,
      message: 'Image uploaded successfully',
      url: 'https://cloudinary.com/test-image.jpg',
      secure_url: 'https://cloudinary.com/test-image.jpg',
    });
  });

  it('should throw BadRequestException if file is missing', async () => {
    await expect(controller.uploadImage(null as any)).rejects.toThrow(BadRequestException);
  });
});
