import { Request, Response } from 'express';
import { StopService } from '../services/stop.service';
import { sendSuccess, sendError } from '../utils/response';

/**
 * Get stops by route
 */
export const getStopsByRoute = async (req: Request, res: Response) => {
  try {
    const { routeId } = req.params;
    const stops = await StopService.getStopsByRoute(routeId as string);
    return sendSuccess(res, stops, 'Stops fetched successfully');
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
};

/**
 * Get stop by ID
 */
export const getStopById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const stop = await StopService.getStopById(id as string);
    
    if (!stop) {
      return sendError(res, 'Stop not found', 404);
    }
    
    return sendSuccess(res, stop, 'Stop fetched successfully');
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
};

/**
 * Create new stop (admin only)
 */
export const createStop = async (req: Request, res: Response) => {
  try {
    const stopData = req.body;
    const stop = await StopService.createStop(stopData);
    return sendSuccess(res, stop, 'Stop created successfully', 201);
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
};

/**
 * Update stop (admin only)
 */
export const updateStop = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const stopData = req.body;
    
    const stop = await StopService.updateStop(id as string, stopData);
    
    if (!stop) {
      return sendError(res, 'Stop not found', 404);
    }
    
    return sendSuccess(res, stop, 'Stop updated successfully');
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
};

/**
 * Delete stop (admin only)
 */
export const deleteStop = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await StopService.deleteStop(id as string);
    return sendSuccess(res, null, 'Stop deleted successfully');
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
};

/**
 * Check nearby stops (driver app - GPS detection)
 */
export const checkNearbyStops = async (req: Request, res: Response) => {
  try {
    const { routeId, latitude, longitude } = req.query;
    
    if (!routeId || !latitude || !longitude) {
      return sendError(res, 'routeId, latitude, and longitude are required', 400);
    }
    
    const stops = await StopService.checkNearbyStops(
      routeId as string,
      parseFloat(latitude as string),
      parseFloat(longitude as string)
    );
    
    return sendSuccess(res, stops, 'Nearby stops checked successfully');
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
};
