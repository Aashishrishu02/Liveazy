
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { BlogsService } from './blogs.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminEmailGuard } from '../auth/guards/admin-email.guard';

@Controller('blogs')
export class BlogsController {
  constructor(private readonly blogsService: BlogsService) {}

  @Get()
  findPublic(
    @Query('q') query?: string,
    @Query('category') category?: string,
  ) {
    return this.blogsService.findPublic(query, category);
  }

  @Get('slug/:slug')
  findPublicBySlug(@Param('slug') slug: string) {
    return this.blogsService.findPublicBySlug(slug);
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard, AdminEmailGuard)
  findAllAdmin(@Query('status') status?: string) {
    return this.blogsService.findAllAdmin(
      status as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | undefined,
    );
  }

  @Post()
  @UseGuards(JwtAuthGuard, AdminEmailGuard)
  create(@Body() body: unknown) {
    return this.blogsService.create(body);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, AdminEmailGuard)
  update(@Param('id') id: string, @Body() body: unknown) {
    return this.blogsService.update(id, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, AdminEmailGuard)
  remove(@Param('id') id: string) {
    return this.blogsService.remove(id);
  }
}
