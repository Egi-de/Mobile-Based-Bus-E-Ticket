export interface FirebaseBusLocation {
  id: string;
  plateNumber: string;
  routeId: string;
  location: {
    lat: number;
    lng: number;
  };
  speed: number; // km/h
  heading: number; // degrees 0-360
  status: 'IDLE' | 'ON_ROUTE' | 'DELAYED' | 'MAINTENANCE';
  lastUpdated: number; // timestamp in milliseconds
  nextStopId?: string;
  eta?: number; // seconds to next stop
  seatsAvailable?: number;
}

export interface FirebaseRouteData {
  id: string;
  origin: string;
  destination: string;
  waypoints?: Array<{
    lat: number;
    lng: number;
    name: string;
    order: number;
  }>;
  activeBuses: string[]; // Array of bus IDs
}

export interface NotificationPayload {
  type: 'arrival' | 'delay' | 'status_change' | 'departure';
  busId: string;
  routeId: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  timestamp: number;
}

export interface BusUpdateEvent {
  type: 'location' | 'status' | 'eta';
  busId: string;
  data: Partial<FirebaseBusLocation>;
  timestamp: number;
}

export interface NotificationPreferences {
  arrivalAlerts: boolean;
  arrivalMinutesBefore: number; // 5, 10, 15, 20
  delayAlerts: boolean;
  statusChangeAlerts: boolean;
  departureAlerts: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

export interface FcmTokenData {
  token: string;
  userId: string;
  platform: 'android' | 'ios' | 'web';
  deviceId: string;
  createdAt: number;
  updatedAt: number;
}
