# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Project Overview

MBTI 双人测试 Web 应用 — two users join a room, complete a 7-point Likert MBTI questionnaire, receive AI-generated relationship analysis, and chat with AI character personas. Chinese-language UI.

## Commands

```bash
# Install dependencies
bun install

# Run both client and server in development mode
bun dev

# Run individually
bun dev:server   # Express + Socket.IO on :3000
bun dev:client   # Vite + React on :5173 (proxies /api and /socket.io to :3000)

# Build for production
bun build

# Run tests (runs across all packages)
bun test

# Run tests for a specific package
bun run --filter @mbti-duo/client test
bun run --filter @mbti-duo/server test
```

## Architecture

### Monorepo (bun workspaces)

- `client/` — React 19 + Vite + Tailwind CSS v4 (frontend)
- `server/` — Express 5 + Socket.IO (backend)
- `shared/` — TypeScript types shared between client and server (no build step, imported as source)

### State Management

No global state library. Uses React useState + Context (theme only). All persistence via localStorage (`mbti_user`, `mbti_rooms`, `mbti_latest_result` keys). Server stores room state in-memory (`MemoryRoomStore`) with auto-cleanup every 10 minutes.

### Socket.IO Communication

Fully typed events defined in `shared/types/index.ts`. Client uses `useSocket` hook which returns typed `emit`/`on` functions. Key flow: `join-room` → `partner-joined` → `answer-submitted`/`answer-synced` → `test-completed` → `both-completed`. Reconnection handled via duplicate `join-room` handler that emits `user-reconnected`.

### REST API

Mounted at `/api/` with three route groups: `rooms` (CRUD + join), `analysis` (AI relationship analysis, cached 7 days), `chat` (AI character chat). Rate-limited: 10 room creations per IP per day.

### LLM Integration

`server/src/services/llm.ts` uses OpenAI SDK with env vars `LLM_BASE_URL`, `LLM_API_KEY`, `LLM_MODEL` (defaults to `gpt-4o-mini`). Four character personas with distinct system prompts. Fallback template when LLM unavailable.

### Scoring

7-point Likert scale (-3 to +3) per question. Reverse-scored questions have `reverse: true`. Percentage = (score + maxScore) / (2 * maxScore) × 100. Questions in `client/src/data/questions.ts` (lite: 28, full: 60).

### Security

DOMPurify for XSS protection (`sanitize.ts`). Input validation on room names (2-20 chars), chat messages (1-500 chars), relationship type whitelist. No authentication — users identified by generated IDs in localStorage.

## Key Files

| File | Purpose |
|------|---------|
| `shared/types/index.ts` | All shared TypeScript types and interfaces |
| `server/src/socket/handler.ts` | Socket.IO event handling core |
| `server/src/store/RoomStore.ts` | `RoomStore` interface + `MemoryRoomStore` implementation |
| `server/src/services/llm.ts` | OpenAI-compatible LLM client |
| `client/src/hooks/useSocket.ts` | Socket.IO client hook with auto-reconnect |
| `client/src/utils/scoring.ts` | MBTI scoring algorithm |
| `client/src/utils/storage.ts` | localStorage wrappers |
| `client/src/data/questions.ts` | MBTI question set (lite + full) |
| `mbti-project-brainstorm.md` | Design document (v2.1) |
