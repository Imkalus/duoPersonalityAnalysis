import { Router } from 'express';
import { nanoid } from 'nanoid';
import { roomStore } from '../store';
import { rateLimiter } from '../middleware/rateLimiter';
import type { CreateRoomRequest, JoinRoomRequest } from '@mbti-duo/shared';
import type { Server } from 'socket.io';

let ioRef: Server | null = null;

export function setSocketIO(io: Server) {
  ioRef = io;
}

export const roomsRouter = Router();

// 创建房间
roomsRouter.post('/', rateLimiter, (req, res) => {
  const { name, relationship, questionVersion, displayMode } = req.body as CreateRoomRequest;

  if (!name || name.length < 2 || name.length > 20) {
    res.status(400).json({ error: '用户名需要 2-20 个字符' });
    return;
  }

  if (!['情侣', '朋友', '家人', '同事'].includes(relationship)) {
    res.status(400).json({ error: '无效的关系类型' });
    return;
  }

  const roomId = nanoid(8);
  const userId = `user_${nanoid(8)}`;

  roomStore.create({
    roomId,
    members: {
      A: { socketId: '', userId, name },
      B: null,
    },
    status: 'waiting',
    displayMode: displayMode === 'open' ? 'open' : 'hidden',
    questionVersion,
    relationship,
    createdAt: Date.now(),
    answers: { A: [], B: [] },
    results: { A: null, B: null },
    types: { A: null, B: null },
    analysis: null,
    chat: { messages: [], character: 'kind', typing: false },
  });

  res.json({ roomId, userId });
});

// 获取房间信息
roomsRouter.get('/:roomId', (req, res) => {
  const room = roomStore.get(req.params.roomId);

  if (!room) {
    res.status(404).json({ error: '房间不存在或已过期' });
    return;
  }

  res.json({
    roomId: room.roomId,
    status: room.status,
    members: {
      A: { userId: room.members.A.userId, name: room.members.A.name },
      B: room.members.B ? { name: room.members.B.name } : null,
    },
    relationship: room.relationship,
    displayMode: room.displayMode,
    questionVersion: room.questionVersion,
  });
});

// 加入房间
roomsRouter.post('/:roomId/join', (req, res) => {
  const { name } = req.body as JoinRoomRequest;
  const room = roomStore.get(req.params.roomId);

  if (!room) {
    res.status(404).json({ error: '房间不存在或已过期' });
    return;
  }

  if (room.members.B) {
    res.status(400).json({ error: '房间已满' });
    return;
  }

  if (!name || name.length < 2 || name.length > 20) {
    res.status(400).json({ error: '用户名需要 2-20 个字符' });
    return;
  }

  const userId = `user_${nanoid(8)}`;
  room.members.B = { socketId: '', userId, name };
  room.status = 'testing';

  // Notify A that B has joined
  if (ioRef) {
    ioRef.to(room.roomId).emit('partner-joined', {
      name,
      userId,
    });
  }

  res.json({
    roomId: room.roomId,
    userId,
    partnerName: room.members.A.name,
    relationship: room.relationship,
    questionVersion: room.questionVersion,
    displayMode: room.displayMode,
  });
});
