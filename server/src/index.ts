import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env from project root (server runs from server/ directory)
config({ path: resolve(process.cwd(), '../.env') });

import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import type { ServerToClientEvents, ClientToServerEvents } from '@mbti-duo/shared';
import { roomsRouter, setSocketIO } from './routes/rooms';
import { analysisRouter } from './routes/analysis';
import { chatRouter } from './routes/chat';
import { setupSocketHandlers } from './socket/handler';

const app = express();
const httpServer = createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: { origin: '*' },
  maxHttpBufferSize: 1e6, // 1MB
});

app.use(cors());
app.use(express.json());

// Pass Socket.IO to routes for event emission
setSocketIO(io);

// Routes
app.use('/api/rooms', roomsRouter);
app.use('/api/analysis', analysisRouter);
app.use('/api/chat', chatRouter);

// Socket.IO
setupSocketHandlers(io);

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export { io };
