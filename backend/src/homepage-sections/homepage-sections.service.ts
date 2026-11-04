import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { globalEtagCache } from '../common/services/etag-cache.service';
import {
  CreateSectionItemDto,
  ReorderSectionsDto,
  UpdateSectionDto,
  UpdateSectionItemDto,
} from './dto/sections.dto';

const DEFAULT_SECTIONS = [
  {
    sectionKey: 'CATEGORIES',
    title: 'Explore by Category',
    subtitle: 'Browse through our premium furniture and appliance categories',
    badge: 'Categories',
    sortOrder: 0,
    isVisible: true,
    items: [],
  },
  {
    sectionKey: 'VALUE_PROP',
    title: 'Why Rent with LIVEAZY',
    subtitle: 'Everything included for a smooth rental experience',
    badge: 'Features',
    sortOrder: 1,
    isVisible: true,
    items: [
      {
        title: 'Free Delivery & Assembly',
        description: 'Within 72 hrs at your convenience',
        icon: 'Truck',
        sortOrder: 0,
        isActive: true,
      },
      {
        title: '50+ Point Quality Check',
        description: 'Deep sanitized & like-new mint condition',
        icon: 'ShieldCheck',
        sortOrder: 1,
        isActive: true,
      },
      {
        title: 'Free Relocation',
        description: 'Moving city or apartment? We move it free',
        icon: 'RefreshCw',
        sortOrder: 2,
        isActive: true,
      },
      {
        title: 'Hassle-Free Maintenance',
        description: 'Free annual cleaning & wear-tear cover',
        icon: 'Sparkles',
        sortOrder: 3,
        isActive: true,
      },
    ],
  },
  {
    sectionKey: 'HERO',
    title: 'Homepage Hero Banner Carousel',
    subtitle: 'Main promotional slider at the top',
    badge: 'Hero',
    sortOrder: 2,
    isVisible: true,
    items: [],
  },
  {
    sectionKey: 'TRENDING',
    title: 'Trending Rentals in Your City',
    subtitle: 'Handpicked rentals for your home.',
    badge: 'Trending',
    sortOrder: 3,
    isVisible: true,
    items: [],
  },
  {
    sectionKey: 'CATALOG',
    title: 'Trending Products & Category Catalog',
    subtitle: 'Explore full catalog with flexible tenures',
    badge: 'Catalog',
    sortOrder: 4,
    isVisible: true,
    items: [],
  },
  {
    sectionKey: 'PREMIUM_PILLARS',
    title: 'Looks premium. Feels premium.',
    subtitle:
      'We build, restore, and maintain our own furniture and appliances to guarantee unmatched craftsmanship, hygiene, and durability for your dream home.',
    badge: 'Quality Standards',
    sortOrder: 5,
    isVisible: true,
    items: [
      {
        title: 'Crafted from quality materials',
        description:
          'Solid Sheesham wood frames, high-density resilient foam, and breathable luxury fabrics engineered for supreme daily comfort.',
        icon: 'Layers',
        sortOrder: 0,
        isActive: true,
      },
      {
        title: 'Inspected & restored to like-new',
        description:
          'Every piece undergoes a stringent 50+ point quality inspection and clinical deep steam sanitisation before reaching your doorstep.',
        icon: 'ShieldCheck',
        sortOrder: 1,
        isActive: true,
      },
      {
        title: 'Built to live with',
        description:
          'Hassle-free complimentary annual maintenance, zero-cost relocation, and damage waiver protection let you live freely.',
        icon: 'Home',
        sortOrder: 2,
        isActive: true,
      },
    ],
  },
  {
    sectionKey: 'COMBOS',
    title: 'Value Combo Packages',
    subtitle: 'Carefully curated furniture & appliance packages for every room.',
    badge: 'Room Combos',
    sortOrder: 6,
    isVisible: true,
    items: [],
  },
  {
    sectionKey: 'DEALS',
    title: "This Week's Deals",
    subtitle: 'Limited-time deals with live countdown timers and unbeatable prices.',
    badge: 'Limited Offers',
    sortOrder: 7,
    isVisible: true,
    items: [],
  },
  {
    sectionKey: 'PROMO_BANNER',
    title: 'Promo Banners & Deals',
    subtitle: 'High-impact promotional cards',
    badge: 'Promotions',
    sortOrder: 8,
    isVisible: true,
    items: [],
  },
  {
    sectionKey: 'HOW_IT_WORKS',
    title: 'How it works',
    subtitle: 'Renting furniture and appliances is smooth, paperless, and straightforward',
    badge: 'Simple Process',
    sortOrder: 9,
    isVisible: true,
    items: [
      {
        title: 'Browse & order',
        badge: '01',
        description:
          'Explore 500+ premium furniture and appliance picks. Select your preferred tenure (3, 6, 9, or 12+ months) and add items to your cart or WhatsApp.',
        icon: 'ShoppingBag',
        sortOrder: 0,
        isActive: true,
      },
      {
        title: 'Verify & book',
        badge: '02',
        description:
          'Complete a rapid, 100% secure paperless KYC online and pick a delivery time slot that fits comfortably into your moving schedule.',
        icon: 'FileCheck2',
        sortOrder: 1,
        isActive: true,
      },
      {
        title: 'Delivery & move in',
        badge: '03',
        description:
          'Our professional crew delivers, carries, assembles, and installs everything within 72 hours so you can instantly settle in and relax.',
        icon: 'Truck',
        sortOrder: 2,
        isActive: true,
      },
    ],
  },
  {
    sectionKey: 'CUSTOMER_STORIES',
    title: 'Customer stories',
    subtitle: 'Real experiences from customers who furnished their spaces with LIVEAZY',
    badge: 'Verified Reviews',
    sortOrder: 10,
    isVisible: true,
    items: [
      {
        title: '2,50,000+',
        subtitle: 'Homes Furnished',
        icon: 'Home',
        sortOrder: 0,
        isActive: true,
      },
      {
        title: '4.8 Rating',
        subtitle: 'Google & Customer Reviews',
        icon: 'Star',
        sortOrder: 1,
        isActive: true,
      },
      {
        title: '12+ Cities',
        subtitle: 'Across India',
        icon: 'MapPin',
        sortOrder: 2,
        isActive: true,
      },
      {
        title: '8,00,000+',
        subtitle: 'Products Delivered',
        icon: 'Truck',
        sortOrder: 3,
        isActive: true,
      },
    ],
  },
  {
    sectionKey: 'WHY_RENT',
    title: 'Why rent with LIVEAZY?',
    subtitle: 'Designed for flexibility, convenience, and financial freedom',
    badge: 'Smart Living',
    sortOrder: 11,
    isVisible: true,
    items: [
      {
        title: 'Free Delivery',
        description: 'Doorstep delivery and assembly at zero extra charge across all cities.',
        icon: 'Truck',
        sortOrder: 0,
        isActive: true,
      },
      {
        title: 'Free Relocation',
        description: 'Moving home or city? We move your rented furniture 100% free.',
        icon: 'RefreshCw',
        sortOrder: 1,
        isActive: true,
      },
      {
        title: 'Damage Waiver',
        description: 'Protection against routine wear & minor accidental tear.',
        icon: 'ShieldCheck',
        sortOrder: 2,
        isActive: true,
      },
      {
        title: 'Annual Upgrades',
        description: 'Upgrade to fresh, new models and styles every year effortlessly.',
        icon: 'ArrowUpCircle',
        sortOrder: 3,
        isActive: true,
      },
      {
        title: 'Save Capital',
        description: 'No bulky upfront investment or EMIs locking your hard-earned savings.',
        icon: 'IndianRupee',
        sortOrder: 4,
        isActive: true,
      },
    ],
  },
  {
    sectionKey: 'FAQS',
    title: 'Frequently Asked Questions',
    subtitle: 'Got questions? We have got answers.',
    badge: 'Support',
    sortOrder: 12,
    isVisible: true,
    items: [],
  },
  {
    sectionKey: 'RENTAL_GUIDE',
    title: 'Rent Furniture & Appliances Online with LIVEAZY',
    subtitle: 'SEO & Rental Guide',
    badge: 'Rental Guide',
    description: `We all want to furnish our homes to the best we can afford. What if affordability doesn't remain an issue anymore? Acquiring good quality furniture digs so deep into our pockets that we hardly dare to buy premium furniture more than once or twice in our lifetime. LIVEAZY offers the freedom to live in supreme style without locking away capital.`,
    sortOrder: 13,
    isVisible: true,
    items: [
      { title: 'Economic Times', subtitle: 'Times', sortOrder: 0, isActive: true },
      { title: 'YourStory', subtitle: 'Story', sortOrder: 1, isActive: true },
      { title: 'Inc42', subtitle: '42', sortOrder: 2, isActive: true },
      { title: 'Business Standard', subtitle: 'Standard', sortOrder: 3, isActive: true },
      { title: 'Hindustan Times', subtitle: 'Times', sortOrder: 4, isActive: true },
      { title: 'LiveMint', subtitle: 'Mint', sortOrder: 5, isActive: true },
      { title: 'Entrepreneur', subtitle: 'Entrepreneur', sortOrder: 6, isActive: true },
    ],
  },
];

