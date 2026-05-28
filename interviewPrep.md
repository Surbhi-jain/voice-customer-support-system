# Voice Customer Support System — Detailed Interview Prep

**Read this if you are new to the project.** Every technology on your resume or in your pitch is explained below, with likely interviewer questions and safe answers.

---

## Part 0: Start Here (Know Nothing? Read This First)

### What is this project in one sentence?

A **website where you talk to an AI customer support agent** — like calling a help desk, but in the browser, running **entirely on your computer** (no ChatGPT API bill).

### What does the user do?

1. Open the website (`http://localhost:3000`)
2. Pick a **support topic** (Hotel, Cooking, Retail, Travel, Banking, IT helpdesk)
3. Click **Start conversation** and allow the microphone
4. Click **Start speaking**, ask a question (e.g. "What time is checkout?")
5. Click **Stop** — the app listens, thinks, and **speaks** the answer back
6. If you ask something **wrong for that topic** (e.g. a recipe on the Hotel line), it **refuses** politely

### The full pipeline (memorize this)

```text
YOUR VOICE
    ↓  (browser records audio as WebM)
WHISPER  →  turns speech into TEXT
    ↓
GUARDS + KNOWLEDGE BASE + OLLAMA  →  decides answer TEXT
    ↓
PIPER  →  turns TEXT into spoken AUDIO
    ↓
YOUR SPEAKERS
```

### Three programs you must run (three terminals)

| # | Program | Port | What it does |
|---|---------|------|----------------|
| 1 | **Ollama** | 11434 | The "brain" — generates text answers (Llama 3.2 model) |
| 2 | **speech-service** (Python) | 8000 | Ears + mouth — Whisper (hear) and Piper (speak) |
| 3 | **Next.js app** (`npm run dev`) | 3000 | The website + connects everything |

**Honest line for interviews:** "It's a demo/MVP I built to learn voice AI end-to-end. It's not deployed to production, but the architecture mirrors real systems: STT, LLM, TTS, guardrails, and a knowledge base."

---

## Part 1: 30-Second Elevator Pitch

> "I built a **local voice customer support demo**. Users choose a support line—hotel, retail, banking, etc.—and speak their question. **Whisper** converts speech to text, **Ollama** with Llama 3.2 generates a topic-scoped reply using a **markdown knowledge base**, and **Piper** speaks the answer. I used **Next.js** for the UI and API layer and a **Python FastAPI** microservice for speech because those models run best in Python. Everything runs locally with **no paid APIs**. I also added **topic guardrails** so off-topic questions get a refusal instead of a random answer."

---

## Part 2: Technology Deep Dives

For each technology: **what it is**, **why we use it here**, **interview questions**, **what to say**, **what NOT to claim**.

---

### 2.1 Next.js

**What it is (simple):** A **React framework** for building websites. It adds routing, API routes (backend endpoints in the same project), and production build tools.

**Why in this project:** Powers the UI (buttons, settings, transcript) and **API routes** like `/api/chat`, `/api/stt`, `/api/tts` that sit between the browser and Ollama/speech-service.

**Likely questions:**

| Question | Answer |
|----------|--------|
| What is Next.js? | React framework with file-based routing and server-side API routes. |
| App Router vs Pages Router? | This project uses **App Router** (`app/` folder). |
| Why API routes? | Browser calls `/api/chat`; server forwards to Ollama—hides internal URLs, avoids CORS issues. |
| SSR vs CSR? | UI is mostly **client-side** (`"use client"` hooks). API routes run on the server. |

**Safe phrase:** "Next.js is my BFF layer—it serves the React UI and proxies requests to Ollama and the Python speech service."

**Do NOT claim:** Expert in Next.js caching, ISR, edge deployment—unless you've actually used them.

---

### 2.2 React

**What it is:** A JavaScript **library for building UIs** with components (reusable pieces like buttons, panels).

**Why here:** Pages and components (`PushToTalkButton`, `TranscriptPanel`, `StatusBar`) + the `useVoiceSession` hook manage mic, messages, and loading states.

**Likely questions:**

