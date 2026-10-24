
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

  private readBoolean(
    input: FaqInput,
    field: string,
  ): boolean | undefined {
    const value = input[field];

    if (value === undefined) {
      return undefined;
    }

    if (typeof value !== 'boolean') {
      throw new BadRequestException(
        `${field} must be true or false.`,
      );
    }

    return value;
  }

  private readSortOrder(
    input: FaqInput,
  ): number | undefined {
    const value = input.sortOrder;

    if (value === undefined) {
      return undefined;
    }

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

  /**
   * Validate that the product exists.
   * Returns null for general FAQs.
   */
  private async validateProductId(
    productId: string | null | undefined,
  ): Promise<string | null> {
    if (!productId) {
      return null;
    }

    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { id: true },
    });

    if (!product) {
      throw new NotFoundException('Product not found.');
    }

    return product.id;
  }

  /**
   * Public:
   * - No productId: return active general FAQs.
   * - With productId: return active FAQs for that product.
   */
  async findPublic(productId?: string) {
    const normalizedProductId = productId?.trim() || null;

    if (normalizedProductId) {
      await this.validateProductId(normalizedProductId);
    }

    return this.prisma.faq.findMany({
      where: {
        isActive: true,
        productId: normalizedProductId,
      },
      orderBy: [
        { sortOrder: 'asc' },
        { createdAt: 'asc' },
      ],
    });
  }

  /**
   * Admin: return all FAQs, including inactive FAQs.
   */
  async findAll() {
    return this.prisma.faq.findMany({
      orderBy: [
        { sortOrder: 'asc' },
        { createdAt: 'desc' },
      ],
    });
  }

  /**
   * Create a general FAQ or a product-specific FAQ.
   *
   * Omit productId or send null/empty string for a general FAQ.
   */
  async create(input: unknown) {
    const body = this.validateInput(input);

    const question = this.readString(
      body,
      'question',
      true,
      300,
    )!;

    const answer = this.readString(
      body,
      'answer',
      true,
      2000,
    )!;

    const label =
      this.readString(body, 'label', false, 80) ??
      'GENERAL';

    const foot = this.readString(
      body,
      'foot',
      false,
      180,
    );

    const iconName =
      this.readString(body, 'iconName', false, 60) ??
      'help-circle';

    const isActive =
      this.readBoolean(body, 'isActive') ?? true;

    const sortOrder = this.readSortOrder(body) ?? 0;

    let productId: string | null = null;

    if ('productId' in body) {
      const rawProductId = body.productId;

      if (rawProductId === null || rawProductId === '') {
        productId = null;
      } else {
        productId =
          this.readString(
            body,
            'productId',
            true,
            100,
          ) ?? null;
      }
    }

    productId = await this.validateProductId(productId);

    return this.prisma.faq.create({
      data: {
        label,
        question,
        answer,
        iconName,
        isActive,
        sortOrder,
        productId,
        ...(foot !== undefined ? { foot } : {}),
      },
    });
  }

  /**
   * Update an existing FAQ.
   * productId can be changed or set to null to make it general.
   */
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
      productId?: string | null;
    } = {};

    if ('label' in body) {
      data.label = this.readString(
        body,
        'label',
        true,
        80,
      )!;
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
      data.isActive = this.readBoolean(
        body,
        'isActive',
      )!;
    }

    if ('sortOrder' in body) {
      data.sortOrder = this.readSortOrder(body)!;
    }

    if ('productId' in body) {
      const rawProductId = body.productId;

      if (
        rawProductId === null ||
        rawProductId === ''
      ) {
        data.productId = null;
      } else {
        const productId = this.readString(
          body,
          'productId',
          true,
          100,
        )!;

        data.productId =
          await this.validateProductId(productId);
      }
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

  /**
   * Delete an FAQ.
   */
  async remove(id: string) {
    if (!id?.trim()) {
      throw new BadRequestException('FAQ ID is required.');
    }

    try {
      await this.prisma.faq.delete({
        where: { id },
      });

      return {
        message: 'FAQ deleted successfully.',
      };
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
