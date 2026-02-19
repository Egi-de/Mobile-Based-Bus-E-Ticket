// Response wrapper types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// User types
export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserDto {
  email: string;
  password: string;
  name: string;
  phone: string;
  role?: 'PASSENGER' | 'DRIVER' | 'ADMIN';
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: Omit<User, 'password'>;
  token: string;
}

// Route types
export interface Route {
  id: string;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  price: number;
  availableSeats: number;
  totalSeats: number;
  busPlate: string;
  busType: 'standard' | 'vip' | 'express';
}

// Booking types
export interface Booking {
  id: string;
  userId: string;
  routeId: string;
  seatNumbers: string[];
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  qrCode: string;
  createdAt: Date;
}

export interface CreateBookingDto {
  routeId: string;
  seatNumbers: string[];
}

// Pass types
export interface Pass {
  id: string;
  userId: string;
  type: 'weekly' | 'monthly' | 'student';
  name: string;
  price: number;
  purchaseDate: Date;
  expiryDate: Date;
  status: 'active' | 'expired';
  qrCode: string;
}
