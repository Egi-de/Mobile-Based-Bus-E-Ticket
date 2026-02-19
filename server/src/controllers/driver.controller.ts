import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Get the bus assigned to the authenticated driver
 * Note: For now, we'll return the first available bus on a route
 * In production, you should add a driverId field to the Bus model
 */
export const getAssignedBus = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    // Find the driver's user record
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Find a bus assigned to a route
    // TODO: Add driverId field to Bus model for proper assignment
    const bus = await prisma.bus.findFirst({
      where: {
        routeId: { not: null },
      },
      include: {
        route: true,
      },
    });

    if (!bus) {
      res.status(404).json({ 
        message: 'No bus assigned to this driver',
        hasAssignment: false,
      });
      return;
    }

    // Return bus details with route information
    res.json({
      hasAssignment: true,
      bus: {
        id: bus.id,
        plateNumber: bus.plateNumber,
        status: bus.status,
        routeId: bus.routeId,
        route: bus.route ? {
          id: bus.route.id,
          name: `${bus.route.origin} - ${bus.route.destination}`,
          origin: bus.route.origin,
          destination: bus.route.destination,
        } : null,
      },
      driver: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Error fetching assigned bus:', error);
    res.status(500).json({ 
      message: 'Error fetching assigned bus', 
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
