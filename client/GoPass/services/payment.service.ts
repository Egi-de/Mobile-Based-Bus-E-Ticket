import { apiClient } from './api/client';

export interface PaymentMethod {
  id: string;
  type: 'mobile_money' | 'card';
  label: string;
}

export interface ProcessPaymentDto {
  bookingId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  phoneNumber?: string;
}

export interface PaymentResponse {
  success: boolean;
  transactionId: string;
  message: string;
}

export const PaymentService = {
  /**
   * Process payment for a booking
   * Note: This is a simplified implementation. In production, this would integrate
   * with actual payment gateways like MTN Mobile Money, Airtel Money, or Stripe.
   */
  async processPayment(data: ProcessPaymentDto): Promise<PaymentResponse> {
    try {
      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In a real implementation, this would call a payment gateway API
      // For now, we'll simulate a successful payment
      const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      console.log('Payment processed:', {
        bookingId: data.bookingId,
        amount: data.amount,
        method: data.paymentMethod.label,
        transactionId,
      });

      return {
        success: true,
        transactionId,
        message: 'Payment processed successfully',
      };
    } catch (error: any) {
      console.error('Payment processing failed:', error);
      throw new Error(error?.message || 'Payment processing failed');
    }
  },
};
