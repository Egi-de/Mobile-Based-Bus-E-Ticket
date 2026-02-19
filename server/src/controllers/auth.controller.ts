import { Request, Response } from 'express';
import { UserService } from '../services/user.service';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { sendSuccess, sendError } from '../utils/response';
import { CreateUserDto, LoginDto } from '../types';
import * as bcrypt from 'bcryptjs';
import prisma from '../utils/prisma';

export class AuthController {
  /**
   * Bootstrap Admin User
   * POST /api/auth/setup-admin
   * Headers: x-admin-secret
   */
  static async setupAdmin(req: Request, res: Response): Promise<Response> {
    try {
      const secret = req.headers['x-admin-secret'];
      const ADMIN_SECRET = process.env.ADMIN_SECRET || 'bootstrap_admin_secret_2024';

      if (secret !== ADMIN_SECRET) {
        return sendError(res, 'Unauthorized: Invalid admin secret', 403);
      }

      const { email, password, name, phone, role } = req.body;

      // Create admin/driver user
      const user = await UserService.createUser({
        email,
        password,
        name,
        phone,
        role: role || 'ADMIN'
      });

      return sendSuccess(res, user, 'Admin user created successfully', 201);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to create admin', 500);
    }
  }

  /**
   * Register a new user
   * POST /api/auth/register
   */
  static async register(req: Request, res: Response): Promise<Response> {
    try {
      const { email, password, name, phone }: CreateUserDto = req.body;

      // Validation
      if (!email || !password || !name || !phone) {
        return sendError(res, 'All fields are required', 400);
      }

      if (password.length < 6) {
        return sendError(res, 'Password must be at least 6 characters', 400);
      }

      // Create user
      const user = await UserService.createUser({ email, password, name, phone });

      // Generate tokens
      const accessToken = generateAccessToken({ userId: user.id, email: user.email });
      const refreshToken = generateRefreshToken({ userId: user.id, email: user.email });

      return sendSuccess(
        res,
        {
          user,
          tokens: { accessToken, refreshToken, expiresIn: 900 }
        },
        'User registered successfully',
        201
      );
    } catch (error: any) {
      if (error.message === 'Email already registered') {
        return sendError(res, error.message, 409);
      }
      return sendError(res, 'Registration failed', 500);
    }
  }

  /**
   * Login user
   * POST /api/auth/login
   */
  static async login(req: Request, res: Response): Promise<Response> {
    try {
      const { email, password }: LoginDto = req.body;

      // Validation
      if (!email || !password) {
        return sendError(res, 'Email and password are required', 400);
      }

      // Find user
      const user = await UserService.findByEmail(email);
      if (!user) {
        return sendError(res, 'Invalid credentials', 401);
      }

      // Verify password
      const isValidPassword = await UserService.verifyPassword(password, user.password);
      if (!isValidPassword) {
        return sendError(res, 'Invalid credentials', 401);
      }

      // Generate tokens
      const accessToken = generateAccessToken({ userId: user.id, email: user.email });
      const refreshToken = generateRefreshToken({ userId: user.id, email: user.email });

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;

      return sendSuccess(
        res,
        {
          user: userWithoutPassword,
          tokens: { accessToken, refreshToken, expiresIn: 900 }
        },
        'Login successful'
      );
    } catch (error) {
      return sendError(res, 'Login failed', 500);
    }
  }

  /**
   * Refresh Access Token
   * POST /api/auth/refresh
   */
  static async refresh(req: Request, res: Response): Promise<Response> {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return sendError(res, 'Refresh token required', 400);
      }

      // Verify refresh token
      const decoded = verifyRefreshToken(refreshToken);

      // Check if user still exists
      const user = await UserService.findById(decoded.userId);
      if (!user) {
        return sendError(res, 'User not found', 401);
      }

      // Generate new access token
      const accessToken = generateAccessToken({ userId: user.id, email: user.email });

      return sendSuccess(res, { accessToken, expiresIn: 900 }, 'Token refreshed');
    } catch (error) {
      return sendError(res, 'Invalid refresh token', 401);
    }
  }

  /**
   * Get current user profile
   * GET /api/auth/profile
   */
  static async getProfile(req: Request, res: Response): Promise<Response> {
    try {
      const userId = (req as any).user.userId; // Set by auth middleware

      const user = await UserService.findById(userId);
      if (!user) {
        return sendError(res, 'User not found', 404);
      }

      return sendSuccess(res, user, 'Profile fetched successfully');
    } catch (error) {
      return sendError(res, 'Failed to fetch profile', 500);
    }
  }

  /**
   * Update user profile
   * PATCH /api/auth/profile
   */
  /**
   * Update user profile
   * PATCH /api/auth/profile
   */
  static async updateProfile(req: Request, res: Response): Promise<Response> {
    try {
      const userId = (req as any).user.userId;
      const { name, phone, profilePictureUrl, currentPassword, newPassword } = req.body;
      const updateData: any = {};

      if (name) updateData.name = name;
      if (phone) updateData.phone = phone;
      if (profilePictureUrl) updateData.profilePicture = profilePictureUrl;

      // Handle password change
      if (currentPassword && newPassword) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return sendError(res, 'User not found', 404);

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) return sendError(res, 'Current password is incorrect', 400);

        if (newPassword.length < 6) return sendError(res, 'New password must be at least 6 characters', 400);
        updateData.password = await bcrypt.hash(newPassword, 10);
      }

      const updatedUser = await UserService.updateUser(userId, updateData);
      return sendSuccess(res, updatedUser, 'Profile updated successfully');
    } catch (error: any) {
      console.error('❌ [UPDATE PROFILE] Error:', error);
      return sendError(res, error.message || 'Failed to update profile', 500);
    }
  }

  /**
   * Logout user
   * POST /api/auth/logout
   */
  static async logout(req: Request, res: Response): Promise<Response> {
    try {
      // In a stateless JWT system, logout is handled client-side by removing tokens
      // However, we can still provide an endpoint for consistency and future token blacklisting
      return sendSuccess(res, null, 'Logout successful');
    } catch (error) {
      return sendError(res, 'Logout failed', 500);
    }
  }
}
