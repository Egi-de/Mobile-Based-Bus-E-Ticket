import { Request, Response } from 'express';
import { StatsService } from '../services/stats.service';

export const getDashboardStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const stats = await StatsService.getDashboardStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching dashboard stats', error });
  }
};
