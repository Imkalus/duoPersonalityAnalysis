# MBTI 双人测试 Web 应用 — 完整设计文档

> 版本：v2.1 | 最后更新：2026-06-19

---

## 一、产品概述

一个支持两人配对完成 MBTI 测试的 Web 应用。用户创建房间后分享链接，双方各自答题，完成后再查看双人关系分析，并通过 AI 角色进行引导式对话。

### 核心价值

- **双人 MBTI 测试**：不同于传统单人测试，双方同时参与
- **关系分析**：AI 生成双人关系洞察
- **角色对话**：多种人格角色引导双方沟通

---

## 二、技术选型

| 模块 | 技术 | 理由 |
|------|------|------|
| 后端 | Express + TypeScript | 场景简单，性能足够，开发最快 |
| 实时通信 | Socket.IO | 内置房间管理、自动重连、事件驱动 |
| 前端 | React + TypeScript + Tailwind | 组件化开发，暗黑/亮色模式支持 |
| 状态管理 | React Context + localStorage | 轻量，无需 Redux |
| 测试 | Jest + Vitest | 标准方案，前后端统一 |
| AI 接口 | MiMo API（主）/ 备用 API | 成本可控 |

### 项目结构

```
mbti-duo/
├── client/                    # 前端 React 应用
│   ├── src/
│   │   ├── components/        # UI 组件
│   │   ├── pages/             # 页面路由
│   │   ├── hooks/             # 自定义 Hooks
│   │   ├── context/           # React Context
│   │   ├── services/          # API / Socket.IO 客户端
│   │   ├── data/              # 静态数据（题目、MBTI 描述）
│   │   ├── utils/             # 工具函数
│   │   └── types/             # TypeScript 类型
│   └── public/
├── server/                    # 后端 Express 应用
│   ├── src/
│   │   ├── routes/            # REST API 路由
│   │   ├── socket/            # Socket.IO 事件处理
│   │   ├── middleware/        # 限流、过滤中间件
│   │   ├── services/          # LLM 调用、缓存
│   │   └── types/
│   └── tests/
└── shared/                    # 前后端共享类型
    └── types/
```

---

## 三、用户流程与状态机

### 3.1 主流程

```
┌─────────────────────────────────────────────────────────┐
│                    用户 A 创建房间                       │
│  输入用户名 + 关系类型 → 获得分享链接                    │
└──────────────────────┬──────────────────────────────────┘
                       │ 分享链接给 B
                       ▼
┌─────────────────────────────────────────────────────────┐
│                    用户 B 加入房间                       │
│  打开链接 → 看到 A 的名字 → 输入自己的用户名            │
└──────────────────────┬──────────────────────────────────┘
                       │ 双方确认
                       ▼
┌─────────────────────────────────────────────────────────┐
│              选择测试模式（同步 / 独立）                  │
└──────────┬──────────────────────────────┬───────────────┘
           │ 同步模式                      │ 独立模式
           ▼                              ▼
┌──────────────────────┐    ┌─────────────────────────────┐
│  同步答题（同题同时）  │    │  各自答题（互不影响）         │
│  等待对方完成每题     │    │  随时暂停继续                │
└──────────┬───────────┘    └──────────────┬──────────────┘
           │                               │
           └───────────┬───────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────┐
│              双方都完成 → 查看各自结果                    │
│  展示个人 MBTI 类型 + 维度百分比（静态数据）             │
└──────────────────────┬──────────────────────────────────┘
                       │ 等待双方都完成
                       ▼
┌─────────────────────────────────────────────────────────┐
│        点击查看 → 双人关系分析（AI 生成）                 │
│  关系特点、互补点、潜在冲突、相处建议                     │
│  ⚠️ 必须等双方都完成后才能查看                           │
└──────────────────────┬──────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────┐
│              进入 LLM 对话                                │
│  4 种角色可切换：调解员 / 神丁 / 邪恶 / 善良             │
│  双方可见同一对话（Socket.IO 实时同步）                   │
└─────────────────────────────────────────────────────────┘
```

### 3.2 房间状态机

```
                    ┌──────────┐
          创建房间   │          │  B 加入
  A ───────────────▶│ waiting  │──────────────▶ testing
                    │          │
                    └────┬─────┘
                         │ 超时 / A 主动放弃
                         ▼
                    ┌──────────┐
                    │ closed   │
                    └──────────┘

testing ──(双方完成)──▶ analyzing ──(分析完成)──▶ chatting
    │                       │
    │ B 离线(独立)          │ B 离线
    ▼                       ▼
  A 继续做                  等待重连
```

