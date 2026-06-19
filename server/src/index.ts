import { config } from 'dotenv';
import { resolve } from 'path';
import { existsSync } from 'fs';

// 加载根目录 .env（server 进程的工作目录通常是 server/，故向上一级找）。
// 也兼容直接从项目根启动的情况。
config({ path: resolve(process.cwd(), '../.env') });
config({ path: resolve(process.cwd(), '.env') });

import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import type { ServerToClientEvents, ClientToServerEvents } from '@mbti-duo/shared';
import { roomsRouter, setSocketIO } from './routes/rooms';
import { analysisRouter } from './routes/analysis';
import { setupSocketHandlers } from './socket/handler';

const app = express();
const httpServer = createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: { origin: process.env.CORS_ORIGIN || '*' },
  maxHttpBufferSize: 1e6, // 1MB
});

app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());

// Pass Socket.IO to routes for event emission
setSocketIO(io);

// Routes
app.use('/api/rooms', roomsRouter);
app.use('/api/analysis', analysisRouter);

// Socket.IO
setupSocketHandlers(io);

// 生产环境：若前端已构建，直接由后端托管静态文件（单进程部署）。
// 默认查找 client/dist，可用 CLIENT_DIST 覆盖。
const clientDist = process.env.CLIENT_DIST || resolve(process.cwd(), '../client/dist');
if (existsSync(clientDist)) {
  console.log(`Serving client from ${clientDist}`);
  app.use(express.static(clientDist));
  // SPA 兜底：非 /api、非 /socket.io 的路由都回退到 index.html
  app.get(/^(?!\/(api|socket\.io)).*/, (_req, res) => {
    res.sendFile(resolve(clientDist, 'index.html'));
  });
}

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';
httpServer.listen(Number(PORT), HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
});

export { io };
