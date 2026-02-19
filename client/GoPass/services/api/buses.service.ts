import { apiClient } from './client';

export interface Bus {
  id: string;
  plateNumber: string;
  routeId: string | null;
  driverId: string | null;
  status: 'IDLE' | 'ON_ROUTE' | 'MAINTENANCE';
  currentLat?: number;
  currentLng?: number;
  speed?: number;
  heading?: number;
  lastUpdated?: string;
}

export const busesApi = {
  /**
   * Get all buses
   */
  getAll: async (): Promise<Bus[]> => {
    const response = await apiClient.get<Bus[]>('/buses');
    return response.data;
  },

  /**
   * Get bus by ID
   */
  getById: async (id: string): Promise<Bus> => {
    const response = await apiClient.get<Bus>(`/buses/${id}`);
    return response.data;
  },

  /**
   * Get buses by route ID
   */
  getByRoute: async (routeId: string): Promise<Bus[]> => {
    const response = await apiClient.get<Bus[]>(`/buses/route/${routeId}`);
    return response.data;
  },
};
