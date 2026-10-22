
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FeedbackService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

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

    return this.prisma.feedback.create({
      data: {
        customerName,
        rating,
        message,
      },
    });
  }

  // Get approved feedback for public website
  async findApproved() {
    return this.prisma.feedback.findMany({
      where: {
        status: 'APPROVED',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // Get all feedback for admin
  async findAll() {
    return this.prisma.feedback.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
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

    return this.prisma.feedback.update({
      where: { id },
      data: { status },
    });
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

    return this.prisma.feedback.update({
      where: { id },
      data: {
        customerName,
        rating,
        message,
      },
    });
  }

  // Delete existing feedback
  async deleteFeedback(id: string) {
    const feedback = await this.prisma.feedback.findUnique({
      where: { id },
    });

    if (!feedback) {
      throw new NotFoundException('Feedback not found');
    }

    return this.prisma.feedback.delete({
      where: { id },
    });
  }
}
