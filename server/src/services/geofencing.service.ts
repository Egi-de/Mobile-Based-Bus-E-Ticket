/**
 * Geofencing Service
 * Handles proximity detection for buses approaching stops
 * Calculates distances and triggers arrival notifications
 */

interface Coordinates {
  lat: number;
  lng: number;
}

interface Stop {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

interface ProximityResult {
  stopId: string;
  stopName: string;
  distance: number; // in meters
  isNearby: boolean;
  eta?: number; // in seconds
}

class GeofencingService {
  // Default proximity radius in meters
  private readonly PROXIMITY_RADIUS = 500;
  
  // Earth's radius in meters
  private readonly EARTH_RADIUS = 6371000;

  /**
   * Calculate distance between two coordinates using Haversine formula
   * @param point1 - First coordinate
   * @param point2 - Second coordinate
   * @returns Distance in meters
   */
  calculateDistance(point1: Coordinates, point2: Coordinates): number {
    const lat1Rad = this.toRadians(point1.lat);
    const lat2Rad = this.toRadians(point2.lat);
    const deltaLat = this.toRadians(point2.lat - point1.lat);
    const deltaLng = this.toRadians(point2.lng - point1.lng);

    const a =
      Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
      Math.cos(lat1Rad) *
        Math.cos(lat2Rad) *
        Math.sin(deltaLng / 2) *
        Math.sin(deltaLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = this.EARTH_RADIUS * c;

    return Math.round(distance);
  }

  /**
   * Convert degrees to radians
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Check if bus is within proximity of a stop
   * @param busLocation - Current bus coordinates
   * @param stop - Stop coordinates
   * @param radiusMeters - Optional custom radius (default: 500m)
   * @returns Whether bus is nearby
   */
  isNearStop(
    busLocation: Coordinates,
    stop: Coordinates,
    radiusMeters: number = this.PROXIMITY_RADIUS
  ): boolean {
    const distance = this.calculateDistance(busLocation, stop);
    return distance <= radiusMeters;
  }

  /**
   * Find all stops within proximity of bus
   * @param busLocation - Current bus coordinates
   * @param stops - Array of stops to check
   * @param radiusMeters - Optional custom radius
   * @returns Array of nearby stops with distances
   */
  findNearbyStops(
    busLocation: Coordinates,
    stops: Stop[],
    radiusMeters: number = this.PROXIMITY_RADIUS
  ): ProximityResult[] {
    return stops
      .map((stop) => {
        const distance = this.calculateDistance(busLocation, {
          lat: stop.lat,
          lng: stop.lng,
        });

        return {
          stopId: stop.id,
          stopName: stop.name,
          distance,
          isNearby: distance <= radiusMeters,
        };
      })
      .filter((result) => result.isNearby)
      .sort((a, b) => a.distance - b.distance);
  }

  /**
   * Calculate ETA to stop based on current speed and distance
   * @param distance - Distance to stop in meters
   * @param speedKmh - Current speed in km/h
   * @returns ETA in seconds
   */
  calculateETA(distance: number, speedKmh: number): number {
    if (speedKmh === 0) {
      return 0; // Can't calculate ETA if not moving
    }

    // Convert speed from km/h to m/s
    const speedMs = speedKmh / 3.6;

    // Calculate time in seconds
    const timeSeconds = distance / speedMs;

    return Math.round(timeSeconds);
  }

  /**
   * Find next stop on route
   * @param busLocation - Current bus coordinates
   * @param stops - Ordered array of stops on route
   * @param currentSpeed - Current bus speed in km/h
   * @returns Next stop with distance and ETA
   */
  findNextStop(
    busLocation: Coordinates,
    stops: Stop[],
    currentSpeed: number
  ): ProximityResult | null {
    if (stops.length === 0) {
      return null;
    }

    // Find closest stop ahead
    let closestStop: ProximityResult | null = null;
    let minDistance = Infinity;

    for (const stop of stops) {
      const distance = this.calculateDistance(busLocation, {
        lat: stop.lat,
        lng: stop.lng,
      });

      if (distance < minDistance) {
        minDistance = distance;
        const eta = this.calculateETA(distance, currentSpeed);

        closestStop = {
          stopId: stop.id,
          stopName: stop.name,
          distance,
          isNearby: distance <= this.PROXIMITY_RADIUS,
          eta,
        };
      }
    }

    return closestStop;
  }

  /**
   * Calculate bearing between two points
   * @param point1 - Starting point
   * @param point2 - Ending point
   * @returns Bearing in degrees (0-360)
   */
  calculateBearing(point1: Coordinates, point2: Coordinates): number {
    const lat1Rad = this.toRadians(point1.lat);
    const lat2Rad = this.toRadians(point2.lat);
    const deltaLng = this.toRadians(point2.lng - point1.lng);

    const y = Math.sin(deltaLng) * Math.cos(lat2Rad);
    const x =
      Math.cos(lat1Rad) * Math.sin(lat2Rad) -
      Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(deltaLng);

    const bearingRad = Math.atan2(y, x);
    const bearingDeg = (bearingRad * 180) / Math.PI;

    // Normalize to 0-360
    return (bearingDeg + 360) % 360;
  }

  /**
   * Check if bus is heading towards a stop
   * @param busLocation - Current bus coordinates
   * @param busHeading - Current bus heading (0-360)
   * @param stop - Stop coordinates
   * @param toleranceDegrees - Acceptable deviation (default: 45°)
   * @returns Whether bus is heading towards stop
   */
  isHeadingTowards(
    busLocation: Coordinates,
    busHeading: number,
    stop: Coordinates,
    toleranceDegrees: number = 45
  ): boolean {
    const bearingToStop = this.calculateBearing(busLocation, stop);
    const headingDifference = Math.abs(busHeading - bearingToStop);

    // Handle wrap-around (e.g., 350° vs 10°)
    const normalizedDifference =
      headingDifference > 180 ? 360 - headingDifference : headingDifference;

    return normalizedDifference <= toleranceDegrees;
  }

  /**
   * Format distance for display
   * @param meters - Distance in meters
   * @returns Formatted string (e.g., "500m" or "1.2km")
   */
  formatDistance(meters: number): string {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
  }

  /**
   * Format ETA for display
   * @param seconds - ETA in seconds
   * @returns Formatted string (e.g., "2 mins" or "1 hr 15 mins")
   */
  formatETA(seconds: number): string {
    if (seconds < 60) {
      return `${seconds} sec`;
    }

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
      return `${minutes} min${minutes > 1 ? 's' : ''}`;
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours} hr${hours > 1 ? 's' : ''} ${remainingMinutes} min${remainingMinutes > 1 ? 's' : ''}`;
  }
}

export const geofencingService = new GeofencingService();
