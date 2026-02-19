import { apiClient } from './client';
import { Stop, CreateStopRequest, StopWithDistance } from '../../types/stop.types';

/**
 * API service for managing route stops
 */
export const stopsApi = {
  /**
   * Get all stops for a specific route, ordered by orderNumber
   */
  async getByRoute(routeId: string): Promise<Stop[]> {
    const response = await apiClient.get<Stop[]>(`/stops/route/${routeId}`);
    return response.data;
  },

  /**
   * Get stop by ID
   */
  async getById(id: string): Promise<Stop> {
    const response = await apiClient.get<Stop>(`/stops/${id}`);
    return response.data;
  },

  /**
   * Create a new stop (admin only)
   */
  async create(data: CreateStopRequest): Promise<Stop> {
    const response = await apiClient.post<Stop>('/stops', data);
    return response.data;
  },

  /**
   * Update stop details (admin only)
   */
  async update(id: string, data: Partial<CreateStopRequest>): Promise<Stop> {
    const response = await apiClient.put<Stop>(`/stops/${id}`, data);
    return response.data;
  },

  /**
   * Delete stop (admin only)
   */
  async delete(id: string): Promise<void> {
    await apiClient.delete(`/stops/${id}`);
  },

  /**
   * Check which stops are within detection radius of current GPS location
   * Used by driver app for automatic stop detection
   */
  async checkNearbyStops(routeId: string, latitude: number, longitude: number): Promise<StopWithDistance[]> {
    const response = await apiClient.get<StopWithDistance[]>('/stops/nearby', {
      routeId,
      latitude,
      longitude,
    });
    return response.data;
  },
};
