import { Router } from 'express';
import { AnalyticsController } from '../controllers/analytics.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// Secure analytics routes
router.use(authMiddleware);

router.get('/financials', AnalyticsController.getFinancials);
router.get('/scans', AnalyticsController.getScans);
router.get('/demographics', AnalyticsController.getDemographics);
router.get('/capacity', AnalyticsController.getCapacity);
router.get('/support', AnalyticsController.getSupportStats);
router.get('/summary', AnalyticsController.getSummary);

export default router;
