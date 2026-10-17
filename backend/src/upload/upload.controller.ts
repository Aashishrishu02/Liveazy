import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes } from '@nestjs/swagger';
import { UploadService } from './upload.service';
import { BannersService } from '../banners/banners.service';

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
      properties: { file: { type: 'string', format: 'binary' } },
      required: ['file'],
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(@UploadedFile() file: any) {
    if (!file) throw new BadRequestException('Please select an image');
    const result = await this.uploadService.uploadImage(file);
    return { message: 'Image uploaded successfully', url: result.secure_url };
  }

  // Upload a hero image without creating a Banner database record.
  // Admin creates or updates the record separately through /banners.
  @Post('banner-image')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
      required: ['file'],
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadBannerImage(@UploadedFile() file: any) {
    if (!file) throw new BadRequestException('Please select an image');
    const result = await this.uploadService.uploadBanner(file);
    return { message: 'Banner image uploaded successfully', url: result.secure_url };
  }

  // Legacy endpoint preserved for existing clients that expect upload + create.
  @Post('banner')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
      required: ['file'],
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadBanner(@UploadedFile() file: any) {
    if (!file) throw new BadRequestException('Please select an image');
    const result = await this.uploadService.uploadBanner(file);
    const banner = await this.bannersService.createBanner(result.secure_url);
    return { message: 'Banner uploaded successfully', banner };
  }

  @Post('promo-banner')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
      required: ['file'],
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadPromoBanner(@UploadedFile() file: any) {
    if (!file) throw new BadRequestException('Please select an image');
    const result = await this.uploadService.uploadPromoBanner(file);
    return { message: 'Promo banner image uploaded successfully', url: result.secure_url };
  }
}
