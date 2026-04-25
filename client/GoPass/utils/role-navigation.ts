import { router } from 'expo-router';
import { useAuthStore } from '../stores/auth.store';

export type UserRole = 'DRIVER' | 'PASSENGER';

export const navigateByRole = (role?: UserRole, busId?: string) => {
  if (!role) {
    router.replace('/(tabs)');
    return;
  }

  switch (role) {
    case 'DRIVER':
      router.replace('/driver-tracking');
      break;
    case 'PASSENGER':
      if (busId) {
        router.replace(`/passenger-tracking?busId=${busId}`);
      } else {
        router.replace('/(tabs)');
      }
      break;
    default:
      router.replace('/(tabs)');
  }
};

export const getUserRole = (): UserRole | undefined => {
  const user = useAuthStore.getState().user;
  return user?.role as UserRole | undefined;
};

export const hasRole = (role: UserRole): boolean => {
  const userRole = getUserRole();
  return userRole === role;
};

export const isDriver = (): boolean => {
  return hasRole('DRIVER');
};

export const isPassenger = (): boolean => {
  return hasRole('PASSENGER');
};

export const getRoleHomeRoute = (role?: UserRole): string => {
  switch (role) {
    case 'DRIVER':
      return '/driver-tracking';
    case 'PASSENGER':
    default:
      return '/(tabs)';
  }
};
