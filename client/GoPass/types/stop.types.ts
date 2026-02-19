/**
 * Stop represents a location along a route where passengers can board or drop.
 * Stops are ordered sequentially (1, 2, 3, 4...) to enable segment-based logic.
 */
export interface Stop {
  id: string;
  routeId: string;
  stopName: string;
  latitude: number;
  longitude: number;
  orderNumber: number; // Sequential order: 1, 2, 3, 4...
  detectionRadius: number; // Meters for GPS-based arrival detection
  estimatedArrivalMinutes?: number; // Minutes from departure
  createdAt: string;
  updatedAt: string;
}

/**
 * Request to create a new stop
 */
export interface CreateStopRequest {
  routeId: string;
  stopName: string;
  latitude: number;
  longitude: number;
  orderNumber: number;
  detectionRadius?: number; // Default: 100 meters
  estimatedArrivalMinutes?: number;
}

/**
 * Stop with distance calculation (for GPS detection)
 */
export interface StopWithDistance extends Stop {
  distanceMeters: number;
  isWithinRadius: boolean;
}
