import { apiClient } from './client';
import { Ticket, TicketFilter } from '../../types/ticket.types';

export const ticketsService = {
  async getTickets(filter?: TicketFilter): Promise<Ticket[]> {
    const response = await apiClient.get<Ticket[]>('/tickets', filter);
    return response.data;
  },

  async getTicketById(id: string): Promise<Ticket> {
    const response = await apiClient.get<Ticket>(`/tickets/${id}`);
    return response.data;
  },

  async cancelTicket(id: string): Promise<void> {
    await apiClient.post(`/tickets/${id}/cancel`);
  },

  async downloadTicket(id: string): Promise<Blob> {
    const response = await apiClient.get(`/tickets/${id}/download`, { responseType: 'blob' });
    return response.data;
  },
};
