# Dizi AI — Backend Integration Placeholder

> **Status:** Placeholder — LLM integration to be implemented here.

Dizi is the custom AI assistant for Dizitup. This folder is reserved for all LLM-related backend code.

---

## What Goes Here

| File / Folder | Purpose |
|---|---|
| `src/llm.js` | Core LLM client (e.g. OpenAI, Anthropic, local model) |
| `src/prompts/` | System prompts and persona configs for Dizi |
| `src/routes/dizi.js` | Express route: `POST /api/dizi/chat` |
| `src/memory/` | Conversation memory / context window management |
| `src/tools/` | Function-calling tools Dizi can invoke (e.g. lookup FAQ, check project status) |
| `config.js` | LLM provider keys, model names, temperature, max_tokens |

---

## Planned API Endpoint

```
POST /api/dizi/chat
Authorization: Bearer <user_token>

Body: { message: string, conversationId?: string }

Response: { reply: string, conversationId: string }
```

This endpoint should be wired into `components/ChatWidget.tsx` (currently shows "Coming Soon").  
Once live, replace the Coming Soon UI with the real Dizi chat panel.

---

## How to Wire Into ChatWidget.tsx

1. Implement `POST /api/dizi/chat` in this folder and register it in `backend/dizitup-backend/src/app.js`.
2. In `components/ChatWidget.tsx`, update `sendMessage` to call `/api/dizi/chat` instead of showing the disabled placeholder.
3. Render the response as a Dizi message bubble (use `sender_type: 'dizi'` or adapt the existing `'admin'` style).
4. Remove the Coming Soon UI and restore the full messages list + input.

---

## Suggested Stack

- **LLM Provider:** OpenAI GPT-4o / Anthropic Claude / Ollama (local)
- **Memory:** Simple in-memory conversation array per session, or persist to the existing Postgres/Prisma setup
- **Streaming:** Use SSE (`text/event-stream`) for a better UX — stream tokens as they arrive
- **Rate limiting:** Apply per-user rate limiting via the existing `middleware/auth.js`

---

## Environment Variables to Add

```env
# In backend/.env
DIZI_LLM_PROVIDER=openai          # openai | anthropic | ollama
DIZI_OPENAI_API_KEY=sk-...
DIZI_MODEL=gpt-4o
DIZI_SYSTEM_PROMPT="You are Dizi, the AI assistant for Dizitup..."
DIZI_MAX_TOKENS=1024
DIZI_TEMPERATURE=0.7
```

---

*Created: March 2026 — Placeholder by Dizitup dev team*
