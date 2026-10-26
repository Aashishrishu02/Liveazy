
import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UploadService {
  constructor(private configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
    });
  }

  private uploadBuffer(
    file: any,
    folder: string,
    resourceType: 'image' | 'video' = 'image',
  ) {
    return new Promise<any>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: resourceType,
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else if (!result) {
            reject(new Error('Cloudinary returned no upload result'));
          } else {
            resolve(result);
          }
        },
      );

      uploadStream.end(file.buffer);
    });
  }

  async uploadImage(file: any) {
    return this.uploadBuffer(file, 'liveazy/categories');
  }

  async uploadBanner(file: any) {
    return this.uploadBuffer(file, 'liveazy/banners');
  }

  async uploadPromoBanner(file: any) {
    return this.uploadBuffer(file, 'liveazy/promo-banners');
  }

  async uploadBlogImage(file: any) {
    return this.uploadBuffer(file, 'liveazy/blog-images');
  }

  async uploadBlogVideo(file: any) {
    return this.uploadBuffer(file, 'liveazy/blog-videos', 'video');
  }
}