@Injectable()
export class HomepageSectionsService {
  constructor(private readonly prisma: PrismaService) {}

  async seedIfEmpty() {
    const count = await this.prisma.homepageSection.count();
    if (count > 0) return;

    for (const sec of DEFAULT_SECTIONS) {
      await this.prisma.homepageSection.create({
        data: {
          sectionKey: sec.sectionKey,
          title: sec.title,
          subtitle: sec.subtitle,
          badge: sec.badge,
          description: sec.description,
          sortOrder: sec.sortOrder,
          isVisible: sec.isVisible,
          items: {
            create: sec.items.map((item) => ({
              title: item.title,
              subtitle: (item as { subtitle?: string }).subtitle,
              description: (item as { description?: string }).description,
              icon: (item as { icon?: string }).icon,
              badge: (item as { badge?: string }).badge,
              sortOrder: item.sortOrder,
              isActive: item.isActive,
            })),
          },
        },
      });
    }
  }

  async getPublicSections() {
    await this.seedIfEmpty();

    return this.prisma.homepageSection.findMany({
      where: { isVisible: true },
      include: {
        items: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findAll() {
    await this.seedIfEmpty();

    return this.prisma.homepageSection.findMany({
      include: {
        items: {
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findByKey(sectionKey: string) {
    await this.seedIfEmpty();

    const sec = await this.prisma.homepageSection.findUnique({
      where: { sectionKey },
      include: {
        items: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!sec) {
      throw new NotFoundException(`Section ${sectionKey} not found`);
    }

    return sec;
  }

  async updateSection(id: string, dto: UpdateSectionDto) {
    globalEtagCache.invalidate('homepage-sections');
    return this.prisma.homepageSection.update({
      where: { id },
      data: {
        title: dto.title,
        subtitle: dto.subtitle,
        badge: dto.badge,
        description: dto.description,
        sortOrder: dto.sortOrder,
        isVisible: dto.isVisible,
      },
      include: {
        items: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
  }

  async reorderSections(dto: ReorderSectionsDto) {
    globalEtagCache.invalidate('homepage-sections');
    return this.prisma.$transaction(
      dto.sections.map((s) =>
        this.prisma.homepageSection.update({
          where: { id: s.id },
          data: {
            sortOrder: s.sortOrder,
            isVisible: s.isVisible !== undefined ? s.isVisible : undefined,
          },
        })
      )
    );
  }

  async addItem(sectionId: string, dto: CreateSectionItemDto) {
    globalEtagCache.invalidate('homepage-sections');
    return this.prisma.homepageSectionItem.create({
      data: {
        sectionId,
        title: dto.title,
        subtitle: dto.subtitle,
        description: dto.description,
        icon: dto.icon,
        image: dto.image,
        badge: dto.badge,
        linkUrl: dto.linkUrl,
        sortOrder: dto.sortOrder ?? 0,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async updateItem(sectionId: string, itemId: string, dto: UpdateSectionItemDto) {
    globalEtagCache.invalidate('homepage-sections');
    const item = await this.prisma.homepageSectionItem.findFirst({
      where: { id: itemId, sectionId },
    });

    if (!item) {
      throw new NotFoundException(`Item with ID ${itemId} in section ${sectionId} not found`);
    }

    return this.prisma.homepageSectionItem.update({
      where: { id: itemId },
      data: {
        title: dto.title,
        subtitle: dto.subtitle,
        description: dto.description,
        icon: dto.icon,
        image: dto.image,
        badge: dto.badge,
        linkUrl: dto.linkUrl,
        sortOrder: dto.sortOrder,
        isActive: dto.isActive,
      },
    });
  }

  async deleteItem(sectionId: string, itemId: string) {
    globalEtagCache.invalidate('homepage-sections');
    const item = await this.prisma.homepageSectionItem.findFirst({
      where: { id: itemId, sectionId },
    });

    if (!item) {
      throw new NotFoundException(`Item with ID ${itemId} in section ${sectionId} not found`);
    }

    return this.prisma.homepageSectionItem.delete({
      where: { id: itemId },
    });
  }
}
