import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type FaqInput = Record<string, unknown>;

@Injectable()
export class FaqsService {
  constructor(private readonly prisma: PrismaService) {}

  private validateInput(input: unknown): FaqInput {
    if (
      typeof input !== 'object' ||
      input === null ||
      Array.isArray(input)
    ) {
      throw new BadRequestException(
        'A valid JSON object is required.',
      );
    }

    return input as FaqInput;
  }

  private readString(
    input: FaqInput,
    field: string,
    required = false,
    maxLength = 2000,
  ): string | undefined {
    const value = input[field];

    if (value === undefined) {
      if (required) {
        throw new BadRequestException(`${field} is required.`);
      }
      return undefined;
    }

    if (typeof value !== 'string') {
      throw new BadRequestException(`${field} must be a string.`);
    }

    const trimmed = value.trim();

    if (required && !trimmed) {
      throw new BadRequestException(`${field} cannot be empty.`);
    }

    if (trimmed.length > maxLength) {
      throw new BadRequestException(
        `${field} must not exceed ${maxLength} characters.`,
      );
    }

    return trimmed;
  }

  private readBoolean(
    input: FaqInput,
    field: string,
  ): boolean | undefined {
    const value = input[field];

    if (value === undefined) return undefined;

    if (typeof value !== 'boolean') {
      throw new BadRequestException(`${field} must be true or false.`);
    }

    return value;
  }

  private readSortOrder(input: FaqInput): number | undefined {
    const value = input.sortOrder;

    if (value === undefined) return undefined;

    if (
      typeof value !== 'number' ||
      !Number.isInteger(value) ||
      value < 0
    ) {
      throw new BadRequestException(
        'sortOrder must be a non-negative integer.',
      );
    }

    return value;
  }

  // Public: return active FAQs for the customer Contact page.
  async findPublic() {
    return this.prisma.faq.findMany({
      where: { isActive: true },
      orderBy: [
        { sortOrder: 'asc' },
        { createdAt: 'asc' },
      ],
    });
  }

  // Admin: return all FAQs, including inactive ones.
  async findAll() {
    return this.prisma.faq.findMany({
      orderBy: [
        { sortOrder: 'asc' },
        { createdAt: 'desc' },
      ],
    });
  }

  async create(input: unknown) {
    const body = this.validateInput(input);

    const question = this.readString(body, 'question', true, 300)!;
    const answer = this.readString(body, 'answer', true, 2000)!;

    const label =
      this.readString(body, 'label', false, 80) ?? 'GENERAL';

    const foot = this.readString(body, 'foot', false, 180);
    const iconName =
      this.readString(body, 'iconName', false, 60) ??
      'help-circle';

    const isActive =
      this.readBoolean(body, 'isActive') ?? true;

    const sortOrder = this.readSortOrder(body) ?? 0;

    return this.prisma.faq.create({
      data: {
        label,
        question,
        answer,
        iconName,
        isActive,
        sortOrder,
        ...(foot !== undefined ? { foot } : {}),
      },
    });
  }

  async update(id: string, input: unknown) {
    if (!id?.trim()) {
      throw new BadRequestException('FAQ ID is required.');
    }

    const body = this.validateInput(input);

    const data: {
      label?: string;
      question?: string;
      answer?: string;
      foot?: string | null;
      iconName?: string;
      isActive?: boolean;
      sortOrder?: number;
    } = {};

    if ('label' in body) {
      data.label = this.readString(body, 'label', true, 80)!;
    }

    if ('question' in body) {
      data.question = this.readString(
        body,
        'question',
        true,
        300,
      )!;
    }

    if ('answer' in body) {
      data.answer = this.readString(
        body,
        'answer',
        true,
        2000,
      )!;
    }

    if ('foot' in body) {
      if (body.foot === null) {
        data.foot = null;
      } else {
        data.foot = this.readString(
          body,
          'foot',
          true,
          180,
        )!;
      }
    }

    if ('iconName' in body) {
      data.iconName = this.readString(
        body,
        'iconName',
        true,
        60,
      )!;
    }

    if ('isActive' in body) {
      data.isActive = this.readBoolean(body, 'isActive')!;
    }

    if ('sortOrder' in body) {
      data.sortOrder = this.readSortOrder(body)!;
    }

    if (Object.keys(data).length === 0) {
      throw new BadRequestException(
        'Provide at least one FAQ field to update.',
      );
    }

    try {
      return await this.prisma.faq.update({
        where: { id },
        data,
      });
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('FAQ not found.');
      }

      throw error;
    }
  }

  async remove(id: string) {
    if (!id?.trim()) {
      throw new BadRequestException('FAQ ID is required.');
    }

    try {
      await this.prisma.faq.delete({
        where: { id },
      });

      return { message: 'FAQ deleted successfully.' };
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('FAQ not found.');
      }

      throw error;
    }
  }
}