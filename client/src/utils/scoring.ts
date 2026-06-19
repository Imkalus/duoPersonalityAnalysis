import type { Answer, MBTIResult, DimensionResult } from '@mbti-duo/shared';
import { getQuestions } from '../data/questions';

// Likert 值范围：-3 到 +3
// reverse=true 的题目需要反转：value = -value
// 正方向 = 维度第一个字母（E, S, T, J）
// 负方向 = 维度第二个字母（I, N, F, P）

export function calculateMBTI(answers: Answer[]): MBTIResult {
  const questions = getQuestions('lite'); // 使用精简版作为参考
  const questionMap = new Map(questions.map((q) => [q.id, q]));

  // 累计各维度得分
  const dimensionScores: Record<string, { score: number; count: number }> = {
    EI: { score: 0, count: 0 },
    SN: { score: 0, count: 0 },
    TF: { score: 0, count: 0 },
    JP: { score: 0, count: 0 },
  };

  for (const answer of answers) {
    const question = questionMap.get(answer.questionId);
    if (!question) continue;

    const dim = answer.dimension;
    // 反向题目：反转得分
    const value = question.reverse ? -answer.value : answer.value;
    dimensionScores[dim].score += value;
    dimensionScores[dim].count++;
  }

  // 计算各维度结果
  const dimensions: Record<string, DimensionResult> = {};

  for (const [dim, { score, count }] of Object.entries(dimensionScores)) {
    // 最大可能得分 = count * 3（每题最高 +3）
    const maxScore = count * 3;
    // 百分比 = (score + maxScore) / (2 * maxScore) * 100
    // 将 -maxScore~+maxScore 映射到 0~100
    const percentage = Math.round(((score + maxScore) / (2 * maxScore)) * 100);

    // 正方向字母
    const positiveDirection = dim[0]; // E, S, T, J
    const negativeDirection = dim[1]; // I, N, F, P
    const direction = score >= 0 ? positiveDirection : negativeDirection;

    dimensions[dim] = {
      score,
      direction,
      percentage: score >= 0 ? percentage : 100 - percentage,
    };
  }

  // 生成 MBTI 类型字符串
  const type = [
    dimensions.EI.direction,
    dimensions.SN.direction,
    dimensions.TF.direction,
    dimensions.JP.direction,
  ].join('');

  return {
    type,
    dimensions: dimensions as MBTIResult['dimensions'],
    description: getMBTIDescription(type),
  };
}

function getMBTIDescription(type: string): string {
  const descriptions: Record<string, string> = {
    INTJ: '建筑师 — 富有想象力和战略性的思想家，一切皆在计划之中。',
    INTP: '逻辑学家 — 具有创造力的发明家，对知识有着不懈的渴望。',
    ENTJ: '指挥官 — 大胆、富有想象力且意志坚强的领导者。',
    ENTP: '辩论家 — 聪明好奇的思想家，不会放过任何智力挑战。',
    INFJ: '提倡者 — 安静而神秘，同时鼓舞人心且不知疲倦的理想主义者。',
    INFP: '调停者 — 诗意、善良的利他主义者，总是热心为正义事业提供帮助。',
    ENFJ: '主人公 — 富有魅力且鼓舞人心的领导者，能够迷住他的听众。',
    ENFP: '竞选者 — 热情、有创造力、善于社交的自由灵魂。',
    ISTJ: '物流师 — 实际且注重事实的个人，其可靠性不容怀疑。',
    ISFJ: '守卫者 — 非常专注且温暖的保护者，时刻准备着保护所爱的人。',
    ESTJ: '总经理 — 出色的管理者，在管理事物或人的方面无与伦比。',
    ESFJ: '执政官 — 极有同情心、善于社交且受人欢迎的人，总是热心帮助他人。',
    ISTP: '鉴赏家 — 大胆而实际的实验家，擅长使用各种形式的工具。',
    ISFP: '探险家 — 灵活而有魅力的艺术家，时刻准备着探索和体验新事物。',
    ESTP: '企业家 — 聪明、精力充沛且非常善于感知的人，真正享受活在边缘的感觉。',
    ESFP: '表演者 — 自发的、精力充沛的、热情的娱乐者——生活永远不会无聊。',
  };

  return descriptions[type] || `${type} 类型`;
}
