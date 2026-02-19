import { Route } from './route.types';
import { Passenger } from './booking.types';
import { Trip } from './trip.types';
import { Stop } from './stop.types';

export type TicketStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED';

/**
 * Ticket represents a passenger reservation for a specific trip segment.
 * CRITICAL: Tickets are linked to tripId, not routeId.
 */
export interface Ticket {
  id: string;
  tripId: string; // ✅ Changed from routeId - links to specific bus trip
  bookingId: string;
  userId: string;
  seatNumber: string;
  boardingStopId: string; // ✅ NEW - where passenger boards
  dropStopId: string; // ✅ NEW - where passenger drops
  passenger: Passenger;
  status: TicketStatus;
  price: number;
  purchaseDate: string;
  qrCodeData: string;
  
  // Populated from relations (optional, for UI display)
  trip?: Trip;
  boardingStop?: Stop;
  dropStop?: Stop;
  route?: Route; // Kept for backward compatibility in UI
}

export interface TicketFilter {
  status?: TicketStatus;
}

/**
 * Legacy ticket format (for backward compatibility during migration)
 * @deprecated Use Ticket instead
 */
export interface LegacyTicket {
  id: string;
  bookingId: string;
  route: Route;
  seatLabel: string;
  price: number;
  passenger: Passenger;
  status: 'active' | 'used' | 'cancelled' | 'expired';
  purchaseDate: string;
  qrCodeData: string;
  expiryDate: string;
}
