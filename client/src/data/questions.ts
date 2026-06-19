import type { Question, QuestionVersion } from '@mbti-duo/shared';

// 精简版 28 题（每维度 7 题）
const liteQuestions: Question[] = [
  // EI 维度
  { id: 1, dimension: 'EI', text: '在社交场合中，你通常会主动与陌生人交谈。', reverse: false },
  { id: 2, dimension: 'EI', text: '长时间的社交活动后，你需要独处来恢复精力。', reverse: true },
  { id: 3, dimension: 'EI', text: '你更喜欢小范围的深度对话，而不是大型聚会。', reverse: true },
  { id: 4, dimension: 'EI', text: '你经常是聚会中最后离开的人之一。', reverse: false },
  { id: 5, dimension: 'EI', text: '你在思考时倾向于大声说出来，与他人讨论。', reverse: false },
  { id: 6, dimension: 'EI', text: '你更享受一个人的活动，如阅读或游戏。', reverse: true },
  { id: 7, dimension: 'EI', text: '你很容易结交新朋友，并且享受这个过程。', reverse: false },

  // SN 维度
  { id: 8, dimension: 'SN', text: '你更关注具体的事实和细节，而不是抽象的概念。', reverse: false },
  { id: 9, dimension: 'SN', text: '你喜欢想象未来的各种可能性。', reverse: true },
  { id: 10, dimension: 'SN', text: '你更相信亲身经历，而不是理论推测。', reverse: false },
  { id: 11, dimension: 'SN', text: '你经常思考事物背后的深层含义。', reverse: true },
  { id: 12, dimension: 'SN', text: '你更喜欢处理实际的、当下的问题。', reverse: false },
  { id: 13, dimension: 'SN', text: '你对新奇的、未经验证的想法很感兴趣。', reverse: true },
  { id: 14, dimension: 'SN', text: '你更倾向于按部就班地完成任务。', reverse: false },

  // TF 维度
  { id: 15, dimension: 'TF', text: '做决定时，你更看重逻辑分析而非他人感受。', reverse: false },
  { id: 16, dimension: 'TF', text: '你很容易感受到他人的情绪变化。', reverse: true },
  { id: 17, dimension: 'TF', text: '你认为公平比同情更重要。', reverse: false },
  { id: 18, dimension: 'TF', text: '你经常为了维护关系而妥协自己的立场。', reverse: true },
  { id: 19, dimension: 'TF', text: '你更倾向于给出直接的批评，而不是委婉的建议。', reverse: false },
  { id: 20, dimension: 'TF', text: '你在做决定时会优先考虑对他人造成的影响。', reverse: true },
  { id: 21, dimension: 'TF', text: '你认为诚实的批评比善意的谎言更有价值。', reverse: false },

  // JP 维度
  { id: 22, dimension: 'JP', text: '你喜欢提前制定详细的计划。', reverse: false },
  { id: 23, dimension: 'JP', text: '你更喜欢灵活应变，随遇而安。', reverse: true },
  { id: 24, dimension: 'JP', text: '你通常会按时完成任务，不喜欢拖延。', reverse: false },
  { id: 25, dimension: 'JP', text: '你觉得严格的截止日期是一种束缚。', reverse: true },
  { id: 26, dimension: 'JP', text: '你喜欢把事情安排得井井有条。', reverse: false },
  { id: 27, dimension: 'JP', text: '你更享受即兴发挥的感觉。', reverse: true },
  { id: 28, dimension: 'JP', text: '你倾向于尽快做出决定，而不是反复权衡。', reverse: false },
];

// 完整版 60 题（每维度 15 题）
const fullQuestions: Question[] = [
  ...liteQuestions,
  // 补充 EI
  { id: 29, dimension: 'EI', text: '你在团队中更喜欢倾听而不是发言。', reverse: true },
  { id: 30, dimension: 'EI', text: '你经常主动组织社交活动。', reverse: false },
  { id: 31, dimension: 'EI', text: '你在公共场合发言会感到紧张。', reverse: true },
  { id: 32, dimension: 'EI', text: '你喜欢成为众人关注的焦点。', reverse: false },
  { id: 33, dimension: 'EI', text: '你更喜欢通过文字而非电话沟通。', reverse: true },
  { id: 34, dimension: 'EI', text: '你在新环境中很快就能放松下来。', reverse: false },
  { id: 35, dimension: 'EI', text: '你更喜欢和一两个好友深度交流。', reverse: true },
  { id: 36, dimension: 'EI', text: '你在聚会中经常主动发起话题。', reverse: false },

  // 补充 SN
  { id: 37, dimension: 'SN', text: '你更喜欢有明确步骤的工作任务。', reverse: false },
  { id: 38, dimension: 'SN', text: '你经常对未来充满各种幻想和憧憬。', reverse: true },
  { id: 39, dimension: 'SN', text: '你更相信数据和证据。', reverse: false },
  { id: 40, dimension: 'SN', text: '你经常从一个话题联想到另一个话题。', reverse: true },
  { id: 41, dimension: 'SN', text: '你更喜欢实际操作而非理论研究。', reverse: false },
  { id: 42, dimension: 'SN', text: '你对隐喻和象征性的表达很有感觉。', reverse: true },
  { id: 43, dimension: 'SN', text: '你更关注眼前的事物。', reverse: false },
  { id: 44, dimension: 'SN', text: '你喜欢探索事物的本质和规律。', reverse: true },

  // 补充 TF
  { id: 45, dimension: 'TF', text: '你在争论中更关注逻辑的正确性。', reverse: false },
  { id: 46, dimension: 'TF', text: '你会因为感人的故事而落泪。', reverse: true },
  { id: 47, dimension: 'TF', text: '你认为规则应该适用于所有人，不应有例外。', reverse: false },
  { id: 48, dimension: 'TF', text: '你在做决定时会考虑团队的和谐。', reverse: true },
  { id: 49, dimension: 'TF', text: '你更欣赏直言不讳的人。', reverse: false },
  { id: 50, dimension: 'TF', text: '你经常会为他人的问题感到担忧。', reverse: true },
  { id: 51, dimension: 'TF', text: '你更看重效率而非人际关系。', reverse: false },
  { id: 52, dimension: 'TF', text: '你在批评别人时会考虑对方的感受。', reverse: true },

  // 补充 JP
  { id: 53, dimension: 'JP', text: '你的房间/桌面通常保持整洁。', reverse: false },
  { id: 54, dimension: 'JP', text: '你更喜欢即兴旅行而非提前规划。', reverse: true },
  { id: 55, dimension: 'JP', text: '你会在截止日期前很久就完成工作。', reverse: false },
  { id: 56, dimension: 'JP', text: '你觉得太多的规则让人窒息。', reverse: true },
  { id: 57, dimension: 'JP', text: '你喜欢做清单和待办事项。', reverse: false },
  { id: 58, dimension: 'JP', text: '你更喜欢保留多种选择，不做最终决定。', reverse: true },
  { id: 59, dimension: 'JP', text: '你通常会遵守既定的日程安排。', reverse: false },
  { id: 60, dimension: 'JP', text: '你更享受过程而非结果。', reverse: true },
];

export function getQuestions(version: QuestionVersion): Question[] {
  return version === 'lite' ? liteQuestions : fullQuestions;
}
