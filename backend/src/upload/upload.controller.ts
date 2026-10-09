import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes } from '@nestjs/swagger';
import { UploadService } from './upload.service';
import { BannersService } from '../banners/banners.service';

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService,
  private readonly bannersService: BannersService,
 ) {}

  @Post('image')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
      required: ['file'],
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(@UploadedFile() file: any) {
    const result = await this.uploadService.uploadImage(file);

    return {
      message: 'Image uploaded successfully',
      url: (result as any).secure_url,
    };
  }



    @Post('banner')
    @ApiConsumes('multipart/form-data')
    @ApiBody({
      schema: {
        type: 'object',
        properties: {
          file: {
            type: 'string',
            format: 'binary',
          },
        },
        required: ['file'],
      },
    })
    @UseInterceptors(FileInterceptor('file'))
    async uploadBanner(@UploadedFile() file: any) {
      const result = await this.uploadService.uploadBanner(file);

      const url = (result as any).secure_url;

      const banner = await this.bannersService.createBanner(url);

      return{
        message:'Banner uploaded successfully',
        banner,
      };
    }
  }


   