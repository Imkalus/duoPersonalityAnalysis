import { Router } from 'express';
import { roomStore } from '../store';
import { chatCompletion } from '../services/llm';
import type { ChatRequest } from '@mbti-duo/shared';

export const chatRouter = Router();

const CHAT_LIMIT_PER_ROOM = 50; // 每房间每天对话上限

chatRouter.post('/', async (req, res) => {
  const { roomId, message, character } = req.body as ChatRequest;

  const room = roomStore.get(roomId);
  if (!room) {
    res.status(404).json({ error: '房间不存在' });
    return;
  }

  if (!message || message.length > 500) {
    res.status(400).json({ error: '消息长度需要在 1-500 字符之间' });
    return;
  }

  try {
    const reply = await chatCompletion({
      typeA: room.results.A?.type || 'unknown',
      typeB: room.results.B?.type || 'unknown',
      relationship: room.relationship,
      character,
      message,
    });

    res.json({ reply });
  } catch (error) {
    console.error('Chat completion failed:', error);
    res.status(500).json({ error: 'AI 服务暂时不可用，请稍后再试' });
  }
});
