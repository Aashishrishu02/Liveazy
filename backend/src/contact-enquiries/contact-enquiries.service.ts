import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import { globalEtagCache } from '../common/services/etag-cache.service';

const VALID_STATUSES = [
  'PENDING',
  'CONTACTED',
  'RESOLVED',
] as const;

type EnquiryStatus = (typeof VALID_STATUSES)[number];
type EnquiryInput = Record<string, unknown>;

@Injectable()
export class ContactEnquiriesService {
  private cache = new Map<string, { data: unknown; expiresAt: number }>();

  constructor(private readonly prisma: PrismaService) {}

  private invalidateCache() {
    this.cache.clear();
    globalEtagCache.invalidate('contact-enquiries');
  }

  private validateBody(input: unknown): EnquiryInput {
    if (
      typeof input !== 'object' ||
      input === null ||
      Array.isArray(input)
    ) {
      throw new BadRequestException(
        'A valid JSON object is required.',
      );
    }

    return input as EnquiryInput;
  }

  private readString(
    body: EnquiryInput,
    field: string,
    required = false,
    maxLength = 2000,
  ): string | undefined {
    const value = body[field];

    if (value === undefined) {
      if (required) {
        throw new BadRequestException(
          `${field} is required.`,
        );
      }

      return undefined;
    }

    if (typeof value !== 'string') {
      throw new BadRequestException(
        `${field} must be a string.`,
      );
    }

    const trimmed = value.trim();

    if (required && !trimmed) {
      throw new BadRequestException(
        `${field} cannot be empty.`,
      );
    }

    if (trimmed.length > maxLength) {
      throw new BadRequestException(
        `${field} must not exceed ${maxLength} characters.`,
      );
    }

    return trimmed;
  }

  // PUBLIC: Customers can submit enquiries without an account.
  async create(input: unknown) {
    const body = this.validateBody(input);

    const fullName = this.readString(
      body,
      'fullName',
      true,
      100,
    )!;

    const email = this.readString(
      body,
      'email',
      true,
      160,
    )!;

    const phone = this.readString(
      body,
      'phone',
      true,
      30,
    )!;

    const category = this.readString(
      body,
      'category',
      true,
      100,
    )!;

    const message = this.readString(
      body,
      'message',
      true,
      3000,
    )!;

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
      throw new BadRequestException(
        'Enter a valid email address.',
      );
    }

    const phoneDigits = phone.replace(/\D/g, '');

    if (
      phoneDigits.length < 10 ||
      phoneDigits.length > 15
    ) {
      throw new BadRequestException(
        'Enter a valid phone number.',
      );
    }

    if (message.length < 5) {
      throw new BadRequestException(
        'Message must contain at least 5 characters.',
      );
    }

    const enquiry = await this.prisma.contactEnquiry.create({
      data: {
        fullName,
        email,
        phone,
        category,
        message,
      },
      select: {
        id: true,
        status: true,
        createdAt: true,
      },
    });

    this.invalidateCache();

    return {
      message: 'Your enquiry has been submitted successfully.',
      enquiry,
    };
  }

  // ADMIN ONLY: List enquiries, newest first.
  async findAll(status?: string) {
    let statusFilter: EnquiryStatus | undefined;

    if (status !== undefined) {
      if (
        !VALID_STATUSES.includes(
          status as EnquiryStatus,
        )
      ) {
        throw new BadRequestException(
          'Status must be PENDING, CONTACTED, or RESOLVED.',
        );
      }

      statusFilter = status as EnquiryStatus;
    }

    const key = statusFilter || '__ALL__';
    const now = Date.now();
    const cached = this.cache.get(key);
    if (cached && now < cached.expiresAt) {
      return cached.data;
    }

    const result = await this.prisma.contactEnquiry.findMany({
      where: statusFilter
        ? { status: statusFilter }
        : undefined,
      orderBy: {
        createdAt: 'desc',
      },
      take: 200,
    });

    this.cache.set(key, { data: result, expiresAt: now + 60000 });
    return result;
  }

  // ADMIN ONLY: Change status and/or add internal notes.
  async update(
    id: string,
    input: unknown,
  ) {
    if (!id?.trim()) {
      throw new BadRequestException(
        'Enquiry ID is required.',
      );
    }

    const body = this.validateBody(input);

    const updateData: {
      status?: EnquiryStatus;
      adminNotes?: string | null;
    } = {};

    if ('status' in body) {
      const status = body.status;

      if (
        typeof status !== 'string' ||
        !VALID_STATUSES.includes(
          status as EnquiryStatus,
        )
      ) {
        throw new BadRequestException(
          'Status must be PENDING, CONTACTED, or RESOLVED.',
        );
      }

      updateData.status = status as EnquiryStatus;
    }

    if ('adminNotes' in body) {
      const notes = body.adminNotes;

      if (notes === null) {
        updateData.adminNotes = null;
      } else if (typeof notes === 'string') {
        const trimmedNotes = notes.trim();

        if (trimmedNotes.length > 2000) {
          throw new BadRequestException(
            'Admin notes must not exceed 2000 characters.',
          );
        }

        updateData.adminNotes = trimmedNotes;
      } else {
        throw new BadRequestException(
          'Admin notes must be a string or null.',
        );
      }
    }

    if (Object.keys(updateData).length === 0) {
      throw new BadRequestException(
        'Provide a status or adminNotes value to update.',
      );
    }

    try {
      const updated = await this.prisma.contactEnquiry.update({
        where: { id },
        data: updateData,
      });
      this.invalidateCache();
      return updated;
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(
          'Contact enquiry not found.',
        );
      }

      throw error;
    }
  }
}