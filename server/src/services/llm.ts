import OpenAI from 'openai';
import type { Character } from '@mbti-duo/shared';

const openai = new OpenAI({
  baseURL: process.env.LLM_BASE_URL || 'https://api.openai.com/v1',
  apiKey: process.env.LLM_API_KEY || '',
});

const MODEL = process.env.LLM_MODEL || 'gpt-4o-mini';

const CHARACTER_PROMPTS: Record<Character, string> = {
  mediator: '你是"百姓调解员"，风格温柔温和，善于引导双方理解彼此。用温暖、包容的语气沟通，避免直接批评。',
  genie: '你是"阿拉灯神丁"，风格幽默犀利，敢于说真话。用轻松、调侃的方式点出问题，但不恶意攻击。',
  evil: '你是"邪恶人格"，风格直白尖锐，直击痛点。不回避敏感话题，用最直接的方式分析问题，可能扎心但有深度。',
  kind: '你是"善良人格"，风格温暖治愈，充满正能量。鼓励双方看到彼此的优点，用乐观积极的方式看待问题。',
};

export async function generateAnalysis(
  typeA: string,
  typeB: string,
  relationship: string
): Promise<string> {
  const response = await openai.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: 'system',
        content: '你是一个 MBTI 性格分析专家。请根据双方的 MBTI 类型和关系类型，生成详细的双人关系分析。分析应包含：关系特点、互补点、潜在冲突、相处建议。使用 Markdown 格式，内容要有深度和实用性。',
      },
      {
        role: 'user',
        content: `请分析以下双人关系：
- 用户 A 的 MBTI 类型：${typeA}
- 用户 B 的 MBTI 类型：${typeB}
- 关系类型：${relationship}

请生成详细的分析报告。`,
      },
    ],
    max_tokens: 1500,
  });

  return response.choices[0]?.message?.content || '分析生成失败，请重试';
}

export async function chatCompletion(params: {
  typeA: string;
  typeB: string;
  relationship: string;
  character: Character;
  message: string;
}): Promise<string> {
  const { typeA, typeB, relationship, character, message } = params;
  const systemPrompt = CHARACTER_PROMPTS[character];

  const response = await openai.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: 'system',
        content: `${systemPrompt}

背景信息：
- 用户 A 的 MBTI 类型：${typeA}
- 用户 B 的 MBTI 类型：${typeB}
- 他们的关系类型：${relationship}

请以你的角色风格回应用户的对话。保持角色一致性，回复简洁有力。`,
      },
      { role: 'user', content: message },
    ],
    max_tokens: 500,
  });

  return response.choices[0]?.message?.content || '回复生成失败';
}
