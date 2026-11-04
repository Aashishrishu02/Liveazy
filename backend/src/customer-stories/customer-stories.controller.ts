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
import { CustomerStoriesService } from './customer-stories.service';
import { CreateCustomerStoryDto } from './dto/create-customer-story.dto';
import { UpdateCustomerStoryDto } from './dto/update-customer-story.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminEmailGuard } from '../auth/guards/admin-email.guard';

@Controller('customer-stories')
export class CustomerStoriesController {
  constructor(private readonly customerStoriesService: CustomerStoriesService) {}

  // Public customer endpoint
  @Get('public')
  getPublic() {
    return this.customerStoriesService.getPublicStories();
  }

  // Admin endpoints
  @Get()
  @UseGuards(JwtAuthGuard, AdminEmailGuard)
  findAll() {
    return this.customerStoriesService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, AdminEmailGuard)
  findOne(@Param('id') id: string) {
    return this.customerStoriesService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, AdminEmailGuard)
  create(@Body() createCustomerStoryDto: CreateCustomerStoryDto) {
    return this.customerStoriesService.create(createCustomerStoryDto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, AdminEmailGuard)
  update(
    @Param('id') id: string,
    @Body() updateCustomerStoryDto: UpdateCustomerStoryDto,
  ) {
    return this.customerStoriesService.update(id, updateCustomerStoryDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, AdminEmailGuard)
  remove(@Param('id') id: string) {
    return this.customerStoriesService.remove(id);
  }
}
