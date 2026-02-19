import { apiClient } from './client';
import { Booking, BookingRequest, Seat } from '../../types/booking.types';
import { SeatAvailabilityRequest, SeatAvailabilityResponse } from '../../types/seat-availability.types';

export const bookingsService = {
  /**
   * Get available seats for a specific trip segment (boarding to drop stop)
   * This replaces the old route-based seat availability
   */
  async getSeatsForSegment(request: SeatAvailabilityRequest): Promise<SeatAvailabilityResponse> {
    const response = await apiClient.post<SeatAvailabilityResponse>('/seats/availability', request);
    return response.data;
  },

  /**
   * @deprecated Use getSeatsForSegment instead
   * Legacy method for backward compatibility
   */
  async getSeats(routeId: string, travelDate: string): Promise<Seat[]> {
    const response = await apiClient.get<Seat[]>(`/routes/${routeId}/seats`, { travelDate });
    return response.data;
  },

  /**
   * Lock seats temporarily during booking process
   */
  async lockSeats(tripId: string, seatIds: string[], boardingStopId: string, dropStopId: string): Promise<void> {
    await apiClient.post(`/trips/${tripId}/seats/lock`, { 
      seatIds, 
      boardingStopId, 
      dropStopId 
    });
  },

  /**
   * Create booking for a specific trip segment
   */
  async createBooking(data: BookingRequest): Promise<Booking> {
    const response = await apiClient.post<Booking>('/bookings', data);
    return response.data;
  },

  async getBookings(): Promise<Booking[]> {
    const response = await apiClient.get<Booking[]>('/bookings');
    return response.data;
  },

  async getBookingById(id: string): Promise<Booking> {
    const response = await apiClient.get<Booking>(`/bookings/${id}`);
    return response.data;
  },

  async cancelBooking(id: string): Promise<void> {
    await apiClient.post(`/bookings/${id}/cancel`);
  },
};
