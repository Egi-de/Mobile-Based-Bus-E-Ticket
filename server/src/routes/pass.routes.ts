import { Router } from 'express';
import {
  getPassTemplates,
  createPass,
  getMyPasses,
  getAllPasses,
  deletePass,
  updatePassStatus,
} from '../controllers/pass.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { checkRole } from '../middlewares/role.middleware';

const router = Router();

// Protected routes
router.use(authMiddleware);

/**
 * @swagger
 * /api/passes/templates:
 *   get:
 *     tags: [Passes]
 *     summary: Get pass templates
 *     description: Retrieve available pass types and pricing
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Pass templates retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   type: { type: string, enum: [DAILY, WEEKLY, MONTHLY] }
 *                   price: { type: number }
 *                   duration: { type: number }
 *       401:
 *         description: Unauthorized
 */
router.get('/templates', getPassTemplates);

/**
 * @swagger
 * /api/passes:
 *   post:
 *     tags: [Passes]
 *     summary: Purchase a pass
 *     description: Create a new pass subscription
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [type]
 *             properties:
 *               type: 
 *                 type: string
 *                 enum: [DAILY, WEEKLY, MONTHLY]
 *                 example: "WEEKLY"
 *     responses:
 *       201:
 *         description: Pass created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Pass'
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 */
router.post('/', createPass);

/**
 * @swagger
 * /api/passes:
 *   get:
 *     tags: [Passes]
 *     summary: Get passes
 *     description: Get user's passes (or all passes for admin)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Passes retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Pass'
 *       401:
 *         description: Unauthorized
 */
router.get('/', (req, res) => {
  const userRole = (req as any).user?.role;
  if (userRole === 'ADMIN') {
    return getAllPasses(req, res);
  }
  return getMyPasses(req, res);
});

// Admin-only pass management
router.delete('/:id', checkRole(['ADMIN']), deletePass);
router.patch('/:id/status', checkRole(['ADMIN']), updatePassStatus);

export default router;
