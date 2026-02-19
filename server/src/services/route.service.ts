import { Route } from '@prisma/client';
import prisma from '../utils/prisma';

export class RouteService {
  /**
   * Get all routes with optional filters
   */
  static async getAllRoutes(filters?: { origin?: string; destination?: string }): Promise<Route[]> {
    const where: any = {};
    
    if (filters?.origin) {
      where.origin = { contains: filters.origin, mode: 'insensitive' };
    }
    
    if (filters?.destination) {
      where.destination = { contains: filters.destination, mode: 'insensitive' };
    }

    return prisma.route.findMany({
      where,
      include: {
        buses: {
          select: {
            id: true,
            plateNumber: true,
            status: true,
          },
        },
      },
      orderBy: { departureTime: 'asc' },
    });
  }

  /**
   * Get route by ID
   */
  static async getRouteById(id: string): Promise<Route | null> {
    return prisma.route.findUnique({
      where: { id },
    });
  }

  /**
   * Create a new route (for admin/seeding)
   */
  static async createRoute(data: Omit<Route, 'id' | 'createdAt' | 'updatedAt'>): Promise<Route> {
    return prisma.route.create({
      data,
    });
  }

  /**
   * Update a route
   */
  static async updateRoute(id: string, data: Partial<Omit<Route, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Route> {
    return prisma.route.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete a route
   */
  static async deleteRoute(id: string): Promise<void> {
    await prisma.route.delete({ where: { id } });
  }
}
