import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerStoryDto } from './dto/create-customer-story.dto';
import { UpdateCustomerStoryDto } from './dto/update-customer-story.dto';
import { globalEtagCache } from '../common/services/etag-cache.service';

@Injectable()
export class CustomerStoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async getPublicStories() {
    const stories = await this.prisma.customerStory.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });

    if (stories.length > 0) {
      return stories;
    }

    // Fallback: If no curated stories exist, load approved feedback
    const approved = await this.prisma.feedback.findMany({
      where: { status: 'APPROVED' },
      orderBy: { createdAt: 'desc' },
      take: 8,
    });

    return approved.map((f, idx) => ({
      id: f.id,
      customerName: f.customerName,
      photo: null,
      story: f.message,
      location: 'Pune',
      videoUrl: null,
      rating: f.rating,
      sortOrder: idx,
      isActive: true,
      createdAt: f.createdAt,
      updatedAt: f.updatedAt,
    }));
  }

  async findAll() {
    return this.prisma.customerStory.findMany({
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findOne(id: string) {
    const story = await this.prisma.customerStory.findUnique({
      where: { id },
    });

    if (!story) {
      throw new NotFoundException(`Customer story with ID ${id} not found`);
    }

    return story;
  }

  async create(dto: CreateCustomerStoryDto) {
    globalEtagCache.invalidate('customer-stories');
    return this.prisma.customerStory.create({
      data: {
        customerName: dto.customerName,
        photo: dto.photo,
        story: dto.story,
        location: dto.location || 'Pune',
        videoUrl: dto.videoUrl,
        rating: dto.rating ?? 5,
        sortOrder: dto.sortOrder ?? 0,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async update(id: string, dto: UpdateCustomerStoryDto) {
    await this.findOne(id);
    globalEtagCache.invalidate('customer-stories');
    return this.prisma.customerStory.update({
      where: { id },
      data: {
        customerName: dto.customerName,
        photo: dto.photo,
        story: dto.story,
        location: dto.location,
        videoUrl: dto.videoUrl,
        rating: dto.rating,
        sortOrder: dto.sortOrder,
        isActive: dto.isActive,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    globalEtagCache.invalidate('customer-stories');
    return this.prisma.customerStory.delete({
      where: { id },
    });
  }
}
