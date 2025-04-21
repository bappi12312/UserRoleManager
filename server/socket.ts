import { Server as SocketIOServer } from "socket.io";
import { Server as HttpServer } from "http";
import { createAdapter } from "@socket.io/redis-adapter";
import { createClient } from "redis";
import { User } from "@shared/schema";

// Define event types for better type safety
interface ServerToClientEvents {
  notifications: (data: Notification) => void;
  transactionUpdate: (data: TransactionUpdate) => void;
  orderUpdate: (data: OrderUpdate) => void;
  userUpdate: (data: UserUpdate) => void;
}

interface ClientToServerEvents {
  subscribe: (userId: number) => void;
  unsubscribe: (userId: number) => void;
}

export interface Notification {
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  timestamp: Date;
}

export interface TransactionUpdate {
  userId: number;
  transaction: any;
  message: string;
}

export interface OrderUpdate {
  userId: number;
  order: any;
  message: string;
}

export interface UserUpdate {
  userId: number;
  user: User;
  message: string;
}

export let io: SocketIOServer<ClientToServerEvents, ServerToClientEvents>;

export async function setupSocketIO(httpServer: HttpServer) {
  // Create Redis client for Socket.IO adapter
  let redisClient;
  let pubClient;
  let subClient;
  
  try {
    // Create Redis client - this will work in both local and prod with Replit
    pubClient = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
    subClient = pubClient.duplicate();
    
    // Connect the clients
    await pubClient.connect();
    await subClient.connect();
    
    console.log("Redis connected successfully");
    
    // Set up Socket.IO server with Redis adapter
    io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents>(httpServer, {
      path: '/ws',
      cors: {
        origin: '*',
        methods: ['GET', 'POST']
      },
      adapter: createAdapter(pubClient, subClient)
    });
    
    // Handle connections
    io.on('connection', (socket) => {
      console.log(`Client connected: ${socket.id}`);
      
      socket.on('subscribe', (userId) => {
        // Use userId as the room name to target specific users
        socket.join(`user:${userId}`);
        console.log(`User ${userId} subscribed to updates`);
      });
      
      socket.on('unsubscribe', (userId) => {
        socket.leave(`user:${userId}`);
        console.log(`User ${userId} unsubscribed from updates`);
      });
      
      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
      });
    });
    
    console.log('Socket.IO server initialized with Redis adapter');
  } catch (error) {
    console.error('Failed to set up Redis or Socket.IO:', error);
    
    // Fallback to in-memory adapter if Redis fails
    io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents>(httpServer, {
      path: '/ws',
      cors: {
        origin: '*',
        methods: ['GET', 'POST']
      }
    });
    
    io.on('connection', (socket) => {
      console.log(`Client connected (in-memory): ${socket.id}`);
      
      socket.on('subscribe', (userId) => {
        socket.join(`user:${userId}`);
      });
      
      socket.on('unsubscribe', (userId) => {
        socket.leave(`user:${userId}`);
      });
      
      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
      });
    });
    
    console.log('Socket.IO server initialized with in-memory adapter (Redis connection failed)');
  }
  
  return io;
}

// Helper functions to emit events
export function notifyUser(userId: number, notification: Notification) {
  if (!io) return;
  io.to(`user:${userId}`).emit('notifications', notification);
}

export function notifyTransactionUpdate(userId: number, transaction: any, message: string) {
  if (!io) return;
  io.to(`user:${userId}`).emit('transactionUpdate', {
    userId,
    transaction,
    message
  });
}

export function notifyOrderUpdate(userId: number, order: any, message: string) {
  if (!io) return;
  io.to(`user:${userId}`).emit('orderUpdate', {
    userId,
    order,
    message
  });
}

export function notifyUserUpdate(userId: number, user: User, message: string) {
  if (!io) return;
  io.to(`user:${userId}`).emit('userUpdate', {
    userId,
    user,
    message
  });
}