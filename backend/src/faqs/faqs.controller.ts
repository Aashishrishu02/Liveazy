import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
  Query,
} from '@nestjs/common';

import { FaqsService } from './faqs.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminEmailGuard } from '../auth/guards/admin-email.guard';

@Controller('faqs')
export class FaqsController {
  constructor(private readonly faqsService: FaqsService) {}

  // Public endpoint: only active FAQs.
  @Get()
findPublic(@Query('productId') productId?: string) {
  return this.faqsService.findPublic(productId);
}

  // Admin endpoint: all FAQs, including inactive ones.
  @Get('admin')
  @UseGuards(JwtAuthGuard, AdminEmailGuard)
  findAll() {
    return this.faqsService.findAll();
  }

  // Admin only.
  @Post()
  @UseGuards(JwtAuthGuard, AdminEmailGuard)
  create(@Body() body: unknown) {
    return this.faqsService.create(body);
  }

  // Admin only.
  @Patch(':id')
  @UseGuards(JwtAuthGuard, AdminEmailGuard)
  update(
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    return this.faqsService.update(id, body);
  }

  // Admin only.
  @Delete(':id')
  @UseGuards(JwtAuthGuard, AdminEmailGuard)
  remove(@Param('id') id: string) {
    return this.faqsService.remove(id);
  }
}