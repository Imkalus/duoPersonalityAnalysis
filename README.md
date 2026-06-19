# 宁配吗 · MBTI 双人关系测试

两个人各自完成 MBTI 测试，AI 生成一份**共享**的定制化关系分析，并支持双方在同一个对话框里与「善良/邪恶」两种 AI 人格实时聊天，探讨彼此的契合与分歧。

## 功能

- **双人 MBTI 测试**：创建房间分享链接，双方实时同步答题进度
- **明牌 / 暗牌**：明牌可看到对方上一题的选择，暗牌只显示进度
- **定制化关系分析**：基于双方**每个维度的答题倾向**生成一份共享分析，两人看到完全一致的结果，重点推演潜在分歧
- **共享 AI 对话**：双方在同一对话框中与 AI 实时交流，消息、人格切换、"正在输入"状态全部同步；可切换善良（温柔治愈）/ 邪恶（犀利直白）两种人格

## 技术栈

| 模块 | 技术 |
|------|------|
| 后端 | Express 5 + TypeScript + Socket.IO |
| 前端 | React 19 + TypeScript + Tailwind 4 + Vite 6 |
| 实时通信 | Socket.IO |
| AI 接口 | OpenAI 兼容格式（默认 MiMo-V2.5，256K 上下文） |

提示词集中在 `server/src/services/prompts.ts`，可直接修改分析与对话的角色设定、语气、输出结构。

## 本地开发

```bash
bun install                 # 安装依赖
cp .env.example .env        # 配置环境变量（填入 LLM_API_KEY 等）
bun dev                     # 同时启动前后端
```

- 前端开发服务器: http://localhost:5173 （已配置代理，`/api` 与 `/socket.io` 自动转发到后端）
- 后端: http://localhost:3000

其他命令：

```bash
bun run build               # 构建前后端生产版本
bun test                    # 运行测试
```

## 环境变量

所有配置集中在**项目根目录**的 `.env` 文件（参考 `.env.example`）：

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `LLM_BASE_URL` | OpenAI 兼容 API 地址（结尾不带 `/chat/completions`） | `https://api.openai.com/v1` |
| `LLM_API_KEY` | API 密钥 | 无（必填） |
| `LLM_MODEL` | 模型名称 | `gpt-4o-mini` |
| `PORT` | 后端监听端口 | `3000` |
| `HOST` | 后端监听地址（云服务器保持 `0.0.0.0`） | `0.0.0.0` |
| `CORS_ORIGIN` | 允许的跨域来源（生产建议填域名） | `*` |
| `CLIENT_DIST` | 前端构建产物目录（单进程托管前端时使用） | `../client/dist` |

## 云服务器部署

后端在生产模式下会**自动托管前端静态文件**（检测到 `client/dist` 存在即启用 SPA 托管），因此可以单进程部署，无需额外配置 Nginx 静态目录。

### 方式一：单进程部署（推荐，最简单）

```bash
# 1. 拉取代码
git clone <your-repo-url> && cd duoPersonalityAnalysis

# 2. 安装依赖（需先安装 bun: https://bun.sh）
bun install

# 3. 配置环境变量
cp .env.example .env
vim .env                    # 填入 LLM_API_KEY，按需改 PORT / CORS_ORIGIN

# 4. 构建前后端
bun run build

# 5. 启动（后端同时托管前端）
cd server && node dist/server/src/index.js
# 访问 http://<服务器IP>:3000
```

建议用进程守护工具常驻运行，例如 PM2：

```bash
npm i -g pm2
cd server
pm2 start dist/server/src/index.js --name ninpeima
pm2 save && pm2 startup       # 开机自启
```

### 方式二：Nginx 反向代理（绑定域名 / HTTPS）

单进程部署后，用 Nginx 在前面做反代，处理域名与 SSL，并正确转发 WebSocket：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;       # WebSocket 必需
        proxy_set_header Connection "upgrade";        # WebSocket 必需
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

> 配置 HTTPS 可使用 certbot 自动签发证书。启用域名后，记得把 `.env` 的 `CORS_ORIGIN` 改为 `https://your-domain.com`。

### 端口与防火墙

- 单进程部署需放行后端端口（默认 `3000`）或 Nginx 的 `80/443`
- 云服务商安全组同样需要放行对应端口

## 项目结构

```
duoPersonalityAnalysis/
├── client/                      # React 前端
│   └── src/
│       ├── pages/               # 页面（Home/Test/Result/Analysis/Chat，分移动端/桌面端）
│       ├── data/                # MBTI 题库与类型描述
│       └── utils/               # 计分、存储、消毒
├── server/                      # Express 后端
│   └── src/
│       ├── routes/              # rooms / analysis 接口
│       ├── socket/              # Socket.IO 事件处理
│       ├── services/
│       │   ├── llm.ts           # LLM 调用 + token 估算
│       │   └── prompts.ts       # ★ 提示词集中管理（分析 + 对话）
│       └── store/               # 房间内存存储
├── shared/                      # 前后端共享类型
└── .env.example                 # 环境变量模板
```

## License

MIT
