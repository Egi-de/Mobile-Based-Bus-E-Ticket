import { Router } from 'express';
import {
  registerToken,
  unregisterToken,
  getPreferences,
  updatePreferences,
  sendTestNotification,
} from '../controllers/notification.controller';

const router = Router();

// Token management
router.post('/register-token', registerToken);
router.post('/unregister-token', unregisterToken);

// Preferences
router.get('/preferences/:userId', getPreferences);
router.put('/preferences/:userId', updatePreferences);

// Testing
router.post('/test', sendTestNotification);

export default router;
