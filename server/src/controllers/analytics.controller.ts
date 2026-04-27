import { Request, Response } from 'express';
import { BookingStatus, TicketStatus, UserRole } from '@prisma/client';
import prisma from '../utils/prisma';

type DateRange = { startDate?: Date; endDate?: Date };

function parseDateRange(req: Request): DateRange {
  const startDate = req.query.startDate ? new Date(String(req.query.startDate)) : undefined;
  const endDate = req.query.endDate ? new Date(String(req.query.endDate)) : undefined;

  if (endDate) {
    endDate.setHours(23, 59, 59, 999);
  }

  return { startDate, endDate };
}

function buildCreatedAtFilter(range?: DateRange) {
  if (!range?.startDate && !range?.endDate) return undefined;
  const filter: { gte?: Date; lte?: Date } = {};
  if (range?.startDate) filter.gte = range.startDate;
  if (range?.endDate) filter.lte = range.endDate;
  return filter;
}

function getMonthKeys(range?: DateRange) {
  const months: string[] = [];
  const now = new Date();
  const start = range?.startDate ? new Date(range.startDate) : new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const end = range?.endDate ? new Date(range.endDate) : now;
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  end.setDate(1);
  end.setHours(0, 0, 0, 0);

  const cursor = new Date(start);
  while (cursor <= end) {
    months.push(`${cursor.getFullYear()}-${cursor.getMonth()}`);
    cursor.setMonth(cursor.getMonth() + 1);
  }

  if (months.length > 6) {
    return months.slice(months.length - 6);
  }

  while (months.length < 6) {
    const next = new Date(start);
    next.setMonth(start.getMonth() - (6 - months.length));
    months.unshift(`${next.getFullYear()}-${next.getMonth()}`);
  }

  return months;
}

function getMonthLabel(key: string) {
  const [year, month] = key.split('-').map(Number);
  return new Date(year, month, 1).toLocaleString('en-US', { month: 'short' });
}

async function fetchFinancials(range?: DateRange) {
  const createdAtFilter = buildCreatedAtFilter(range);
  const activeBookingStatus: BookingStatus[] = ['ACTIVE', 'USED'];
  const canceledBookingStatus: BookingStatus[] = ['CANCELLED'];
  const bookingWhere = {
    status: { in: activeBookingStatus },
    ...(createdAtFilter ? { createdAt: createdAtFilter } : {})
  };
  const canceledWhere = {
    status: { in: canceledBookingStatus },
    ...(createdAtFilter ? { createdAt: createdAtFilter } : {})
  };
  const userWhere = {
    role: UserRole.PASSENGER,
    ...(createdAtFilter ? { createdAt: createdAtFilter } : {})
  };

  const [totalUsers, totalBookings, canceledBookings, revenueResult] = await Promise.all([
    prisma.user.count({ where: userWhere }),
    prisma.booking.count({ where: bookingWhere }),
    prisma.booking.count({ where: canceledWhere }),
    prisma.booking.aggregate({
      _sum: { totalAmount: true },
      where: bookingWhere
    })
  ]);

  const totalRevenue = revenueResult._sum?.totalAmount || 0;

  const revenueBookings = await prisma.booking.findMany({
    where: bookingWhere,
    select: {
      totalAmount: true,
      route: {
        select: { origin: true, destination: true }
      }
    }
  });

  const revenueByRouteMap: Record<string, number> = {};
  revenueBookings.forEach((booking) => {
    const routeLabel = booking.route
      ? `${booking.route.origin} → ${booking.route.destination}`
      : 'Unknown Route';
    revenueByRouteMap[routeLabel] = (revenueByRouteMap[routeLabel] || 0) + booking.totalAmount;
  });

  const revenueByMethod = Object.entries(revenueByRouteMap).map(([method, amount]) => ({ method, amount }));

  const monthKeys = getMonthKeys(range);
  const monthMap: Record<string, number> = {};
  monthKeys.forEach(key => { monthMap[key] = 0; });

  const revenueByMonthBookings = await prisma.booking.findMany({
    where: bookingWhere,
    select: { totalAmount: true, createdAt: true }
  });

  revenueByMonthBookings.forEach(b => {
    const key = `${b.createdAt.getFullYear()}-${b.createdAt.getMonth()}`;
    if (monthMap[key] !== undefined) {
      monthMap[key] += b.totalAmount;
    }
  });

  const revenueByMonth = monthKeys.map(key => ({
    month: getMonthLabel(key),
    amount: monthMap[key]
  }));

  return { totalRevenue, revenueByMethod, revenueByMonth, totalUsers, totalBookings, canceledBookings };
}

