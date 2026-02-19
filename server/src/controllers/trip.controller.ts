import { Request, Response } from 'express';
import { TripService } from '../services/trip.service';
import { sendSuccess, sendError } from '../utils/response';

/**
 * Get trips by route and date (for booking flow)
 */
export const getTripsByRoute = async (req: Request, res: Response) => {
  try {
    const { routeId } = req.params;
    const { date } = req.query;
    
    if (!date) {
      return sendError(res, 'Date parameter is required', 400);
    }
    
    const trips = await TripService.getTripsByRouteAndDate(routeId as string, date as string);
    return sendSuccess(res, trips, 'Trips fetched successfully');
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
};

/**
 * Get all trips with optional filters
 */
export const getTrips = async (req: Request, res: Response) => {
  try {
    const { routeId, date, status } = req.query;
    
    const trips = await TripService.getAllTrips({
      routeId: routeId as string,
      date: date as string,
      status: status as any,
    });
    
    return sendSuccess(res, trips, 'Trips fetched successfully');
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
};

/**
 * Get trip by ID
 */
export const getTripById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const trip = await TripService.getTripById(id as string);
    
    if (!trip) {
      return sendError(res, 'Trip not found', 404);
    }
    
    return sendSuccess(res, trip, 'Trip fetched successfully');
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
};

/**
 * Create new trip (admin/driver only)
 */
export const createTrip = async (req: Request, res: Response) => {
  try {
    const tripData = req.body;
    const trip = await TripService.createTrip(tripData);
    return sendSuccess(res, trip, 'Trip created successfully', 201);
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
};

/**
 * Update trip status (driver app)
 */
export const updateTripStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const statusData = req.body;
    
    const trip = await TripService.updateTripStatus(id as string, statusData);
    
    if (!trip) {
      return sendError(res, 'Trip not found', 404);
    }
    
    return sendSuccess(res, trip, 'Trip status updated successfully');
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
};

/**
 * Cancel trip (admin only)
 */
export const cancelTrip = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await TripService.cancelTrip(id as string);
    return sendSuccess(res, null, 'Trip cancelled successfully');
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
};
