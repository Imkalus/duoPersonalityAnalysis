// 数据来源: MskTmi/MBTI (https://github.com/MskTmi/MBTI)
// 93 题，二选一格式，每选项映射到 MBTI 维度字母 (E/I/S/N/T/F/J/P)

export interface QuestionChoice {
  text: string;
  value: string; // E/I/S/N/T/F/J/P
}

export interface MBTIQuestion {
  id: number;
  question: string;
  choiceA: QuestionChoice;
  choiceB: QuestionChoice;
}

export const questions: MBTIQuestion[] = [
  {
    "id": 1,
    "question": "当你要外出一整天，你会",
    "choiceA": {
      "text": "计划你要做什么和在什么时候做",
      "value": "J"
    },
    "choiceB": {
      "text": "说去就去",
      "value": "P"
    }
  },
  {
    "id": 2,
    "question": "你认为自己是一个",
    "choiceA": {
      "text": "较为随兴所至的人",
      "value": "P"
    },
    "choiceB": {
      "text": "较为有条理的人",
      "value": "J"
    }
  },
  {
    "id": 3,
    "question": "假如你是一名老师，你会选教",
    "choiceA": {
      "text": "以事实为主的课程",
      "value": "S"
    },
    "choiceB": {
      "text": "涉及理论的课程",
      "value": "N"
    }
  },
  {
    "id": 4,
    "question": "你通常",
    "choiceA": {
      "text": "与人容易混熟",
      "value": "E"
    },
    "choiceB": {
      "text": "比较沉静或矜持",
      "value": "I"
    }
  },
  {
    "id": 5,
    "question": "一般来说，你和哪些人比较合得来？",
    "choiceA": {
      "text": "富于想象力的人",
      "value": "N"
    },
    "choiceB": {
      "text": "现实的人",
      "value": "S"
    }
  },
  {
    "id": 6,
    "question": "你是否经常让",
    "choiceA": {
      "text": "你的情感支配你的理智",
      "value": "F"
    },
    "choiceB": {
      "text": "你的理智主宰你的情感",
      "value": "T"
    }
  },
  {
    "id": 7,
    "question": "处理许多事情上，你会喜欢",
    "choiceA": {
      "text": "凭兴所至行事",
      "value": "P"
    },
    "choiceB": {
      "text": "按照计划行事",
      "value": "J"
    }
  },
  {
    "id": 8,
    "question": "你是否",
    "choiceA": {
      "text": "容易让人了解",
      "value": "E"
    },
    "choiceB": {
      "text": "难于让人了解",
      "value": "I"
    }
  },
  {
    "id": 9,
    "question": "按照程序表做事",
    "choiceA": {
      "text": "合你心意",
      "value": "J"
    },
    "choiceB": {
      "text": "令你感到束缚",
      "value": "P"
    }
  },
  {
    "id": 10,
    "question": "当你有一项特别的任务，你会喜欢",
    "choiceA": {
      "text": "开始前小心组织计划",
      "value": "J"
    },
    "choiceB": {
      "text": "边做边找要做什么",
      "value": "P"
    }
  },
  {
    "id": 11,
    "question": "在大多数情况下，你会选择",
    "choiceA": {
      "text": "顺其自然",
      "value": "P"
    },
    "choiceB": {
      "text": "按程序表做事",
      "value": "J"
    }
  },
  {
    "id": 12,
    "question": "大多数人会说你是一个",
    "choiceA": {
      "text": "重视自我隐私的人",
      "value": "I"
    },
    "choiceB": {
      "text": "非常坦率开放的人",
      "value": "E"
    }
  },
  {
    "id": 13,
    "question": "你宁愿被人认为是一个",
    "choiceA": {
      "text": "实事求是的人",
      "value": "S"
    },
    "choiceB": {
      "text": "机灵的人",
      "value": "N"
    }
  },
  {
    "id": 14,
    "question": "在一大群人当中，通常是",
    "choiceA": {
      "text": "你介绍大家认识",
      "value": "E"
    },
    "choiceB": {
      "text": "别人介绍你",
      "value": "I"
    }
  },
  {
    "id": 15,
    "question": "你会跟哪些人做朋友？",
    "choiceA": {
      "text": "常提出新主意的",
      "value": "N"
    },
    "choiceB": {
      "text": "脚踏实地的",
      "value": "S"
    }
  },
  {
    "id": 16,
    "question": "你倾向",
    "choiceA": {
      "text": "重视感情多于逻辑",
      "value": "F"
    },
    "choiceB": {
      "text": "重视逻辑多于感情",
      "value": "T"
    }
  },
  {
    "id": 17,
    "question": "你比较喜欢",
    "choiceA": {
      "text": "坐观事情发展才作计划",
      "value": "P"
    },
    "choiceB": {
      "text": "很早就作计划",
      "value": "J"
    }
  },
  {
    "id": 18,
    "question": "你喜欢花很多的时间",
    "choiceA": {
      "text": "一个人独处",
      "value": "I"
    },
    "choiceB": {
      "text": "和别人在一起",
      "value": "E"
    }
  },
  {
    "id": 19,
    "question": "与很多人一起会",
    "choiceA": {
      "text": "令你活力倍增",
      "value": "E"
    },
    "choiceB": {
      "text": "常常令你心力交瘁",
      "value": "I"
    }
  },
  {
    "id": 20,
    "question": "你比较喜欢",
    "choiceA": {
      "text": "很早便把约会、社交聚集等事情安排妥当",
      "value": "J"
    },
    "choiceB": {
      "text": "无拘无束，看当时有什么好玩就做什么",
      "value": "P"
    }
  },
  {
    "id": 21,
    "question": "计划一个旅程时，你较喜欢",
    "choiceA": {
      "text": "大部分的时间都是跟当天的感觉行事",
      "value": "P"
    },
    "choiceB": {
      "text": "事先知道大部分的日子会做什么",
      "value": "J"
    }
  },
  {
    "id": 22,
    "question": "在社交聚会中，你",
    "choiceA": {
      "text": "有时感到郁闷",
      "value": "I"
    },
    "choiceB": {
      "text": "常常乐在其中",
      "value": "E"
    }
  },
  {
    "id": 23,
    "question": "你通常",
    "choiceA": {
      "text": "和别人容易混熟",
      "value": "E"
    },
    "choiceB": {
      "text": "趋向自处一隅",
      "value": "I"
    }
  },
  {
    "id": 24,
    "question": "哪些人会更吸引你？",
    "choiceA": {
      "text": "一个思维敏捷及非常聪颖的人",
      "value": "N"
    },
    "choiceB": {
      "text": "实事求是，具丰富常识的人",
      "value": "S"
    }
  },
  {
    "id": 25,
    "question": "在日常工作中，你会",
    "choiceA": {
      "text": "颇为喜欢处理迫使你分秒必争的突发",
      "value": "P"
    },
    "choiceB": {
      "text": "通常预先计划，以免要在压力下工作",
      "value": "J"
    }
  },
  {
    "id": 26,
    "question": "你认为别人一般",
    "choiceA": {
      "text": "要花很长时间才认识你",
      "value": "I"
    },
    "choiceB": {
      "text": "用很短的时间便认识你",
      "value": "E"
    }
  },
  {
    "id": 27,
    "question": "在下列每一对词语中，哪一个词语更合你心意？请仔细想想这些词语的意义，而不要理会他们的字形或读音。",
    "choiceA": {
      "text": "注重隐私",
      "value": "I"
    },
    "choiceB": {
      "text": "坦率开放",
      "value": "E"
    }
  },
  {
    "id": 28,
    "question": "在下列每一对词语中，哪一个词语更合你心意？请仔细想想这些词语的意义，而不要理会他们的字形或读音。",
    "choiceA": {
      "text": "预先安排地",
      "value": "J"
    },
    "choiceB": {
      "text": "无计划地",
      "value": "P"
    }
  },
  {
    "id": 29,
    "question": "在下列每一对词语中，哪一个词语更合你心意？请仔细想想这些词语的意义，而不要理会他们的字形或读音。",
    "choiceA": {
      "text": "抽象",
      "value": "N"
    },
    "choiceB": {
      "text": "具体",
      "value": "S"
    }
  },
  {
    "id": 30,
    "question": "在下列每一对词语中，哪一个词语更合你心意？请仔细想想这些词语的意义，而不要理会他们的字形或读音。",
    "choiceA": {
      "text": "温柔",
      "value": "F"
    },
    "choiceB": {
      "text": "坚定",
      "value": "T"
    }
  },
  {
    "id": 31,
    "question": "在下列每一对词语中，哪一个词语更合你心意？请仔细想想这些词语的意义，而不要理会他们的字形或读音。",
    "choiceA": {
      "text": "思考",
      "value": "T"
    },
    "choiceB": {
      "text": "感受",
      "value": "F"
    }
  },
  {
    "id": 32,
    "question": "在下列每一对词语中，哪一个词语更合你心意？请仔细想想这些词语的意义，而不要理会他们的字形或读音。",
    "choiceA": {
      "text": "事实",
      "value": "S"
    },
    "choiceB": {
      "text": "意念",
      "value": "N"
    }
  },
  {
    "id": 33,
    "question": "在下列每一对词语中，哪一个词语更合你心意？请仔细想想这些词语的意义，而不要理会他们的字形或读音。",
    "choiceA": {
      "text": "冲动",
      "value": "P"
    },
    "choiceB": {
      "text": "决定",
      "value": "J"
    }
  },
  {
    "id": 34,
    "question": "在下列每一对词语中，哪一个词语更合你心意？请仔细想想这些词语的意义，而不要理会他们的字形或读音。",
    "choiceA": {
      "text": "热衷",
      "value": "E"
    },
    "choiceB": {
      "text": "文静",
      "value": "I"
    }
  },
  {
    "id": 35,
    "question": "在下列每一对词语中，哪一个词语更合你心意？请仔细想想这些词语的意义，而不要理会他们的字形或读音。",
    "choiceA": {
      "text": "文静",
      "value": "I"
    },
    "choiceB": {
      "text": "外向",
      "value": "E"
    }
  },
  {
    "id": 36,
    "question": "在下列每一对词语中，哪一个词语更合你心意？请仔细想想这些词语的意义，而不要理会他们的字形或读音。",
    "choiceA": {
      "text": "有系统",
      "value": "J"
    },
    "choiceB": {
      "text": "随意",
      "value": "P"
    }
  },
  {
    "id": 37,
    "question": "在下列每一对词语中，哪一个词语更合你心意？请仔细想想这些词语的意义，而不要理会他们的字形或读音。",
    "choiceA": {
      "text": "理论",
      "value": "N"
    },
    "choiceB": {
      "text": "肯定",
      "value": "S"
    }
  },
  {
    "id": 38,
    "question": "在下列每一对词语中，哪一个词语更合你心意？请仔细想想这些词语的意义，而不要理会他们的字形或读音。",
    "choiceA": {
      "text": "敏感",
      "value": "F"
    },
    "choiceB": {
      "text": "公正",
      "value": "T"
    }
  },
  {
    "id": 39,
    "question": "在下列每一对词语中，哪一个词语更合你心意？请仔细想想这些词语的意义，而不要理会他们的字形或读音。",
    "choiceA": {
      "text": "令人信服",
      "value": "T"
    },
    "choiceB": {
      "text": "感人的",
      "value": "F"
    }
  },
  {
    "id": 40,
    "question": "在下列每一对词语中，哪一个词语更合你心意？请仔细想想这些词语的意义，而不要理会他们的字形或读音。",
    "choiceA": {
      "text": "声明",
      "value": "S"
    },
    "choiceB": {
      "text": "概念",
      "value": "N"
    }
  },
  {
    "id": 41,
    "question": "在下列每一对词语中，哪一个词语更合你心意？请仔细想想这些词语的意义，而不要理会他们的字形或读音。",
    "choiceA": {
      "text": "不受约束",
      "value": "P"
    },
    "choiceB": {
      "text": "预先安排",
      "value": "J"
    }
  },
  {
    "id": 42,
    "question": "在下列每一对词语中，哪一个词语更合你心意？请仔细想想这些词语的意义，而不要理会他们的字形或读音。",
    "choiceA": {
      "text": "矜持",
      "value": "I"
    },
    "choiceB": {
      "text": "健谈",
      "value": "E"
    }
  },
  {
    "id": 43,
    "question": "在下列每一对词语中，哪一个词语更合你心意？请仔细想想这些词语的意义，而不要理会他们的字形或读音。",
    "choiceA": {
      "text": "有条不紊",
      "value": "J"
    },
    "choiceB": {
      "text": "不拘小节",
      "value": "P"
    }
  },
  {
    "id": 44,
    "question": "在下列每一对词语中，哪一个词语更合你心意？请仔细想想这些词语的意义，而不要理会他们的字形或读音。",
    "choiceA": {
      "text": "意念",
      "value": "N"
    },
    "choiceB": {
      "text": "实况",
      "value": "S"
    }
  },
  {
    "id": 45,
    "question": "在下列每一对词语中，哪一个词语更合你心意？请仔细想想这些词语的意义，而不要理会他们的字形或读音。",
    "choiceA": {
      "text": "同情怜悯",
      "value": "F"
    },
    "choiceB": {
      "text": "远见",
      "value": "T"
    }
  },
  {
    "id": 46,
    "question": "在下列每一对词语中，哪一个词语更合你心意？请仔细想想这些词语的意义，而不要理会他们的字形或读音。",
    "choiceA": {
      "text": "利益",
      "value": "T"
    },
    "choiceB": {
      "text": "祝福",
      "value": "F"
    }
  },
  {
    "id": 47,
    "question": "在下列每一对词语中，哪一个词语更合你心意？请仔细想想这些词语的意义，而不要理会他们的字形或读音。",
    "choiceA": {
      "text": "务实的",
      "value": "S"
    },
    "choiceB": {
      "text": "理论的",
      "value": "N"
    }
  },
  {
    "id": 48,
    "question": "在下列每一对词语中，哪一个词语更合你心意？请仔细想想这些词语的意义，而不要理会他们的字形或读音。",
    "choiceA": {
      "text": "朋友不多",
      "value": "I"
    },
    "choiceB": {
      "text": "朋友众多",
      "value": "E"
    }
  },
  {
    "id": 49,
    "question": "在下列每一对词语中，哪一个词语更合你心意？请仔细想想这些词语的意义，而不要理会他们的字形或读音。",
    "choiceA": {
      "text": "有系统",
      "value": "J"
    },
    "choiceB": {
      "text": "即兴",
      "value": "P"
    }
  },
  {
    "id": 50,
    "question": "在下列每一对词语中，哪一个词语更合你心意？请仔细想想这些词语的意义，而不要理会他们的字形或读音。",
    "choiceA": {
      "text": "富想象的",
      "value": "N"
    },
    "choiceB": {
      "text": "以事论事",
      "value": "S"
    }
  },
  {
    "id": 51,
    "question": "在下列每一对词语中，哪一个词语更合你心意？请仔细想想这些词语的意义，而不要理会他们的字形或读音。",
    "choiceA": {
      "text": "亲切地",
      "value": "F"
    },
    "choiceB": {
      "text": "客观地",
      "value": "T"
    }
  },
  {
    "id": 52,
    "question": "在下列每一对词语中，哪一个词语更合你心意？请仔细想想这些词语的意义，而不要理会他们的字形或读音。",
    "choiceA": {
      "text": "客观地",
      "value": "T"
    },
    "choiceB": {
      "text": "热情地",
      "value": "F"
    }
  },
  {
    "id": 53,
    "question": "在下列每一对词语中，哪一个词语更合你心意？请仔细想想这些词语的意义，而不要理会他们的字形或读音。",
    "choiceA": {
      "text": "建造",
      "value": "S"
    },
    "choiceB": {
      "text": "发明",
      "value": "N"
    }
  },
  {
    "id": 54,
    "question": "在下列每一对词语中，哪一个词语更合你心意？请仔细想想这些词语的意义，而不要理会他们的字形或读音。",
    "choiceA": {
      "text": "文静",
      "value": "I"
    },
    "choiceB": {
      "text": "爱合群",
      "value": "E"
    }
  },
  {
    "id": 55,
    "question": "在下列每一对词语中，哪一个词语更合你心意？请仔细想想这些词语的意义，而不要理会他们的字形或读音。",
    "choiceA": {
      "text": "理论",
      "value": "N"
    },
    "choiceB": {
      "text": "事实",
      "value": "S"
    }
  },
  {
    "id": 56,
    "question": "在下列每一对词语中，哪一个词语更合你心意？请仔细想想这些词语的意义，而不要理会他们的字形或读音。",
    "choiceA": {
      "text": "富同情",
      "value": "F"
    },
    "choiceB": {
      "text": "合逻辑",
      "value": "T"
    }
  },
  {
    "id": 57,
    "question": "在下列每一对词语中，哪一个词语更合你心意？请仔细想想这些词语的意义，而不要理会他们的字形或读音。",
    "choiceA": {
      "text": "具分析力",
      "value": "T"
    },
    "choiceB": {
      "text": "多愁善感",
      "value": "F"
    }
  },
  {
    "id": 58,
    "question": "在下列每一对词语中，哪一个词语更合你心意？请仔细想想这些词语的意义，而不要理会他们的字形或读音。",
    "choiceA": {
      "text": "合情合理",
      "value": "S"
    },
    "choiceB": {
      "text": "令人着迷",
      "value": "N"
    }
  },
  {
    "id": 59,
    "question": "当你要在一个星期内完成一个大项目，你在开始的时候会",
    "choiceA": {
      "text": "把要做的不同工作依次列出",
      "value": "J"
    },
    "choiceB": {
      "text": "马上动工",
      "value": "P"
    }
  },
  {
    "id": 60,
    "question": "在社交场合中，你经常会感到",
    "choiceA": {
      "text": "与某些人很难打开话匣儿和保持对话",
      "value": "I"
    },
    "choiceB": {
      "text": "与多数人都能从容地长谈",
      "value": "E"
    }
  },
  {
    "id": 61,
    "question": "要做许多人也做的事，你比较喜欢",
    "choiceA": {
      "text": "按照一般认可的方法去做",
      "value": "S"
    },
    "choiceB": {
      "text": "构想一个自己的想法",
      "value": "N"
    }
  },
  {
    "id": 62,
    "question": "你刚认识的朋友能否说出你的兴趣？",
    "choiceA": {
      "text": "马上可以",
      "value": "E"
    },
    "choiceB": {
      "text": "要待他们真正了解你之后才可以",
      "value": "I"
    }
  },
  {
    "id": 63,
    "question": "你通常较喜欢的科目是",
    "choiceA": {
      "text": "讲授概念和原则的",
      "value": "N"
    },
    "choiceB": {
      "text": "讲授事实和数据的",
      "value": "S"
    }
  },
  {
    "id": 64,
    "question": "哪个是较高的赞誉，或称许为？",
    "choiceA": {
      "text": "一贯感性的人",
      "value": "F"
    },
    "choiceB": {
      "text": "一贯理性的人",
      "value": "T"
    }
  },
  {
    "id": 65,
    "question": "你认为按照程序表做事",
    "choiceA": {
      "text": "有时是需要的，但一般来说你不大喜欢这样做",
      "value": "P"
    },
    "choiceB": {
      "text": "大多数情况下是有帮助而且是你喜欢做的",
      "value": "J"
    }
  },
  {
    "id": 66,
    "question": "和一群人在一起，你通常会选",
    "choiceA": {
      "text": "跟你很熟悉的个别人谈话",
      "value": "I"
    },
    "choiceB": {
      "text": "参与大伙的谈话",
      "value": "E"
    }
  },
  {
    "id": 67,
    "question": "在社交聚会上，你会",
    "choiceA": {
      "text": "是说话很多的一个",
      "value": "E"
    },
    "choiceB": {
      "text": "让别人多说话",
      "value": "I"
    }
  },
  {
    "id": 68,
    "question": "把周末期间要完成的事列成清单，这个主意会",
    "choiceA": {
      "text": "合你意",
      "value": "J"
    },
    "choiceB": {
      "text": "使你提不起劲",
      "value": "P"
    }
  },
  {
    "id": 69,
    "question": "哪个是较高的赞誉，或称许为",
    "choiceA": {
      "text": "能干的",
      "value": "T"
    },
    "choiceB": {
      "text": "富有同情心",
      "value": "F"
    }
  },
  {
    "id": 70,
    "question": "你通常喜欢",
    "choiceA": {
      "text": "事先安排你的社交约会",
      "value": "J"
    },
    "choiceB": {
      "text": "随兴之所至做事",
      "value": "P"
    }
  },
  {
    "id": 71,
    "question": "总的说来，要做一个大型作业时，你会选",
    "choiceA": {
      "text": "边做边想该做什么",
      "value": "P"
    },
    "choiceB": {
      "text": "首先把工作按步细分",
      "value": "J"
    }
  },
  {
    "id": 72,
    "question": "你能否滔滔不绝地与人聊天",
    "choiceA": {
      "text": "只限于跟你有共同兴趣的人",
      "value": "I"
    },
    "choiceB": {
      "text": "几乎跟任何人都可以",
      "value": "E"
    }
  },
  {
    "id": 73,
    "question": "你会",
    "choiceA": {
      "text": "跟随一些证明有效的方法",
      "value": "S"
    },
    "choiceB": {
      "text": "几乎跟任何人都可以",
      "value": "N"
    }
  },
  {
    "id": 74,
    "question": "为乐趣而阅读时，你会",
    "choiceA": {
      "text": "喜欢奇特或创新的表达方式",
      "value": "N"
    },
    "choiceB": {
      "text": "喜欢作者直话直说",
      "value": "S"
    }
  },
  {
    "id": 75,
    "question": "你宁愿替哪一类上司（或者老师）工作？",
    "choiceA": {
      "text": "天性淳良，但常常前后不一的",
      "value": "T"
    },
    "choiceB": {
      "text": "言辞尖锐但永远合乎逻辑的",
      "value": "N"
    }
  },
  {
    "id": 76,
    "question": "你做事多数是",
    "choiceA": {
      "text": "按当天心情去做",
      "value": "P"
    },
    "choiceB": {
      "text": "照拟好的程序表去做",
      "value": "J"
    }
  },
  {
    "id": 77,
    "question": "你是否",
    "choiceA": {
      "text": "可以和任何人按需求从容地交谈",
      "value": "E"
    },
    "choiceB": {
      "text": "只是对某些人或在某种情况下才可以畅所欲言",
      "value": "I"
    }
  },
  {
    "id": 78,
    "question": "要做决定时，你认为比较重要的是",
    "choiceA": {
      "text": "据事实衡量",
      "value": "T"
    },
    "choiceB": {
      "text": "考虑他人的感受和意见",
      "value": "F"
    }
  },
  {
    "id": 79,
    "question": "在下列每一对词语中，哪一个词语更合你心意？",
    "choiceA": {
      "text": "想象的",
      "value": "N"
    },
    "choiceB": {
      "text": "真实的",
      "value": "S"
    }
  },
  {
    "id": 80,
    "question": "在下列每一对词语中，哪一个词语更合你心意？",
    "choiceA": {
      "text": "仁慈慷慨的",
      "value": "F"
    },
    "choiceB": {
      "text": "意志坚定地",
      "value": "T"
    }
  },
  {
    "id": 81,
    "question": "在下列每一对词语中，哪一个词语更合你心意？",
    "choiceA": {
      "text": "公正的",
      "value": "T"
    },
    "choiceB": {
      "text": "有关怀心的",
      "value": "F"
    }
  },
  {
    "id": 82,
    "question": "在下列每一对词语中，哪一个词语更合你心意？",
    "choiceA": {
      "text": "制作",
      "value": "S"
    },
    "choiceB": {
      "text": "设计",
      "value": "N"
    }
  },
  {
    "id": 83,
    "question": "在下列每一对词语中，哪一个词语更合你心意？",
    "choiceA": {
      "text": "可能性",
      "value": "N"
    },
    "choiceB": {
      "text": "必然性",
      "value": "S"
    }
  },
  {
    "id": 84,
    "question": "在下列每一对词语中，哪一个词语更合你心意？",
    "choiceA": {
      "text": "温柔",
      "value": "F"
    },
    "choiceB": {
      "text": "力量",
      "value": "T"
    }
  },
  {
    "id": 85,
    "question": "在下列每一对词语中，哪一个词语更合你心意？",
    "choiceA": {
      "text": "实际",
      "value": "T"
    },
    "choiceB": {
      "text": "多愁善感",
      "value": "F"
    }
  },
  {
    "id": 86,
    "question": "在下列每一对词语中，哪一个词语更合你心意？",
    "choiceA": {
      "text": "制造",
      "value": "S"
    },
    "choiceB": {
      "text": "创造",
      "value": "N"
    }
  },
  {
    "id": 87,
    "question": "在下列每一对词语中，哪一个词语更合你心意？",
    "choiceA": {
      "text": "新颖的",
      "value": "N"
    },
    "choiceB": {
      "text": "已知的",
      "value": "S"
    }
  },
  {
    "id": 88,
    "question": "在下列每一对词语中，哪一个词语更合你心意？",
    "choiceA": {
      "text": "同情",
      "value": "F"
    },
    "choiceB": {
      "text": "分析",
      "value": "T"
    }
  },
  {
    "id": 89,
    "question": "在下列每一对词语中，哪一个词语更合你心意？",
    "choiceA": {
      "text": "坚持己见",
      "value": "T"
    },
    "choiceB": {
      "text": "温柔有爱心",
      "value": "F"
    }
  },
  {
    "id": 90,
    "question": "在下列每一对词语中，哪一个词语更合你心意？",
    "choiceA": {
      "text": "具体的",
      "value": "S"
    },
    "choiceB": {
      "text": "抽象地",
      "value": "N"
    }
  },
  {
    "id": 91,
    "question": "在下列每一对词语中，哪一个词语更合你心意？",
    "choiceA": {
      "text": "全心投入地",
      "value": "F"
    },
    "choiceB": {
      "text": "有决心地",
      "value": "T"
    }
  },
  {
    "id": 92,
    "question": "在下列每一对词语中，哪一个词语更合你心意？",
    "choiceA": {
      "text": "能干",
      "value": "T"
    },
    "choiceB": {
      "text": "仁慈",
      "value": "F"
    }
  },
  {
    "id": 93,
    "question": "在下列每一对词语中，哪一个词语更合你心意？",
    "choiceA": {
      "text": "实际",
      "value": "S"
    },
    "choiceB": {
      "text": "创新",
      "value": "N"
    }
  }
];
