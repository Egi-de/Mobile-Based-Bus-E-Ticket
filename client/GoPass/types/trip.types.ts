export type TripStatus = 'WAITING' | 'BOARDING' | 'ON_ROUTE' | 'COMPLETED' | 'CANCELLED';

/**
 * Trip represents a specific bus running a route at a specific time.
 * This is the central entity that links buses, routes, drivers, and passengers.
 */
export interface Trip {
  id: string;
  busId: string;
  routeId: string;
  driverId: string | null;
  departureTime: string; // ISO datetime
  arrivalTime: string; // ISO datetime
  tripStatus: TripStatus;
  trackingEnabled: boolean;
  currentStopId: string | null; // Last reached stop
  createdAt: string;
  updatedAt: string;
  
  // Populated from relations (optional, for UI display)
  bus?: {
    id: string;
    plateNumber: string;
    totalSeats: number;
  };
  route?: {
    id: string;
    origin: string;
    destination: string;
  };
  driver?: {
    id: string;
    name: string;
    phone: string;
  };
}

/**
 * Request to create a new trip
 */
export interface CreateTripRequest {
  busId: string;
  routeId: string;
  driverId?: string;
  departureTime: string;
  arrivalTime: string;
}

/**
 * Request to update trip status
 */
export interface UpdateTripStatusRequest {
  tripStatus: TripStatus;
  trackingEnabled?: boolean;
  currentStopId?: string;
}

/**
 * Query parameters for searching trips
 */
export interface TripSearchParams {
  routeId?: string;
  date?: string; // ISO date (YYYY-MM-DD)
  status?: TripStatus;
}
