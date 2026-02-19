import { apiClient } from './api/client';

export interface CreateBookingDto {
  routeId: string;
  seats: string[];
  totalAmount: number;
  travelDate: string; // ISO string
}

export interface Booking {
  id: string;
  userId: string;
  routeId: string;
  seats: string[];
  totalAmount: number;
  status: 'ACTIVE' | 'USED' | 'CANCELLED';
  qrCode?: string;
  bookingDate: string;
  travelDate: string;
  route?: {
    id: string;
    origin: string;
    destination: string;
    departureTime: string;
    arrivalTime: string;
    price: number;
    operator: string;
    seatsAvailable: number;
    totalSeats: number;
    amenities: string[];
  };
}

export const BookingService = {
  /**
   * Create a new booking
   */
  async createBooking(data: CreateBookingDto): Promise<any> {
    try {
      const response = await apiClient.post('/bookings', data);
      return response.data;
    } catch (error) {
      console.error('Error creating booking:', error);
      throw error;
    }
  },

  /**
   * Get user's bookings with optional status filter
   */
  async getMyBookings(status?: 'ACTIVE' | 'USED' | 'CANCELLED'): Promise<Booking[]> {
    try {
      const params = status ? { status } : undefined;
      const response = await apiClient.get<Booking[]>('/bookings', params);
      const bookings = (response as any).data as Booking[];
      return bookings || []; // Return empty array if no data
    } catch (error: any) {
      // If it's a 401, let it propagate for auth handling
      if (error?.statusCode === 401) {
        throw error;
      }
      // For other errors (like no bookings found), return empty array
      console.log('No bookings found or error fetching:', error?.message);
      return [];
    }
  },

  /**
   * Get booking by ID
   */
  async getBookingById(id: string): Promise<any> {
    try {
      const response = await apiClient.get(`/bookings/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching booking:', error);
      throw error;
    }
  },

  /**
   * Cancel a booking
   */
  async cancelBooking(id: string) {
    try {
      const response = await apiClient.patch(`/bookings/${id}/cancel`);
      return response.data;
    } catch (error) {
      console.error('Error cancelling booking:', error);
      throw error;
    }
  },

  /**
   * Get booked seats for a route on a specific date
   */
  async getBookedSeats(routeId: string, date: string): Promise<string[]> {
    try {
      const response = await apiClient.get<string[]>(`/bookings/route/${routeId}/seats`, { date });
      const seats = (response as any).data as string[];
      return Array.isArray(seats) ? seats : [];
    } catch (error) {
      console.error('Error fetching booked seats:', error);
      return [];
    }
  },
};
