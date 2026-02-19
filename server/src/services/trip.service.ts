/**
 * Trip Service with Prisma Database Implementation
 * Handles business logic for trip management
 */

import { Trip, TripStatus, Prisma } from '@prisma/client';
import prisma from '../utils/prisma';

export interface CreateTripData {
  busId: string;
  routeId: string;
  driverId?: string;
  departureTime: string | Date;
  arrivalTime: string | Date;
}

export interface UpdateTripStatusData {
  tripStatus: TripStatus;
  trackingEnabled?: boolean;
  currentStopId?: string;
}

export interface TripFilters {
  routeId?: string;
  date?: string;
  status?: TripStatus;
}

export class TripService {
  /**
   * Get all trips with optional filters
   */
  static async getAllTrips(filters: TripFilters): Promise<Trip[]> {
    const where: Prisma.TripWhereInput = {};

    if (filters.routeId) {
      where.routeId = filters.routeId;
    }

    if (filters.status) {
      where.tripStatus = filters.status;
    }

    if (filters.date) {
      // Filter by date (trips departing on this date)
      const startOfDay = new Date(filters.date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(filters.date);
      endOfDay.setHours(23, 59, 59, 999);

      where.departureTime = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    return prisma.trip.findMany({
      where,
      include: {
        bus: true,
        route: true,
        driver: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
      orderBy: { departureTime: 'asc' },
    });
  }

  /**
   * Get trips by route and date (primary booking flow method)
   */
  static async getTripsByRouteAndDate(routeId: string, date: string): Promise<Trip[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return prisma.trip.findMany({
      where: {
        routeId,
        departureTime: {
          gte: startOfDay,
          lte: endOfDay,
        },
        tripStatus: {
          not: 'CANCELLED',
        },
      },
      include: {
        bus: {
          select: {
            id: true,
            plateNumber: true,
            totalSeats: true,
          },
        },
        route: {
          select: {
            id: true,
            origin: true,
            destination: true,
            price: true,
            operator: true,
          },
        },
        driver: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
      orderBy: { departureTime: 'asc' },
    });
  }

  /**
   * Get trip by ID with populated relations
   */
  static async getTripById(id: string): Promise<Trip | null> {
    return prisma.trip.findUnique({
      where: { id },
      include: {
        bus: {
          select: {
            id: true,
            plateNumber: true,
            totalSeats: true,
          },
        },
        route: {
          select: {
            id: true,
            origin: true,
            destination: true,
            price: true,
            operator: true,
          },
        },
        driver: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        currentStop: true,
      },
    });
  }

  /**
   * Create new trip
   */
  static async createTrip(data: CreateTripData): Promise<Trip> {
    // Validate that bus exists
    const bus = await prisma.bus.findUnique({
      where: { id: data.busId },
    });

    if (!bus) {
      throw new Error('Bus not found');
    }

    // Validate that route exists
    const route = await prisma.route.findUnique({
      where: { id: data.routeId },
    });

    if (!route) {
      throw new Error('Route not found');
    }

    // Check if bus is already assigned to another active trip at the same time
    const conflictingTrip = await prisma.trip.findFirst({
      where: {
        busId: data.busId,
        tripStatus: {
          in: ['WAITING', 'BOARDING', 'ON_ROUTE'],
        },
        departureTime: {
          lte: new Date(data.arrivalTime),
        },
        arrivalTime: {
          gte: new Date(data.departureTime),
        },
      },
    });

    if (conflictingTrip) {
      throw new Error('Bus is already assigned to another trip during this time');
    }

    return prisma.trip.create({
      data: {
        busId: data.busId,
        routeId: data.routeId,
        driverId: data.driverId || null,
        departureTime: new Date(data.departureTime),
        arrivalTime: new Date(data.arrivalTime),
        tripStatus: 'WAITING',
        trackingEnabled: false,
      },
      include: {
        bus: true,
        route: true,
        driver: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
    });
  }

  /**
   * Update trip status (driver app)
   */
  static async updateTripStatus(id: string, data: UpdateTripStatusData): Promise<Trip | null> {
    const trip = await prisma.trip.findUnique({
      where: { id },
    });

    if (!trip) {
      return null;
    }

    // If status is COMPLETED, mark all ACTIVE tickets for this trip as COMPLETED
    if (data.tripStatus === 'COMPLETED') {
      await prisma.ticket.updateMany({
        where: {
          tripId: id,
          status: 'ACTIVE',
        },
        data: {
          status: 'COMPLETED',
        },
      });
    }

    // If currentStopId is provided, expire tickets for passengers dropping at this stop
    if (data.currentStopId) {
      await prisma.ticket.updateMany({
        where: {
          tripId: id,
          dropStopId: data.currentStopId,
          status: 'ACTIVE',
        },
        data: {
          status: 'COMPLETED',
        },
      });
    }

    return prisma.trip.update({
      where: { id },
      data: {
        tripStatus: data.tripStatus,
        trackingEnabled: data.trackingEnabled ?? trip.trackingEnabled,
        currentStopId: data.currentStopId ?? trip.currentStopId,
      },
      include: {
        bus: true,
        route: true,
        driver: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        currentStop: true,
      },
    });
  }

  /**
   * Cancel trip
   */
  static async cancelTrip(id: string): Promise<void> {
    await prisma.trip.update({
      where: { id },
      data: {
        tripStatus: 'CANCELLED',
      },
    });

    await prisma.ticket.updateMany({
      where: {
        tripId: id,
        status: 'ACTIVE',
      },
      data: {
        status: 'CANCELLED',
      },
    });
  }
}
