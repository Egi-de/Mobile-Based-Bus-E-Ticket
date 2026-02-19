import * as admin from 'firebase-admin';

class FirebaseAdminService {
  private database: admin.database.Database | null = null;
  private messaging: admin.messaging.Messaging | null = null;
  private storage: admin.storage.Storage | null = null;
  private isInitialized: boolean = false;

  /**
   * Initialize Firebase Admin SDK
   */
  initialize() {
    if (this.isInitialized) {
      console.log('⚠️ Firebase Admin already initialized');
      return;
    }

    try {
      // Get credentials from environment
      const projectId = process.env.FIREBASE_PROJECT_ID;
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
      const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
      const databaseURL = process.env.FIREBASE_DATABASE_URL;

      // Validate configuration
      if (!projectId || !clientEmail || !privateKey || !databaseURL) {
        console.warn(
          '⚠️ Firebase Admin configuration incomplete. Missing environment variables:\n' +
          `  FIREBASE_PROJECT_ID: ${projectId ? '✓' : '✗'}\n` +
          `  FIREBASE_CLIENT_EMAIL: ${clientEmail ? '✓' : '✗'}\n` +
          `  FIREBASE_PRIVATE_KEY: ${privateKey ? '✓' : '✗'}\n` +
          `  FIREBASE_DATABASE_URL: ${databaseURL ? '✓' : '✗'}\n` +
          'Firebase real-time features will not work until configured.'
        );
        return;
      }

      const storageBucket = process.env.FIREBASE_STORAGE_BUCKET || 'mobile-based-bus-ticket.appspot.com';

      // Initialize Firebase Admin
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        databaseURL,
        storageBucket,
      });

      this.database = admin.database();
      this.messaging = admin.messaging();
      this.storage = admin.storage();
      this.isInitialized = true;

      console.log('✅ Firebase Admin SDK initialized successfully');
    } catch (error) {
      console.error('❌ Firebase Admin initialization failed:', error);
    }
  }

  /**
   * Get Firebase Realtime Database instance
   */
  getDatabase(): admin.database.Database | null {
    if (!this.isInitialized) {
      console.warn('⚠️ Firebase Admin not initialized');
      return null;
    }
    return this.database;
  }

  /**
   * Get Firebase Storage instance
   */
  getStorage(): admin.storage.Storage | null {
    if (!this.isInitialized) {
      console.warn('⚠️ Firebase Admin not initialized');
      return null;
    }
    return this.storage;
  }

  /**
   * Get Firebase Cloud Messaging instance
   */
  getMessaging(): admin.messaging.Messaging | null {
    if (!this.isInitialized) {
      console.warn('⚠️ Firebase Admin not initialized');
      return null;
    }
    return this.messaging;
  }

  /**
   * Update bus location in Firebase Realtime Database
   */
  async updateBusLocation(
    busId: string,
    data: {
      plateNumber: string;
      routeId: string;
      lat: number;
      lng: number;
      speed?: number;
      heading?: number;
      status?: string;
      nextStopId?: string;
      eta?: number;
      seatsAvailable?: number;
    }
  ): Promise<boolean> {
    if (!this.database) {
      console.warn('⚠️ Firebase database not available');
      return false;
    }

    try {
      const busRef = this.database.ref(`buses/${busId}`);
      
      await busRef.set({
        id: busId,
        plateNumber: data.plateNumber,
        routeId: data.routeId,
        location: {
          lat: data.lat,
          lng: data.lng,
        },
        speed: data.speed || 0,
        heading: data.heading || 0,
        status: data.status || 'ON_ROUTE',
        lastUpdated: Date.now(),
        nextStopId: data.nextStopId || null,
        eta: data.eta || null,
        seatsAvailable: data.seatsAvailable || null,
      });

      console.log(`✅ Updated bus ${busId} location in Firebase`);
      return true;
    } catch (error) {
      console.error(`❌ Error updating bus ${busId} in Firebase:`, error);
      return false;
    }
  }

  /**
   * Delete bus location from Firebase (when bus goes offline)
   */
  async deleteBusLocation(busId: string): Promise<boolean> {
    if (!this.database) {
      return false;
    }

    try {
      const busRef = this.database.ref(`buses/${busId}`);
      await busRef.remove();
      console.log(`✅ Removed bus ${busId} from Firebase`);
      return true;
    } catch (error) {
      console.error(`❌ Error removing bus ${busId} from Firebase:`, error);
      return false;
    }
  }

  /**
   * Send push notification to a single device
   */
  async sendNotification(
    token: string,
    notification: {
      title: string;
      body: string;
      data?: Record<string, string>;
    }
  ): Promise<boolean> {
    if (!this.messaging) {
      console.warn('⚠️ Firebase messaging not available');
      return false;
    }

    try {
      const message: admin.messaging.Message = {
        token,
        notification: {
          title: notification.title,
          body: notification.body,
        },
        data: notification.data,
        android: {
          priority: 'high',
          notification: {
            channelId: 'bus-tracking',
            sound: 'default',
            priority: 'max',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
      };

      const response = await this.messaging.send(message);
      console.log(`✅ Notification sent successfully:`, response);
      return true;
    } catch (error) {
      console.error('❌ Error sending notification:', error);
      return false;
    }
  }

  /**
   * Send push notification to multiple devices
   */
  async sendMulticastNotification(
    tokens: string[],
    notification: {
      title: string;
      body: string;
      data?: Record<string, string>;
    }
  ): Promise<{ successCount: number; failureCount: number }> {
    if (!this.messaging) {
      console.warn('⚠️ Firebase messaging not available');
      return { successCount: 0, failureCount: tokens.length };
    }

    try {
      const message: admin.messaging.MulticastMessage = {
        tokens,
        notification: {
          title: notification.title,
          body: notification.body,
        },
        data: notification.data,
        android: {
          priority: 'high',
          notification: {
            channelId: 'arrival-alerts',
            sound: 'default',
            priority: 'max',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
      };

      const response = await this.messaging.sendEachForMulticast(message);
      
      console.log(
        `✅ Multicast notification sent: ${response.successCount} succeeded, ${response.failureCount} failed`
      );

      return {
        successCount: response.successCount,
        failureCount: response.failureCount,
      };
    } catch (error) {
      console.error('❌ Error sending multicast notification:', error);
      return { successCount: 0, failureCount: tokens.length };
    }
  }

  /**
   * Validate FCM token
   */
  async validateToken(token: string): Promise<boolean> {
    if (!this.messaging) {
      return false;
    }

    try {
      // Try to send a dry-run message to validate the token
      await this.messaging.send(
        {
          token,
          data: { test: 'true' },
        },
        true // dry run
      );
      return true;
    } catch (error) {
      console.warn(`⚠️ Invalid FCM token: ${token}`);
      return false;
    }
  }

  /**
   * Check if Firebase Admin is initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }
}

// Export singleton instance
export const firebaseAdminService = new FirebaseAdminService();