状态定义：

| 状态 | 说明 |
|------|------|
| `waiting` | A 已创建房间，等待 B 加入 |
| `testing` | 双方正在答题 |
| `analyzing` | 双方都完成，生成双人分析中 |
| `chatting` | 分析完成，进入对话阶段 |
| `closed` | 房间已关闭（超时/手动） |

### 3.3 同步模式界面选择

同步做题时，有两种界面模式可选：

| 模式 | 说明 | 体验 |
|------|------|------|
| **明牌** | 每做完一题，可以看到对方**上一题**的选择 | 互动感强，可即时讨论 |
| **暗牌** | 看不到对方选择，双方同时做 | 保持独立性，避免从众 |

> 用户在进入同步模式时选择界面类型。

---

## 四、数据存储设计

**核心原则：前端 localStorage 为王，后端只管"谁在线"**

### 4.1 前端 localStorage 结构（永久保留）

```typescript
// ===== 用户信息 =====
interface UserProfile {
  id: string;           // "user_a1b2c3d4"
  name: string;         // "Alice"
  createdAt: number;    // 时间戳
}

// ===== 房间数据 =====
interface RoomData {
  roomId: string;
  partnerName: string;
  partnerId: string;
  relationship: string;  // "情侣" | "朋友" | "家人" | "同事"
  mode: 'sync' | 'independent';
  questionVersion: 'lite' | 'full';  // 题目版本
  status: RoomStatus;
  myAnswers: Answer[];
  partnerAnswers: Answer[];  // 独立模式下从服务器获取，同步模式下实时同步
  myResult: MBTIResult;
  partnerResult: MBTIResult;
  relationshipAnalysis: string;  // AI 生成的双人分析
  chatHistory: ChatMessage[];    // 对话历史
  createdAt: number;  // 房间创建时间（用于超时检测）
}

interface Answer {
  questionId: number;      // 题目编号
  dimension: string;       // "EI" | "SN" | "TF" | "JP"
  choice: 'A' | 'B';
  timestamp: number;
}

interface MBTIResult {
  type: string;            // "INTJ"
  dimensions: {
    EI: { score: number; direction: 'E' | 'I'; percentage: number };
    SN: { score: number; direction: 'S' | 'N'; percentage: number };
    TF: { score: number; direction: 'T' | 'F'; percentage: number };
    JP: { score: number; direction: 'J' | 'P'; percentage: number };
  };
  description: string;     // 类型描述
}

interface ChatMessage {
  id: string;
  role: 'user_a' | 'user_b' | 'assistant';
  content: string;
  character: string;       // 当前角色
  timestamp: number;
}

// ===== localStorage 布局 =====
// key: "mbti_user"      → UserProfile
// key: "mbti_rooms"     → Record<roomId, RoomData>
```

### 4.2 后端内存结构（不落盘）

```typescript
// 仅用于 Socket.IO 房间广播
interface ServerRoom {
  roomId: string;
  members: {
    A: { socketId: string; name: string };
    B: { socketId: string; name: string } | null;
  };
  status: RoomStatus;
  mode: 'sync' | 'independent';
  questionVersion: 'lite' | 'full';  // 题目版本（28题/60题）
  createdAt: number;
  
  // 答案同步（独立模式下 B 的答案暂存）
  answers: {
    A: Answer[] | null;
    B: Answer[] | null;
  };
}

// 内存存储
const rooms: Map<string, ServerRoom> = new Map();

// 限流存储
const rateLimits: Map<string, {
  ipCount: number;
  roomCount: Map<string, number>;
  resetAt: number;
}> = new Map();
```

### 答案同步流程

**独立模式**：
1. B 完成每题 → 答案发给服务器 → 服务器转发给 A → A 存入 localStorage
2. B 全部完成 → 答案全部发给服务器暂存 → 服务器通知 A "B 已完成"
3. A 全部完成 → 从服务器获取 B 的答案 → 生成双人分析

**同步模式**：
1. 每题答案 → 发给服务器 → 服务器广播给双方 → 双方存入 localStorage
2. 全部完成 → 服务器通知双方 → 生成双人分析

---

## 五、测试模块

### 5.1 题目来源

**16Personalities 开源题库**（60 题），独立开发，无版权风险。

