export type PaymentProvider = 'MTN' | 'Airtel' | 'Visa' | 'Mastercard';
export type PaymentMethodType = 'mobile_money' | 'card';

export interface PaymentMethod {
  id: string;
  type: PaymentMethodType;
  provider: PaymentProvider;
  phoneNumber?: string; // For mobile money
  cardNumber?: string; // For card (masked)
  label: string;
}

export interface Transaction {
  id: string;
  bookingId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'success' | 'failed';
  method: PaymentMethod;
  timestamp: string;
}

export const MOCK_PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: '1',
    type: 'mobile_money',
    provider: 'MTN',
    phoneNumber: '078***123',
    label: 'MTN Mobile Money',
  },
  {
    id: '2',
    type: 'mobile_money',
    provider: 'Airtel',
    phoneNumber: '072***456',
    label: 'Airtel Money',
  },
  {
    id: '3',
    type: 'card',
    provider: 'Visa',
    cardNumber: '**** 1234',
    label: 'Visa Card',
  },
];
