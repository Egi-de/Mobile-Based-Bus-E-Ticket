import { apiClient } from './client';
import { Trip, CreateTripRequest, UpdateTripStatusRequest, TripSearchParams } from '../../types/trip.types';

/**
 * API service for managing trips (specific bus runs on routes)
 */
export const tripsApi = {
  /**
   * Get all trips matching search criteria
   */
  async search(params: TripSearchParams): Promise<Trip[]> {
    const response = await apiClient.get<Trip[]>('/trips', params);
    return response.data;
  },

  /**
   * Get trips for a specific route on a specific date
   * This is the primary method for the booking flow
   */
  async getByRouteAndDate(routeId: string, date: string): Promise<Trip[]> {
    const response = await apiClient.get<Trip[]>(`/trips/route/${routeId}`, { date });
    return response.data;
  },

  /**
   * Get trip by ID with full details (bus, route, driver)
   */
  async getById(id: string): Promise<Trip> {
    const response = await apiClient.get<Trip>(`/trips/${id}`);
    return response.data;
  },

  /**
   * Create a new trip (admin/driver only)
   */
  async create(data: CreateTripRequest): Promise<Trip> {
    const response = await apiClient.post<Trip>('/trips', data);
    return response.data;
  },

  /**
   * Update trip status (driver app uses this to start/end trips)
   */
  async updateStatus(id: string, data: UpdateTripStatusRequest): Promise<Trip> {
    const response = await apiClient.put<Trip>(`/trips/${id}/status`, data);
    return response.data;
  },

  /**
   * Start trip (convenience method for driver app)
   */
  async start(id: string): Promise<Trip> {
    return this.updateStatus(id, {
      tripStatus: 'ON_ROUTE',
      trackingEnabled: true,
    });
  },

  /**
   * Complete trip (convenience method for driver app)
   */
  async complete(id: string): Promise<Trip> {
    return this.updateStatus(id, {
      tripStatus: 'COMPLETED',
      trackingEnabled: false,
    });
  },

  /**
   * Cancel trip (admin only)
   */
  async cancel(id: string): Promise<void> {
    await apiClient.post(`/trips/${id}/cancel`);
  },
};
