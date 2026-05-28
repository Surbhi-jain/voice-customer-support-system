# Voice Customer Support System — Plans

| Phase | File | Status |
|-------|------|--------|
| 1 | [phase-1-plan.md](../phase-1-plan.md) | Implemented |
| 2 | [phase-2-plan.md](./phase-2-plan.md) | Planned |
| 3 | [phase-3-plan.md](./phase-3-plan.md) | Implemented |
| 4 | [phase-4-plan.md](./phase-4-plan.md) | Implemented |
| 5 | (in phase-4-plan.md) | Planned |

**Phase 2** — Local faster-whisper (STT) and Piper (TTS) via Python speech service.

**Phase 3** — Topic-scoped support, file-based knowledge base, topic guard + classifier.

**Phase 4** — Single repo, three folders: `services/speech` (STT/TTS), `services/ollama` (Ollama daemon scripts + chat API + KB), `services/web` (UI). HTTP between services; callable from other projects.

**Phase 5** — App Router gateway + optional reverse proxy.
