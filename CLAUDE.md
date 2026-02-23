# Novraux v2 — CLAUDE.md

## What This Is
A lean POD (Print-on-Demand) research + design tool.

**Core workflow:** Find trending niches → validate → generate designs → download → upload to Printful manually.

No Shopify sync. No order management. No Printful API. Just the creative workflow.

---

## 3 Pages

| Page | URL | Sprint | Status |
|------|-----|--------|--------|
| Discover | `/` | 1 | ✅ Done |
| Research | `/research` | 2 | 🔜 Next |
| Design | `/design` | 3 | 🔜 Planned |

---

## Sprint Plan

- **Sprint 1** — Niche Discovery: Google Trends scraper + Groq scoring + ranked list UI ✅
- **Sprint 2** — Niche Research: Claude deep analysis, competitor check, "worth it / skip" verdict
- **Sprint 3** — Design Studio: DALL-E + Gemini generation, design brief, download button
- **Sprint 4** — Design Library: save designs, tag by niche, mark as exported to Printful

---

## Stack

| Layer | Tech | Port |
|-------|------|------|
| Frontend | React + Vite + TypeScript + Tailwind CSS | 5174 |
| Backend | FastAPI (Python 3.11) | 8001 |
| Database | PostgreSQL 16 | 5433 |

---

## Running the Project

```bash
# 1. Copy and fill your API keys
cp .env.example .env

# 2. Start DB + backend
docker compose up -d

# 3. Start frontend
cd frontend && npm install && npm run dev

# Frontend → http://localhost:5174
# Backend  → http://localhost:8001
# Health   → http://localhost:8001/health
```

---

## API Keys (in .env)

| Key | Provider | Cost | Used for |
|-----|----------|------|---------|
| `AI_API_KEY` | Groq | FREE | Trend scoring (every keyword) |
| `OPENAI_API_KEY` | OpenAI | ~$0.02/img | DALL-E image generation |
| `GOOGLE_AI_KEY` | Google | Very cheap | Gemini image generation |
| `ANTHROPIC_API_KEY` | Anthropic | Cheap | Deep niche analysis (gated: score ≥ 7) |

**Cost strategy:** Groq is free — use it for everything text. Only call DALL-E / Claude when the user explicitly requests it.

---

## Project Structure

```
novraux-v2/
├── backend/
│   ├── main.py              # FastAPI app + CORS + lifespan
│   ├── config.py            # pydantic_settings (reads .env)
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── db/
│   │   ├── database.py      # SQLAlchemy engine + session
│   │   └── models.py        # Niche table
│   ├── routers/
│   │   └── discover.py      # GET/POST /discover, DELETE /discover/{id}
│   └── services/
│       ├── scraper.py       # Google Trends via pytrends
│       └── scorer.py        # Groq POD scoring
├── frontend/
│   └── src/
│       ├── App.tsx           # Routes + sidebar
│       ├── api.ts            # All API calls
│       ├── index.css         # Tailwind + Inter font
│       └── pages/
│           ├── Discover.tsx  # Sprint 1 ✅
│           ├── Research.tsx  # Sprint 2 placeholder
│           └── Design.tsx    # Sprint 3 placeholder
├── docker-compose.yml
├── .env.example
└── CLAUDE.md
```

---

## Key Conventions

- **Thin routers** — business logic lives in `services/`, routers just wire HTTP to services
- **DB sessions** — injected via `Depends(get_db)`, never instantiated manually
- **No migrations** — schema changes require container restart (no Alembic)
- **Tailwind zinc palette** — `zinc-950` bg, `zinc-900` cards, `indigo-600` accent
- **ESLint `--max-warnings 0`** — fix all warnings before committing
- **Cost gate** — never call Claude or DALL-E in a loop without a score gate (≥ 7)
