import bcrypt from 'bcryptjs';
import { User, CreateUserDto } from '../types';
import prisma from '../utils/prisma';

export class UserService {
  /**
   * Create a new user with hashed password
   */
  static async createUser(dto: CreateUserDto): Promise<Omit<User, 'password'>> {
    // Check if email already exists
    const existingUser = await this.findByEmail(dto.email);
    if (existingUser) {
      throw new Error('Email already registered');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Create user in database
    const user = await prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        phone: dto.phone,
        password: hashedPassword,
        role: (dto.role as any) || undefined,
      },
    });

    // Return user without password
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword as any; // Cast to avoid strict type mismatch with date strings vs objects if needed
  }

  /**
   * Find user by email
   */
  static async findByEmail(email: string): Promise<any | null> {
    const user = await prisma.user.findUnique({
      where: { email },
    });
    return user || null;
  }

  /**
   * Find user by ID
   */
  static async findById(id: string): Promise<Omit<User, 'password'> | null> {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) return null;

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword as any;
  }

  /**
   * Verify password
   */
  static async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  /**
   * Get all users (for debugging/admin)
   */
  static async getAllUsers(): Promise<Omit<User, 'password'>[]> {
    const users = await prisma.user.findMany();
    return users.map(({ password, ...user }) => user as any);
  }

  /**
   * Update user details
   */
  static async updateUser(id: string, data: Partial<User>): Promise<Omit<User, 'password'>> {
    const user = await prisma.user.update({
      where: { id },
      data,
    });

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword as any;
  }
}
