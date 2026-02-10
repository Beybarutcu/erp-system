import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '@shared/database/client';
import { AppError } from '@shared/middleware/error-handler';
import { logger } from '@shared/utils/logger';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

// Generate JWT tokens
const generateTokens = (userId: string, role: string) => {
  const accessToken = jwt.sign({ userId, role }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });

  const refreshToken = jwt.sign({ userId, role }, JWT_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES_IN,
  });

  return { accessToken, refreshToken };
};

// Login
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      throw new AppError('Username and password are required', 400);
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        email: true,
        passwordHash: true,
        fullName: true,
        role: true,
        languagePreference: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      throw new AppError('Invalid credentials', 401);
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new AppError('Invalid credentials', 401);
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.id, user.role);

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    logger.info(`User logged in: ${user.username}`);

    // Return user data and tokens
    const { passwordHash, ...userWithoutPassword } = user;

    res.json({
      success: true,
      data: {
        user: userWithoutPassword,
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Refresh token
export const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new AppError('Refresh token is required', 400);
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, JWT_SECRET) as any;

    // Generate new tokens
    const tokens = generateTokens(decoded.userId, decoded.role);

    res.json({
      success: true,
      data: tokens,
    });
  } catch (error) {
    next(new AppError('Invalid refresh token', 401));
  }
};

// Logout
export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // In a production environment, you might want to:
    // 1. Blacklist the token
    // 2. Clear session from Redis
    // 3. Log the logout event

    logger.info(`User logged out: ${req.user?.username}`);

    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Get current user
export const getCurrentUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        role: true,
        languagePreference: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
      },
    });

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// Update profile
export const updateProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { fullName, email, languagePreference } = req.body;

    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        ...(fullName && { fullName }),
        ...(email && { email }),
        ...(languagePreference && { languagePreference }),
      },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        role: true,
        languagePreference: true,
      },
    });

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// Change password
export const changePassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      throw new AppError('Current and new passwords are required', 400);
    }

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { id: true, passwordHash: true },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.passwordHash
    );

    if (!isPasswordValid) {
      throw new AppError('Current password is incorrect', 400);
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: hashedPassword },
    });

    logger.info(`Password changed for user: ${req.user?.username}`);

    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    next(error);
  }
};