| Question | Answer |
|----------|--------|
| What is a hook? | A function like `useVoiceSession` that holds state (`useState`) and side effects (`useEffect`, `useCallback`). |
| Why custom hook? | Voice flow is complex (record → STT → chat → TTS → play → cancel). One hook keeps UI components simple. |
| State vs ref? | **State** updates UI (status: idle/thinking/speaking). **Refs** hold values without re-render (abort controller, mic stream). |

**Key file:** `hooks/useVoiceSession.ts`

---

### 2.3 TypeScript

**What it is:** JavaScript **with types** — catches errors at compile time (e.g. wrong shape of API response).

**Why here:** Types for `ChatMessage`, `SessionStatus`, topic IDs—safer when passing data between STT, chat, and UI.

**Likely questions:**

| Question | Answer |
|----------|--------|
| Why TypeScript over JS? | Fewer runtime bugs; better IDE autocomplete in a multi-file app. |
| Example type in project? | `ChatMessage` with `role: "user" \| "assistant"` and `content: string`. |

---

### 2.4 Tailwind CSS

**What it is:** Utility-first CSS—you style with classes like `flex`, `p-4`, `text-sm` in JSX instead of separate CSS files.

**Why here:** Fast styling for layout, settings panel, status indicators.

**Likely questions:** "I used Tailwind for rapid UI styling; no heavy custom CSS architecture."

---

### 2.5 Node.js

**What it is:** Runs JavaScript **outside the browser**—powers Next.js dev server and API routes.

**Why here:** `npm run dev` starts Next.js on port 3000.

**Likely questions:** "Node runs the Next.js server; Python runs speech-service—they're separate processes."

---

### 2.6 REST API

**What it is:** Client sends **HTTP requests** (GET/POST) to URLs; server returns JSON or files.

**Our endpoints:**

| Endpoint | Method | Input | Output |
|----------|--------|-------|--------|
| `/api/stt` | POST | Audio file (WebM) | `{ transcript, confidence }` |
| `/api/chat` | POST | Messages + topicId | `{ reply }` |
| `/api/tts` | POST | Text + voice | WAV audio bytes |
| `/api/health` | GET | — | Ollama + speech-service status |
| `/api/voices` | GET | — | List of Piper voices |

**Python speech-service (port 8000):** Same idea—`POST /stt`, `POST /tts`, `GET /health`, `GET /voices`.

**Likely questions:**

| Question | Answer |
|----------|--------|
| REST vs GraphQL? | REST—simple file upload for audio and JSON for chat. |
| Why POST for STT? | Sending audio file in body; GET can't carry file bodies. |

---

### 2.7 Python + FastAPI + Uvicorn

**Python:** Language used for AI/audio libraries (Whisper, Piper).

**FastAPI:** Modern Python **web framework**—defines routes like `@app.post("/stt")`, validates input, returns JSON/WAV.

**Uvicorn:** **ASGI server** that runs FastAPI (like Node runs Next.js). Command: `uvicorn main:app --port 8000`.

**Why separate from Next.js:** Whisper and Piper have **Python packages** (`faster-whisper`, `piper-tts`). Loading multi-GB models in Node is awkward.

**Likely questions:**

| Question | Answer |
|----------|--------|
| Why FastAPI vs Flask? | FastAPI has async support, automatic docs, easy file uploads—good for STT. |
| What is uvicorn? | Production-style server process for FastAPI. |
| How does Next talk to Python? | `fetch(SPEECH_SERVICE_URL + "/stt", ...)` from `lib/speechService.ts`. |

**Key files:** `speech-service/main.py`, `stt.py`, `tts.py`

---

### 2.8 Whisper & faster-whisper (STT)

**STT = Speech-to-Text** (speech → written text).

**Whisper:** OpenAI's open model that listens to audio and outputs transcript.

**faster-whisper:** Community reimplementation—**same idea, faster** on CPU with quantization (`int8`).

**In this project:**

- User stops recording → WebM blob sent to `/api/stt` → Python saves temp file → `WhisperModel.transcribe()` → text returned
- Config: `WHISPER_MODEL` (tiny/base/small/medium/turbo), `WHISPER_DEVICE` (cpu/cuda)
- **VAD** (Voice Activity Detection): skips long silence so transcription focuses on speech

