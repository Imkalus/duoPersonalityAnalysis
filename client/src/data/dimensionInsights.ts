// Each dimension pole has a brief insight shown under the dimension bar,
// and a fuller description shown in the expanded detail section.

export interface DimensionPoleInfo {
  label: string;        // e.g. "外向"
  shortDesc: string;    // shown under the bar, ~15 chars
  fullDesc: string;     // shown in detail section, 1-2 sentences
}

export const dimensionPoles: Record<string, { left: DimensionPoleInfo; right: DimensionPoleInfo }> = {
  EI: {
    left: {
      label: '外向 E',
      shortDesc: '从社交中获取能量',
      fullDesc: '你倾向于通过与人互动来充电。热闹的聚会、团队协作、即兴聊天都是你活力的来源。',
    },
    right: {
      label: '内向 I',
      shortDesc: '从独处中获取能量',
      fullDesc: '你更享受独处或小范围深度交流。长时间社交会消耗你的精力，你需要安静的空间来恢复。',
    },
  },
  SN: {
    left: {
      label: '实感 S',
      shortDesc: '关注具体的事实',
      fullDesc: '你相信眼见为实，注重细节和实际经验。你喜欢处理具体的问题，对抽象理论保持谨慎。',
    },
    right: {
      label: '直觉 N',
      shortDesc: '关注可能性与规律',
      fullDesc: '你善于发现事物之间的联系和潜在可能。你喜欢思考未来、探索新想法，对一成不变的事物容易感到乏味。',
    },
  },
  TF: {
    left: {
      label: '思考 T',
      shortDesc: '以逻辑和客观为先',
      fullDesc: '你做决定时更看重逻辑分析和公平原则。你倾向于就事论事，追求效率和真相。',
    },
    right: {
      label: '情感 F',
      shortDesc: '以价值观和共情为先',
      fullDesc: '你做决定时更关注他人的感受和自身的价值观。你善于共情，重视和谐与人际连接。',
    },
  },
  JP: {
    left: {
      label: '判断 J',
      shortDesc: '喜欢计划与确定',
      fullDesc: '你喜欢有条理、有计划的生活。完成待办事项让你有成就感，未决定的事情会让你焦虑。',
    },
    right: {
      label: '感知 P',
      shortDesc: '喜欢灵活与开放',
      fullDesc: '你享受随性和自由，喜欢保留选择的空间。你适应力强，能在变化中找到乐趣。',
    },
  },
};

// Type-specific strengths and growth areas
export const typeTraits: Record<string, { strengths: string[]; growth: string[] }> = {
  ENFJ: {
    strengths: ['天生的领导者，能激励他人', '善于理解和回应他人需求', '组织能力强，擅长协调团队'],
    growth: ['可能过度关注他人而忽视自己', '有时过于理想化', '需要学会接受不完美'],
  },
  ENFP: {
    strengths: ['充满热情和创造力', '善于建立人际连接', '适应力强，思维灵活'],
    growth: ['容易分心，难以坚持', '可能过度理想化', '需要培养执行力'],
  },
  ENTJ: {
    strengths: ['战略思维和决断力强', '高效执行，目标导向', '天生的组织者和领导者'],
    growth: ['可能忽视他人感受', '有时过于强势', '需要培养耐心和倾听'],
  },
  ENTP: {
    strengths: ['创新思维，善于解决问题', '辩论能力强，思维敏捷', '对新想法充满热情'],
    growth: ['可能缺乏跟进和执行', '有时过于好辩', '需要关注细节'],
  },
  ESFJ: {
    strengths: ['热心助人，善于照顾他人', '组织能力强，注重细节', '忠诚可靠，重视承诺'],
    growth: ['可能过度在意他人评价', '有时难以接受变化', '需要学会说"不"'],
  },
  ESFP: {
    strengths: ['热情开朗，感染力强', '活在当下，享受生活', '实际务实，善于解决问题'],
    growth: ['可能回避长期规划', '有时难以处理严肃话题', '需要培养耐心'],
  },
  ESTJ: {
    strengths: ['组织能力强，做事有条理', '果断实际，注重效率', '可靠负责，言出必行'],
    growth: ['可能过于固执', '有时忽视情感因素', '需要保持开放心态'],
  },
  ESTP: {
    strengths: ['行动力强，善于应对危机', '实际务实，注重结果', '适应力强，灵活变通'],
    growth: ['可能冲动行事', '有时忽视长远影响', '需要培养耐心和规划能力'],
  },
  INFJ: {
    strengths: ['洞察力强，善于理解他人', '有远见，能预见可能性', '坚定执着，追求意义'],
    growth: ['可能过度理想化', '有时难以处理冲突', '需要学会放松和接受现实'],
  },
  INFP: {
    strengths: ['富有同情心和创造力', '忠于自己的价值观', '善于理解复杂的内心世界'],
    growth: ['可能过于敏感', '有时难以采取行动', '需要培养实际执行力'],
  },
  INTJ: {
    strengths: ['战略思维能力极强', '独立自主，意志坚定', '善于将复杂理论转化为行动'],
    growth: ['可能忽视情感因素', '有时过于批判', '需要培养人际敏感度'],
  },
  INTP: {
    strengths: ['逻辑分析能力极强', '好奇心旺盛，善于学习', '独立思考，不受传统束缚'],
    growth: ['可能过度沉浸在思考中', '有时忽视实际执行', '需要培养社交技能'],
  },
  ISFJ: {
    strengths: ['细心体贴，善于照顾他人', '可靠忠诚，值得信赖', '注重细节，做事周到'],
    growth: ['可能过度自我牺牲', '有时难以表达需求', '需要学会设立界限'],
  },
  ISFP: {
    strengths: ['审美感强，富有艺术气质', '温和友善，善解人意', '活在当下，享受美好事物'],
    growth: ['可能回避冲突', '有时难以做决定', '需要培养自信和表达能力'],
  },
  ISTJ: {
    strengths: ['可靠负责，言出必行', '做事有条理，注重细节', '忠诚坚定，值得信赖'],
    growth: ['可能过于刻板', '有时难以接受新想法', '需要保持灵活性'],
  },
  ISTP: {
    strengths: ['冷静理性，善于分析', '动手能力强', '适应力强，独立自主'],
    growth: ['可能难以表达情感', '有时过于冷淡', '需要培养人际连接'],
  },
};
