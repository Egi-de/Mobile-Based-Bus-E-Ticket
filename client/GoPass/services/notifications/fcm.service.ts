import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { apiClient } from '../api/client';

/**
 * FCM Service
 * Handles push notification registration and management
 */

// Configure notification behavior - DISABLED UI ALERTS
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: false,      // Disabled - no UI alerts
    shouldPlaySound: false,       // Disabled - no sounds
    shouldSetBadge: false,        // Disabled - no badge
    shouldShowBanner: false,      // Disabled - no banner
    shouldShowList: false,        // Disabled - no notification list
  }),
});

class FCMService {
  private expoPushToken: string | null = null;

  /**
   * Request notification permissions
   */
  async requestPermissions(): Promise<boolean> {
    if (!Device.isDevice) {
      console.warn('⚠️ Push notifications only work on physical devices');
      return false;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('⚠️ Notification permission denied');
        return false;
      }


      return true;
    } catch (error) {
      console.error('❌ Error requesting notification permissions:', error);
      return false;
    }
  }

  /**
   * Get Expo Push Token
   */
  async getExpoPushToken(): Promise<string | null> {
    if (this.expoPushToken) {
      return this.expoPushToken;
    }

    try {
      // Expo will automatically use the projectId from app.json
      const token = await Notifications.getExpoPushTokenAsync();

      this.expoPushToken = token.data;

      return this.expoPushToken;
    } catch (error) {
      console.error('❌ Error getting push token:', error);
      return null;
    }
  }

  /**
   * Register FCM token with backend
   */
  async registerToken(userId: string): Promise<void> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.log('⚠️ Skipping token registration - no permission');
        return;
      }

      const token = await this.getExpoPushToken();
      if (!token) {
        console.error('❌ Failed to get push token');
        return;
      }

      // Register token with backend
      await apiClient.post('/notifications/register-token', {
        userId,
        token,
        platform: Platform.OS,
        deviceId: Device.osInternalBuildId || 'unknown',
      });


    } catch (error) {
      console.error('❌ Error registering FCM token:', error);
    }
  }

  /**
   * Unregister FCM token
   */
  async unregisterToken(): Promise<void> {
    try {
      if (!this.expoPushToken) {
        return;
      }

      await apiClient.post('/notifications/unregister-token', {
        token: this.expoPushToken,
      });

      this.expoPushToken = null;

    } catch (error) {
      console.error('❌ Error unregistering FCM token:', error);
    }
  }

  /**
   * Listen for notification received (app in foreground)
   */
  onNotificationReceived(callback: (notification: Notifications.Notification) => void) {
    return Notifications.addNotificationReceivedListener(callback);
  }

  /**
   * Listen for notification tapped (app in background/closed)
   */
  onNotificationTapped(callback: (response: Notifications.NotificationResponse) => void) {
    return Notifications.addNotificationResponseReceivedListener(callback);
  }

  /**
   * Show local notification (for testing)
   */
  async showLocalNotification(title: string, body: string, data?: any) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
      },
      trigger: null, // Show immediately
    });
  }

  /**
   * Configure notification channels (Android)
   */
  async configureChannels() {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#4CAF50',
      });

      await Notifications.setNotificationChannelAsync('bus-tracking', {
        name: 'Bus Tracking',
        description: 'Notifications about bus arrivals and departures',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#4CAF50',
        sound: 'default',
      });
    }
  }
}

export const fcmService = new FCMService();
