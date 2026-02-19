import { apiClient } from './api/client';
import { Pass, PassTemplate, PassStatus } from '../types/pass.types';

export const PassService = {
  /**
   * Get all available pass templates
   */
  async getPassTemplates(): Promise<PassTemplate[]> {
    try {
      const response = await apiClient.get<PassTemplate[]>('/passes/templates');
      // apiClient.get returns the full wrapper {success, data, message}
      // The actual array is at response.data
      const templates = (response as any).data as PassTemplate[];
      return Array.isArray(templates) ? templates : [];
    } catch (error) {
      console.log('Error fetching pass templates:', error);
      return [];
    }
  },

  /**
   * Get user's passes
   */
  async getUserPasses(status?: PassStatus | 'HISTORY'): Promise<Pass[]> {
    try {
      const params = status ? { status } : undefined;
      const response = await apiClient.get<Pass[]>('/passes', params);
      // apiClient.get returns the full wrapper {success, data, message}
      const passes = (response as any).data as Pass[];
      return Array.isArray(passes) ? passes : [];
    } catch (error) {
      console.log('Error fetching user passes:', error);
      return [];
    }
  },

  /**
   * Purchase a new pass
   */
  async purchasePass(templateId: string): Promise<Pass> {
    try {
      const response = await apiClient.post<Pass>('/passes', { templateId });
      return response.data;
    } catch (error: any) {
      console.log('Error purchasing pass:', error);
      throw error;
    }
  }
};
