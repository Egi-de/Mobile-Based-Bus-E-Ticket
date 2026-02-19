import { Pass, PassStatus, PassTemplate } from '@prisma/client';
import prisma from '../utils/prisma';

export class PassService {
  /**
   * Get all pass templates
   */
  static async getTemplates(): Promise<PassTemplate[]> {
    return prisma.passTemplate.findMany({
      orderBy: { price: 'asc' },
    });
  }

  /**
   * Create a new pass for a user
   */
  static async createPass(data: {
    userId: string;
    templateId: string;
  }): Promise<Pass> {
    const template = await prisma.passTemplate.findUnique({
      where: { id: data.templateId },
    });

    if (!template) {
      throw new Error('Pass template not found');
    }

    const now = new Date();
    const expiryDate = new Date(now);
    expiryDate.setDate(expiryDate.getDate() + template.durationDays);

    const qrCode = `PASS-${Date.now()}`;

    return prisma.pass.create({
      data: {
        userId: data.userId,
        templateId: template.id,
        type: template.type,
        name: template.name,
        price: template.price,
        status: PassStatus.ACTIVE,
        qrCode,
        purchaseDate: now,
        expiryDate,
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
          }
        }
      }
    });
  }

  /**
   * Get user's passes
   */
  static async getUserPasses(userId: string, status?: PassStatus | 'HISTORY'): Promise<Pass[]> {
    const where: any = { userId };

    if (status === 'HISTORY') {
      where.status = { not: PassStatus.ACTIVE };
    } else if (status) {
      where.status = status;
    }

    return prisma.pass.findMany({
      where,
      orderBy: { purchaseDate: 'desc' },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
          }
        }
      }
    });
  }

  /**
   * Get all passes (Admin only)
   */
  static async getAllPasses(status?: PassStatus | 'HISTORY'): Promise<Pass[]> {
    const where: any = {};

    if (status === 'HISTORY') {
      where.status = { not: PassStatus.ACTIVE };
    } else if (status) {
      where.status = status;
    }

    return prisma.pass.findMany({
      where,
      orderBy: { purchaseDate: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          }
        }
      }
    });
  }

  /**
   * Delete a pass (Admin only)
   */
  static async deletePass(id: string): Promise<void> {
    await prisma.pass.delete({ where: { id } });
  }

  /**
   * Update pass status (Admin only)
   */
  static async updatePassStatus(id: string, status: PassStatus): Promise<Pass> {
    return prisma.pass.update({
      where: { id },
      data: { status },
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true }
        }
      }
    });
  }
}
