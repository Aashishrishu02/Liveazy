
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import { globalEtagCache } from '../common/services/etag-cache.service';

@Injectable()
export class FeedbackService {
  private approvedCache: unknown = null;
  private approvedExpiresAt = 0;
  private adminCache: unknown = null;
  private adminExpiresAt = 0;

  constructor(
    private readonly prisma: PrismaService,
  ) {}

  private invalidateCache() {
    this.approvedCache = null;
    this.approvedExpiresAt = 0;
    this.adminCache = null;
    this.adminExpiresAt = 0;
    globalEtagCache.invalidate('feedback');
  }

  // Create feedback
  async create(data: {
    customerName: string;
    rating: number;
    message: string;
  }) {
    const customerName = data.customerName?.trim();
    const message = data.message?.trim();
    const rating = Number(data.rating);

    if (!customerName || !message) {
      throw new BadRequestException(
        'Customer name and feedback message are required',
      );
    }

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      throw new BadRequestException(
        'Rating must be an integer between 1 and 5',
      );
    }

    const created = await this.prisma.feedback.create({
      data: {
        customerName,
        rating,
        message,
      },
    });

    this.invalidateCache();
    return created;
  }

  // Get approved feedback for public website
  async findApproved() {
    const now = Date.now();
    if (this.approvedCache && now < this.approvedExpiresAt) {
      return this.approvedCache;
    }

    const result = await this.prisma.feedback.findMany({
      where: {
        status: 'APPROVED',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    this.approvedCache = result;
    this.approvedExpiresAt = now + 60000;
    return result;
  }

  // Get all feedback for admin
  async findAll() {
    const now = Date.now();
    if (this.adminCache && now < this.adminExpiresAt) {
      return this.adminCache;
    }

    const result = await this.prisma.feedback.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    this.adminCache = result;
    this.adminExpiresAt = now + 60000;
    return result;
  }

  // Approve or reject feedback
  async updateStatus(
    id: string,
    status: 'APPROVED' | 'REJECTED',
  ) {
    if (!['APPROVED', 'REJECTED'].includes(status)) {
      throw new BadRequestException(
        'Status must be APPROVED or REJECTED',
      );
    }

    const feedback = await this.prisma.feedback.findUnique({
      where: { id },
    });

    if (!feedback) {
      throw new NotFoundException('Feedback not found');
    }

    const updated = await this.prisma.feedback.update({
      where: { id },
      data: { status },
    });
    this.invalidateCache();
    return updated;
  }

  // Edit existing feedback
  async updateFeedback(
    id: string,
    data: {
      customerName: string;
      rating: number;
      message: string;
    },
  ) {
    const customerName = data.customerName?.trim();
    const message = data.message?.trim();
    const rating = Number(data.rating);

    if (!customerName || !message) {
      throw new BadRequestException(
        'Customer name and feedback message are required',
      );
    }

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      throw new BadRequestException(
        'Rating must be an integer between 1 and 5',
      );
    }

    const feedback = await this.prisma.feedback.findUnique({
      where: { id },
    });

    if (!feedback) {
      throw new NotFoundException('Feedback not found');
    }

    const updated = await this.prisma.feedback.update({
      where: { id },
      data: {
        customerName,
        rating,
        message,
      },
    });
    this.invalidateCache();
    return updated;
  }

  // Delete existing feedback
  async deleteFeedback(id: string) {
    const feedback = await this.prisma.feedback.findUnique({
      where: { id },
    });

    if (!feedback) {
      throw new NotFoundException('Feedback not found');
    }

    const deleted = await this.prisma.feedback.delete({
      where: { id },
    });
    this.invalidateCache();
    return deleted;
  }
}