> ⚠️ 注意：MBTI 官方题库（Form M, 93 题）受版权保护，不能直接使用。

### 5.2 题目数量

| 模式 | 题数 | 每维度题数 | 适用场景 |
|------|------|-----------|---------|
| 精简版 | 28 题 | 7 题 | 快速测试 |
| 完整版 | 60 题 | ~15 题 | 精确结果 |

### 5.3 计分方式

按照 16Personalities 标准：
- 每题 A/B 二选一
- 每个维度累计得分，得分高的一极确定类型
- 百分比 = 该维度得分 / 该维度总题数 × 100%

### 5.4 题目数据结构

```typescript
interface Question {
  id: number;
  dimension: 'EI' | 'SN' | 'TF' | 'JP';
  text: string;
  optionA: string;
  optionB: string;
  // A 对应维度的正方向，B 对应负方向
  // 例：EI 维度，A = E 方向，B = I 方向
}
```

### 5.5 题目顺序

**固定顺序，不打乱。** 精简版 28 题和完整版 60 题的顺序预置在前端代码中，同步模式下 A 和 B 做完全相同的题目。

### 5.6 重测机制（可选）

如果 A 已经做过测试，再次创建/进入房间时可以选择：
- **重新测试**：做完整套题目
- **沿用上次结果**：跳过测试，直接使用上次的 MBTI 结果

> 适用场景：A 想和 C 做关系分析，但 A 的 MBTI 结果已经知道，不需要重复测试。
> 注意：B（新搭档）仍然需要测试，A 可以等待 B 完成。

---

## 六、API 设计

### 6.1 REST API

| 方法 | 路径 | 说明 |
|------|------|------|
| `POST` | `/api/rooms` | 创建房间 |
| `GET` | `/api/rooms/:roomId` | 获取房间信息 |
| `POST` | `/api/rooms/:roomId/join` | 加入房间 |
| `POST` | `/api/analysis` | 请求双人关系分析 |
| `POST` | `/api/chat` | LLM 对话请求 |

### 6.2 Socket.IO 事件

| 事件 | 方向 | 说明 |
|------|------|------|
| `join-room` | Client → Server | 加入房间 |
| `room-joined` | Server → Client | 确认加入，返回房间状态 |
| `partner-joined` | Server → Client | 通知 A：B 已加入 |
| `answer-submitted` | Client → Server | 提交单题答案 |
| `answer-synced` | Server → Client | 广播对方答案（同步模式） |
| `answers-batch` | Client → Server | 批量提交答案（独立模式完成时） |
| `test-completed` | Client → Server | 告知完成答题 |
| `both-completed` | Server → Client | 通知双方都完成了 |
| `partner-answers` | Server → Client | 获取对方答案（独立模式） |
| `chat-message` | Client → Server | 发送对话消息 |
| `new-message` | Server → Client | 广播新消息 |
| `user-disconnected` | Server → Client | 对方掉线 |
| `user-reconnected` | Server → Client | 对方重连 |
| `room-expired` | Server → Client | 房间已过期 |

---

## 七、房间设计

### 7.1 邀请链接格式

```
https://app.com/room/{roomId}?from={A的名字}
```

B 打开后看到：**"Alice 邀请你一起做 MBTI 测试，请输入你的名字加入"**

### 7.2 多房间支持

A 可以创建多个房间，每个房间独立：

```
房间 1：A + B（情侣）
房间 2：A + C（朋友）
房间 3：A + D（同事）
```

### 7.3 房间有效期

**waiting 状态 10 分钟后自动关闭。** 测试和对话阶段无超时限制。

### 7.4 离线/重连处理

| 模式 | 离线行为 | 重连行为 |
|------|---------|---------| 
| 独立模式 | A 提示"对方已掉线"，各自继续 | 自动恢复，从服务器获取对方答案 |
| 同步模式 | A 提示"等待重连"，暂停答题 | B 重连后从断点继续 |

### 7.5 等待对方完成

独立模式下，一方先完成时：
- 显示"等待对方完成..."
- 可以查看自己的 MBTI 结果（静态数据）
- **双人关系分析按钮灰色，提示"等待对方完成后查看"

---

## 八、分析模块

### 8.1 个人 MBTI 结果

- 展示类型 + 维度百分比 + 详细描述
- **全部为静态数据，零 AI 成本**
- 不使用 LLM，纯前端展示
- 数据来源：预置的 16 种类型描述 JSON

### 8.2 双人关系分析

