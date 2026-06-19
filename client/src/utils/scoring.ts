import type { Answer, MBTIResult, DimensionResult } from '@mbti-duo/shared';
import { mbtiTypes } from '../data/descriptions';

// 新的计分方式：二选一，每选项映射到一个字母 (E/I/S/N/T/F/J/P)
// 统计每个字母出现的次数，每对中取多的

export function calculateMBTI(answers: Answer[]): MBTIResult {
  // 统计每个字母的出现次数
  const counts: Record<string, number> = {
    E: 0, I: 0,
    S: 0, N: 0,
    T: 0, F: 0,
    J: 0, P: 0,
  };

  for (const answer of answers) {
    if (counts[answer.value] !== undefined) {
      counts[answer.value]++;
    }
  }

  // 计算每个维度
  const dimensions: Record<string, DimensionResult> = {};

  const pairs: [string, string][] = [['E', 'I'], ['S', 'N'], ['T', 'F'], ['J', 'P']];
  const dimKeys = ['EI', 'SN', 'TF', 'JP'];

  for (let i = 0; i < pairs.length; i++) {
    const [a, b] = pairs[i];
    const total = counts[a] + counts[b];
    const direction = counts[a] >= counts[b] ? a : b;
    const percentage = total > 0 ? Math.round((Math.max(counts[a], counts[b]) / total) * 100) : 50;

    dimensions[dimKeys[i]] = {
      score: counts[a] - counts[b],
      direction,
      percentage,
    };
  }

  const type = [
    dimensions.EI.direction,
    dimensions.SN.direction,
    dimensions.TF.direction,
    dimensions.JP.direction,
  ].join('');

  const typeInfo = mbtiTypes[type];

  return {
    type,
    dimensions: dimensions as MBTIResult['dimensions'],
    description: typeInfo ? `${typeInfo.subtitle} — ${typeInfo.description}` : type,
  };
}
