import { Router } from 'express';
import {
  getTicketById,
  validateTicket,
} from '../controllers/ticket.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @swagger
 * /api/tickets/{id}:
 *   get:
 *     summary: Get ticket by ID
 *     tags: [Tickets]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Ticket details
 *       404:
 *         description: Ticket not found
 */
router.get('/:id', authMiddleware, getTicketById);

/**
 * @swagger
 * /api/tickets/{id}/validate:
 *   post:
 *     summary: Validate ticket
 *     tags: [Tickets]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tripId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Ticket is valid
 *       400:
 *         description: Invalid ticket
 */
router.post('/:id/validate', authMiddleware, validateTicket);

export default router;