**Likely questions:**

| Question | Answer |
|----------|--------|
| What is Whisper? | Speech-to-text ML model; we use faster-whisper in Python. |
| How accurate is it? | Depends on model size, mic quality, noise. `small` is default balance; `medium`/`turbo` better but slower. |
| What is VAD? | Detects which parts of audio are speech vs silence. |
| GPU vs CPU? | `WHISPER_DEVICE=cpu` by default; `cuda` if NVIDIA GPU available. |

**Do NOT claim:** You trained Whisper. You **used** a pre-trained model.

---

### 2.9 Piper (TTS)

**TTS = Text-to-Speech** (written text → spoken audio).

**Piper:** Open-source, **local** TTS engine. Uses `.onnx` voice model files (neural network format).

**In this project:**

- LLM returns text → `toSpokenText()` makes it sound natural (numbers as words, etc.) → `/api/tts` → Piper → **WAV** → browser plays audio
- User picks voice in Settings ("Spoken reply voice (Piper)")
- Models downloaded via `python download_models.py`

**Likely questions:**

| Question | Answer |
|----------|--------|
| Piper vs Google/AWS Polly? | Piper is free and local; cloud TTS is paid and needs internet. |
| What is ONNX? | Format for running ML models efficiently; Piper voices are `.onnx` files. |
| Output format? | WAV (uncompressed audio)—easy for browser `AudioContext` playback. |

---

### 2.10 Ollama & Llama 3.2 (LLM)

**LLM = Large Language Model** — AI that generates human-like **text** from prompts.

**Ollama:** Desktop app that **runs LLMs locally** (downloads models, exposes HTTP API on port 11434).

**Llama 3.2:** Meta's open model family; we use `llama3.2` via Ollama for chat replies.

**In this project:**

- `chatWithOllama()` sends system prompt + conversation to `POST http://localhost:11434/api/chat`
- System prompt includes: topic scope, language, knowledge-base chunks, "answer briefly for voice"
- Classifier also uses Ollama for ambiguous on/off-topic decisions

**Likely questions:**

| Question | Answer |
|----------|--------|
| What is Ollama? | Local LLM runtime—like Docker for AI models. |
| Why local vs OpenAI API? | No API cost, privacy, learning full pipeline. Tradeoff: slower/weaker on weak hardware. |
| What is a system prompt? | Instructions prepended to every chat: "You are hotel support; stay on topic; use KB when provided." |
| Temperature / streaming? | We use `stream: false`—wait for full reply before TTS. |
| Hallucination? | Mitigated by topic guard + KB context; not eliminated. |

**Do NOT claim:** You fine-tuned Llama. You **prompted** it.

---

### 2.11 RAG (Retrieval-Augmented Generation)

**What it is:** Before asking the LLM to answer, **retrieve relevant documents** and put them in the prompt so the model grounds answers in real text.

**In this project (simple RAG, not vector DB):**

1. Markdown files live in `knowledge-base/hotel/`, `knowledge-base/cooking/`, etc.
2. Files split into **chunks** by `##` headings
3. User question → **keyword scoring** → top 4 chunks
4. Chunks injected into system prompt → Ollama answers

**Likely questions:**

| Question | Answer |
|----------|--------|
| What is RAG? | Retrieve docs + augment prompt + generate answer. |
| Vector DB? | We use **keyword matching**, not embeddings—simpler for demo. |
| Improvement? | Add embedding model + Chroma/Pinecone for semantic search. |
| What if no match? | Open topics: model still answers from domain prompt. Strict: fixed "not in KB" message. |

**Key file:** `lib/knowledgeBase.ts`

---

### 2.12 Topic guard & classifier (guardrails)

**Problem:** User on **Hotel** line asks about **cooking** — LLM might still answer. We block that.

**Layer 1 — Topic guard (`lib/topicGuard.ts`):**

- Each topic has `keywords` (hotel, checkout, room) and `antiKeywords` (recipe, flight, password reset)
- If anti-keyword found → **off_topic** → spoken refusal script, skip LLM
- If keyword found → **on_topic**
- If unclear → **ambiguous**

