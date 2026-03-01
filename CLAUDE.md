# Novraux v2 — CLAUDE.md

## What This Is
A lean POD (Print-on-Demand) research + design tool for Etsy and Shopify sellers.

**Core workflow:**
Find trending niches → validate with AI → get design angles → generate Kittl prompts → create in Kittl → copy Etsy SEO → list on Etsy/Shopify → fulfill via Printify.

No Shopify sync. No order management. No Printify API. Just the creative + research workflow.

---

## Pages & Status

| Page | URL | Status | What it does |
|------|-----|--------|--------------|
| Discover | `/` | ✅ Done | Google Trends scraper + Groq scoring + ranked niche list |
| Event Radar | `/holidays` | ✅ Done | 55+ calendar events with POD potential, lead times, prep status |
| Research | `/research` | ✅ Done | Claude analysis: verdict, audience, competitor insights, design angles + Etsy/Shopify SEO copy |
| Prompt Studio | `/design` | ✅ Done | Groq-generated Kittl prompts with model + background recommendations |

---

## Sprint History

- **Sprint 1** — Niche Discovery: Google Trends + Groq scoring + ranked list ✅
- **Sprint 2** — Niche Research: Claude deep analysis, worth it verdict ✅
- **Sprint 3** — Prompt Studio: Groq → Kittl-ready prompts (no image generation) ✅
- **Sprint 3.5** — Event Radar: 55+ events, POD potential, "Research Event" CTA ✅
- **Sprint 3.6** — SEO Copy: Etsy title, 13 tags, description, Shopify meta (Groq, free) ✅
- **Sprint 4** — Planned: Listing Library — save listings, track what is live, export history

---

## Stack

| Layer | Tech | Port |
|-------|------|------|
| Frontend | React + Vite + TypeScript + Tailwind CSS | 5174 |
| Backend | FastAPI (Python 3.11) | 8001 |
| Database | PostgreSQL 16 | 5433 |
| Storage | Cloudflare R2 (S3-compatible, boto3) | — |

---

## Running the Project

```bash
# 1. Start DB + backend (Docker)
docker compose up -d

# 2. Start frontend
cd frontend && npm install && npm run dev

# Frontend -> http://localhost:5174
# Backend  -> http://localhost:8001
# Health   -> http://localhost:8001/health
```

---

## API Keys (in .env)

| Key | Provider | Cost | Used for |
|-----|----------|------|---------|
| `AI_API_KEY` | Groq | FREE | Niche scoring, Kittl prompt gen, SEO copy |
| `ANTHROPIC_API_KEY` | Anthropic | ~$0.001/call | Deep niche analysis (Claude Haiku) — explicit user action only |
| `OPENAI_API_KEY` | OpenAI | ~$0.04/img | DALL-E 3 (backend kept, not in UI) |
| `GOOGLE_AI_KEY` | Google | Needs billing | Gemini image gen (backend kept, not in UI) |
| `R2_*` | Cloudflare | ~$0 | Image storage with presigned URLs (7-day TTL) |

**Cost strategy:** Groq is free — use for all text (scoring, prompts, SEO). Only call Claude on explicit user button click. Image generation APIs kept in backend but not shown in UI.

---

## Project Structure

