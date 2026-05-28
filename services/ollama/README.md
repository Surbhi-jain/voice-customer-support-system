# Ollama service (chat API + knowledge base)

This folder owns the **LLM stack**: Ollama daemon setup, model pull, topic-scoped chat API, and `knowledge-base/`.

## Prerequisites

1. Install [Ollama](https://ollama.com/download)
2. Node.js 18+ (for the chat API)

## Setup

```bash
cd services/ollama
cp .env.example .env
npm install   # from repo root: npm install
```

## Run (3 steps)

**Terminal A — Ollama daemon**

```bash
cd services/ollama
npm run daemon:serve
# or: ollama serve
```

**Terminal B — Pull model (once)**

```bash
cd services/ollama
npm run daemon:pull
```

**Terminal C — Chat API (port 4000)**

```bash
cd services/ollama
npm run dev
```

From repo root:

```bash
npm run ollama:serve
npm run ollama:pull
npm run dev:ollama
```

## HTTP API

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Checks Ollama daemon (`/api/version`) |
| `POST` | `/chat` | Topic-scoped chat — body: `{ topicId, messages, language }` |

## Knowledge base

Edit markdown under `knowledge-base/{topicId}/`. Restart the chat API to reload the cache.

## Environment

See `.env.example`.
