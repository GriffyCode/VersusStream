import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';

import { createApp } from './app';
import { redisService } from './services/redis.service';
import { prismaService } from './services/prisma.service';
import { setupSocketHandler } from './socket/socket.handler';

// Load environment variables
dotenv.config();

const bootstrap = async () => {
  try {
    // 1. Connect dependencies (Fail-Fast)
    await redisService.connect();
    await prismaService.connect();

    // 2. Setup Express App
    const app = createApp();

    const httpServer = createServer(app);

    // 3. Setup WebSockets
    const io = new Server(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });

    setupSocketHandler(io);

    // 4. Start Server
    const PORT = process.env.PORT || 3001;
    httpServer.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to bootstrap server:', error);
    process.exit(1);
  }
};

bootstrap();