**Layer 2 — Classifier (`lib/topicClassifier.ts`):**

- Only when ambiguous and `TOPIC_STRICT_MODE=true`
- Small Ollama prompt: reply `ON_TOPIC` or `OFF_TOPIC`

**Layer 3 — System prompt:** Tells model to stay in scope.

**Likely questions:**

| Question | Answer |
|----------|--------|
| Why not only prompt the LLM? | Models still drift; rules + classifier are faster and more reliable for obvious cases. |
| False positives? | Possible—e.g. "pool" OK on hotel, "flight" refused. Tuned via keyword lists. |

**Key file:** `lib/chatPipeline.ts` orchestrates guard → classifier → retrieve → Ollama

---

### 2.13 WebM & ffmpeg

**WebM:** A **file format** for audio/video on the web. Browser `MediaRecorder` saves your mic recording as WebM.

**ffmpeg:** Industry-standard tool to **read/convert** audio/video. Whisper doesn't read raw WebM bytes directly—it needs decoded audio; ffmpeg (used inside faster-whisper/PyAV) does that.

**Likely questions:**

| Question | Answer |
|----------|--------|
| Why WebM? | Native browser recording—no extra conversion in frontend. |
| Why install ffmpeg? | README says STT fails without it—decoding step breaks. |
| `brew install ffmpeg`? | macOS install command. |

**Key file:** `lib/audioCapture.ts` — tries `audio/webm;codecs=opus` first

---

### 2.14 Browser audio APIs

**getUserMedia:** Asks permission and opens the **microphone stream**.

**MediaRecorder:** Records that stream into **chunks**; on stop, combines into a **Blob** (file in memory).

**AudioContext / playback:** Plays WAV returned from TTS.

**Likely questions:**

| Question | Answer |
|----------|--------|
| Push-to-talk? | User holds/clicks Start speaking → Stop; not always-listening (simpler privacy). |
| Chrome only in Phase 1? | Old version used Web Speech API (Chrome). Phase 2+ uses Whisper—works in modern browsers. |

---

### 2.15 Microservices & BFF

**Microservices:** Split app into **small independent services** (here: web, speech, LLM).

**BFF (Backend for Frontend):** Next.js API routes tailored for the UI—one place for `/api/stt`, `/api/chat`, etc.

**Why split:**

| Service | Stack | Reason |
|---------|-------|--------|
| Next.js | Node/TS | UI + orchestration |
| speech-service | Python | Whisper + Piper |
| Ollama | Go/binary + models | LLM hosting |

**Likely questions:**

| Question | Answer |
|----------|--------|
| Monolith vs microservices? | We chose 3 processes for **different runtimes and heavy models**, not because we needed massive scale. |
| How communicate? | HTTP REST between services on localhost. |

---

### 2.16 Playwright (E2E testing)

**What it is:** Tool that **automates a real browser**—clicks buttons, checks text, mocks network.

**Why here:** Voice needs mic—we **mock** `MediaRecorder` and `/api/stt`, `/api/tts` so tests run in CI without Whisper/Ollama.

**Command:** `npm run test:e2e`

**Likely questions:**

| Question | Answer |
|----------|--------|
| Unit vs E2E? | E2E tests full UI flows; we mock backend for reliability. |
| What do tests verify? | Start session, speak controls, topic sent to chat API, stop reply button, etc. |

**Key folder:** `e2e/`

---

### 2.17 Environment variables (.env)

**What they are:** Config values **outside code**—URLs, model names, feature flags.

| Variable | Meaning |
|----------|---------|
| `OLLAMA_MODEL` | Which Llama model (e.g. llama3.2) |
| `OLLAMA_BASE_URL` | Where Ollama runs |
| `SPEECH_SERVICE_URL` | Python service URL |
| `WHISPER_MODEL` | Whisper size (in speech-service `.env`) |
| `PIPER_VOICE` | Default TTS voice |
| `TOPIC_STRICT_MODE` | Use LLM classifier when guard is ambiguous |
| `NEXT_PUBLIC_*` | Exposed to browser (greeting, debug flags) |

**Likely questions:**

