import { Request, Response } from 'express';
import { BusService } from '../services/bus.service';
import { WebSocketServer } from '../websocket/socket.server';
import { firebaseAdminService } from '../services/firebase-admin.service';
import { sendSuccess, sendError } from '../utils/response';
import { notificationService } from '../services/notification.service';

export const getBus = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const bus = await BusService.getBusById(id);
    
    if (!bus) {
      sendError(res, 'Bus not found', 404);
      return;
    }
    
    sendSuccess(res, bus);
  } catch (error: any) {
    sendError(res, error.message || 'Error fetching bus', 500);
  }
};

export const getAllBuses = async (req: Request, res: Response): Promise<void> => {
  try {
    const buses = await BusService.getAllBuses();
    sendSuccess(res, buses);
  } catch (error: any) {
    sendError(res, error.message || 'Error fetching buses', 500);
  }
};

export const getRouteBuses = async (req: Request, res: Response): Promise<void> => {
  try {
    const routeId = req.params.routeId as string;
    const buses = await BusService.getBusesByRoute(routeId);
    sendSuccess(res, buses);
  } catch (error: any) {
    sendError(res, error.message || 'Error fetching route buses', 500);
  }
};

export const updateLocation = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { lat, lng, speed, heading, nextStopId, eta, seatsAvailable } = req.body;
    
    // Update in Prisma database (persistence)
    const bus = await BusService.updateBusLocation(id, lat, lng, speed, heading);
    
    // Update in Firebase Realtime Database (real-time)
    if (firebaseAdminService.isReady()) {
      await firebaseAdminService.updateBusLocation(id, {
        plateNumber: bus.plateNumber,
        routeId: bus.routeId || '',
        lat,
        lng,
        speed,
        heading,
        status: bus.status,
        nextStopId,
        eta,
        seatsAvailable,
      });
    }
    
    // Emit WebSocket update (legacy support)
    WebSocketServer.emitBusUpdate(id, bus);
    
    // Check and send arrival notifications (if bus is on route)
    if (bus.status === 'ON_ROUTE' && bus.routeId) {
      notificationService.checkAndSendArrivalNotifications(
        id,
        { lat, lng },
        speed || 0
      ).catch(err => {
        console.error('Failed to check arrival notifications:', err);
      });
    }
    
    sendSuccess(res, bus);
  } catch (error: any) {
    sendError(res, error.message || 'Error updating location', 500);
  }
};

export const createBus = async (req: Request, res: Response): Promise<void> => {
  try {
    const bus = await BusService.createBus(req.body);
    sendSuccess(res, bus, 'Bus created successfully', 201);
  } catch (error: any) {
    sendError(res, error.message || 'Error creating bus', 500);
  }
};

export const updateBus = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const bus = await BusService.updateBus(id, req.body);
    
    if (!bus) {
      sendError(res, 'Bus not found', 404);
      return;
    }
    
    sendSuccess(res, bus);
  } catch (error: any) {
    sendError(res, error.message || 'Error updating bus', 500);
  }
};

export const updateStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { status } = req.body;
    const bus = await BusService.updateBusStatus(id, status);
    
    // Trigger departure notification when bus starts tracking
    if (status === 'ON_ROUTE' && bus.routeId) {
      console.log(`🚌 Bus ${id} started tracking, sending departure notifications...`);
      // Fire and forget - don't wait for notifications
      notificationService.sendDepartureNotification(id, bus.routeId).catch(err => {
        console.error('Failed to send departure notification:', err);
      });
    }
    
    sendSuccess(res, bus);
  } catch (error: any) {
    sendError(res, error.message || 'Error updating bus status', 500);
  }
};

export const deleteBus = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    await BusService.deleteBus(id);
    sendSuccess(res, { message: 'Bus deleted successfully' });
  } catch (error: any) {
    sendError(res, error.message || 'Error deleting bus', 500);
  }
};
