import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { checkRole } from '../middlewares/role.middleware';
import { asyncHandler } from '../utils/response';

const router = Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Apply admin role check to all routes
router.use(checkRole(['ADMIN']));

// Routes
router.get('/', asyncHandler(UserController.getAllUsers));
router.get('/:id', asyncHandler(UserController.getUserById));
router.put('/:id', asyncHandler(UserController.updateUser));
router.patch('/:id/role', asyncHandler(UserController.updateUserRole));
router.delete('/:id', asyncHandler(UserController.deleteUser));

export default router;
