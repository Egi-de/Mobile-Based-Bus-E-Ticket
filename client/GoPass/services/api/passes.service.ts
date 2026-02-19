import { apiClient } from './client';
import { BusPass, PassPurchaseRequest, PassRenewalRequest } from '../../types/pass.types';

export const passesService = {
  async getPasses(): Promise<BusPass[]> {
    const response = await apiClient.get<BusPass[]>('/passes');
    return response.data;
  },

  async getPassById(id: string): Promise<BusPass> {
    const response = await apiClient.get<BusPass>(`/passes/${id}`);
    return response.data;
  },

  async purchasePass(data: PassPurchaseRequest): Promise<BusPass> {
    const response = await apiClient.post<BusPass>('/passes', data);
    return response.data;
  },

  async renewPass(data: PassRenewalRequest): Promise<BusPass> {
    const response = await apiClient.post<BusPass>(`/passes/${data.passId}/renew`, data);
    return response.data;
  },

  async cancelPass(id: string): Promise<void> {
    await apiClient.post(`/passes/${id}/cancel`);
  },
};
