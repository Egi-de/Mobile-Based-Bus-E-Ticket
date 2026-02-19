import { AppState, AppStateStatus } from 'react-native';
import { realtimeTrackingService } from './firebase/realtime-tracking.service';
import { FirebaseBusLocation } from '../types/firebase.types';

export interface BusLocation {
  id: string;
  plateNumber: string;
  routeId: string;
  currentLat: number;
  currentLng: number;
  speed: number;
  heading: number;
  status: 'IDLE' | 'ON_ROUTE' | 'DELAYED' | 'MAINTENANCE';
  lastUpdated: string;
}

class TrackingService {
  private appState: AppStateStatus = AppState.currentState;
  private isOnTrackingScreen: boolean = false;
  private activeSubscriptions: Map<string, () => void> = new Map();
  private isConnected: boolean = false;
  private connectionUnsubscribe: (() => void) | null = null;

  constructor() {
    // Listen to app state changes
    AppState.addEventListener('change', this.handleAppStateChange);
    
    // Monitor Firebase connection
    this.connectionUnsubscribe = realtimeTrackingService.onConnectionChange((connected) => {
      this.isConnected = connected;
      console.log(`🔌 Tracking service connection: ${connected ? 'ONLINE' : 'OFFLINE'}`);
    });
  }

  private handleAppStateChange = (nextAppState: AppStateStatus) => {
    const previousState = this.appState;
    this.appState = nextAppState;
    
    console.log(`📱 App state changed: ${previousState} → ${nextAppState}`);
    
    // Firebase handles reconnection automatically, no need to adjust intervals
  };

  initialize() {
    console.log('🚀 Tracking service initialized (Firebase real-time mode)');
  }

  setOnTrackingScreen(isOnScreen: boolean) {
    this.isOnTrackingScreen = isOnScreen;
    console.log(`📍 Tracking screen: ${isOnScreen ? 'ACTIVE' : 'INACTIVE'}`);
  }

  joinRoute(routeId: string) {
    console.log(`🚌 Joined route: ${routeId}`);
    // Firebase automatically handles route subscriptions
  }

  leaveRoute(routeId: string) {
    console.log(`👋 Left route: ${routeId}`);
    // Cleanup is handled by unsubscribe functions
  }

  /**
   * Subscribe to real-time bus updates using Firebase
   * @param busId - Bus ID to track
   * @param callback - Callback function for updates
   * @returns Cleanup function
   */
  subscribeToBus(busId: string, callback: (data: BusLocation) => void) {
    console.log(`🔔 Subscribing to bus ${busId} (Firebase real-time)`);

    // Convert Firebase data format to app format
    const firebaseCallback = (firebaseData: FirebaseBusLocation) => {
      const busLocation: BusLocation = {
        id: firebaseData.id,
        plateNumber: firebaseData.plateNumber,
        routeId: firebaseData.routeId,
        currentLat: firebaseData.location.lat,
        currentLng: firebaseData.location.lng,
        speed: firebaseData.speed,
        heading: firebaseData.heading,
        status: firebaseData.status,
        lastUpdated: new Date(firebaseData.lastUpdated).toISOString(),
      };

      callback(busLocation);
    };

    // Subscribe to Firebase real-time updates
    const unsubscribe = realtimeTrackingService.subscribeToBus(busId, firebaseCallback);
    
    // Store cleanup function
    this.activeSubscriptions.set(busId, unsubscribe);

    // Return cleanup function
    return () => {
      const cleanup = this.activeSubscriptions.get(busId);
      if (cleanup) {
        cleanup();
        this.activeSubscriptions.delete(busId);
      }
      console.log(`🛑 Stopped tracking bus ${busId}`);
    };
  }

  /**
   * Subscribe to all buses on a route
   * @param routeId - Route ID to track
   * @param callback - Callback function for updates
   * @returns Cleanup function
   */
  subscribeToRoute(routeId: string, callback: (data: BusLocation) => void) {
    console.log(`🔔 Subscribing to route ${routeId} (Firebase real-time)`);

    const firebaseCallback = (firebaseData: FirebaseBusLocation) => {
      const busLocation: BusLocation = {
        id: firebaseData.id,
        plateNumber: firebaseData.plateNumber,
        routeId: firebaseData.routeId,
        currentLat: firebaseData.location.lat,
        currentLng: firebaseData.location.lng,
        speed: firebaseData.speed,
        heading: firebaseData.heading,
        status: firebaseData.status,
        lastUpdated: new Date(firebaseData.lastUpdated).toISOString(),
      };

      callback(busLocation);
    };

    const unsubscribe = realtimeTrackingService.subscribeToRoute(routeId, firebaseCallback);
    
    this.activeSubscriptions.set(`route_${routeId}`, unsubscribe);

    return () => {
      const cleanup = this.activeSubscriptions.get(`route_${routeId}`);
      if (cleanup) {
        cleanup();
        this.activeSubscriptions.delete(`route_${routeId}`);
      }
      console.log(`🛑 Stopped tracking route ${routeId}`);
    };
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  /**
   * Cleanup all subscriptions
   */
  cleanup() {
    this.activeSubscriptions.forEach((unsubscribe) => {
      unsubscribe();
    });
    this.activeSubscriptions.clear();

    if (this.connectionUnsubscribe) {
      this.connectionUnsubscribe();
    }

    realtimeTrackingService.cleanup();
    console.log('🧹 Tracking service cleaned up');
  }
}

export const trackingService = new TrackingService();

