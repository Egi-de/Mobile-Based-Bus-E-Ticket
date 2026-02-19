import { ref, onValue, off, query, orderByChild, equalTo, DatabaseReference, DataSnapshot } from 'firebase/database';
import { firebaseDatabase, isFirebaseConfigured } from './firebase.config';
import { FirebaseBusLocation, BusUpdateEvent } from '../../types/firebase.types';

type BusUpdateCallback = (bus: FirebaseBusLocation) => void;
type ConnectionCallback = (connected: boolean) => void;

class RealtimeTrackingService {
  private listeners: Map<string, DatabaseReference> = new Map();
  private callbacks: Map<string, BusUpdateCallback> = new Map();
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
      console.warn('⚠️ Firebase not configured, skipping connection monitoring');
      return;
    }

    const connectedRef = ref(firebaseDatabase, '.info/connected');
    onValue(connectedRef, (snapshot: DataSnapshot) => {
      this.isConnected = snapshot.val() === true;

      
      // Notify all connection callbacks
      this.connectionCallbacks.forEach(callback => callback(this.isConnected));
    });
  }

  /**
   * Subscribe to real-time updates for a specific bus
   * @param busId - The ID of the bus to track
   * @param callback - Function to call when bus data updates
   * @returns Cleanup function to unsubscribe
   */
  subscribeToBus(busId: string, callback: BusUpdateCallback): () => void {
    if (!isFirebaseConfigured || !firebaseDatabase) {
      console.warn('⚠️ Firebase not configured, cannot subscribe to bus updates');
      // Return a no-op cleanup function
      return () => {};
    }

    // Create reference to the bus location in Firebase
    const busRef = ref(firebaseDatabase, `buses/${busId}`);
    
    // Store callback
    this.callbacks.set(busId, callback);
    
    // Set up real-time listener
    const listener = onValue(busRef, (snapshot: DataSnapshot) => {
      const data = snapshot.val();
      
      if (data) {
        const busLocation: FirebaseBusLocation = {
          id: busId,
          plateNumber: data.plateNumber,
          routeId: data.routeId,
          location: {
            lat: data.location?.lat || data.currentLat || 0,
            lng: data.location?.lng || data.currentLng || 0,
          },
          speed: data.speed || 0,
          heading: data.heading || 0,
          status: data.status || 'IDLE',
          lastUpdated: data.lastUpdated || Date.now(),
          nextStopId: data.nextStopId,
          eta: data.eta,
          seatsAvailable: data.seatsAvailable,
        };
        

        
        callback(busLocation);
      }
    }, (error) => {
      console.error(`❌ Error subscribing to bus ${busId}:`, error);
    });
    
    // Store listener reference
    this.listeners.set(busId, busRef);
    

    
    // Return cleanup function
    return () => {
      this.unsubscribeFromBus(busId);
    };
  }

  /**
   * Unsubscribe from bus updates
   * @param busId - The ID of the bus to stop tracking
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
   * Subscribe to all buses on a specific route
   * @param routeId - The ID of the route
   * @param callback - Function to call when any bus on the route updates
   * @returns Cleanup function to unsubscribe
   */
  subscribeToRoute(routeId: string, callback: BusUpdateCallback): () => void {
    if (!isFirebaseConfigured || !firebaseDatabase) {
      console.warn('⚠️ Firebase not configured, cannot subscribe to route updates');
      return () => {};
    }

    const routeBusesRef = ref(firebaseDatabase, 'buses');
    const routeQuery = query(routeBusesRef, orderByChild('routeId'), equalTo(routeId));
    
    const listener = onValue(routeQuery, (snapshot: DataSnapshot) => {
      snapshot.forEach((childSnapshot) => {
        const data = childSnapshot.val();
        const busId = childSnapshot.key;
        
        if (data && busId) {
          const busLocation: FirebaseBusLocation = {
            id: busId,
            plateNumber: data.plateNumber,
            routeId: data.routeId,
            location: {
              lat: data.location?.lat || data.currentLat || 0,
              lng: data.location?.lng || data.currentLng || 0,
            },
            speed: data.speed || 0,
            heading: data.heading || 0,
            status: data.status || 'IDLE',
            lastUpdated: data.lastUpdated || Date.now(),
            nextStopId: data.nextStopId,
            eta: data.eta,
            seatsAvailable: data.seatsAvailable,
          };
          
          callback(busLocation);
        }
      });
    }, (error) => {
      console.error(`❌ Error subscribing to route ${routeId}:`, error);
    });
    
    this.listeners.set(`route_${routeId}`, routeBusesRef);
    // this.listeners.set(`route_${routeId}`, routeBusesRef);
    
    return () => {
      off(routeBusesRef);
      this.listeners.delete(`route_${routeId}`);

    };
  }

  /**
   * Subscribe to connection status changes
   * @param callback - Function to call when connection status changes
   * @returns Cleanup function to unsubscribe
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
    this.listeners.forEach((busRef, key) => {
      off(busRef);
    });
    
    this.listeners.clear();
    this.callbacks.clear();
    this.connectionCallbacks.clear();
    

  }
}

// Export singleton instance
export const realtimeTrackingService = new RealtimeTrackingService();
