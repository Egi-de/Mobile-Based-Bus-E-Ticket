import { Request, Response } from 'express';
import { RouteService } from '../services/route.service';
import { sendSuccess, sendError } from '../utils/response';

export const getRoutes = async (req: Request, res: Response) => {
  try {
    const { origin, destination } = req.query;
    
    const routes = await RouteService.getAllRoutes({
      origin: origin as string,
      destination: destination as string,
    });
    
    return sendSuccess(res, routes, 'Routes fetched successfully');
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
};

export const getRouteById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const routeId = Array.isArray(id) ? id[0] : id;
    const route = await RouteService.getRouteById(routeId);
    
    if (!route) {
      return sendError(res, 'Route not found', 404);
    }
    
    return sendSuccess(res, route, 'Route fetched successfully');
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
};

export const createRoute = async (req: Request, res: Response) => {
  try {
    const data = req.body;
    if (!data.origin || !data.destination || !data.price) {
      return sendError(res, 'origin, destination, and price are required', 400);
    }
    const route = await RouteService.createRoute(data);
    return sendSuccess(res, route, 'Route created successfully', 201);
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
};

export const updateRoute = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const routeId = Array.isArray(id) ? id[0] : id;
    const route = await RouteService.updateRoute(routeId, req.body);
    return sendSuccess(res, route, 'Route updated successfully');
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
};

export const deleteRoute = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const routeId = Array.isArray(id) ? id[0] : id;
    await RouteService.deleteRoute(routeId);
    return sendSuccess(res, null, 'Route deleted successfully');
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
};
