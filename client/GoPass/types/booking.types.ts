export type SeatStatus = 'available' | 'booked' | 'selected' | 'reserved' | 'blocked';
export type SeatType = 'standard' | 'vip';

export interface Seat {
  id: string;
  label: string;
  row: number;
  col: number; // 0, 1, 2, 3, 4 (0=A, 1=B, aisle, 2=C, 3=D)
  status: SeatStatus;
  type: SeatType;
  price: number;
}

export interface Passenger {
  name: string;
  email: string;
  phone: string;
  nationalId?: string;
}

export interface Booking {
  id: string;
  tripId: string; // ✅ Changed from routeId - links to specific trip
  userId: string;
  seats: string[]; // Seat IDs
  boardingStopId: string; // ✅ NEW - where passenger boards
  dropStopId: string; // ✅ NEW - where passenger drops
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  passenger: Passenger;
  createdAt: string;
  qrCode?: string;
}

export interface BookingRequest {
  tripId: string; // ✅ Changed from routeId
  seats: string[];
  boardingStopId: string; // ✅ NEW
  dropStopId: string; // ✅ NEW
  totalAmount: number;
  passenger: Passenger;
}

export const SEAT_COLUMNS_COUNT = 4; // 2-2 layout usually
export const AISLE_INDEX = 2; // Insert aisle after 2nd seat
