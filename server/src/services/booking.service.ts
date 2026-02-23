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
    passengerNames?: string[];
  }): Promise<Booking> {
    // Fetch route info for rich QR code data
    const route = await prisma.route.findUnique({
      where: { id: data.routeId },
      select: { origin: true, destination: true, operator: true, departureTime: true },
    });

    // Generate rich QR code data as JSON
    const qrData = JSON.stringify({
      bookingId: '', // Will be replaced after creation
      route: route ? `${route.origin} → ${route.destination}` : data.routeId,
      operator: route?.operator || '',
      seats: data.seats,
      passengers: data.passengerNames || [],
      date: data.travelDate.toISOString(),
      amount: data.totalAmount,
    });

    const booking = await prisma.booking.create({
      data: {
        userId: data.userId,
        routeId: data.routeId,
        seats: data.seats,
        passengerNames: data.passengerNames || [],
        totalAmount: data.totalAmount,
        travelDate: data.travelDate,
        qrCode: qrData, // Temporary, will update with actual ID
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

    // Update QR code with the actual booking ID
    const finalQrData = JSON.stringify({
      ...JSON.parse(qrData),
      bookingId: booking.id,
    });

    await prisma.booking.update({
      where: { id: booking.id },
      data: { qrCode: finalQrData },
    });

    return { ...booking, qrCode: finalQrData };
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
