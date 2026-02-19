import { Router } from 'express';
import {
  getAllBuses,
  getBus,
  getRouteBuses,
  updateLocation,
  createBus,
  updateBus,
  updateStatus,
  deleteBus
} from '../controllers/bus.controller';

const router = Router();

router.get('/', getAllBuses);
router.get('/:id', getBus);
router.get('/route/:routeId', getRouteBuses);
router.post('/:id/location', updateLocation);
router.post('/', createBus); // For testing/seeding
router.put('/:id', updateBus); // Update bus (assign driver, change route, etc.)
router.patch('/:id/status', updateStatus); // Update bus status
router.delete('/:id', deleteBus); // Delete bus

export default router;
