import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { HomepageSectionsService } from './homepage-sections.service';
import {
  CreateSectionItemDto,
  ReorderSectionsDto,
  UpdateSectionDto,
  UpdateSectionItemDto,
} from './dto/sections.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminEmailGuard } from '../auth/guards/admin-email.guard';

@Controller('homepage-sections')
export class HomepageSectionsController {
  constructor(
    private readonly sectionsService: HomepageSectionsService,
  ) {}

  // Public customer homepage endpoint
  @Get('public')
  getPublic() {
    return this.sectionsService.getPublicSections();
  }

  // Admin endpoints
  @Get()
  @UseGuards(JwtAuthGuard, AdminEmailGuard)
  findAll() {
    return this.sectionsService.findAll();
  }

  @Get(':key')
  @UseGuards(JwtAuthGuard, AdminEmailGuard)
  findByKey(@Param('key') key: string) {
    return this.sectionsService.findByKey(key);
  }

  @Patch('reorder')
  @UseGuards(JwtAuthGuard, AdminEmailGuard)
  reorder(@Body() dto: ReorderSectionsDto) {
    return this.sectionsService.reorderSections(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, AdminEmailGuard)
  updateSection(
    @Param('id') id: string,
    @Body() dto: UpdateSectionDto,
  ) {
    return this.sectionsService.updateSection(id, dto);
  }

  @Post(':id/items')
  @UseGuards(JwtAuthGuard, AdminEmailGuard)
  addItem(
    @Param('id') id: string,
    @Body() dto: CreateSectionItemDto,
  ) {
    return this.sectionsService.addItem(id, dto);
  }

  @Patch(':id/items/:itemId')
  @UseGuards(JwtAuthGuard, AdminEmailGuard)
  updateItem(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateSectionItemDto,
  ) {
    return this.sectionsService.updateItem(id, itemId, dto);
  }

  @Delete(':id/items/:itemId')
  @UseGuards(JwtAuthGuard, AdminEmailGuard)
  deleteItem(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
  ) {
    return this.sectionsService.deleteItem(id, itemId);
  }
}
