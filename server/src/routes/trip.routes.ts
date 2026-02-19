import { Router } from 'express';
import {
  getTrips,
  getTripById,
  getTripsByRoute,
  createTrip,
  updateTripStatus,
  cancelTrip,
} from '../controllers/trip.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @swagger
 * /api/trips:
 *   get:
 *     tags: [Trips]
 *     summary: Get all trips with optional filters
 *     description: Retrieve trips filtered by route, date, or status
 *     security: []
 *     parameters:
 *       - in: query
 *         name: routeId
 *         schema:
 *           type: string
 *         description: Filter by route ID
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by date (YYYY-MM-DD)
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [WAITING, BOARDING, ON_ROUTE, COMPLETED, CANCELLED]
 *         description: Filter by trip status
 *     responses:
 *       200:
 *         description: Trips fetched successfully
 */
router.get('/', getTrips);

/**
 * @swagger
 * /api/trips/route/{routeId}:
 *   get:
 *     tags: [Trips]
 *     summary: Get trips for a specific route and date
 *     description: Primary endpoint for booking flow - get available trips
 *     security: []
 *     parameters:
 *       - in: path
 *         name: routeId
 *         required: true
 *         schema:
 *           type: string
 *         description: Route ID
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Travel date (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Trips fetched successfully
 *       400:
 *         description: Date parameter is required
 */
router.get('/route/:routeId', getTripsByRoute);

/**
 * @swagger
 * /api/trips/{id}:
 *   get:
 *     tags: [Trips]
 *     summary: Get trip by ID
 *     description: Get detailed trip information including bus, route, and driver
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Trip ID
 *     responses:
 *       200:
 *         description: Trip fetched successfully
 *       404:
 *         description: Trip not found
 */
router.get('/:id', getTripById);

/**
 * @swagger
 * /api/trips:
 *   post:
 *     tags: [Trips]
 *     summary: Create new trip
 *     description: Create a new trip (admin/driver only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - busId
 *               - routeId
 *               - departureTime
 *               - arrivalTime
 *             properties:
 *               busId:
 *                 type: string
 *               routeId:
 *                 type: string
 *               driverId:
 *                 type: string
 *               departureTime:
 *                 type: string
 *                 format: date-time
 *               arrivalTime:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Trip created successfully
 *       401:
 *         description: Unauthorized
 */
router.post('/', authMiddleware, createTrip);

/**
 * @swagger
 * /api/trips/{id}/status:
 *   put:
 *     tags: [Trips]
 *     summary: Update trip status
 *     description: Update trip status (driver app)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Trip ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tripStatus
 *             properties:
 *               tripStatus:
 *                 type: string
 *                 enum: [WAITING, BOARDING, ON_ROUTE, COMPLETED, CANCELLED]
 *               trackingEnabled:
 *                 type: boolean
 *               currentStopId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Trip status updated successfully
 *       404:
 *         description: Trip not found
 */
router.put('/:id/status', authMiddleware, updateTripStatus);

/**
 * @swagger
 * /api/trips/{id}/cancel:
 *   post:
 *     tags: [Trips]
 *     summary: Cancel trip
 *     description: Cancel a trip (admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Trip ID
 *     responses:
 *       200:
 *         description: Trip cancelled successfully
 */
router.post('/:id/cancel', authMiddleware, cancelTrip);

export default router;
