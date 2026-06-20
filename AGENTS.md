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

# Build for production (server: tsc, client: vite build)
bun run build

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

Fully typed events defined in `shared/types/index.ts`. Client uses `useSocket` hook which returns typed `emit`/`on` functions. Key flow: `join-room` → `partner-joined` → `answer-submitted`/`answer-synced`/`partner-progress` → `test-completed` → `both-completed`. Reconnection handled via duplicate `join-room` handler.

**Answer progress is server-authoritative.** `answer-submitted` dedupes by `questionId` (re-answering replaces, never appends) so counts can't exceed the question total. Both `answer-synced` (明牌) and `partner-progress` (暗牌) carry the server's authoritative `count`; clients **set** the partner count from it rather than incrementing. On `join-room` the server backfills the partner's current count via `partner-progress`, so a late/reconnecting user resyncs immediately.

The AI chat is a **server-driven shared session**: the server owns chat history, the selected persona, and the typing state per room (`ServerRoom.chat`). Clients send `chat-message`/`change-character`; the server runs the LLM call and broadcasts `new-message`/`chat-typing`/`character-changed` to both users. On join, the server replays `chat-history` so a reconnecting/late user sees the full conversation. There is no REST chat endpoint.

### Test display modes

There is no "answer mode" — all tests are synchronous. The only option is `displayMode`: `open` (明牌, partner's per-question choice is broadcast via `answer-synced`) or `hidden` (暗牌, only a progress count is broadcast via `partner-progress`).

### REST API

Mounted at `/api/` with two route groups: `rooms` (CRUD + join) and `analysis` (AI relationship analysis, cached 7 days). Chat is handled over Socket.IO, not REST. Rate-limited: 10 room creations per IP per day.

### LLM Integration

`server/src/services/llm.ts` calls an OpenAI-compatible endpoint via `fetch` with env vars `LLM_BASE_URL`, `LLM_API_KEY`, `LLM_MODEL`. The configured model (`mimo-v2.5`) is a long-context reasoning model (256K / 262144 tokens — see `CONTEXT_LIMIT`), so token budgets are generous (analysis 8000, chat 4000). `estimateTokens` logs a rough budget per call. Two character personas: `kind` (善良人格) and `evil` (邪恶人格). Fallback template when LLM unavailable.

**All prompts live in `server/src/services/prompts.ts`** (analysis system/user prompts + chat system prompt with persona tone and per-dimension context). Edit prompts there, not in `llm.ts`. Analysis is built from each side's per-dimension direction + percentage (`PersonProfile`); the analysis route dedupes concurrent A/B requests via an in-flight promise so both users get one identical result.

### Scoring

7-point Likert scale (-3 to +3) per question. Reverse-scored questions have `reverse: true`. Percentage = (score + maxScore) / (2 * maxScore) × 100. Questions in `client/src/data/questions.ts` (lite: 28, full: 60). Per-type descriptions in `client/src/data/descriptions.ts`.

### Configuration & Deployment

A single root `.env` configures both packages (see `.env.example`); Vite reads it via `envDir: '..'`. Server vars: `LLM_*`, `PORT`, `HOST`, `CORS_ORIGIN`, `CLIENT_DIST`. Client build-time vars use the `VITE_` prefix and are surfaced via `client/src/config.ts` (e.g. `VITE_SHOW_FILL_ALL` toggles the "一键填充" debug button). In production the server auto-serves `client/dist` (or `CLIENT_DIST`) with an SPA fallback, so it deploys as a single process (`node dist/server/src/index.js`).

### Security

DOMPurify for XSS protection (`sanitize.ts`). Input validation on room names (2-20 chars), chat messages (1-500 chars), relationship type whitelist. No authentication — users identified by generated IDs in localStorage.

## Key Files

| File | Purpose |
|------|---------|
| `shared/types/index.ts` | All shared TypeScript types and interfaces |
| `server/src/socket/handler.ts` | Socket.IO event handling core (progress dedup + shared chat) |
| `server/src/store/RoomStore.ts` | `RoomStore` interface + `MemoryRoomStore` implementation |
| `server/src/services/llm.ts` | OpenAI-compatible LLM client + token estimation |
| `server/src/services/prompts.ts` | All analysis & chat prompts (edit prompts here) |
| `server/src/index.ts` | Express bootstrap; serves client build in production |
| `client/src/config.ts` | Build-time client config (e.g. `VITE_SHOW_FILL_ALL`) |
| `client/src/hooks/useSocket.ts` | Socket.IO client hook with auto-reconnect |
| `client/src/utils/scoring.ts` | MBTI scoring algorithm |
| `client/src/utils/storage.ts` | localStorage wrappers |
| `client/src/data/questions.ts` | MBTI question set (lite + full) |
| `client/src/data/descriptions.ts` | 16-type subtitles + descriptions |
| `.env.example` | Root env template (server + `VITE_` client vars) |
| `mbti-project-brainstorm.md` | Design document (v2.1) |
