import { PrismaClient, BookingStatus } from '@prisma/client';

const prisma = new PrismaClient();

export const StatsService = {
  async getDashboardStats() {
    const [totalUsers, activeBuses, totalBookings, activePasses, revenueResult, recentBookings] = await Promise.all([
      prisma.user.count(),
      prisma.bus.count({
        where: { status: 'ON_ROUTE' }
      }),
      prisma.booking.count(),
      prisma.pass.count({
        where: { status: 'ACTIVE' }
      }),
      prisma.booking.aggregate({
        _sum: { totalAmount: true },
        where: { status: { in: [BookingStatus.ACTIVE, BookingStatus.USED] } },
      }),
      prisma.booking.findMany({
        take: 5,
        orderBy: { bookingDate: 'desc' },
        include: {
          user: { select: { name: true, email: true } },
          route: { select: { origin: true, destination: true } },
        },
      }),
    ]);

    return {
      totalUsers,
      activeBuses,
      totalBookings,
      activePasses,
      totalRevenue: revenueResult._sum?.totalAmount ?? 0,
      recentBookings,
    };
  }
};
