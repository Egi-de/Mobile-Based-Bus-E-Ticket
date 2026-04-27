import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
} as const;

// Web fallback using localStorage
const webStore = {
  setItemAsync: async (key: string, value: string) => localStorage.setItem(key, value),
  getItemAsync: async (key: string) => localStorage.getItem(key),
  deleteItemAsync: async (key: string) => localStorage.removeItem(key),
};

const store = Platform.OS === 'web' ? webStore : SecureStore;

export const secureStorage = {
  async setAccessToken(token: string): Promise<void> {
    await store.setItemAsync(KEYS.ACCESS_TOKEN, token);
  },

  async getAccessToken(): Promise<string | null> {
    return await store.getItemAsync(KEYS.ACCESS_TOKEN);
  },

  async setRefreshToken(token: string): Promise<void> {
    await store.setItemAsync(KEYS.REFRESH_TOKEN, token);
  },

  async getRefreshToken(): Promise<string | null> {
    return await store.getItemAsync(KEYS.REFRESH_TOKEN);
  },

  async setUserData(userData: string): Promise<void> {
    await store.setItemAsync(KEYS.USER_DATA, userData);
  },

  async getUserData(): Promise<string | null> {
    return await store.getItemAsync(KEYS.USER_DATA);
  },

  async clearAll(): Promise<void> {
    await Promise.all([
      store.deleteItemAsync(KEYS.ACCESS_TOKEN),
      store.deleteItemAsync(KEYS.REFRESH_TOKEN),
      store.deleteItemAsync(KEYS.USER_DATA),
    ]);
  },
};