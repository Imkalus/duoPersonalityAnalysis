import type { Server } from 'socket.io';
import type { ServerToClientEvents, ClientToServerEvents } from '@mbti-duo/shared';
import { roomStore } from '../store';

export function setupSocketHandlers(io: Server<ClientToServerEvents, ServerToClientEvents>): void {
  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // 加入房间
    socket.on('join-room', ({ roomId, userId }) => {
      const room = roomStore.get(roomId);
      if (!room) {
        socket.emit('room-expired');
        return;
      }

      // 判断是 A 还是 B
      const isA = room.members.A.userId === userId;
      const isB = room.members.B?.userId === userId;

      if (!isA && !isB) {
        return;
      }

      socket.join(roomId);
      socket.data = { roomId, userId, role: isA ? 'A' : 'B' };

      // 更新 socketId
      if (isA) {
        room.members.A.socketId = socket.id;
      } else if (room.members.B) {
        room.members.B.socketId = socket.id;
        // 通知 A：B 已加入
        io.to(roomId).emit('partner-joined', {
          name: room.members.B.name,
          userId: room.members.B.userId,
        });
      }

      // 发送房间当前状态
      socket.emit('room-state', {
        status: room.status,
        answersA: room.answers.A.length,
        answersB: room.answers.B.length,
      });
    });

    // rejoin-room（重连时使用）
    socket.on('join-room', ({ roomId, userId }) => {
      const room = roomStore.get(roomId);
      if (!room) {
        socket.emit('room-expired');
        return;
      }

      const isA = room.members.A.userId === userId;
      const isB = room.members.B?.userId === userId;

      if (!isA && !isB) return;

      socket.join(roomId);
      socket.data = { roomId, userId, role: isA ? 'A' : 'B' };

      if (isA) {
        room.members.A.socketId = socket.id;
      } else if (room.members.B) {
        room.members.B.socketId = socket.id;
      }

      // 通知对方已重连
      socket.to(roomId).emit('user-reconnected');

      // 发送当前状态
      socket.emit('room-state', {
        status: room.status,
        answersA: room.answers.A.length,
        answersB: room.answers.B.length,
      });
    });

    // 提交单题答案
    socket.on('answer-submitted', ({ roomId, answer }) => {
      const room = roomStore.get(roomId);
      if (!room) return;

      const role = socket.data.role as 'A' | 'B';
      if (!role) return;

      room.answers[role].push(answer);

      // 同步模式下广播给对方
      if (room.mode === 'sync') {
        socket.to(roomId).emit('answer-synced', {
          questionId: answer.questionId,
          value: answer.value,
        });
      }
    });

    // 批量提交答案（独立模式完成时）
    socket.on('answers-batch', ({ roomId, answers }) => {
      const room = roomStore.get(roomId);
      if (!room) return;

      const role = socket.data.role as 'A' | 'B';
      if (!role) return;

      room.answers[role] = answers;
    });

    // 完成测试
    socket.on('test-completed', ({ roomId, userId }) => {
      const room = roomStore.get(roomId);
      if (!room) return;

      const role = socket.data.role as 'A' | 'B';
      if (!role) return;

      // 检查双方是否都完成
      const bothCompleted = room.answers.A.length > 0 && room.answers.B.length > 0;
      if (bothCompleted) {
        room.status = 'analyzing';
        io.to(roomId).emit('both-completed');
      }
    });

    // 聊天消息
    socket.on('chat-message', ({ roomId, message, character }) => {
      const room = roomStore.get(roomId);
      if (!room) return;

      const role = socket.data.role as 'A' | 'B';
      if (!role) return;

      const chatMessage = {
        id: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
        role: role === 'A' ? 'user_a' as const : 'user_b' as const,
        content: message,
        character,
        timestamp: Date.now(),
      };

      io.to(roomId).emit('new-message', chatMessage);
    });

    // 断开连接
    socket.on('disconnect', () => {
      const { roomId } = socket.data as { roomId?: string };
      if (roomId) {
        socket.to(roomId).emit('user-disconnected');
      }
    });
  });
}
