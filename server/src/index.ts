import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import apiRoutes from './routes';
import { firebaseAdminService } from './services/firebase-admin.service';
import { swaggerSpec } from './config/swagger';

// Load environment variables
dotenv.config();

// Initialize Express app
const app: Express = express();
const PORT = Number(process.env.PORT) || 5000;

// Middleware
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
const isProduction = process.env.NODE_ENV === 'production';

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // In development, allow all origins
    if (!isProduction) return callback(null, true);

    // In production, check against allowed origins
    if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      console.warn(`Blocked CORS request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));


// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Swagger API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'GoPass API Documentation',
}));

// API Routes
app.use('/api', apiRoutes);

// 404 Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// Global Error Handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
  });
});

// Create HTTP server
import { createServer } from 'http';
import { WebSocketServer } from './websocket/socket.server';
import { cloudinaryService } from './services/cloudinary.service';

const httpServer = createServer(app);

// Initialize Firebase Admin SDK
firebaseAdminService.initialize();

// Initialize Cloudinary
cloudinaryService.initialize();

// Initialize WebSocket Server
WebSocketServer.initialize(httpServer);

// Start server
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log('='.repeat(50));
  console.log(`🚀 GoPass Server Started`);
  console.log('='.repeat(50));
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Port: ${PORT}`);
  console.log(`🔗 Local: http://localhost:${PORT}`);
  console.log(`💚 Health: http://localhost:${PORT}/health`);
  console.log(`📚 API Docs: http://localhost:${PORT}/api-docs`);
  console.log(`🔌 WebSocket: Enabled`);
  console.log(`🔥 Firebase: ${firebaseAdminService.isReady() ? 'Connected' : 'Not Configured'}`);
  console.log(`☁️  Cloudinary: ${cloudinaryService.isReady() ? 'Connected' : 'Not Configured'}`);
  console.log(`🔒 CORS Origins: ${process.env.ALLOWED_ORIGINS || 'All (Development)'}`);
  console.log('='.repeat(50));
});
