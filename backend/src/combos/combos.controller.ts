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
import { CombosService } from './combos.service';
import { CreateComboDto } from './dto/create-combo.dto';
import { UpdateComboDto } from './dto/update-combo.dto';
import { CategorySettingsDto } from './dto/category-settings.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminEmailGuard } from '../auth/guards/admin-email.guard';

@Controller('combos')
export class CombosController {
  constructor(private readonly combosService: CombosService) {}

  // Public customer endpoint
  @Get('public')
  getPublic() {
    return this.combosService.getPublicCombos();
  }

  // Category Icon & Image Settings endpoints
  @Get('category-settings')
  getCategorySettings() {
    return this.combosService.getCategorySettings();
  }

  @Put('category-settings')
  @UseGuards(JwtAuthGuard, AdminEmailGuard)
  updateCategorySettings(@Body() dto: CategorySettingsDto) {
    return this.combosService.updateCategorySettings(dto);
  }

  // Admin endpoints
  @Get()
  @UseGuards(JwtAuthGuard, AdminEmailGuard)
  findAll() {
    return this.combosService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, AdminEmailGuard)
  findOne(@Param('id') id: string) {
    return this.combosService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, AdminEmailGuard)
  create(@Body() createComboDto: CreateComboDto) {
    return this.combosService.create(createComboDto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, AdminEmailGuard)
  update(
    @Param('id') id: string,
    @Body() updateComboDto: UpdateComboDto,
  ) {
    return this.combosService.update(id, updateComboDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, AdminEmailGuard)
  remove(@Param('id') id: string) {
    return this.combosService.remove(id);
  }
}
