import { apiClient } from './client';
import { Payment, PaymentRequest, PaymentResponse } from '../../types/payment.types';

export const paymentsService = {
  async initiatePayment(data: PaymentRequest): Promise<PaymentResponse> {
    const response = await apiClient.post<PaymentResponse>('/payments/initiate', data);
    return response.data;
  },

  async verifyPayment(reference: string): Promise<Payment> {
    const response = await apiClient.get<Payment>(`/payments/verify/${reference}`);
    return response.data;
  },

  async getPayments(): Promise<Payment[]> {
    const response = await apiClient.get<Payment[]>('/payments');
    return response.data;
  },

  async getPaymentById(id: string): Promise<Payment> {
    const response = await apiClient.get<Payment>(`/payments/${id}`);
    return response.data;
  },
};
