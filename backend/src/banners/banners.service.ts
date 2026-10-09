import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BannersService {
    constructor(private prisma: PrismaService){}

    async getActiveBanner() { //user ko current active banner dega
        return this.prisma.banner.findFirst({
            where:{
                isActive: true,

            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    }

    async createBanner(image: string) { //purana banner ko inactive karega aur nya uploaded banner ko active krega
        await this.prisma.banner.updateMany({
            where:{
                isActive: true,
            },
            data:{
                isActive: false,
            },
        });

        //create new active banner ok

        return this.prisma.banner.create({
            data:{
                image,
                isActive: true,
            },
        });
    }

    async updateActiveBanner(data: {
        topLabeel?: string;
        heading?: string;
        subtitle?: string;
        button1Text?: string;
        button1Linc?: string;
        button2Text?: string;
        button2Link?: string;
    }) {
        const activeBanner = await this.prisma.banner.findFirst({
            where: { isActive: true },
            orderBy: { createdAt: 'desc'},
        });

        if(!activeBanner) {
            throw new Error('Please upload a banner image first');

        }
        return this.prisma.banner.update({
            where: {id: activeBanner.id},
            data,
        })
    }
}
