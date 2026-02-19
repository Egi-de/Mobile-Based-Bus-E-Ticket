import { Router } from 'express';
import {
  getStopsByRoute,
  getStopById,
  createStop,
  updateStop,
  deleteStop,
  checkNearbyStops,
} from '../controllers/stop.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @swagger
 * /api/stops/route/{routeId}:
 *   get:
 *     tags: [Stops]
 *     summary: Get stops for a route
 *     description: Get all stops for a specific route, ordered by orderNumber
 *     security: []
 *     parameters:
 *       - in: path
 *         name: routeId
 *         required: true
 *         schema:
 *           type: string
 *         description: Route ID
 *     responses:
 *       200:
 *         description: Stops fetched successfully
 */
router.get('/route/:routeId', getStopsByRoute);

/**
 * @swagger
 * /api/stops/nearby:
 *   get:
 *     tags: [Stops]
 *     summary: Check nearby stops
 *     description: Find stops within detection radius of GPS coordinates (driver app)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: routeId
 *         required: true
 *         schema:
 *           type: string
 *         description: Route ID
 *       - in: query
 *         name: latitude
 *         required: true
 *         schema:
 *           type: number
 *         description: Current latitude
 *       - in: query
 *         name: longitude
 *         required: true
 *         schema:
 *           type: number
 *         description: Current longitude
 *     responses:
 *       200:
 *         description: Nearby stops checked successfully
 *       400:
 *         description: Missing required parameters
 */
router.get('/nearby', authMiddleware, checkNearbyStops);

/**
 * @swagger
 * /api/stops/{id}:
 *   get:
 *     tags: [Stops]
 *     summary: Get stop by ID
 *     description: Get detailed stop information
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Stop ID
 *     responses:
 *       200:
 *         description: Stop fetched successfully
 *       404:
 *         description: Stop not found
 */
router.get('/:id', getStopById);

/**
 * @swagger
 * /api/stops:
 *   post:
 *     tags: [Stops]
 *     summary: Create new stop
 *     description: Create a new stop (admin only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - routeId
 *               - stopName
 *               - latitude
 *               - longitude
 *               - orderNumber
 *             properties:
 *               routeId:
 *                 type: string
 *               stopName:
 *                 type: string
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *               orderNumber:
 *                 type: integer
 *               detectionRadius:
 *                 type: number
 *                 default: 100
 *               estimatedArrivalMinutes:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Stop created successfully
 */
router.post('/', authMiddleware, createStop);

/**
 * @swagger
 * /api/stops/{id}:
 *   put:
 *     tags: [Stops]
 *     summary: Update stop
 *     description: Update stop details (admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Stop ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Stop updated successfully
 *       404:
 *         description: Stop not found
 */
router.put('/:id', authMiddleware, updateStop);

/**
 * @swagger
 * /api/stops/{id}:
 *   delete:
 *     tags: [Stops]
 *     summary: Delete stop
 *     description: Delete a stop (admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Stop ID
 *     responses:
 *       200:
 *         description: Stop deleted successfully
 */
router.delete('/:id', authMiddleware, deleteStop);

export default router;
