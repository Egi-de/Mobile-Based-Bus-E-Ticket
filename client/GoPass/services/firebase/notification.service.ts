import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { apiClient } from '../api/client';
import { NotificationPayload, NotificationPreferences } from '../../types/firebase.types';

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

class NotificationService {
  private expoPushToken: string | null = null;
  private notificationListener: any = null;
  private responseListener: any = null;

  /**
   * Initialize notification service and request permissions
   */
  async initialize(): Promise<boolean> {
    try {
      // Check if device supports notifications
      if (!Device.isDevice) {
        console.warn('⚠️ Push notifications only work on physical devices');
        return false;
      }

      // Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('⚠️ Notification permissions not granted');
        return false;
      }

      // Get Expo push token
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      });
      
      this.expoPushToken = tokenData.data;
      console.log('✅ Expo Push Token:', this.expoPushToken);

      // Set up notification listeners
      this.setupListeners();

      // Configure notification channel for Android
      if (Platform.OS === 'android') {
        await this.setupAndroidChannel();
      }

      return true;
    } catch (error) {
      console.error('❌ Error initializing notifications:', error);
      return false;
    }
  }

  /**
   * Set up Android notification channel
   */
  private async setupAndroidChannel() {
    await Notifications.setNotificationChannelAsync('bus-tracking', {
      name: 'Bus Tracking',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#F2FD7D',
      sound: 'default',
      enableVibrate: true,
      enableLights: true,
    });

    await Notifications.setNotificationChannelAsync('arrival-alerts', {
      name: 'Arrival Alerts',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 500, 250, 500],
      lightColor: '#4CAF50',
      sound: 'default',
      enableVibrate: true,
      enableLights: true,
    });

    console.log('✅ Android notification channels configured');
  }

  /**
   * Set up notification listeners
   */
  private setupListeners() {
    // Listener for notifications received while app is foregrounded
    this.notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('📬 Notification received (foreground):', notification);
      this.handleNotificationReceived(notification);
    });

    // Listener for when user taps on notification
    this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('👆 Notification tapped:', response);
      this.handleNotificationResponse(response);
    });
  }

  /**
   * Handle notification received while app is in foreground
   */
  private handleNotificationReceived(notification: Notifications.Notification) {
    const data = notification.request.content.data as Partial<NotificationPayload>;
    
    // You can emit events here for the app to handle
    // For example, update a notification badge, show in-app alert, etc.
    console.log('Notification data:', data);
  }

  /**
   * Handle notification tap (deep linking)
   */
  private handleNotificationResponse(response: Notifications.NotificationResponse) {
    const data = response.notification.request.content.data as Partial<NotificationPayload>;
    
    // Deep link to tracking screen
    if (data.busId && data.routeId) {
      // You can use router.push here if you pass router instance
      // For now, we'll just log it
      console.log(`Navigate to bus tracking: busId=${data.busId}, routeId=${data.routeId}`);
    }
  }

  /**
   * Register FCM token with backend
   */
  async registerToken(userId: string): Promise<boolean> {
    if (!this.expoPushToken) {
      console.warn('⚠️ No push token available to register');
      return false;
    }

    try {
      await apiClient.post('/notifications/register-token', {
        userId,
        token: this.expoPushToken,
        platform: Platform.OS,
        deviceId: Constants.deviceId || 'unknown',
      });

      console.log('✅ Push token registered with backend');
      return true;
    } catch (error) {
      console.error('❌ Error registering push token:', error);
      return false;
    }
  }

  /**
   * Unregister FCM token (on logout)
   */
  async unregisterToken(): Promise<boolean> {
    if (!this.expoPushToken) {
      return true;
    }

    try {
      await apiClient.post('/notifications/unregister-token', {
        token: this.expoPushToken,
      });

      console.log('✅ Push token unregistered');
      return true;
    } catch (error) {
      console.error('❌ Error unregistering push token:', error);
      return false;
    }
  }

  /**
   * Send local notification (for testing or immediate alerts)
   */
  async sendLocalNotification(
    title: string,
    body: string,
    data?: Record<string, any>
  ): Promise<void> {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: 'default',
        badge: 1,
      },
      trigger: null, // Send immediately
    });
  }

  /**
   * Schedule notification for future delivery
   */
  async scheduleNotification(
    title: string,
    body: string,
    triggerSeconds: number,
    data?: Record<string, any>
  ): Promise<string> {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: 'default',
        badge: 1,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: triggerSeconds,
      },
    });

    return notificationId;
  }

  /**
   * Cancel scheduled notification
   */
  async cancelNotification(notificationId: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  }

  /**
   * Cancel all scheduled notifications
   */
  async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  /**
   * Get notification preferences from backend
   */
  async getPreferences(userId: string): Promise<NotificationPreferences | null> {
    try {
      const response = await apiClient.get(`/notifications/preferences/${userId}`);
      return response.data as NotificationPreferences;
    } catch (error) {
      console.error('❌ Error fetching notification preferences:', error);
      return null;
    }
  }

  /**
   * Update notification preferences
   */
  async updatePreferences(
    userId: string,
    preferences: Partial<NotificationPreferences>
  ): Promise<boolean> {
    try {
      await apiClient.put(`/notifications/preferences/${userId}`, preferences);
      console.log('✅ Notification preferences updated');
      return true;
    } catch (error) {
      console.error('❌ Error updating notification preferences:', error);
      return false;
    }
  }

  /**
   * Get badge count
   */
  async getBadgeCount(): Promise<number> {
    return await Notifications.getBadgeCountAsync();
  }

  /**
   * Set badge count
   */
  async setBadgeCount(count: number): Promise<void> {
    await Notifications.setBadgeCountAsync(count);
  }

  /**
   * Clear badge
   */
  async clearBadge(): Promise<void> {
    await Notifications.setBadgeCountAsync(0);
  }

  /**
   * Get push token
   */
  getPushToken(): string | null {
    return this.expoPushToken;
  }

  /**
   * Clean up listeners
   */
  cleanup() {
    if (this.notificationListener) {
      this.notificationListener.remove();
    }
    if (this.responseListener) {
      this.responseListener.remove();
    }
    console.log('🧹 Notification listeners cleaned up');
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
