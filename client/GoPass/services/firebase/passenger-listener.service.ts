import { ref, onValue, off, DatabaseReference } from 'firebase/database';
import { firebaseDatabase, isFirebaseConfigured } from './firebase.config';

/**
 * Passenger GPS Listening Service
 * Listens to real-time bus location updates from Firebase
 * Only for users with PASSENGER role
 */

export interface BusLocationData {
  lat: number;
  lng: number;
  speed: number;
  heading: number;
  accuracy: number;
  updatedAt: number;
}

type LocationUpdateCallback = (location: BusLocationData) => void;
type ConnectionCallback = (connected: boolean) => void;

class PassengerListenerService {
  private listeners: Map<string, DatabaseReference> = new Map();
  private callbacks: Map<string, LocationUpdateCallback> = new Map();
  private connectionCallbacks: Set<ConnectionCallback> = new Set();
  private isConnected: boolean = false;

  constructor() {
    this.initializeConnectionMonitoring();
  }

  /**
   * Monitor Firebase connection status
   */
  private initializeConnectionMonitoring() {
    if (!isFirebaseConfigured || !firebaseDatabase) {
      return;
    }

    const connectedRef = ref(firebaseDatabase, '.info/connected');
    onValue(connectedRef, (snapshot) => {
      this.isConnected = snapshot.val() === true;

      
      this.connectionCallbacks.forEach(callback => callback(this.isConnected));
    });
  }

  /**
   * Subscribe to real-time bus location updates
   * @param busId - The bus ID to track
   * @param callback - Function called when location updates
   * @returns Cleanup function to unsubscribe
   */
  subscribeToBusLocation(busId: string, callback: LocationUpdateCallback): () => void {
    if (!isFirebaseConfigured || !firebaseDatabase) {
      console.warn('⚠️ Firebase not configured');
      return () => {};
    }

    // Create reference to bus location
    const busLocationRef = ref(firebaseDatabase, `buses/${busId}/location`);
    
    // Store callback
    this.callbacks.set(busId, callback);
    
    // Set up real-time listener
    onValue(busLocationRef, (snapshot) => {
      const data = snapshot.val();
      
      if (data) {
        const locationData: BusLocationData = {
          lat: data.lat,
          lng: data.lng,
          speed: data.speed || 0,
          heading: data.heading || 0,
          accuracy: data.accuracy || 0,
          updatedAt: data.updatedAt || Date.now(),
        };
        

        
        callback(locationData);
      } else {

      }
    }, (error) => {
      console.error(`❌ Error listening to bus ${busId}:`, error);
    });
    
    // Store listener reference
    this.listeners.set(busId, busLocationRef);
    

    
    // Return cleanup function
    return () => {
      this.unsubscribeFromBus(busId);
    };
  }

  /**
   * Unsubscribe from bus location updates
   */
  private unsubscribeFromBus(busId: string) {
    const busRef = this.listeners.get(busId);
    
    if (busRef) {
      off(busRef);
      this.listeners.delete(busId);
      this.callbacks.delete(busId);

    }
  }

  /**
   * Subscribe to connection status changes
   */
  onConnectionChange(callback: ConnectionCallback): () => void {
    this.connectionCallbacks.add(callback);
    
    // Immediately call with current status
    callback(this.isConnected);
    
    return () => {
      this.connectionCallbacks.delete(callback);
    };
  }

  /**
   * Get current connection status
   */
  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  /**
   * Clean up all listeners (call on app unmount)
   */
  cleanup() {
    this.listeners.forEach((busRef) => {
      off(busRef);
    });
    
    this.listeners.clear();
    this.callbacks.clear();
    this.connectionCallbacks.clear();
    

  }
}

// Export singleton instance
export const passengerListenerService = new PassengerListenerService();
