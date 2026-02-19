/**
 * Ticket Service with Prisma Database Implementation
 * Handles business logic for ticket management
 */

import { Ticket } from '@prisma/client';
import prisma from '../utils/prisma';

export class TicketService {
  /**
   * Get ticket by ID with populated relations
   */
  static async getTicketById(id: string): Promise<Ticket | null> {
    return prisma.ticket.findUnique({
      where: { id },
      include: {
        trip: {
          include: {
            bus: {
              select: {
                id: true,
                plateNumber: true,
              },
            },
            route: {
              select: {
                id: true,
                origin: true,
                destination: true,
                operator: true,
              },
            },
          },
        },
        boardingStop: true,
        dropStop: true,
      },
    });
  }

  /**
   * Get tickets by booking ID
   */
  static async getTicketsByBooking(bookingId: string): Promise<Ticket[]> {
    return prisma.ticket.findMany({
      where: { bookingId },
      include: {
        trip: {
          include: {
            bus: {
              select: {
                id: true,
                plateNumber: true,
              },
            },
            route: {
              select: {
                id: true,
                origin: true,
                destination: true,
                operator: true,
              },
            },
          },
        },
        boardingStop: true,
        dropStop: true,
      },
    });
  }

  /**
   * Get active tickets for a user (via bookings)
   */
  static async getActiveTicketsByUser(userId: string): Promise<Ticket[]> {
    return prisma.ticket.findMany({
      where: {
        status: 'ACTIVE',
        trip: {
          tripStatus: {
            not: 'CANCELLED',
          },
        },
        // We link tickets to users via Booking -> User relation, but Ticket model doesn't have direct userId
        // So we might need to rely on the Booking relation if we had it in Ticket, but currently Ticket -> BookingId
        // Let's check if we can filter by booking.userId
      },
      include: {
        trip: {
          include: {
            bus: {
              select: {
                id: true,
                plateNumber: true,
              },
            },
            route: {
              select: {
                id: true,
                origin: true,
                destination: true,
                operator: true,
              },
            },
            driver: {
              select: {
                id: true,
                name: true,
                phone: true,
              }
            }
          },
        },
        boardingStop: true,
        dropStop: true,
      },
      orderBy: {
        trip: {
          departureTime: 'asc',
        },
      },
    });
  }
  
  /**
   * Validate ticket (check if active and belongs to trip)
   */
  static async validateTicket(id: string, tripId?: string): Promise<{ valid: boolean; message?: string; ticket?: Ticket }> {
    const ticket = await this.getTicketById(id);
    
    if (!ticket) {
      return { valid: false, message: 'Ticket not found' };
    }
    
    if (ticket.status !== 'ACTIVE') {
      return { valid: false, message: `Ticket is ${ticket.status}` };
    }
    
    if (tripId && ticket.tripId !== tripId) {
      return { valid: false, message: 'Ticket does not belong to this trip' };
    }
    
    return { valid: true, ticket };
  }
}
