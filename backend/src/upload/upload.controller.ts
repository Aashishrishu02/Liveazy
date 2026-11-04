
import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiBearerAuth } from '@nestjs/swagger';
import { memoryStorage } from 'multer';

import { UploadService } from './upload.service';
import { BannersService } from '../banners/banners.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminEmailGuard } from '../auth/guards/admin-email.guard';

const imageUploadInterceptor = (maxSize = 5 * 1024 * 1024) =>
  FileInterceptor('file', {
    storage: memoryStorage(),
    limits: { fileSize: maxSize },
    fileFilter: (_req, file, callback) => {
      const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
      if (!allowed.includes(file.mimetype.toLowerCase())) {
        return callback(
          new BadRequestException('Only JPG, JPEG, PNG, and WEBP images are allowed'),
          false,
        );
      }
      callback(null, true);
    },
  });

const videoUploadInterceptor = () =>
  FileInterceptor('file', {
    storage: memoryStorage(),
    limits: { fileSize: 100 * 1024 * 1024 },
    fileFilter: (_req, file, callback) => {
      if (!['video/mp4', 'video/webm', 'video/quicktime', 'video/ogg'].includes(file.mimetype)) {
        return callback(new BadRequestException('Only MP4, WEBM, MOV and OGG videos are allowed'), false);
      }
      callback(null, true);
    },
  });

@Controller('upload')
export class UploadController {
  constructor(
    private readonly uploadService: UploadService,
    private readonly bannersService: BannersService,
  ) {}

  @Post('image')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        folder: { type: 'string', description: 'Target subfolder under liveazy/' },
      },
      required: ['file'],
    },
  })
  @UseInterceptors(imageUploadInterceptor(5 * 1024 * 1024))
  async uploadImage(
    @UploadedFile() file: any,
    @Body('folder') folder?: string,
  ) {
    if (!file) throw new BadRequestException('Please select an image (JPG, PNG, or WEBP, max 5 MB)');
    const safeFolder = folder && typeof folder === 'string' && folder.trim()
      ? `liveazy/${folder.trim().replace(/[^a-zA-Z0-9_-]/g, '')}`
      : 'liveazy/uploads';
    const result = await this.uploadService.uploadImage(file, safeFolder);
    return {
      success: true,
      message: 'Image uploaded successfully',
      url: result.secure_url,
      secure_url: result.secure_url,
    };
  }

  @Post('banner-image')
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } }, required: ['file'] } })
  @UseInterceptors(FileInterceptor('file'))
  async uploadBannerImage(@UploadedFile() file: any) {
    if (!file) throw new BadRequestException('Please select an image');
    const result = await this.uploadService.uploadBanner(file);
    return { message: 'Banner image uploaded successfully', url: result.secure_url };
  }

  @Post('banner')
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } }, required: ['file'] } })
  @UseInterceptors(FileInterceptor('file'))
  async uploadBanner(@UploadedFile() file: any) {
    if (!file) throw new BadRequestException('Please select an image');
    const result = await this.uploadService.uploadBanner(file);
    const banner = await this.bannersService.createBanner(result.secure_url);
    return { message: 'Banner uploaded successfully', banner };
  }

  @Post('promo-banner')
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } }, required: ['file'] } })
  @UseInterceptors(FileInterceptor('file'))
  async uploadPromoBanner(@UploadedFile() file: any) {
    if (!file) throw new BadRequestException('Please select an image');
    const result = await this.uploadService.uploadPromoBanner(file);
    return { message: 'Promo banner image uploaded successfully', url: result.secure_url };
  }

  @Post('blog-image')
  @UseGuards(JwtAuthGuard, AdminEmailGuard)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } }, required: ['file'] } })
  @UseInterceptors(imageUploadInterceptor())
  async uploadBlogImage(@UploadedFile() file: any) {
    if (!file) throw new BadRequestException('Please select an image');
    const result = await this.uploadService.uploadBlogImage(file);
    return { message: 'Blog image uploaded successfully', url: result.secure_url };
  }

  @Post('blog-video')
  @UseGuards(JwtAuthGuard, AdminEmailGuard)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } }, required: ['file'] } })
  @UseInterceptors(videoUploadInterceptor())
  async uploadBlogVideo(@UploadedFile() file: any) {
    if (!file) throw new BadRequestException('Please select a video');
    const result = await this.uploadService.uploadBlogVideo(file);
    return {
      message: 'Blog video uploaded successfully',
      url: result.secure_url,
      resourceType: result.resource_type,
    };
  }
}
