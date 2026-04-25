import { Router } from 'express';
import routeRoutes from './route.routes';
import authRoutes from './auth.routes';
import bookingRoutes from './booking.routes';
import passRoutes from './pass.routes';
import busRoutes from './bus.routes';
import statsRoutes from './stats.routes';
import userRoutes from './user.routes';
import driverRoutes from './driver.routes';
import notificationRoutes from './notification.routes';
import tripRoutes from './trip.routes';
import stopRoutes from './stop.routes';
import ticketRoutes from './ticket.routes';
import analyticsRoutes from './analytics.routes';
import { StorageController } from '../controllers/storage.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { asyncHandler } from '../utils/response';

const router = Router();

// Mount route modules
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/drivers', driverRoutes);
router.use('/routes', routeRoutes);
router.use('/trips', tripRoutes);
router.use('/stops', stopRoutes);
router.use('/tickets', ticketRoutes);
router.use('/bookings', bookingRoutes);
router.use('/passes', passRoutes);
router.use('/buses', busRoutes);
router.use('/stats', statsRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/notifications', notificationRoutes);

// Storage routes
router.post('/storage/upload', authMiddleware, asyncHandler(StorageController.uploadImage));
router.delete('/storage/:publicId', authMiddleware, asyncHandler(StorageController.deleteImage));

// Health check for API
router.get('/', (_req, res) => {
  res.json({
    message: 'GoPass API v1',
    status: 'active',
    endpoints: {
      auth: '/api/auth',
      routes: '/api/routes',
      bookings: '/api/bookings',
    },
  });
});

export default router;
