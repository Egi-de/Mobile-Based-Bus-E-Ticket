import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';

export class WebSocketServer {
  private static io: SocketIOServer;

  public static initialize(httpServer: HttpServer) {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
    const isProduction = process.env.NODE_ENV === 'production';

    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: (origin, callback) => {
          if (!origin || !isProduction) return callback(null, true);
          if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
            callback(null, true);
          } else {
            callback(new Error('Not allowed by CORS'));
          }
        },
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });

    this.io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);

      socket.on('join_route', (routeId: string) => {
        socket.join(`route_${routeId}`);
        console.log(`Client ${socket.id} joined route ${routeId}`);
      });

      socket.on('leave_route', (routeId: string) => {
        socket.leave(`route_${routeId}`);
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });

    console.log('WebSocket server initialized');
  }

  public static emitBusUpdate(busId: string, data: any) {
    if (this.io) {
      this.io.emit(`bus_${busId}`, data);
      
      if (data.routeId) {
        this.io.to(`route_${data.routeId}`).emit('route_update', data);
      }
    }
  }
}
