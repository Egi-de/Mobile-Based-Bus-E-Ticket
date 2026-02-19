import { Booking, BookingStatus } from '@prisma/client';
import prisma from '../utils/prisma';

export class BookingService {
  /**
   * Create a new booking
   */
  static async createBooking(data: {
    userId: string;
    routeId: string;
    seats: string[];
    totalAmount: number;
    travelDate: Date;
  }): Promise<Booking> {
    // Generate QR code data (simple format for now)
    const qrCode = `BOOKING-${Date.now()}`;

    return prisma.booking.create({
      data: {
        userId: data.userId,
        routeId: data.routeId,
        seats: data.seats,
        totalAmount: data.totalAmount,
        travelDate: data.travelDate,
        qrCode,
      },
      include: {
        route: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });
  }

  /**
   * Get user's bookings with optional status filter
   */
  static async getUserBookings(userId: string, status?: BookingStatus): Promise<Booking[]> {
    const where: any = { userId };
    
    if (status) {
      where.status = status;
    }

    return prisma.booking.findMany({
      where,
      include: {
        route: true,
      },
      orderBy: { bookingDate: 'desc' },
    });
  }

  /**
   * Get all bookings (Admin only)
   */
  static async getAllBookings(status?: BookingStatus): Promise<Booking[]> {
    const where: any = {};
    
    if (status) {
      where.status = status;
    }

    return prisma.booking.findMany({
      where,
      include: {
        route: {
          include: {
            buses: {
              select: {
                id: true,
                plateNumber: true,
                status: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: { bookingDate: 'desc' },
    });
  }

  /**
   * Get booking by ID
   */
  static async getBookingById(id: string): Promise<Booking | null> {
    return prisma.booking.findUnique({
      where: { id },
      include: {
        route: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });
  }

  /**
   * Cancel a booking
   */
  static async cancelBooking(id: string): Promise<Booking> {
    return prisma.booking.update({
      where: { id },
      data: { status: BookingStatus.CANCELLED },
      include: {
        route: true,
      },
    });
  }

  /**
   * Update booking status
   */
  static async updateBookingStatus(id: string, status: BookingStatus): Promise<Booking> {
    return prisma.booking.update({
      where: { id },
      data: { status },
      include: {
        route: true,
      },
    });
  }

  /**
   * Delete a booking (Admin only)
   */
  static async deleteBooking(id: string): Promise<void> {
    await prisma.booking.delete({ where: { id } });
  }

  /**
   * Get booked seats for a route on a specific date
   */
  static async getBookedSeats(routeId: string, travelDate: Date): Promise<string[]> {
    // defined start and end of the day to match bookings
    const startOfDay = new Date(travelDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(travelDate);
    endOfDay.setHours(23, 59, 59, 999);

    const bookings = await prisma.booking.findMany({
      where: {
        routeId,
        travelDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: {
          not: BookingStatus.CANCELLED,
        },
      },
      select: {
        seats: true,
      },
    });

    // Flatten all booked seats into a single array
    const bookedSeats = bookings.flatMap(booking => booking.seats);
    return bookedSeats;
  }
}
