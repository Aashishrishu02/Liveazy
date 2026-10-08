import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { BannersModule } from '../banners/banners.module';


@Module({
  imports: [BannersModule],
  controllers: [UploadController],
  providers: [UploadService],
})
export class UploadModule {}