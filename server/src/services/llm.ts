import type { Character } from '@mbti-duo/shared';
import {
  ANALYSIS_SYSTEM_PROMPT,
  buildAnalysisUserPrompt,
  buildChatSystemPrompt,
  type PersonProfile,
} from './prompts';

// 惰性读取环境变量：避免 ES module import 提升导致在 dotenv config() 之前固化默认值
function llmConfig() {
  return {
    baseUrl: process.env.LLM_BASE_URL || 'https://api.openai.com/v1',
    apiKey: process.env.LLM_API_KEY || '',
    model: process.env.LLM_MODEL || 'gpt-4o-mini',
  };
}

// 粗略估算 token 数：中文按 ~1.5 字/token，英文/符号按 ~4 字符/token。
// 仅用于日志和上下文超限预警，不要求精确。
function estimateTokens(text: string): number {
  let cjk = 0;
  let other = 0;
  for (const ch of text) {
    if (/[一-鿿　-〿＀-￯]/.test(ch)) cjk++;
    else other++;
  }
  return Math.ceil(cjk / 1.5 + other / 4);
}

// 模型上下文上限。MiMo-V2.5 / V2.5-Pro 原生支持 256K（262144）tokens 上下文，
// 本项目单次提示词仅 ~1K tokens，余量极大。这里取 256K 作为预警阈值，可按所用模型调整。
const CONTEXT_LIMIT = 262_144;

async function callLLM(
  messages: { role: string; content: string }[],
  maxTokens: number,
  tag: string
): Promise<string> {
  const { baseUrl, apiKey, model } = llmConfig();
  const url = `${baseUrl}/chat/completions`;

  const promptTokens = messages.reduce((sum, m) => sum + estimateTokens(m.content), 0);
  console.log(`[LLM] ${tag} → ${url}, model=${model}`);
  console.log(`[LLM] ${tag} 估算输入 ~${promptTokens} tokens + 预留输出 ${maxTokens} tokens = ~${promptTokens + maxTokens}（上下文上限约 ${CONTEXT_LIMIT}）`);
  if (promptTokens + maxTokens > CONTEXT_LIMIT) {
    console.warn(`[LLM] ⚠️ ${tag} 预计可能超出上下文上限，请精简提示词或缩短输出预留`);
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: maxTokens,
    }),
    signal: AbortSignal.timeout(120_000),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`LLM API error ${res.status}: ${body}`);
  }

  const data = await res.json() as any;
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error(`LLM returned empty content: ${JSON.stringify(data)}`);
  }

  console.log(`[LLM] ${tag} 成功（输出 ${content.length} 字）`);
  return content;
}

export async function generateAnalysis(params: {
  relationship: string;
  personA: PersonProfile;
  personB: PersonProfile;
}): Promise<string> {
  console.log(`[LLM] 生成关系分析：${params.personA.type} + ${params.personB.type}，关系=${params.relationship}`);

  return callLLM([
    { role: 'system', content: ANALYSIS_SYSTEM_PROMPT },
    { role: 'user', content: buildAnalysisUserPrompt(params) },
  ], 8000, '分析');
}

export async function chatCompletion(params: {
  relationship: string;
  personA: PersonProfile;
  personB: PersonProfile;
  character: Character;
  message: string;
}): Promise<string> {
  const { relationship, personA, personB, character, message } = params;

  return callLLM([
    { role: 'system', content: buildChatSystemPrompt({ relationship, personA, personB, character }) },
    { role: 'user', content: message },
  ], 4000, '对话');
}