async function fetchScans(range?: DateRange) {
  const createdAtFilter = buildCreatedAtFilter(range);
  const whereBase: Record<string, any> = {};
  if (createdAtFilter) whereBase.createdAt = createdAtFilter;

  const successStatuses: TicketStatus[] = ['COMPLETED', 'ACTIVE'];
  const failureStatuses: TicketStatus[] = ['EXPIRED', 'CANCELLED'];

  const [totalScans, successfulScans, failedScans] = await Promise.all([
    prisma.ticket.count({ where: whereBase }),
    prisma.ticket.count({ where: { ...whereBase, status: { in: successStatuses } } }),
    prisma.ticket.count({ where: { ...whereBase, status: { in: failureStatuses } } })
  ]);
  const successRate = totalScans > 0 ? (successfulScans / totalScans) * 100 : 0;
  return { totalScans, successfulScans, failedScans, successRate };
}

async function fetchDemographics(range?: DateRange) {
  const createdAtFilter = buildCreatedAtFilter(range);
  const where = createdAtFilter ? { createdAt: createdAtFilter } : undefined;

  const roleCounts = await prisma.user.groupBy({
    by: ['role'],
    _count: { _all: true },
    ...(where ? { where } : {})
  });

  const roleDistribution = roleCounts.map(r => ({ role: r.role, count: r._count._all }));
  return { roleDistribution };
}

async function fetchCapacity() {
  const activeTrips = await prisma.trip.findMany({
    where: { tripStatus: { in: ['WAITING', 'BOARDING', 'ON_ROUTE'] } },
    include: {
      route: { select: { origin: true, destination: true } },
      bus: { select: { totalSeats: true } },
      _count: { select: { tickets: { where: { status: 'ACTIVE' } } } }
    }
  });

  const capacityData = activeTrips.map(trip => {
    const total = trip.bus?.totalSeats || 40;
    const sold = trip._count.tickets;
    return { route: `${trip.route.origin} → ${trip.route.destination}`, total, sold };
  });
  return { capacityData };
}

async function fetchSupportStats() {
  const [totalTickets, openTickets, resolvedTickets, completedTickets] = await Promise.all([
    prisma.ticket.count(),
    prisma.ticket.count({ where: { status: TicketStatus.ACTIVE } }),
    prisma.ticket.count({ where: { status: TicketStatus.COMPLETED } }),
    prisma.ticket.findMany({
      where: { status: TicketStatus.COMPLETED },
      select: { createdAt: true, updatedAt: true }
    })
  ]);

  const avgResolutionTimeHours = completedTickets.length > 0
    ? completedTickets.reduce((sum, ticket) => {
      return sum + (ticket.updatedAt.getTime() - ticket.createdAt.getTime());
    }, 0) / completedTickets.length / 1000 / 60 / 60
    : 0;

  return {
    totalTickets,
    openTickets,
    resolvedTickets,
    avgResolutionTimeHours: avgResolutionTimeHours.toFixed(1),
  };
}

export const AnalyticsController = {
  getFinancials: async (req: Request, res: Response): Promise<void> => {
    try {
      const range = parseDateRange(req);
      res.json(await fetchFinancials(range));
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch financials' });
    }
  },
  getScans: async (req: Request, res: Response): Promise<void> => {
    try {
      const range = parseDateRange(req);
      res.json(await fetchScans(range));
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch scans' });
    }
  },
  getDemographics: async (req: Request, res: Response): Promise<void> => {
    try {
      const range = parseDateRange(req);
      res.json(await fetchDemographics(range));
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch demographics' });
    }
  },
  getCapacity: async (req: Request, res: Response): Promise<void> => {
    try {
      res.json(await fetchCapacity());
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch capacity' });
    }
  },
  getSupportStats: async (req: Request, res: Response): Promise<void> => {
    try {
      res.json(await fetchSupportStats());
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch support stats' });
    }
  },
  getSummary: async (req: Request, res: Response): Promise<void> => {
    try {
      const range = parseDateRange(req);
      const [financials, scans, demographics, capacity, supportStats] = await Promise.all([
        fetchFinancials(range),
        fetchScans(range),
        fetchDemographics(range),
        fetchCapacity(),
        fetchSupportStats()
      ]);
      res.json({ financials, scans, demographics, capacity, supportStats });
    } catch (error) {
      console.error('[ANALYTICS] Error fetching summary:', error);
      res.status(500).json({ error: 'Failed to fetch summary' });
    }
  }
};
