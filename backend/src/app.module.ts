import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { CategoriesModule } from './categories/categories.module';
import { ProductsModule } from './products/products.module';
import { UploadModule } from './upload/upload.module';
import { BannersModule } from './banners/banners.module';
import { SettingsModule } from './settings/settings.module';
import { PromoBannersModule } from './promo-banners/promo-banners.module';
import { ContactSettingsModule } from './contact-settings/contact-settings.module';
import { FaqsModule } from './faqs/faqs.module';
import { ContactEnquiriesModule } from './contact-enquiries/contact-enquiries.module';
import { FeedbackModule } from './feedback/feedback.module';
import { TrendingRentalsModule } from './trending-rentals/trending-rentals.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule,
    PrismaModule,
    CategoriesModule,
    ProductsModule,
    UploadModule,
    BannersModule,
    SettingsModule,
    PromoBannersModule,
    ContactSettingsModule,
    FaqsModule,
    ContactEnquiriesModule,
    FeedbackModule,
    TrendingRentalsModule,
  ],
})
export class AppModule {}