```
novraux-v2/
├── backend/
│   ├── main.py                  # FastAPI app + CORS + lifespan
│   ├── config.py                # pydantic_settings (reads .env)
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── db/
│   │   ├── database.py          # SQLAlchemy engine + session
│   │   └── models.py            # Niche, NicheResearch, Design tables
│   ├── routers/
│   │   ├── discover.py          # GET/POST /discover, DELETE /discover/{id}
│   │   ├── research.py          # GET/POST /research/{id}, /by-keyword, /seo
│   │   └── design.py            # POST /design/prompts, /generate; GET /design/list
│   └── services/
│       ├── generator.py         # Groq keyword generation
│       ├── scorer.py            # Groq POD viability scoring (llama-3.1-8b-instant)
│       ├── researcher.py        # Claude Haiku deep niche analysis
│       ├── prompt_generator.py  # Groq Kittl-ready prompt generation (llama-3.3-70b)
│       ├── seo_generator.py     # Groq Etsy+Shopify SEO copy (llama-3.3-70b)
│       ├── image_generator.py   # DALL-E 3 + Gemini (backend only, not in UI)
│       └── r2.py                # Cloudflare R2 upload + presigned URLs
├── frontend/
│   └── src/
│       ├── App.tsx              # Routes + sidebar (useLocation for correct active state)
│       ├── api.ts               # All API calls + TypeScript interfaces
│       ├── index.css            # Tailwind + Inter font
│       ├── lib/
│       │   └── holidays.ts      # 55+ calendar events with POD metadata
│       └── pages/
│           ├── Discover.tsx     # Niche list, scraper, topic filter
│           ├── Holidays.tsx     # Event Radar with "Research Event" button
│           ├── Research.tsx     # Claude analysis + SEO copy panel
│           └── Design.tsx       # Prompt Studio — Kittl prompts with copy buttons
├── docker-compose.yml
├── .env                         # API keys (never commit)
├── .env.example
└── CLAUDE.md
```

---

## API Endpoints

| Method | Path | Service | Cost |
|--------|------|---------|------|
| GET | `/health` | — | free |
| GET | `/discover` | — | free |
| POST | `/discover/scrape` | Groq | free |
| DELETE | `/discover/{id}` | — | free |
| GET | `/research/{niche_id}` | DB | free |
| POST | `/research/{niche_id}` | Claude Haiku | ~$0.001 |
| POST | `/research/by-keyword` | Claude Haiku | ~$0.001 |
| POST | `/research/seo` | Groq | free |
| POST | `/design/prompts` | Groq | free |
| POST | `/design/generate` | DALL-E / Gemini | ~$0.04 (not in UI) |
| GET | `/design/list` | DB | free |

---

## Key Conventions

- **Thin routers** — business logic lives in services/, routers just wire HTTP to services
- **DB sessions** — injected via Depends(get_db), never instantiated manually
- **No migrations** — schema changes require manual ALTER TABLE via docker exec (no Alembic)
- **Tailwind zinc palette** — zinc-950 bg, zinc-900 cards, indigo-600 accent, emerald-* positive, red-* negative
- **ESLint --max-warnings 0** — fix all warnings before committing
- **Cost gate** — never call Claude or DALL-E in a loop; only on explicit user button click
- **Groq models** — llama-3.3-70b-versatile for quality copywriting; llama-3.1-8b-instant for fast scoring
- **Kittl model routing** — text-heavy: Ideogram 3 Quality; illustration: FLUX 1.1 Pro; mixed: DALL-E 3
- **R2 images** — always use presigned URLs (7-day TTL); never expose private S3 endpoint directly
- **Research routing** — from Discover: POST /research/{id} (score >= 7 gate); from Event Radar: POST /research/by-keyword (no gate)

---

## User Workflow (Etsy/Shopify POD)

Event Radar or Discover -> Research page
  Claude: Worth It / Skip verdict
  Target audience + competitor insights
  Design angles (click any -> Prompt Studio)
  SEO Copy panel: Etsy title + 13 tags + description + Shopify meta

Prompt Studio (from Research angle click)
  5 Kittl prompts generated by Groq
  Each shows: style, product, Kittl model, background type
  Copy button -> paste into Kittl

Kittl (external tool)
  Select the recommended model shown in the prompt card
  Set background (transparent for apparel, white for mugs/posters)
  Generate -> AI Vectorize -> Export PNG/SVG

Etsy / Shopify listing
  Paste SEO copy from Research page
  Upload exported design
  Connect Printify for print fulfillment

---

## Sprint 4 Ideas (Next)

- **Listing Library** — save approved niches + SEO copy, mark as "live on Etsy"
- **Competitor checker** — paste Etsy URL, get review count + estimated monthly sales
- **Trend history** — chart niche score over time, catch rising niches early
- **Bulk SEO** — generate SEO for all high-score niches at once (batch Groq)
- **Printify integration** — auto-create product draft after design is approved
