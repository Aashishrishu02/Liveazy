import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { DealsService } from './deals.service';
import { CreateDealDto } from './dto/create-deal.dto';
import { UpdateDealDto } from './dto/update-deal.dto';
import { CategorySettingsDto } from './dto/category-settings.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminEmailGuard } from '../auth/guards/admin-email.guard';

@Controller('deals')
export class DealsController {
  constructor(private readonly dealsService: DealsService) {}

  // Public customer endpoints
  @Get('current')
  getCurrentDeal() {
    return this.dealsService.getCurrentDeal();
  }

  @Get('public')
  getPublicDeals() {
    return this.dealsService.getPublicDeals();
  }

  // Category Icon & Image Settings endpoints
  @Get('category-settings')
  getCategorySettings() {
    return this.dealsService.getCategorySettings();
  }

  @Put('category-settings')
  @UseGuards(JwtAuthGuard, AdminEmailGuard)
  updateCategorySettings(@Body() dto: CategorySettingsDto) {
    return this.dealsService.updateCategorySettings(dto);
  }

  // Admin endpoints
  @Get()
  @UseGuards(JwtAuthGuard, AdminEmailGuard)
  findAll() {
    return this.dealsService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, AdminEmailGuard)
  findOne(@Param('id') id: string) {
    return this.dealsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, AdminEmailGuard)
  create(@Body() createDealDto: CreateDealDto) {
    return this.dealsService.create(createDealDto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, AdminEmailGuard)
  update(
    @Param('id') id: string,
    @Body() updateDealDto: UpdateDealDto,
  ) {
    return this.dealsService.update(id, updateDealDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, AdminEmailGuard)
  remove(@Param('id') id: string) {
    return this.dealsService.remove(id);
  }
}
