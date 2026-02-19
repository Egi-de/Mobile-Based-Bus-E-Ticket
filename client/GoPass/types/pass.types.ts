import { Passenger } from './booking.types';

export type PassType = 'weekly' | 'monthly' | 'student_trimester';
export type PassStatus = 'ACTIVE' | 'EXPIRED' | 'PENDING';

export interface Pass {
  id: string;
  type: PassType;
  name: string; // e.g., "Monthly Unlimited"
  price: number;
  user: {
    name: string;
    email: string;
    phone: string;
  };
  status: PassStatus;
  purchaseDate: string;
  expiryDate: string;
  qrCode?: string;
  tripsRemaining?: number; // Unlimited if undefined
  validRoutes?: string[]; // All if undefined
}

export interface PassTemplate {
  id: string;
  type: PassType;
  name: string;
  description: string;
  price: number;
  durationDays: number;
}
