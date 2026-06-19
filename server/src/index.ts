import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import type { ServerToClientEvents, ClientToServerEvents } from '@mbti-duo/shared';
import { roomsRouter } from './routes/rooms';
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
