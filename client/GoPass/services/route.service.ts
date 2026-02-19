import { apiClient } from './api/client';
import { Route, RouteSearchParams } from '../types/route.types';

export const RouteService = {
  /**
   * Fetch all routes or search with filters
   */
  async getRoutes(params?: RouteSearchParams): Promise<Route[]> {
    try {
      const response = await apiClient.get<Route[]>('/routes', params);
      const routes = (response as any).data as Route[];
      return Array.isArray(routes) ? routes : [];
    } catch (error) {
      console.error('Error fetching routes:', error);
      throw error;
    }
  },

  /**
   * Get route details by ID
   */
  async getRouteById(id: string): Promise<Route> {
    try {
      const response = await apiClient.get<Route>(`/routes/${id}`);
      return (response as any).data as Route;
    } catch (error) {
      console.error('Error fetching route details:', error);
      throw error;
    }
  }
};
