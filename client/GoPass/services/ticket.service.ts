import { BookingService } from './booking.service';
import { Ticket } from '../types/ticket.types';

export const TicketService = {
  /**
   * Get a single ticket by ID
   * Fetches booking data and transforms it to ticket format
   */
  async getTicketById(id: string): Promise<Ticket | null> {
    try {
      const booking = await BookingService.getBookingById(id);
      
      if (!booking) {
        return null;
      }

      // Transform booking to ticket format
      const ticket: Ticket = {
        id: booking.id,
        bookingId: booking.id,
        route: booking.route,
        seatLabel: booking.seats.join(', '),
        price: booking.totalAmount,
        passenger: {
          name: booking.user?.name || 'Unknown',
          email: booking.user?.email || '',
          phone: booking.user?.phone || '',
        },
        status: booking.status.toLowerCase() as any,
        purchaseDate: booking.bookingDate,
        qrCodeData: booking.qrCode || '',
        expiryDate: booking.travelDate,
      };

      return ticket;
    } catch (error) {
      console.error('Error fetching ticket:', error);
      throw error;
    }
  },

  /**
   * Cancel a ticket
   */
  async cancelTicket(id: string): Promise<void> {
    try {
      await BookingService.cancelBooking(id);
    } catch (error) {
      console.error('Error cancelling ticket:', error);
      throw error;
    }
  },
};
