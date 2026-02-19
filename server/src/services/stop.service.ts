/**
 * Stop Service with Prisma Database Implementation
 * Handles business logic for stop management and GPS detection
 */

import { Stop } from '@prisma/client';
import prisma from '../utils/prisma';

export interface CreateStopData {
  routeId: string;
  stopName: string;
  latitude: number;
  longitude: number;
  orderNumber: number;
  detectionRadius?: number;
  estimatedArrivalMinutes?: number;
}

export interface StopWithDistance extends Stop {
  distanceMeters: number;
  isWithinRadius: boolean;
}

export class StopService {
  /**
   * Get stops by route, ordered by orderNumber
   */
  static async getStopsByRoute(routeId: string): Promise<Stop[]> {
    return prisma.stop.findMany({
      where: { routeId },
      orderBy: { orderNumber: 'asc' },
    });
  }

  /**
   * Get stop by ID
   */
  static async getStopById(id: string): Promise<Stop | null> {
    return prisma.stop.findUnique({
      where: { id },
      include: {
        route: {
          select: {
            id: true,
            origin: true,
            destination: true,
          },
        },
      },
    });
  }

  /**
   * Create new stop
   */
  static async createStop(data: CreateStopData): Promise<Stop> {
    // Validate that route exists
    const route = await prisma.route.findUnique({
      where: { id: data.routeId },
    });

    if (!route) {
      throw new Error('Route not found');
    }

    // Check if orderNumber is already used for this route
    const existingStop = await prisma.stop.findFirst({
      where: {
        routeId: data.routeId,
        orderNumber: data.orderNumber,
      },
    });

    if (existingStop) {
      throw new Error(`Order number ${data.orderNumber} is already used for this route`);
    }

    return prisma.stop.create({
      data: {
        routeId: data.routeId,
        stopName: data.stopName,
        latitude: data.latitude,
        longitude: data.longitude,
        orderNumber: data.orderNumber,
        detectionRadius: data.detectionRadius || 100,
        estimatedArrivalMinutes: data.estimatedArrivalMinutes,
      },
    });
  }

  /**
   * Update stop
   */
  static async updateStop(id: string, data: Partial<CreateStopData>): Promise<Stop | null> {
    const stop = await prisma.stop.findUnique({
      where: { id },
    });

    if (!stop) {
      return null;
    }

    // If updating orderNumber, check for conflicts
    if (data.orderNumber && data.orderNumber !== stop.orderNumber) {
      const existingStop = await prisma.stop.findFirst({
        where: {
          routeId: stop.routeId,
          orderNumber: data.orderNumber,
          id: { not: id },
        },
      });

      if (existingStop) {
        throw new Error(`Order number ${data.orderNumber} is already used for this route`);
      }
    }

    return prisma.stop.update({
      where: { id },
      data: {
        stopName: data.stopName,
        latitude: data.latitude,
        longitude: data.longitude,
        orderNumber: data.orderNumber,
        detectionRadius: data.detectionRadius,
        estimatedArrivalMinutes: data.estimatedArrivalMinutes,
      },
    });
  }

  /**
   * Delete stop
   */
  static async deleteStop(id: string): Promise<void> {
    // Check if stop is referenced by any active tickets
    const activeTickets = await prisma.ticket.count({
      where: {
        OR: [
          { boardingStopId: id },
          { dropStopId: id },
        ],
        status: 'ACTIVE',
      },
    });

    if (activeTickets > 0) {
      throw new Error('Cannot delete stop: it is referenced by active tickets');
    }

    await prisma.stop.delete({
      where: { id },
    });
  }

  /**
   * Check nearby stops using GPS coordinates
   * Used by driver app for automatic stop detection
   */
  static async checkNearbyStops(
    routeId: string,
    latitude: number,
    longitude: number
  ): Promise<StopWithDistance[]> {
    const stops = await this.getStopsByRoute(routeId);

    return stops.map(stop => {
      const distance = this.calculateDistance(
        latitude,
        longitude,
        stop.latitude,
        stop.longitude
      );

      return {
        ...stop,
        distanceMeters: distance,
        isWithinRadius: distance <= stop.detectionRadius,
      };
    });
  }

  /**
   * Calculate distance between two GPS coordinates (Haversine formula)
   * Returns distance in meters
   */
  private static calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }
}
