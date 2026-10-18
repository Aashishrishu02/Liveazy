import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { ApiBody, ApiTags } from '@nestjs/swagger';

import { ContactEnquiriesService } from './contact-enquiries.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminEmailGuard } from '../auth/guards/admin-email.guard';

@ApiTags('Contact Enquiries')
@Controller('contact-enquiries')
export class ContactEnquiriesController {
  constructor(
    private readonly contactEnquiriesService: ContactEnquiriesService,
  ) {}

  // Public API: customer login is not required.
  @Post()
  @ApiBody({
    schema: {
      type: 'object',
      required: [
        'fullName',
        'email',
        'phone',
        'category',
        'message',
      ],
      properties: {
        fullName: {
          type: 'string',
          example: 'Test Customer',
        },
        email: {
          type: 'string',
          example: 'customer@example.com',
        },
        phone: {
          type: 'string',
          example: '+91 9876543210',
        },
        category: {
          type: 'string',
          example: 'Product availability',
        },
        message: {
          type: 'string',
          example:
            'I want to enquire about renting a fridge for 12 months.',
        },
      },
    },
  })
  create(@Body() body: Record<string, unknown>) {
    return this.contactEnquiriesService.create(body);
  }

  // Admin only: get all enquiries.
  @Get()
  @UseGuards(JwtAuthGuard, AdminEmailGuard)
  findAll(@Query('status') status?: string) {
    return this.contactEnquiriesService.findAll(status);
  }

  // Admin only: update enquiry status or notes.
  @Patch(':id')
  @UseGuards(JwtAuthGuard, AdminEmailGuard)
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['PENDING', 'CONTACTED', 'RESOLVED'],
          example: 'CONTACTED',
        },
        adminNotes: {
          type: 'string',
          example: 'Customer contacted regarding availability.',
        },
      },
    },
  })
  update(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.contactEnquiriesService.update(id, body);
  }
}