
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
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';

import { FeedbackService } from './feedback.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminEmailGuard } from '../auth/guards/admin-email.guard';

@ApiTags('Feedback')
@Controller('feedback')
export class FeedbackController {
  constructor(
    private readonly feedbackService: FeedbackService,
  ) {}

  // Public: Customer submits feedback
  @Post()
  @ApiBody({
    schema: {
      type: 'object',
      required: ['customerName', 'rating', 'message'],
      properties: {
        customerName: {
          type: 'string',
          example: 'Ashish',
        },
        rating: {
          type: 'integer',
          minimum: 1,
          maximum: 5,
          example: 5,
        },
        message: {
          type: 'string',
          example: 'Great rental service!',
        },
      },
    },
  })
  create(
    @Body()
    body: {
      customerName: string;
      rating: number;
      message: string;
    },
  ) {
    return this.feedbackService.create(body);
  }

  // Public: Get approved feedback
  @Get('approved')
  findApproved() {
    return this.feedbackService.findApproved();
  }

  // Admin only: Get all feedback
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, AdminEmailGuard)
  @Get('admin')
  findAll() {
    return this.feedbackService.findAll();
  }

  // Admin only: Approve or reject feedback
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, AdminEmailGuard)
  @Patch('admin/:id/status')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['status'],
      properties: {
        status: {
          type: 'string',
          enum: ['APPROVED', 'REJECTED'],
          example: 'APPROVED',
        },
      },
    },
  })
  updateStatus(
    @Param('id') id: string,
    @Body()
    body: {
      status: 'APPROVED' | 'REJECTED';
    },
  ) {
    return this.feedbackService.updateStatus(id, body.status);
  }

  // Admin only: Edit feedback
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, AdminEmailGuard)
  @Patch('admin/:id')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['customerName', 'rating', 'message'],
      properties: {
        customerName: {
          type: 'string',
          example: 'Ashish',
        },
        rating: {
          type: 'integer',
          minimum: 1,
          maximum: 5,
          example: 5,
        },
        message: {
          type: 'string',
          example: 'Updated feedback message',
        },
      },
    },
  })
  updateFeedback(
    @Param('id') id: string,
    @Body()
    body: {
      customerName: string;
      rating: number;
      message: string;
    },
  ) {
    return this.feedbackService.updateFeedback(id, body);
  }

  // Admin only: Delete feedback
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, AdminEmailGuard)
  @Delete('admin/:id')
  deleteFeedback(
    @Param('id') id: string,
  ) {
    return this.feedbackService.deleteFeedback(id);
  }
}