- **AI 生成**（MiMo API）
- 输入：双方 MBTI 类型 + 关系类型
- 输出：
  - 关系特点
  - 互补点
  - 潜在冲突
  - 相处建议
- **结果缓存**：相同组合 + 关系类型不重复调用
- 缓存 key：`${typeA}-${typeB}-${relationship}`

---

## 九、LLM 对话模块

### 9.1 角色模式

| 角色 | 风格 | 说明 | System Prompt 关键词 |
|------|------|------|---------------------|
| **百姓调解员** | 温柔版 | 温和引导，适合敏感话题 | 温柔、理解、引导 |
| **阿拉灯神丁** | 毒舌版 | 幽默犀利，适合轻松对话 | 毒舌、幽默、犀利 |
| **邪恶人格** | 黑暗版 | 直击痛点，可能扎心 | 黑暗、直白、扎心 |
| **善良人格** | 天使版 | 正能量鼓励，温暖治愈 | 正能量、温暖、治愈 |

用户可在对话中随时切换角色，LLM 会切换对应的人设提示词。

### 9.2 对话上下文

每次请求 LLM 时带上：

```typescript
interface ChatContext {
  // 基础信息
  userA: { name: string; mbtiType: string };
  userB: { name: string; mbtiType: string };
  relationship: string;

  // 答题详情（用于理解性格差异）
  userAAnswers: Answer[];
  userBAnswers: Answer[];

  // 当前角色
  currentCharacter: string;

  // 对话历史
  chatHistory: ChatMessage[];
}
```

### 9.3 Token 超限处理

```
对话历史 token 数 < 阈值?
  ├── 是 → 完整历史发送
  └── 否 → 自动 compact
            ├── 保留最近 N 条消息
            └── 旧消息压缩为摘要
            └── 摘要 + 最近消息一起发送
```

### 9.4 对话历史存储

- **前端 localStorage**：持久化
- **Socket.IO 同步**：实时同步到双方
- **后端不存储**：仅做消息转发

---

## 十、安全设计

### 10.1 LLM 调用防护

| 限流维度 | 阈值 | 说明 |
|---------|------|------|
| IP 限流 | 50 次/天 | 防止单 IP 滥用 |
| 房间限流 | 10 次/天 | 控制单房间对话量 |
| 降级策略 | 主 API → 备用 API → 预设模板 | 主 API 不可用时自动降级 |

### 10.2 恶意创建防护

- 每 IP 每日最多创建 **10 个房间**
- 超限返回 429 + 友好提示

### 10.3 输入过滤

- 后端敏感词过滤（对话消息）
- 前端基础 XSS 防护
- Socket.IO 消息长度限制

---

## 十一、UI 设计

### 11.1 主题

- **暗黑/亮色模式**：自动检测系统偏好，支持手动切换
- 使用 Tailwind CSS `dark:` 前缀

### 11.2 响应式布局

- **移动端**：底部操作按钮（创建/加入）
- **桌面端**：顶部导航栏

### 11.3 微信兼容

- 分享时生成二维码
- 引导用户在浏览器中打开

### 11.4 分享功能

- 支持分享到朋友圈/微博
- 生成带缩略图的分享卡片

### 11.5 页面结构

```
/                       → 首页（创建/加入入口）
/room/:roomId           → 房间主页（根据状态展示不同内容）
/room/:roomId/test      → 答题页
/room/:roomId/result    → 个人结果页
/room/:roomId/analysis  → 双人分析页
/room/:roomId/chat      → 对话页
```

---

## 十二、部署与运营

### 12.1 当前阶段

**先不部署，专注功能开发**

### 12.2 后期方案

- **方案 A**：Vercel（前端）+ Railway（后端）— 免费/低成本
- **方案 B**：自有服务器 — 完全控制

---

## 十三、开发优先级

| 优先级 | 模块 | 说明 |
|--------|------|------|
| P0 | 房间系统 | 创建、加入、Socket.IO 连接 |
| P0 | 测试模块 | 题目展示、答题、计分 |
| P1 | 个人结果 | 静态展示、localStorage 存储 |
| P1 | 双人分析 | AI 调用、缓存 |
| P2 | LLM 对话 | 角色切换、历史同步 |
| P2 | UI 优化 | 暗黑模式、移动端适配 |
| P3 | 安全防护 | 限流、过滤、降级 |

---

## 十四、待确认项

无（已全部确认）

---

*文档版本：v2.1 | 最后更新：2026-06-19*
