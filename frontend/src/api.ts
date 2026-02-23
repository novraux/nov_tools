const BASE = 'http://localhost:8001'

export interface Niche {
  id: number
  keyword: string
  source: string
  score: number
  pod_viability: number
  competition: 'low' | 'medium' | 'high'
  ip_safe: boolean
  velocity: 'rising' | 'stable' | 'declining'
  avg_interest: number
  reasoning: string
  product_ideas: string[]
  scraped_at: string | null
}

export interface NicheResearch {
  id: number
  niche_id: number
  worth_it: boolean
  target_audience: string
  competitor_insights: string
  design_angles: string[]
  created_at: string
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(BASE + path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const err = await res.text().catch(() => `HTTP ${res.status}`)
    throw new Error(err)
  }
  return res.json()
}

export const api = {
  listNiches: () =>
    request<{ success: boolean; count: number; niches: Niche[] }>('/discover'),

  runScrape: () =>
    request<{ success: boolean; saved: number; updated: number; skipped: number; total: number }>(
      '/discover/scrape',
      { method: 'POST' }
    ),

  archiveNiche: (id: number) =>
    request<{ success: boolean }>(`/discover/${id}`, { method: 'DELETE' }),

  getResearch: (nicheId: number) =>
    request<{ success: boolean; research: NicheResearch | null }>(`/research/${nicheId}`),

  runResearch: (nicheId: number) =>
    request<{ success: boolean; research: NicheResearch }>(`/research/${nicheId}`, { method: 'POST' }),
}
