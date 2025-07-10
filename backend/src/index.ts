import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { config } from 'dotenv';
import {
  setupWebSocketHandlers,
  cleanupInactiveLobbies,
} from './websockets/handlers.js';
import {
  ServerToClientEvents,
  ClientToServerEvents,
} from '../../shared/types/index.js';

// Load environment variables
config();

const app = express();
const server = createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents>(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(compression());

// CORS configuration
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api', (_req, res, _next) => {
  // TODO: Add API routes here
  res.status(404).json({ error: 'API route not found' });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  setupWebSocketHandlers(io, socket);
});

// Set up periodic cleanup of inactive lobbies
setInterval(
  () => {
    cleanupInactiveLobbies();
  },
  5 * 60 * 1000
); // Every 5 minutes

// Global error handler
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error('Global error:', err);
    res.status(500).json({
      error: 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { details: err.message }),
    });
  }
);

// 404 handler
app.use('*', (_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Party Games API server running on http://localhost:${PORT}`);
  console.log(`📡 WebSocket server ready for connections`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

export { app, io };
