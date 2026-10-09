
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { PromoBannersService } from './promo-banners.service';

@Controller('promo-banners')
export class PromoBannersController {
  constructor(
    private readonly promoBannersService: PromoBannersService,
  ) {}

  @Get()
  findActive() {
    return this.promoBannersService.findActive();
  }

  @Get('admin')
  findAll() {
    return this.promoBannersService.findAll();
  }

  @Post()
  create(@Body() body: {
    image?: string;
    label?: string;
    heading?: string;
    subtitle?: string;
    buttonText?: string;
    buttonLink?: string;
    isActive?: boolean;
    sortOrder?: number;
  }) {
    return this.promoBannersService.create(body);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() body: {
      image?: string;
      label?: string;
      heading?: string;
      subtitle?: string;
      buttonText?: string;
      buttonLink?: string;
      isActive?: boolean;
      sortOrder?: number;
    },
  ) {
    return this.promoBannersService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.promoBannersService.remove(id);
  }
}
