import { Seat } from './booking.types';

/**
 * Request to check seat availability for a specific trip segment
 */
export interface SeatAvailabilityRequest {
  tripId: string;
  boardingStopId: string;
  dropStopId: string;
}

/**
 * Response with available seats for the requested segment
 */
export interface SeatAvailabilityResponse {
  tripId: string;
  boardingStopId: string;
  dropStopId: string;
  availableSeats: Seat[];
  totalSeats: number;
  availableCount: number;
}

/**
 * Seat occupation info for a specific segment
 */
export interface SeatOccupation {
  seatId: string;
  seatLabel: string;
  isOccupied: boolean;
  occupiedBy?: {
    ticketId: string;
    boardingStopOrder: number;
    dropStopOrder: number;
  };
}
