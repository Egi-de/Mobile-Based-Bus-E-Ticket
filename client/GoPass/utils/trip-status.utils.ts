// Trip status utilities
export enum TripStatus {
  BOARDING = 'boarding',
  IN_TRANSIT = 'in_transit',
  COMPLETED = 'completed',
}

export interface TripStatusInfo {
  status: TripStatus;
  label: string;
  description: string;
  color: string;
  icon: string;
}

export function getTripStatus(departureTime: string, arrivalTime: string): TripStatus {
  const now = new Date();
  const departure = new Date(departureTime);
  const arrival = new Date(arrivalTime);

  // If currently between departure and arrival, trip is in transit
  if (now >= departure && now < arrival) {
    return TripStatus.IN_TRANSIT;
  }
  
  // For all other cases (future trips or past trips), show as BOARDING
  // This allows users to book the next occurrence of the trip
  return TripStatus.BOARDING;
}

export function getTripStatusInfo(status: TripStatus, departureTime: string, nextStop?: string): TripStatusInfo {
  const departure = new Date(departureTime);
  const now = new Date();
  const minutesAgo = Math.floor((now.getTime() - departure.getTime()) / (1000 * 60));

  switch (status) {
    case TripStatus.BOARDING:
      return {
        status,
        label: 'Boarding Soon',
        description: `Departs ${departure.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        color: '#1FAA59', // Emerald
        icon: 'time-outline',
      };
    
    case TripStatus.IN_TRANSIT:
      const nextStopText = nextStop ? `Next: ${nextStop}` : 'On route';
      return {
        status,
        label: 'In Transit',
        description: minutesAgo > 0 ? `Departed ${minutesAgo} min ago • ${nextStopText}` : nextStopText,
        color: '#F4B400', // Gold
        icon: 'navigate-outline',
      };
    
    case TripStatus.COMPLETED:
      return {
        status,
        label: 'Trip Completed',
        description: 'Check next available trip',
        color: '#6B7280', // Gray
        icon: 'checkmark-circle-outline',
      };
  }
}

export function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  
  if (diffMins < 0) {
    const minutesAgo = Math.abs(diffMins);
    if (minutesAgo < 60) return `${minutesAgo} min ago`;
    const hoursAgo = Math.floor(minutesAgo / 60);
    return `${hoursAgo}h ago`;
  }
  
  if (diffMins < 60) return `in ${diffMins} min`;
  const hours = Math.floor(diffMins / 60);
  return `in ${hours}h`;
}
