import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { logger } from './logger';

interface SocketUser {
  id: string;
  username: string;
  role: string;
}

declare module 'socket.io' {
  interface Socket {
    user?: SocketUser;
  }
}

export const setupWebSocket = (io: Server) => {
  // Authentication middleware for WebSocket
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Authentication error'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
      socket.user = {
        id: decoded.userId,
        username: decoded.username,
        role: decoded.role,
      };
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket: Socket) => {
    logger.info(`WebSocket client connected: ${socket.user?.username}`);

    // Join user-specific room
    if (socket.user) {
      socket.join(`user:${socket.user.id}`);
    }

    // Join role-specific rooms
    if (socket.user?.role) {
      socket.join(`role:${socket.user.role}`);
    }

    // Handle custom events
    socket.on('subscribe:machine', (machineId: string) => {
      socket.join(`machine:${machineId}`);
      logger.info(`User ${socket.user?.username} subscribed to machine ${machineId}`);
    });

    socket.on('subscribe:work-order', (workOrderId: string) => {
      socket.join(`work-order:${workOrderId}`);
    });

    socket.on('disconnect', () => {
      logger.info(`WebSocket client disconnected: ${socket.user?.username}`);
    });
  });

  return io;
};

// Helper functions to emit events
export class WebSocketService {
  private static io: Server;

  static initialize(io: Server) {
    this.io = io;
  }

  static emitToUser(userId: string, event: string, data: any) {
    this.io.to(`user:${userId}`).emit(event, data);
  }

  static emitToRole(role: string, event: string, data: any) {
    this.io.to(`role:${role}`).emit(event, data);
  }

  static emitToMachine(machineId: string, event: string, data: any) {
    this.io.to(`machine:${machineId}`).emit(event, data);
  }

  static emitToWorkOrder(workOrderId: string, event: string, data: any) {
    this.io.to(`work-order:${workOrderId}`).emit(event, data);
  }

  static broadcast(event: string, data: any) {
    this.io.emit(event, data);
  }
}