| Question | Answer |
|----------|--------|
| `.env` vs `.env.example`? | Example is committed (template); `.env` has real values and is gitignored. |
| `NEXT_PUBLIC_` prefix? | Next.js exposes these to client-side JavaScript. |

---

### 2.18 Other terms you might hear

| Term | Simple meaning | In this project |
|------|----------------|-----------------|
| **Prompt** | Instructions/text sent to LLM | System prompt + user messages |
| **Token** | Word-piece unit LLMs read | Shorter replies = fewer tokens = faster TTS |
| **Latency** | Delay end-to-end | STT + LLM + TTS on CPU can be several seconds |
| **Quantization (int8)** | Smaller/faster model numbers | `WHISPER_COMPUTE_TYPE=int8` on CPU |
| **ONNX** | ML model file format | Piper voice files |
| **Opus** | Audio codec inside WebM | Efficient compression |
| **WAV** | Uncompressed audio | Piper output for playback |
| **CORS** | Browser security for cross-origin API calls | Why we proxy via Next.js `/api/*` |
| **AbortController** | Cancel in-flight HTTP | "Stop reply" button |
| **Singleton model** | Load ML model once, reuse | `_model` in `stt.py`, `_voices` in `tts.py` |

---

## Part 3: Step-by-Step — What Happens When User Speaks

1. User clicks **Start speaking** → `getUserMedia` opens mic → `MediaRecorder` records
2. User clicks **Stop** → blob `audio/webm` created
3. Frontend `POST /api/stt` with FormData (audio + language)
4. Next.js route forwards to Python `POST /stt`
5. Python writes temp `.webm`, Whisper transcribes, returns `transcript`
6. Frontend shows user text, `POST /api/chat` with messages + `topicId`
7. `chatPipeline`: guard → classifier? → `retrieveKnowledge` → `chatWithOllama`
8. Reply text → `POST /api/tts` → Piper → WAV bytes
9. Browser plays audio; status: Thinking → Speaking → Idle
10. User can **Stop reply** → abort fetch + stop audio

---

## Part 4: Project Phases (if they ask "how did it evolve?")

| Phase | What changed |
|-------|----------------|
| **Phase 1** | Browser Web Speech API for STT/TTS (Chrome-only, simpler) |
| **Phase 2** | Local Whisper + Piper in Python `speech-service` |
| **Phase 3** | Topic dropdown, knowledge base, topic guard + classifier |
| **Phase 4** | Greeting + acknowledgment phrases while processing (call-center feel) |

---

## Part 5: Standard Interview Q&A

### Project overview

| Q | A |
|---|---|
| What does it do? | Voice support demo: speak question → scoped spoken answer. |
| Why build it? | Learn STT, LLM, TTS, RAG, guardrails, microservices—locally. |
| Production ready? | MVP/demo. Needs auth, scaling, better RAG, deployment. |
| Your role? | *(Say honestly: personal project / team / coursework.)* |

### Architecture

| Q | A |
|---|---|
| High-level design? | Browser → Next.js → speech-service (Whisper/Piper) + Ollama. |
| Why 3 services? | Different languages, heavy models, independent restart/tuning. |
| Failure handling? | Health check on start; errors in UI; empty audio → 400. |
| Scale to 10k users? | Containers, GPU pools for STT, queue workers, cloud LLM, Redis sessions, vector DB. |

### AI / ML

| Q | A |
|---|---|
| Did you train models? | No—used pre-trained Whisper, Piper, Llama via Ollama. |
| Biggest AI risk? | Hallucination and off-topic answers—mitigated by guard + KB + prompts. |
| Improve accuracy? | Bigger Whisper, GPU, better mic, embedding RAG, human review loop. |

### Frontend

| Q | A |
|---|---|
| Hardest UI part? | Async pipeline with cancel, no race when user spams buttons. |
| Why React hook? | Centralize voice session logic away from presentational components. |

### Behavioral

| Q | A |
|---|---|
| Proud of? | Full local voice loop with topic enforcement across 3 services. |
| Learned? | How real voice agents chain STT → LLM → TTS and where to put guardrails. |
| Struggled with? | ffmpeg/WebM STT setup, latency on CPU, testing without real mic. |
| One more week? | Docker Compose, streaming LLM+TTS, embedding RAG, deploy to cloud. |

