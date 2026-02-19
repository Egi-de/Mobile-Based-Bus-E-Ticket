import { PrismaClient, BusStatus } from "@prisma/client";

const prisma = new PrismaClient();

export const BusService = {
  async getBusById(id: string) {
    return prisma.bus.findUnique({
      where: { id },
      include: { route: true },
    });
  },

  async getAllBuses() {
    return prisma.bus.findMany({
      include: {
        route: true,
        driver: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  },

  async getBusesByRoute(routeId: string) {
    return prisma.bus.findMany({
      where: { routeId },
      include: { route: true },
    });
  },

  async updateBusLocation(
    id: string,
    lat: number,
    lng: number,
    speed?: number,
    heading?: number,
  ) {
    const bus = await prisma.bus.update({
      where: { id },
      data: {
        currentLat: lat,
        currentLng: lng,
        speed,
        heading,
        status: "ON_ROUTE",
      },
    });
    return bus;
  },

  async updateBusStatus(id: string, status: BusStatus) {
    return prisma.bus.update({
      where: { id },
      data: { status },
    });
  },

  async createBus(data: any) {
    return prisma.bus.create({
      data,
    });
  },

  async updateBus(id: string, data: any) {
    // Only pass fields that exist in the Bus schema to avoid Prisma unknown-field errors
    const allowedFields = [
      "plateNumber",
      "routeId",
      "driverId",
      "status",
      "totalSeats",
      "imageUrl",
      "currentLat",
      "currentLng",
      "speed",
      "heading",
    ];
    const sanitized: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (key in data) sanitized[key] = data[key];
    }
    return prisma.bus.update({
      where: { id },
      data: sanitized,
      include: { route: true },
    });
  },

  async deleteBus(id: string) {
    return prisma.bus.delete({
      where: { id },
    });
  },
};
