import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { sendSuccess, sendError } from '../utils/response';

const prisma = new PrismaClient();

export class UserController {
  static async getAllUsers(req: Request, res: Response) {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      return sendSuccess(res, users, 'Users retrieved successfully');
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to retrieve users', 500);
    }
  }

  static async getUserById(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!user) {
        return sendError(res, 'User not found', 404);
      }

      return sendSuccess(res, user, 'User retrieved successfully');
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to retrieve user', 500);
    }
  }

  static async updateUserRole(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const { role } = req.body;

      if (!['ADMIN', 'DRIVER', 'PASSENGER'].includes(role)) {
        return sendError(res, 'Invalid role', 400);
      }

      const user = await prisma.user.update({
        where: { id },
        data: { role },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      });

      return sendSuccess(res, user, 'User role updated successfully');
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to update user role', 500);
    }
  }

  static async updateUser(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const { name, email, phone, role } = req.body;
      const updateData: any = {};

      if (name) updateData.name = name;
      if (email) updateData.email = email;
      if (phone) updateData.phone = phone;
      if (role && ['ADMIN', 'DRIVER', 'PASSENGER'].includes(role)) {
        updateData.role = role;
      }

      const user = await prisma.user.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return sendSuccess(res, user, 'User updated successfully');
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to update user', 500);
    }
  }

  static async deleteUser(req: Request, res: Response) {
    try {
      const id = req.params.id as string;

      await prisma.user.delete({
        where: { id },
      });

      return sendSuccess(res, null, 'User deleted successfully');
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to delete user', 500);
    }
  }
}
