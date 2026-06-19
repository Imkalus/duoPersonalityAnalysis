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
        console.log(`User ${userId} not in room ${roomId}`);
        return;
      }

      socket.join(roomId);
      socket.data = { roomId, userId, role: isA ? 'A' : 'B' };

      // 更新 socketId
      if (isA) {
        room.members.A.socketId = socket.id;
      } else if (room.members.B) {
        room.members.B.socketId = socket.id;
      }

      console.log(`User ${userId} (${isA ? 'A' : 'B'}) joined room ${roomId}`);

      // 发送房间当前状态给加入者
      socket.emit('room-state', {
        status: room.status,
        answersA: room.answers.A.length,
        answersB: room.answers.B.length,
      });

      // 如果 B 加入了，通知 A
      if (isB && room.members.B) {
        socket.to(roomId).emit('partner-joined', {
          name: room.members.B.name,
          userId: room.members.B.userId,
        });
      }
    });

    // 通知房间状态变更（当 B 通过 REST 加入时调用）
    // 这个由 routes/rooms.ts 中的 join 端点触发

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

      // 标记该用户已完成
      if (role === 'A') {
        room.members.A.completed = true;
      } else {
        room.members.B!.completed = true;
      }

      // 检查双方是否都完成
      const bothCompleted = room.members.A.completed && room.members.B?.completed;
      if (bothCompleted) {
        room.status = 'analyzing';

        // 给 A 发 B 的答案，给 B 发 A 的答案
        const members = io.sockets.adapter.rooms.get(roomId);
        if (members) {
          for (const sid of members) {
            const s = io.sockets.sockets.get(sid);
            if (!s) continue;
            const r = s.data.role as 'A' | 'B';
            if (r === 'A') {
              s.emit('partner-answers', { answers: room.answers.B });
            } else {
              s.emit('partner-answers', { answers: room.answers.A });
            }
          }
        }

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
