import { Request, Response } from 'express';
import { TicketService } from '../services/ticket.service';
import { sendSuccess, sendError } from '../utils/response';

/**
 * Get ticket by ID
 */
export const getTicketById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const ticket = await TicketService.getTicketById(id as string);
    
    if (!ticket) {
      return sendError(res, 'Ticket not found', 404);
    }
    
    return sendSuccess(res, ticket, 'Ticket fetched successfully');
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
};

/**
 * Validate ticket
 */
export const validateTicket = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { tripId } = req.body;
    
    const result = await TicketService.validateTicket(id as string, tripId);
    
    if (!result.valid) {
      return sendError(res, result.message || 'Invalid ticket', 400);
    }
    
    return sendSuccess(res, result.ticket, 'Ticket is valid');
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
};