---

## Part 6: Deep-Dive Script (practice out loud)

**"Walk me through one user question."**

> "User selects Hotel topic and asks about late checkout. Browser records WebM audio. Next.js `/api/stt` forwards to Python; faster-whisper with ffmpeg decodes and transcribes to text. `/api/chat` runs `chatPipeline`: topic guard sees hotel-related words—on topic. We retrieve matching chunks from `knowledge-base/hotel/*.md` by keyword score and inject them into the system prompt. Ollama Llama 3.2 returns a short answer. Text is normalized for speech, sent to `/api/tts`, Piper generates WAV, and the UI plays it. If they had asked about a recipe, anti-keywords would trigger an immediate refusal script without calling the main chat logic."

---

## Part 7: Resume Bullets (copy/adapt)

- Developed a **local voice customer support** web app: **Whisper** STT, **Ollama/Llama 3.2** LLM, **Piper** TTS, **Next.js** frontend, **FastAPI** speech microservice.
- Implemented **topic-scoped guardrails** (keyword guard + LLM classifier) and **markdown-based RAG** across 6 support domains.
- Designed **3-service architecture** (UI, speech ML, LLM) with REST APIs and health checks.
- Added **Playwright E2E tests** with mocked audio APIs for CI-friendly voice flow testing.

---

## Part 8: Words on Resume — Quick Defense Cheat Sheet

| If resume says… | Be ready to explain… |
|-----------------|----------------------|
| Next.js | React framework, API routes, our `/api/*` proxy |
| React | Components + `useVoiceSession` hook |
| TypeScript | Typed messages, topics, API bodies |
| Python / FastAPI | speech-service, `/stt` and `/tts` |
| Whisper | Speech-to-text, faster-whisper |
| Piper | Text-to-speech, local voices |
| Ollama / Llama | Local LLM for answers + classifier |
| RAG | Markdown KB + keyword retrieval |
| REST API | POST stt/chat/tts, GET health/voices |
| Microservices | 3 separate processes |
| Playwright | E2E UI tests with mocks |
| LLM | Large language model—text generation |
| STT / TTS | Speech-to-text / text-to-speech |

---

## Part 9: Honest "I Don't Know" Lines (better than bluffing)

- "I integrated Whisper via faster-whisper; I didn't train it from scratch."
- "Our RAG is keyword-based; I'd move to embeddings for production."
- "I haven't deployed this to AWS yet—that's a planned next step."
- "I understand the pipeline; I'd need to look up exact Whisper hyperparameters."
- "Ollama made local LLM easy; in production we might use a managed API or vLLM."

---

## Part 10: Key Files Cheat Sheet

| Topic | File |
|-------|------|
| Main UI | `app/page.tsx` |
| Voice logic | `hooks/useVoiceSession.ts` |
| Chat orchestration | `lib/chatPipeline.ts` |
| KB / RAG | `lib/knowledgeBase.ts` |
| Topic list | `lib/topics.ts` |
| Guard | `lib/topicGuard.ts` |
| Classifier | `lib/topicClassifier.ts` |
| Ollama call | `lib/ollama.ts` |
| Mic recording | `lib/audioCapture.ts` |
| Speech API (Python) | `speech-service/main.py` |
| STT | `speech-service/stt.py` |
| TTS | `speech-service/tts.py` |
| FAQ content | `knowledge-base/{topicId}/*.md` |
| Tests | `e2e/*.spec.ts` |

---

## Part 11: Commands to Run Before Interview

```bash
# Terminal 1
ollama serve

# Terminal 2
ollama pull llama3.2

# Terminal 3
cd speech-service && source .venv/bin/activate && uvicorn main:app --port 8000

# Terminal 4
npm run dev
```

Open http://localhost:3000 — **demo live** if interviewer asks.

---

## Part 12: Fill In Yourself

| Question | Your answer |
|----------|-------------|
| How long did you work on this? | |
| Solo or team? | |
| Biggest bug you fixed? | |
| What would you demo first? | |

---

*Aligned with README.md, phase-3 plan, and current codebase. Update if you add new features.*
