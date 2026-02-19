import * as Location from 'expo-location';
import { ref, set, onDisconnect, update } from 'firebase/database';
import { firebaseDatabase, isFirebaseConfigured } from './firebase.config';
import { apiClient } from '../api/client';

/**
 * Driver GPS Tracking Service
 * Sends real-time GPS location to Firebase Realtime Database
 * Only for users with DRIVER role
 */

interface LocationUpdate {
  lat: number;
  lng: number;
  speed: number; // meters per second
  heading: number; // degrees
  accuracy: number; // meters
  updatedAt: number; // timestamp
}

interface BusAssignment {
  id: string;
  plateNumber: string;
  status: string;
  routeId: string | null;
  route: {
    id: string;
    name: string;
    origin: string;
    destination: string;
  } | null;
}

interface DriverInfo {
  id: string;
  name: string;
  email: string;
}

class DriverGPSService {
  private locationSubscription: Location.LocationSubscription | null = null;
  private busId: string | null = null;
  private busAssignment: BusAssignment | null = null;
  private driverInfo: DriverInfo | null = null;
  private isTracking: boolean = false;
  private updateInterval: number = 4000; // 4 seconds (between 3-5 seconds)

  /**
   * Request location permissions
   */
  async requestPermissions(): Promise<boolean> {
    try {
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      
      if (foregroundStatus !== 'granted') {
        console.warn('⚠️ Location permission denied');
        return false;
      }


      return true;
    } catch (error) {
      console.error('❌ Error requesting location permissions:', error);
      return false;
    }
  }

  /**
   * Fetch assigned bus from backend
   */
  async fetchAssignedBus(): Promise<BusAssignment | null> {
    try {
      const response = await apiClient.get('/drivers/me/assigned-bus');
      
      // The API client unwraps the response, so data is directly in response
      if (!response) {
        console.error('❌ No response from API');
        return null;
      }

      // Response is the actual data (axios interceptor unwraps it)
      const data = response as any;
      
      if (data.hasAssignment && data.bus) {
        this.busAssignment = data.bus;
        this.driverInfo = data.driver;

        return this.busAssignment;
      } else {
        console.warn('⚠️ No bus assigned to this driver');
        return null;
      }
    } catch (error) {
      console.error('❌ Error fetching assigned bus:', error);
      return null;
    }
  }

  /**
   * Start tracking GPS and sending to Firebase
   */
  async startTracking(): Promise<{ success: boolean; message: string; busId?: string }> {
    if (!isFirebaseConfigured || !firebaseDatabase) {
      console.error('❌ Firebase not configured');
      return { success: false, message: 'Firebase not configured' };
    }

    if (this.isTracking) {
      console.warn('⚠️ Already tracking');
      return { success: true, message: 'Already tracking', busId: this.busId || undefined };
    }

    // Request permissions first
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      return { success: false, message: 'Location permissions not granted' };
    }

    // Fetch assigned bus
    const assignment = await this.fetchAssignedBus();
    if (!assignment) {
      return { success: false, message: 'No bus assigned to your account' };
    }

    this.busId = assignment.id;
    this.isTracking = true;

    try {
      // Initialize bus data in Firebase with complete metadata
      const busRef = ref(firebaseDatabase, `buses/${this.busId}`);
      await set(busRef, {
        id: this.busId,
        plateNumber: assignment.plateNumber,
        routeId: assignment.routeId,
        routeName: assignment.route?.name || 'Unknown Route',
        origin: assignment.route?.origin || '',
        destination: assignment.route?.destination || '',
        status: 'ON_ROUTE',
        driverId: this.driverInfo?.id,
        driverName: this.driverInfo?.name,
        location: null, // Will be updated by GPS
        startedAt: Date.now(),
      });

      // Set up location tracking
      this.locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: this.updateInterval,
          distanceInterval: 10, // Update every 10 meters minimum
        },
        (location) => {
          this.sendLocationToFirebase(location);
        }
      );

      // Set up disconnect handler to update status when driver goes offline
      const statusRef = ref(firebaseDatabase, `buses/${this.busId}/status`);
      onDisconnect(statusRef).set('OFFLINE');


      
      // Update status in PostgreSQL backend
      try {
        await apiClient.patch(`/buses/${this.busId}/status`, { status: 'ON_ROUTE' });

      } catch (err) {
        console.error('⚠️ Failed to update bus status in backend:', err);
      }

      return { 
        success: true, 
        message: `Tracking started for ${assignment.plateNumber}`,
        busId: this.busId,
      }; 

    } catch (error) {
      console.error('❌ Error starting GPS tracking:', error);
      this.isTracking = false;
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to start tracking',
      };
    }
  }

  /**
   * Send location update to Firebase
   */
  private async sendLocationToFirebase(location: Location.LocationObject) {
    if (!this.busId || !firebaseDatabase) {
      return;
    }

    try {
      const locationUpdate: LocationUpdate = {
        lat: location.coords.latitude,
        lng: location.coords.longitude,
        speed: location.coords.speed || 0,
        heading: location.coords.heading || 0,
        accuracy: location.coords.accuracy || 0,
        updatedAt: Date.now(),
      };

      // Update location and timestamp
      const updates: any = {};
      updates[`buses/${this.busId}/location`] = locationUpdate;
      updates[`buses/${this.busId}/lastUpdated`] = Date.now();

      await update(ref(firebaseDatabase), updates);


    } catch (error) {
      console.error('❌ Error sending location to Firebase:', error);
    }
  }

  /**
   * Stop GPS tracking and cleanup
   */
  async stopTracking(): Promise<void> {
    if (!this.isTracking) {
      return;
    }

    // Stop location updates
    if (this.locationSubscription) {
      this.locationSubscription.remove();
      this.locationSubscription = null;
    }

    // Update bus status to IDLE in Firebase
    if (this.busId && firebaseDatabase) {
      try {
        const updates: any = {};
        updates[`buses/${this.busId}/status`] = 'IDLE';
        updates[`buses/${this.busId}/location`] = null;
        updates[`buses/${this.busId}/endedAt`] = Date.now();

        await update(ref(firebaseDatabase), updates);


        // Update status in PostgreSQL backend
        try {
          await apiClient.patch(`/buses/${this.busId}/status`, { status: 'IDLE' });

        } catch (err) {
          console.error('⚠️ Failed to update bus status in backend:', err);
        }

      } catch (error) {
        console.error('❌ Error updating bus status:', error);
      }
    }

    this.busId = null;
    this.isTracking = false;
  }

  /**
   * Check if currently tracking
   */
  isCurrentlyTracking(): boolean {
    return this.isTracking;
  }

  /**
   * Get current bus assignment
   */
  getCurrentBusAssignment(): BusAssignment | null {
    return this.busAssignment;
  }

  /**
   * Get current bus ID
   */
  getCurrentBusId(): string | null {
    return this.busId;
  }
}

// Export singleton instance
export const driverGPSService = new DriverGPSService();
