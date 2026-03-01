# Novraux v2 — Roadmap & Feature Tracker

> Last updated: 2026-03-01
> Status legend: `✅ Done` · `🔨 In Progress` · `📋 Planned` · `💡 Idea`

---

## ✅ Completed (Sprints 1–3.6)

| Feature | Page | Notes |
|---------|------|-------|
| Google Trends scraper + Groq POD scoring | Discover | llama-3.1-8b-instant |
| Niche ranked list with velocity + competition | Discover | archive / research actions |
| 55+ calendar events with POD potential | Event Radar | lead times, prep status |
| Deep niche analysis (worth it / skip verdict) | Research | **migrated to Groq llama-3.3-70b** (was Claude) |
| Target audience + competitor insights + design angles | Research | 5 angles returned |
| Etsy title + 13 tags + description + Shopify meta | Research | Groq, free |
| Kittl-ready prompts with model + bg recommendations | Prompt Studio | style picker, 5 prompts |
| **Reference Image Style Extractor** | Prompt Studio | drag-and-drop → Groq LLaVA vision → style tags, palette, keywords, replication prompt |
| **Competitor Quick-Check** | Research | saturation score, Go/No-Go, top 5 buyer queries, winning angle, price range |

---

## ✅ Sprint 4 Complete

| Feature | Page | Notes |
|---------|------|-------|
| **Sub-niche Driller** | Discover | "Drill Down" → 8-10 sub-niches, pre-scored, expandable panel |
| **Listing Volume Tracker** | Discover | progress bar, +Listed, 🔥 streak, localStorage |
| **Reference Image Style Extractor** | Prompt Studio | drag-and-drop → Groq LLaVA → style tags, palette, keywords, replication prompt |
| **Competitor Quick-Check** | Research | saturation score, Go/No-Go, top 5 buyer queries, winning angle, price range |

---

## ✅ Sprint 5 Complete

| Feature | Page | Notes |
|---------|------|-------|
| **Niche Outcome Tracker** | Research | 🧪/💰/💔/⏸️ buttons → PATCH DB → feedback loop foundation |
| **Pinterest + Printify copy** | Research (SEO) | Same Groq call, 2 new fields — completes publish workflow |
| **Listing URL Estimator** | Research | Paste Etsy URL → Groq estimates tier, price, enter/avoid verdict |
| **Discover filter bar** | Discover | Score 7+ / Rising / Low comp. toggles, X/total count |
| **Research re-analyze button** | Research | Always-visible, shows last-run date |

---

## ✅ Sprint 5.5 Complete — Research UX + Kittl Flows

| Feature | Page | Notes |
|---------|------|-------|
| **Kittl Flows Generator** | Research | Base prompt + 10 audience-variant prompts (nurse, teacher, mom, athlete...). Product selector (tee/mug/tote/hoodie/poster). Copy button per prompt. |
| **Design Angles Redesign** | Research | Each angle = card with `✦ Prompts →` (auto-gen on Design page) + `🔄 Flows` toggle |
| **Session Caching** | Research | SEO, Competitor, Kittl Flows results cached in sessionStorage — survive page navigation |

---

## Sprint 6 — 🔥 Next Priorities (Validated by Strategy Analysis)

### 1. Personalized Event Radar `📋 Planned`
> Filter events by shop's researched niche profile — nurse shop sees Nurses Week first
- **Where:** `Holidays.tsx` — pure frontend, read researched niche keywords from API
- **Logic:** score each event's `topNiches` against user's niche history — sort by relevance
- **Cost:** Zero. No backend change.

### 2. Trend Decay Estimator `📋 Planned`
> "This niche peaked 6 weeks ago" vs "still climbing" — stop chasing dead trends
- **Where:** Discover page — add trend line data to NicheCard
- **Requires:** `niche_history` table (logs `avg_interest` over time, one row per scrape)
- **Effort:** Medium — needs DB schema addition

### 3. Cannibalization Checker `📋 Planned`
> Before drilling into a sub-niche, flag if it overlaps with already-researched niches
- **Requires:** outcome tracking in place (Sprint 5 ✅) + keyword similarity via Groq

### 4. Shop Audit Mode `💡 Long-term`
> Paste your Etsy shop URL → Novraux audits for niche gaps, over-concentration, weak SEO
- Shifts Novraux from "research tool" to "shop strategist"
- Highest differentiation vs SalesSamurai — build after Sprint 6

---

## ~~Deprioritized~~

| Feature | Why skipped |
|---------|------------|
| ~~Price Benchmarker~~ | Thin without live Etsy data |
| ~~Mock-up style suggester~~ | Thin without live data — not a real pain point |
| ~~Batch Sub-niche Generator~~ | Superseded by Drill Down + Outcome Tracker combo |

---

## 💡 SalesSamurai Comparison

| SalesSamurai | Novraux | Status |
|---|---|---|
| Real-time Etsy search volume | Groq estimated demand score | In scorer.py |
| Long-tail keyword generator | Sub-niche Driller | ✅ Done |
| Competition Tracker | Competitor Quick-Check | ✅ Done |
| Listing URL → metrics | Listing URL Estimator | ✅ Done |
| Tag analysis from top listings | 13-tag SEO copy | ✅ Done |
| Multi-platform copy | Etsy+Shopify+Pinterest+Printify | ✅ Done |
| Feedback loops | Outcome Tracker | ✅ Done |
| Shop-level audit | Shop Audit Mode | 💡 Sprint 7 |
| Batch listing variants | Kittl Flows (base + 10 audience variants) | ✅ Done |

> **Our edge:** AI-first creative pipeline (idea → drill → design → Kittl prompts → SEO). SalesSamurai is data-first. We're differentiated.

---

## Safety Note

**No Etsy scraping — ever.** All data is Groq AI estimation + Google Trends public API only.
Etsy API requires approved OAuth — revisit when we have real users who need precision data.
