import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const AnalyticsController = {
  getFinancials: async (req: Request, res: Response): Promise<void> => {
    try {
      const totalUsers = await prisma.user.count({ where: { role: 'PASSENGER' } });
      const totalBookings = await prisma.booking.count({
        where: { status: { in: ['ACTIVE', 'USED'] } }
      });
      const canceledBookings = await prisma.booking.count({
        where: { status: 'CANCELLED' }
      });

      const revenueResult = await prisma.booking.aggregate({
        _sum: { totalAmount: true },
        where: { status: { in: ['ACTIVE', 'USED'] } }
      });

      const totalRevenue = revenueResult._sum?.totalAmount || 0;

      // Mocking revenue by method since we don't store payment method directly in Booking
      const revenueByMethod = [
        { method: 'Mobile Money', amount: Math.round(totalRevenue * 0.7) },
        { method: 'Credit Card', amount: Math.round(totalRevenue * 0.2) },
        { method: 'Wallet', amount: Math.round(totalRevenue * 0.1) },
      ];

      // Calculate last 6 months revenue
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
      sixMonthsAgo.setDate(1);
      sixMonthsAgo.setHours(0, 0, 0, 0);
      
      const recentBookings = await prisma.booking.findMany({
        where: { 
          status: { in: ['ACTIVE', 'USED'] },
          createdAt: { gte: sixMonthsAgo }
        },
        select: { totalAmount: true, createdAt: true }
      });

      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const revenueByMonthMap: Record<string, number> = {};
      const orderedMonths: string[] = [];
      
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const m = months[d.getMonth()];
        revenueByMonthMap[m] = 0;
        orderedMonths.push(m);
      }

      recentBookings.forEach(b => {
        const m = months[b.createdAt.getMonth()];
        if (revenueByMonthMap[m] !== undefined) {
          revenueByMonthMap[m] += b.totalAmount;
        }
      });

      const revenueByMonth = orderedMonths.map(month => ({ month, amount: revenueByMonthMap[month] }));

      res.json({
        totalRevenue,
        revenueByMethod,
        revenueByMonth,
        totalUsers,
        totalBookings,
        canceledBookings
      });
    } catch (error) {
      console.error('[ANALYTICS] Error fetching financials:', error);
      res.status(500).json({ error: 'Failed to fetch financials' });
    }
  },

  getScans: async (req: Request, res: Response): Promise<void> => {
    try {
      const totalScans = await prisma.ticket.count();
      // Assuming COMPLETED means a successful journey/scan and ACTIVE means ticket is valid
      const successfulScans = await prisma.ticket.count({
        where: { status: { in: ['COMPLETED', 'ACTIVE'] } } 
      });
      const failedScans = await prisma.ticket.count({
        where: { status: { in: ['EXPIRED', 'CANCELLED'] } }
      });

      const successRate = totalScans > 0 ? (successfulScans / totalScans) * 100 : 0;

      res.json({
        totalScans,
        successfulScans,
        failedScans,
        successRate
      });
    } catch (error) {
      console.error('[ANALYTICS] Error fetching scans:', error);
      res.status(500).json({ error: 'Failed to fetch scans' });
    }
  },

  getDemographics: async (req: Request, res: Response): Promise<void> => {
    try {
      const roleCounts = await prisma.user.groupBy({
        by: ['role'],
        _count: { _all: true }
      });

      const roleDistribution = roleCounts.map(r => ({
        role: r.role,
        count: r._count._all
      }));

      res.json({ roleDistribution });
    } catch (error) {
      console.error('[ANALYTICS] Error fetching demographics:', error);
      res.status(500).json({ error: 'Failed to fetch demographics' });
    }
  },

  getCapacity: async (req: Request, res: Response): Promise<void> => {
    try {
      const activeTrips = await prisma.trip.findMany({
        where: { tripStatus: { in: ['WAITING', 'BOARDING', 'ON_ROUTE'] } },
        include: {
          route: { select: { origin: true, destination: true } },
          bus: { select: { totalSeats: true } },
          _count: {
            select: { tickets: { where: { status: 'ACTIVE' } } }
          }
        }
      });

      const capacityData = activeTrips.map(trip => {
        const total = trip.bus?.totalSeats || 40;
        const sold = trip._count.tickets;
        return {
          route: `${trip.route.origin} → ${trip.route.destination}`,
          total,
          sold
        };
      });

      res.json({ capacityData });
    } catch (error) {
      console.error('[ANALYTICS] Error fetching capacity:', error);
      res.status(500).json({ error: 'Failed to fetch capacity' });
    }
  },

  getSupportStats: async (req: Request, res: Response): Promise<void> => {
    try {
      // Mock support stats since we don't have SupportTicket model
      const supportStats = {
        totalTickets: 1250,
        openTickets: 12,
        resolvedTickets: 1238,
        avgResolutionTimeHours: "4.5"
      };

      res.json(supportStats);
    } catch (error) {
      console.error('[ANALYTICS] Error fetching support stats:', error);
      res.status(500).json({ error: 'Failed to fetch support stats' });
    }
  }
};
