import { Router } from 'express';
import { getRoutes, getRouteById, createRoute, updateRoute, deleteRoute } from '../controllers/route.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { checkRole } from '../middlewares/role.middleware';

const router = Router();

// Public routes
router.get('/', getRoutes);
router.get('/:id', getRouteById);

// Admin-only routes
router.post('/', authMiddleware, checkRole(['ADMIN']), createRoute);
router.put('/:id', authMiddleware, checkRole(['ADMIN']), updateRoute);
router.delete('/:id', authMiddleware, checkRole(['ADMIN']), deleteRoute);

export default router;
