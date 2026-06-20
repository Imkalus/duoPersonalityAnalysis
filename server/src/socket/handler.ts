import type { Server } from 'socket.io';
import type { ServerToClientEvents, ClientToServerEvents, Character, MBTIResult } from '@mbti-duo/shared';
import { roomStore } from '../store';
import { chatCompletion } from '../services/llm';
import type { PersonProfile } from '../services/prompts';

function makeId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

// 由类型 + 完整结果构造对话所需画像；缺维度数据时用 50% 兜底
function buildProfile(name: string, type: string, result?: MBTIResult | null): PersonProfile {
  const d = result?.dimensions;
  const fb = (dir: string) => ({ direction: dir, percentage: 50 });
  return {
    name,
    type,
    dimensions: {
      EI: d?.EI ? { direction: d.EI.direction, percentage: d.EI.percentage } : fb(type[0] || 'E'),
      SN: d?.SN ? { direction: d.SN.direction, percentage: d.SN.percentage } : fb(type[1] || 'N'),
      TF: d?.TF ? { direction: d.TF.direction, percentage: d.TF.percentage } : fb(type[2] || 'T'),
      JP: d?.JP ? { direction: d.JP.direction, percentage: d.JP.percentage } : fb(type[3] || 'J'),
    },
  };
}

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

      // 补发对方当前答题进度（修复重连/页面切换后进度丢失，导致两端不同步）
      const partnerCount = isA ? room.answers.B.length : room.answers.A.length;
      if (partnerCount > 0) {
        socket.emit('partner-progress', { count: partnerCount });
      }

      // 同步共享对话状态（历史消息 + 当前人格 + 是否正在回复）
      socket.emit('chat-history', {
        messages: room.chat.messages,
        character: room.chat.character,
        typing: room.chat.typing,
      });

      // 如果双方都完成了答题，重新发送对方答案（防止因导航断连丢失事件）
      if (room.members.A.completed && room.members.B?.completed) {
        if (isA) {
          socket.emit('partner-answers', { answers: room.answers.B });
        } else {
          socket.emit('partner-answers', { answers: room.answers.A });
        }
      }

      // 如果 B 加入了，通知 A
      if (isB && room.members.B) {
        socket.to(roomId).emit('partner-joined', {
          name: room.members.B.name,
          userId: room.members.B.userId,
        });
      }
    });

    // 提交单题答案
    socket.on('answer-submitted', ({ roomId, answer }) => {
      const room = roomStore.get(roomId);
      if (!room) return;

      const role = socket.data.role as 'A' | 'B';
      if (!role) return;

      // 按 questionId 去重：返回上一题重新作答时替换而非追加，避免计数超过题目总数
      const list = room.answers[role];
      const idx = list.findIndex((a) => a.questionId === answer.questionId);
      if (idx >= 0) {
        list[idx] = answer;
      } else {
        list.push(answer);
      }

      const count = list.length;
      // 明牌：广播题号+选择+权威计数；暗牌：只广播权威计数
      if (room.displayMode === 'open') {
        socket.to(roomId).emit('answer-synced', {
          questionId: answer.questionId,
          value: answer.value,
          count,
        });
      } else {
        socket.to(roomId).emit('partner-progress', { count });
      }
    });

    // 批量提交答案（完成时）：按 questionId 去重，保留每题最后一次作答
    socket.on('answers-batch', ({ roomId, answers }) => {
      const room = roomStore.get(roomId);
      if (!room) return;

      const role = socket.data.role as 'A' | 'B';
      if (!role) return;

      const deduped = new Map<number, typeof answers[number]>();
      for (const a of answers) deduped.set(a.questionId, a);
      room.answers[role] = Array.from(deduped.values());
    });

    // 完成测试
    socket.on('test-completed', ({ roomId }) => {
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

    // 切换对话人格（双方共享）
    socket.on('change-character', ({ roomId, character }) => {
      const room = roomStore.get(roomId);
      if (!room) return;
      const role = socket.data.role as 'A' | 'B';
      if (!role) return;
      if (character !== 'kind' && character !== 'evil') return;

      room.chat.character = character;
      io.to(roomId).emit('character-changed', { character });
    });

    // 聊天消息（共享对话框：服务端为唯一数据源）
    socket.on('chat-message', async ({ roomId, message, character }) => {
      const room = roomStore.get(roomId);
      if (!room) return;

      const role = socket.data.role as 'A' | 'B';
      if (!role) return;

      const text = (message || '').trim();
      if (!text || text.length > 500) return;
      if (room.chat.typing) return; // 上一条还在生成，忽略

      const activeCharacter: Character = character === 'evil' || character === 'kind'
        ? character
        : room.chat.character;
      room.chat.character = activeCharacter;

      const senderName = role === 'A' ? room.members.A.name : room.members.B?.name;
      const userMessage = {
        id: makeId(),
        role: role === 'A' ? ('user_a' as const) : ('user_b' as const),
        content: text,
        character: activeCharacter,
        senderName,
        timestamp: Date.now(),
      };

      room.chat.messages.push(userMessage);
      io.to(roomId).emit('new-message', userMessage);

      // 标记正在回复，双方同步显示
      room.chat.typing = true;
      io.to(roomId).emit('chat-typing', { typing: true });

      try {
        const typeA = room.types.A || room.results.A?.type || 'unknown';
        const typeB = room.types.B || room.results.B?.type || 'unknown';
        const reply = await chatCompletion({
          relationship: room.relationship,
          personA: buildProfile(room.members.A.name, typeA, room.results.A),
          personB: buildProfile(room.members.B?.name || '伙伴', typeB, room.results.B),
          character: activeCharacter,
          message: text,
        });
        const aiMessage = {
          id: makeId(),
          role: 'assistant' as const,
          content: reply,
          character: activeCharacter,
          timestamp: Date.now(),
        };
        room.chat.messages.push(aiMessage);
        io.to(roomId).emit('new-message', aiMessage);
      } catch (error) {
        console.error('[Chat] LLM failed:', error);
        const errMessage = {
          id: makeId(),
          role: 'assistant' as const,
          content: '> ⚠️ AI 暂时无法回复，请稍后再试',
          character: activeCharacter,
          timestamp: Date.now(),
        };
        room.chat.messages.push(errMessage);
        io.to(roomId).emit('new-message', errMessage);
      } finally {
        room.chat.typing = false;
        io.to(roomId).emit('chat-typing', { typing: false });
      }
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
