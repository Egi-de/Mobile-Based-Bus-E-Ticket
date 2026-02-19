import { router } from 'expo-router';
import { useAuthStore } from '../stores/auth.store';

/**
 * Role-Based Navigation Helper
 * Automatically routes users to appropriate screens based on their role
 */

export type UserRole = 'DRIVER' | 'PASSENGER' | 'ADMIN';

/**
 * Navigate user to role-appropriate screen after login
 */
export const navigateByRole = (role?: UserRole, busId?: string) => {
  if (!role) {
    console.warn('⚠️ No role provided, defaulting to home');
    router.replace('/(tabs)');
    return;
  }

  console.log(`🧭 Navigating user with role: ${role}`);

  switch (role) {
    case 'DRIVER':
      // Drivers go to GPS tracking screen
      router.replace('/driver-tracking');
      break;

    case 'PASSENGER':
      // Passengers go to bus selection or tracking
      if (busId) {
        router.replace(`/passenger-tracking?busId=${busId}`);
      } else {
        router.replace('/(tabs)'); // Home to select a bus
      }
      break;

    case 'ADMIN':
      // Admins go to admin dashboard (if exists)
      router.replace('/(tabs)');
      break;

    default:
      console.warn(`⚠️ Unknown role: ${role}, defaulting to home`);
      router.replace('/(tabs)');
  }
};

/**
 * Get user role from auth store
 */
export const getUserRole = (): UserRole | undefined => {
  const user = useAuthStore.getState().user;
  return user?.role;
};

/**
 * Check if user has specific role
 */
export const hasRole = (role: UserRole): boolean => {
  const userRole = getUserRole();
  return userRole === role;
};

/**
 * Check if user is driver
 */
export const isDriver = (): boolean => {
  return hasRole('DRIVER');
};

/**
 * Check if user is passenger
 */
export const isPassenger = (): boolean => {
  return hasRole('PASSENGER');
};

/**
 * Get role-specific home route
 */
export const getRoleHomeRoute = (role?: UserRole): string => {
  switch (role) {
    case 'DRIVER':
      return '/driver-tracking';
    case 'PASSENGER':
      return '/(tabs)';
    case 'ADMIN':
      return '/(tabs)';
    default:
      return '/(tabs)';
  }
};
