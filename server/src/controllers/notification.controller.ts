import { Request, Response } from 'express';
import { firebaseAdminService } from '../services/firebase-admin.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Register FCM token for push notifications
 */
export const registerToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, token, platform, deviceId } = req.body;

    if (!userId || !token) {
      res.status(400).json({ message: 'userId and token are required' });
      return;
    }

    // Validate token with Firebase
    const isValid = await firebaseAdminService.validateToken(token);
    if (!isValid) {
      res.status(400).json({ message: 'Invalid FCM token' });
      return;
    }

    // Store token in database
    const fcmToken = await prisma.fcmToken.upsert({
      where: { token },
      update: {
        userId,
        platform: platform || 'unknown',
        updatedAt: new Date(),
      },
      create: {
        userId,
        token,
        platform: platform || 'unknown',
        deviceId: deviceId || 'unknown',
      },
    });

    res.json({ success: true, tokenId: fcmToken.id });
  } catch (error) {
    console.error('Error registering FCM token:', error);
    res.status(500).json({ message: 'Error registering token', error });
  }
};

/**
 * Unregister FCM token
 */
export const unregisterToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.body;

    if (!token) {
      res.status(400).json({ message: 'token is required' });
      return;
    }

    await prisma.fcmToken.delete({
      where: { token },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error unregistering FCM token:', error);
    res.status(500).json({ message: 'Error unregistering token', error });
  }
};

/**
 * Get notification preferences for a user
 */
export const getPreferences = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;

    let preferences = await prisma.notificationPreference.findUnique({
      where: { userId },
    });

    // Create default preferences if none exist
    if (!preferences) {
      preferences = await prisma.notificationPreference.create({
        data: {
          userId,
          arrivalAlerts: true,
          arrivalMinutesBefore: 10,
          delayAlerts: true,
          statusChangeAlerts: true,
          soundEnabled: true,
          vibrationEnabled: true,
        },
      });
    }

    res.json(preferences);
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    res.status(500).json({ message: 'Error fetching preferences', error });
  }
};

/**
 * Update notification preferences
 */
export const updatePreferences = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
    const updates = req.body;

    const preferences = await prisma.notificationPreference.upsert({
      where: { userId },
      update: updates,
      create: {
        userId,
        ...updates,
      },
    });

    res.json(preferences);
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    res.status(500).json({ message: 'Error updating preferences', error });
  }
};

/**
 * Send test notification
 */
export const sendTestNotification = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.body;

    // Get user's FCM tokens
    const tokens = await prisma.fcmToken.findMany({
      where: { userId },
    });

    if (tokens.length === 0) {
      res.status(404).json({ message: 'No FCM tokens found for user' });
      return;
    }

    // Send test notification to all user's devices
    const results = await Promise.all(
      tokens.map((tokenData) =>
        firebaseAdminService.sendNotification(tokenData.token, {
          title: 'Test Notification',
          body: 'This is a test notification from GoPass',
          data: {
            type: 'test',
            timestamp: Date.now().toString(),
          },
        })
      )
    );

    const successCount = results.filter((r) => r).length;

    res.json({
      success: true,
      sent: successCount,
      total: tokens.length,
    });
  } catch (error) {
    console.error('Error sending test notification:', error);
    res.status(500).json({ message: 'Error sending notification', error });
  }
};
