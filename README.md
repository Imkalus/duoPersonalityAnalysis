# MBTI 双人测试

支持两人配对完成 MBTI 测试的 Web 应用。创建房间后分享链接，双方各自答题，完成后查看双人关系分析，并通过 AI 角色进行引导式对话。

## 功能

- **双人 MBTI 测试**：支持同步/独立两种答题模式
- **关系分析**：AI 生成双人关系洞察
- **角色对话**：4 种人格角色引导双方沟通（调解员/神丁/邪恶/善良）
- **明牌/暗牌**：同步模式下可选是否查看对方选择

## 技术栈

| 模块 | 技术 |
|------|------|
| 后端 | Express + TypeScript + Socket.IO |
| 前端 | React + TypeScript + Tailwind + Vite |
| 实时通信 | Socket.IO |
| AI 接口 | OpenAI 兼容格式 |

## 快速开始

```bash
# 安装依赖
bun install

# 启动开发服务器
bun dev

# 构建生产版本
bun run build

# 运行测试
bun test
```

- 前端: http://localhost:5173
- 后端: http://localhost:3000

## 环境变量

在 `server/` 目录下创建 `.env` 文件：

```bash
LLM_BASE_URL=https://api.openai.com/v1  # OpenAI 兼容 API 地址
LLM_API_KEY=your-api-key
LLM_MODEL=gpt-4o-mini                     # 模型名称
```

## 项目结构

```
mbti-duo/
├── client/          # React 前端
├── server/          # Express 后端
├── shared/          # 共享类型
└── mbti-project-brainstorm.md  # 设计文档
```

## License

MIT
