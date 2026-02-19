import { apiClient } from './client';
import { Route, RouteSearchParams } from '../../types/route.types';
import { PaginatedResponse } from '../../types/api.types';

export const routesService = {
  async getRoutes(params?: RouteSearchParams): Promise<Route[]> {
    const response = await apiClient.get<Route[]>('/routes', params);
    return response.data;
  },

  async getRouteById(id: string): Promise<Route> {
    const response = await apiClient.get<Route>(`/routes/${id}`);
    return response.data;
  },

  async searchRoutes(params: RouteSearchParams): Promise<Route[]> {
    const response = await apiClient.get<Route[]>('/routes/search', params);
    return response.data;
  },
};
