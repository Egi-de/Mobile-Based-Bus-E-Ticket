import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import { sendError } from '../utils/response';

export const checkRole = (roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const userRole = (req as any).user?.role;

    if (!userRole || !roles.includes(userRole)) {
      sendError(res, 'Unauthorized access', 403);
      return;
    }

    next();
  };
};
