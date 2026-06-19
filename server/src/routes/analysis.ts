import { Router } from 'express';
import { roomStore } from '../store';
import { generateAnalysis } from '../services/llm';
import type { AnalysisRequest, MBTIResult } from '@mbti-duo/shared';
import type { PersonProfile } from '../services/prompts';

export const analysisRouter = Router();

// 分析结果缓存
const analysisCache = new Map<string, { data: string; expireAt: number }>();
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 天

// 由 MBTIResult + 昵称构造提示词所需的画像；缺维度数据时用 50% 兜底
function toProfile(name: string, type: string, result?: MBTIResult): PersonProfile {
  const d = result?.dimensions;
  const fallback = (dir: string) => ({ direction: dir, percentage: 50 });
  return {
    name,
    type,
    dimensions: {
      EI: d?.EI ? { direction: d.EI.direction, percentage: d.EI.percentage } : fallback(type[0] || 'E'),
      SN: d?.SN ? { direction: d.SN.direction, percentage: d.SN.percentage } : fallback(type[1] || 'N'),
      TF: d?.TF ? { direction: d.TF.direction, percentage: d.TF.percentage } : fallback(type[2] || 'T'),
      JP: d?.JP ? { direction: d.JP.direction, percentage: d.JP.percentage } : fallback(type[3] || 'J'),
    },
  };
}

analysisRouter.post('/', async (req, res) => {
  const { roomId, typeA, typeB, relationship, nameA, nameB, resultA, resultB } =
    req.body as AnalysisRequest;

  if (!roomId || !typeA || !typeB || !relationship) {
    res.status(400).json({ error: '缺少必要参数' });
    return;
  }

  const room = roomStore.get(roomId);
  if (!room) {
    res.status(404).json({ error: '房间不存在' });
    return;
  }

  // 记录双方类型与完整结果，供后续 AI 对话提供上下文（首次写入为准）
  if (!room.types.A || !room.types.B) {
    room.types.A = typeA;
    room.types.B = typeB;
  }
  if (resultA && !room.results.A) room.results.A = resultA;
  if (resultB && !room.results.B) room.results.B = resultB;

  // 已有分析结果（房间内已生成过），直接复用，保证两人看到同一份
  if (room.analysis) {
    res.json({ analysis: room.analysis, cached: true });
    return;
  }

  // in-flight 去重：A/B 几乎同时请求时，只发起一次 LLM 调用，双方 await 同一个 Promise
  if (room.analysisInFlight) {
    try {
      const analysis = await room.analysisInFlight;
      res.json({ analysis, cached: true });
    } catch {
      res.json({ analysis: room.analysis || generateFallbackAnalysis(typeA, typeB, relationship), cached: false, fallback: true });
    }
    return;
  }

  const cacheKey = `${[typeA, typeB].sort().join('-')}-${relationship}`;
  const cached = analysisCache.get(cacheKey);
  if (cached && Date.now() < cached.expireAt) {
    console.log(`[Analysis] 命中缓存: ${cacheKey}`);
    room.analysis = cached.data;
    roomStore.update(roomId, { analysis: cached.data, status: 'chatting' });
    res.json({ analysis: cached.data, cached: true });
    return;
  }

  const nameAName = nameA || room.members.A.name || '用户A';
  const nameBName = nameB || room.members.B?.name || '用户B';
  const personA = toProfile(nameAName, typeA, resultA || room.results.A || undefined);
  const personB = toProfile(nameBName, typeB, resultB || room.results.B || undefined);

  console.log(`[Analysis] 发起 LLM 请求: ${cacheKey}`);
  const task = generateAnalysis({ relationship, personA, personB });
  room.analysisInFlight = task;

  try {
    const analysis = await task;
    analysisCache.set(cacheKey, { data: analysis, expireAt: Date.now() + CACHE_TTL });
    room.analysis = analysis;
    roomStore.update(roomId, { analysis, status: 'chatting' });
    res.json({ analysis, cached: false });
  } catch (error: any) {
    console.error('[Analysis] LLM 调用失败:', error?.message || error);
    const fallback = generateFallbackAnalysis(typeA, typeB, relationship);
    roomStore.update(roomId, { analysis: fallback, status: 'chatting' });
    room.analysis = fallback;
    res.json({ analysis: fallback, cached: false, fallback: true });
  } finally {
    room.analysisInFlight = null;
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
