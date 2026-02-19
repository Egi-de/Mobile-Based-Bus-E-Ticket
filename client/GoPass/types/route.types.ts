export enum BusType {
  STANDARD = 'Standard',
  VIP = 'VIP',
}

export enum BusOperator {
  KIGALI_BUS = 'Kigali Bus Service',
  VIRUNGA = 'Virunga Express',
  RITCO = 'Ritco Express',
  VOLCANO = 'Volcano Express',
  HORIZON = 'Horizon Express'
}

export interface Route {
  id: string;
  origin: string;
  destination: string;
  departureTime: string; // ISO string
  arrivalTime: string; // ISO string
  price: number;
  operator: BusOperator;
  seatsAvailable: number;
  totalSeats: number;
  amenities: string[];
  plateNumber?: string;
  busType?: string; // "VIP", "Express", "Standard"
  currentLocation?: string;
  nextStop?: string;
  estimatedArrival?: string;
  /** Optional bus/coach image URL for better UX */
  imageUrl?: string | null;
}

export interface RouteSearchParams {
  origin?: string;
  destination?: string;
  date?: string;
}
