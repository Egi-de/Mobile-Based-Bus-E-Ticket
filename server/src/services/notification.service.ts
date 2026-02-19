import { PrismaClient } from '@prisma/client';
import { firebaseAdminService } from './firebase-admin.service';

const prisma = new PrismaClient();


class NotificationService {
  
  async sendDepartureNotification(busId: string, routeId: string): Promise<void> {
    try {
      
      const bookings = await prisma.booking.findMany({
        where: {
          routeId,
          status: 'ACTIVE',
          travelDate: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)), 
          },
        },
        include: {
          user: {
            include: {
              fcmTokens: true,
            },
          },
          route: true,
        },
      });

      if (bookings.length === 0) {
        console.log('ℹ️ No active bookings found for this route');
        return;
      }

      
      for (const booking of bookings) {
        const tokens = booking.user.fcmTokens.map((t) => t.token);
        
        if (tokens.length === 0) {
          console.log(`⚠️ No FCM tokens for user ${booking.user.name}`);
          continue;
        }

        await firebaseAdminService.sendMulticastNotification(tokens, {
          title: '🚌 Bus Departed!',
          body: `Your bus on ${booking.route.origin} - ${booking.route.destination} route has started its journey. Track it now!`,
          data: {
            type: 'BUS_DEPARTED',
            busId,
            routeId,
            bookingId: booking.id,
          },
        });

        
      }
    } catch (error) {
      console.error('❌ Error sending departure notifications:', error);
    }
  }


  async sendArrivalNotification(
    userId: string,
    busId: string,
    stopName: string,
    eta: number
  ): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { fcmTokens: true },
      });

      if (!user || user.fcmTokens.length === 0) {
        return;
      }

      const tokens = user.fcmTokens.map((t) => t.token);
      const etaMinutes = Math.ceil(eta / 60);

      await firebaseAdminService.sendMulticastNotification(tokens, {
        title: '🔔 Bus Arriving Soon!',
        body: `Your bus will arrive at ${stopName} in approximately ${etaMinutes} minute${etaMinutes > 1 ? 's' : ''}`,
        data: {
          type: 'BUS_ARRIVING',
          busId,
          stopName,
          eta: eta.toString(),
        },
      });

      
    } catch (error) {
      console.error('❌ Error sending arrival notification:', error);
    }
  }

 
  private async hasBeenNotified(bookingId: string, type: string): Promise<boolean> {
    const log = await prisma.notificationLog.findFirst({
      where: {
        bookingId,
        type,
      },
    });
    return !!log;
  }

  
  private async markAsNotified(bookingId: string, type: string): Promise<void> {
    await prisma.notificationLog.create({
      data: {
        bookingId,
        type,
      },
    });
  }

   
  async checkAndSendArrivalNotifications(
    busId: string,
    location: { lat: number; lng: number },
    speed: number
  ): Promise<void> {
    try {
      // Get bus with route information
      const bus = await prisma.bus.findUnique({
        where: { id: busId },
        include: {
          route: true,
        },
      });

      if (!bus || !bus.route) {
        return;
      }

      // Get all active bookings for this route
      const bookings = await prisma.booking.findMany({
        where: {
          routeId: bus.routeId!,
          status: 'ACTIVE',
          travelDate: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)), // Today or later
          },
        },
        include: {
          user: {
            include: {
              fcmTokens: true,
              notificationPreference: true,
            },
          },
          route: true,
        },
      });

      if (bookings.length === 0) {
        return;
      }

      // Import geofencing service dynamically
      const { geofencingService } = await import('./geofencing.service');

      // Check each booking
      for (const booking of bookings) {
        // Get user preferences
        const prefs = booking.user.notificationPreference;
        if (!prefs || !prefs.arrivalAlerts) {
          continue; // User has disabled arrival alerts
        }

        // Check if already notified
        if (await this.hasBeenNotified(booking.id, 'ARRIVAL')) {
          continue;
        }

        // Calculate distance to destination
        const destination = {
          lat: parseFloat(booking.route.destination.split(',')[0] || '0'),
          lng: parseFloat(booking.route.destination.split(',')[1] || '0'),
        };

        const distance = geofencingService.calculateDistance(location, destination);
        const eta = geofencingService.calculateETA(distance, speed * 3.6); // Convert m/s to km/h

        // Check if we should notify
        const etaMinutes = eta / 60;
        const threshold = prefs.arrivalMinutesBefore;

        // Notify if ETA is within threshold (e.g., 10 minutes) but not too close (> 2 minutes)
        if (etaMinutes <= threshold && etaMinutes > 2) {
          await this.sendArrivalNotification(
            booking.userId,
            busId,
            booking.route.destination,
            eta
          );

          // Mark as notified to prevent duplicates
          await this.markAsNotified(booking.id, 'ARRIVAL');
        }
      }
    } catch (error) {
      console.error('❌ Error checking arrival notifications:', error);
    }
  }

  /**
   * Clean up old notification logs (older than 24 hours)
   */
  async cleanupOldLogs(): Promise<void> {
    try {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      await prisma.notificationLog.deleteMany({
        where: {
          sentAt: {
            lt: oneDayAgo,
          },
        },
      });

      // console.log('✅ Cleaned up old notification logs');
    } catch (error) {
      console.error('❌ Error cleaning up notification logs:', error);
    }
  }
}

export const notificationService = new NotificationService();
