import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { Server } from 'socket.io';
import { createServer } from 'http';

// Load environment variables
dotenv.config();

// Import middleware
import { errorHandler } from '@shared/middleware/error-handler';
import { notFoundHandler } from '@shared/middleware/not-found';
import { rateLimiter } from '@shared/middleware/rate-limiter';
import { logger } from '@shared/utils/logger';

// Import routes
import authRoutes from '@modules/auth/auth.routes';
import productRoutes from '@modules/products/products.routes';
import bomRoutes from '@modules/bom/bom.routes';
import inventoryRoutes from '@modules/inventory/inventory.routes';
import workOrderRoutes from '@modules/work-orders/work-orders.routes';
import machineRoutes from '@modules/machines/machines.routes';
import capacityRoutes from '@modules/capacity/capacity.routes';
import customersRoutes from '@modules/customers/customers.routes';
import orderRoutes from '@modules/orders/orders.routes';
import supplierRoutes from '@modules/suppliers/suppliers.routes';
import outsourcingRoutes from '@modules/outsourcing/outsourcing.routes';
import shippingRoutes from '@modules/shipping/shipping.routes';
import reportingRoutes from '@modules/reporting/reporting.routes';
import notificationRoutes from '@modules/notifications/notifications.routes';

// Import websocket handlers
import { setupWebSocket } from '@shared/utils/websocket';

const app: Application = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
    credentials: true,
  },
});

// ============================================
// MIDDLEWARE
// ============================================

// Security
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression
app.use(compression());

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Rate limiting
app.use('/api/', rateLimiter);

// ============================================
// ROUTES
// ============================================

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/bom', bomRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/work-orders', workOrderRoutes);
app.use('/api/machines', machineRoutes);
app.use('/api/capacity', capacityRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/outsourcing', outsourcingRoutes);
app.use('/api/shipping', shippingRoutes);
app.use('/api/reporting', reportingRoutes);
app.use('/api/notifications', notificationRoutes);

// ============================================
// ERROR HANDLING
// ============================================

app.use(notFoundHandler);
app.use(errorHandler);

// ============================================
// WEBSOCKET SETUP
// ============================================

setupWebSocket(io);

// ============================================
// SERVER START
// ============================================

const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  logger.info(`📝 Environment: ${process.env.NODE_ENV}`);
  logger.info(`🔌 WebSocket server is ready`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  httpServer.close(() => {
    logger.info('HTTP server closed');
  });
});

export default app;