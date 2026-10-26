
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type BlogStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

@Injectable()
export class BlogsService {
  constructor(private readonly prisma: PrismaService) {}

  private createSlug(value: string): string {
    return value
      .normalize('NFKD')
      .toLowerCase()
      .trim()
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private async uniqueSlug(title: string, currentId?: string) {
    const baseSlug = this.createSlug(title);

    if (!baseSlug) {
      throw new BadRequestException('A valid blog title is required');
    }

    let slug = baseSlug;
    let suffix = 2;

    while (true) {
      const existing = await this.prisma.blog.findUnique({
        where: { slug },
        select: { id: true },
      });

      if (!existing || existing.id === currentId) {
        return slug;
      }

      slug = `${baseSlug}-${suffix++}`;
    }
  }

  async findPublic(query?: string, category?: string) {
    return this.prisma.blog.findMany({
      where: {
        status: 'PUBLISHED',
        publishedAt: { lte: new Date() },
        ...(category ? { category } : {}),
        ...(query?.trim()
          ? {
              OR: [
                { title: { contains: query.trim(), mode: 'insensitive' } },
                { excerpt: { contains: query.trim(), mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: [{ featured: 'desc' }, { publishedAt: 'desc' }],
    });
  }

  async findPublicBySlug(slug: string) {
    const blog = await this.prisma.blog.findFirst({
      where: {
        slug,
        status: 'PUBLISHED',
        publishedAt: { lte: new Date() },
      },
    });

    if (!blog) {
      throw new NotFoundException('Blog not found');
    }

    return blog;
  }

  async findAllAdmin(status?: BlogStatus) {
    const allowed: BlogStatus[] = ['DRAFT', 'PUBLISHED', 'ARCHIVED'];

    if (status && !allowed.includes(status)) {
      throw new BadRequestException('Invalid blog status');
    }

    return this.prisma.blog.findMany({
      where: status ? { status } : {},
      orderBy: { updatedAt: 'desc' },
    });
  }

  async create(input: unknown) {
    const data = this.validateInput(input, true);
    const slug = await this.uniqueSlug(data.title);

    const status = data.status ?? 'DRAFT';
    const publishedAt =
      status === 'PUBLISHED' ? new Date() : null;

    return this.prisma.blog.create({
      data: {
        ...data,
        slug,
        status,
        publishedAt,
      },
    });
  }

  async update(id: string, input: unknown) {
    const existing = await this.prisma.blog.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Blog not found');
    }

    const data = this.validateInput(input, false);
    const slug = data.title
      ? await this.uniqueSlug(data.title, id)
      : existing.slug;

    const status = data.status ?? existing.status;
    let publishedAt = existing.publishedAt;

    if (status !== 'PUBLISHED') {
      publishedAt = null;
    } else if (existing.status !== 'PUBLISHED' || !publishedAt) {
      publishedAt = new Date();
    }

    return this.prisma.blog.update({
      where: { id },
      data: {
        ...data,
        slug,
        status,
        publishedAt,
      },
    });
  }

  async remove(id: string) {
    const existing = await this.prisma.blog.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('Blog not found');
    }

    await this.prisma.blog.delete({ where: { id } });

    return { message: 'Blog deleted successfully' };
  }

  private validateInput(input: unknown, creating: boolean) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
      throw new BadRequestException('Invalid blog data');
    }

    const body = input as Record<string, unknown>;

    const stringField = (
      key: string,
      required = false,
    ): string | undefined => {
      const value = body[key];

      if (value === undefined && !required) return undefined;

      if (typeof value !== 'string' || (required && !value.trim())) {
        throw new BadRequestException(`Invalid ${key}`);
      }

      return value.trim();
    };

    const booleanField = (key: string) => {
      const value = body[key];

      if (value === undefined) return undefined;

      if (typeof value !== 'boolean') {
        throw new BadRequestException(`Invalid ${key}`);
      }

      return value;
    };

    const data: Record<string, unknown> = {};

    const title = stringField('title', creating);
    const excerpt = stringField('excerpt', creating);
    const content = stringField('content', creating);
    const featuredImage = stringField('featuredImage', creating);
    const category = stringField('category', creating);

    if (title !== undefined) data.title = title;
    if (excerpt !== undefined) data.excerpt = excerpt;
    if (content !== undefined) data.content = content;
    if (featuredImage !== undefined) data.featuredImage = featuredImage;
    if (category !== undefined) data.category = category;

    for (const key of [
      'imageAlt',
      'authorName',
      'metaTitle',
      'metaDescription',
    ]) {
      const value = stringField(key);
      if (value !== undefined) data[key] = value;
    }

    for (const key of ['featured']) {
      const value = booleanField(key);
      if (value !== undefined) data[key] = value;
    }

    if (body.tags !== undefined) {
      if (
        !Array.isArray(body.tags) ||
        !body.tags.every((tag) => typeof tag === 'string')
      ) {
        throw new BadRequestException('Tags must be an array of strings');
      }

      data.tags = body.tags.map((tag) => tag.trim()).filter(Boolean);
    }

    if (body.status !== undefined) {
      if (
        body.status !== 'DRAFT' &&
        body.status !== 'PUBLISHED' &&
        body.status !== 'ARCHIVED'
      ) {
        throw new BadRequestException('Invalid blog status');
      }

      data.status = body.status;
    }

    if (creating && !data.title) {
      throw new BadRequestException('Title is required');
    }

    return data as Prisma.BlogUncheckedCreateInput & {
      status?: BlogStatus;
    };
  }
}
