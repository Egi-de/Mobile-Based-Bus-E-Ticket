import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { checkRole } from '../middlewares/role.middleware';
import { getAssignedBus } from '../controllers/driver.controller';

const router = Router();

/**
 * @route   GET /api/drivers/me/assigned-bus
 * @desc    Get the bus assigned to the authenticated driver
 * @access  Private (DRIVER only)
 */
router.get('/me/assigned-bus', authMiddleware, checkRole(['DRIVER']), getAssignedBus);

export default router;
