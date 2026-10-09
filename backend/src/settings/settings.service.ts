import { Injectable, BadRequestException} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SettingsService {
    constructor(private readonly prisma: PrismaService) {}

    async getWhatsAppNumber() {
        const setting = await this.prisma.siteSetting.upsert({
            where: { id: 1},
            update: {},
            create: {
                id:1,
                whatsappNumber: '919423838109',
            },
        });

        return { whatsappNumber: setting.whatsappNumber };
    }

    async updateWhatsAppNumber(whatsappNumber: string) {
        if (typeof whatsappNumber!== 'string') {
            throw new BadRequestException('WhatsApp number is required');
        }

        const number = whatsappNumber.replace(/\D/g,'');

        if(number.length < 10 || number.length > 15){
            throw new BadRequestException(
                'Enter a valid WhatsApp number with country code',
            );
        }

        const setting = await this.prisma.siteSetting.upsert({
            where:{id: 1},
            update: { whatsappNumber: number},
            create: {
                id:1,
                whatsappNumber: number,
            }
        });
    
    return { whatsappNumber: setting.whatsappNumber };
}
}
