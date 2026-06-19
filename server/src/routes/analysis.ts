import { Router } from 'express';
import { roomStore } from '../store';
import { generateAnalysis } from '../services/llm';
import type { AnalysisRequest } from '@mbti-duo/shared';

export const analysisRouter = Router();

// 分析结果缓存
const analysisCache = new Map<string, { data: string; expireAt: number }>();
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 天

analysisRouter.post('/', async (req, res) => {
  const { roomId, typeA, typeB, relationship } = req.body as AnalysisRequest;

  const room = roomStore.get(roomId);
  if (!room) {
    res.status(404).json({ error: '房间不存在' });
    return;
  }

  // 缓存 key 区分 AB 顺序
  const cacheKey = `${typeA}-${typeB}-${relationship}`;
  const cached = analysisCache.get(cacheKey);
  if (cached && Date.now() < cached.expireAt) {
    res.json({ analysis: cached.data, cached: true });
    return;
  }

  try {
    const analysis = await generateAnalysis(typeA, typeB, relationship);
    analysisCache.set(cacheKey, { data: analysis, expireAt: Date.now() + CACHE_TTL });

    room.analysis = analysis;
    roomStore.update(roomId, { analysis, status: 'chatting' });

    res.json({ analysis, cached: false });
  } catch (error) {
    console.error('Analysis generation failed:', error);
    // 降级到预设模板
    const fallback = generateFallbackAnalysis(typeA, typeB, relationship);
    res.json({ analysis: fallback, cached: false, fallback: true });
  }
});

function generateFallbackAnalysis(typeA: string, typeB: string, relationship: string): string {
  return `## ${typeA} 与 ${typeB} 的${relationship}关系分析

### 关系特点
${typeA} 和 ${typeB} 的组合有着独特的互动模式。在${relationship}关系中，双方可以从彼此的差异中学习和成长。

### 互补点
两种性格类型在多个维度上可以形成互补，帮助彼此看到不同的视角。

### 潜在冲突
不同的偏好可能导致沟通方式和决策方式上的摩擦。

### 相处建议
- 尊重彼此的差异
- 保持开放的沟通
- 寻找共同的兴趣点
- 学会在需要时给予对方空间

> 注：此为基础分析，AI 服务暂时不可用`;
}
