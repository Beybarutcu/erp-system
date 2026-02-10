import { Router } from 'express';
import { authRateLimiter } from '@shared/middleware/rate-limiter';
import { authenticate } from '@shared/middleware/auth';
import * as authController from './auth.controller';

const router = Router();

// Public routes
router.post('/login', authRateLimiter, authController.login);
router.post('/refresh', authController.refreshToken);

// Protected routes
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.getCurrentUser);
router.put('/me', authenticate, authController.updateProfile);
router.put('/change-password', authenticate, authController.changePassword);

export default router;
