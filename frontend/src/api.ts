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

export interface Design {
  id: number
  niche_keyword: string
  prompt: string
  provider: string
  size: string
  image_b64: string | null   // null when stored in R2
  image_url: string | null   // R2 public URL (preferred)
  created_at: string
}

export interface NicheResearch {
  id: number | null
  niche_id: number | null
  worth_it: boolean
  target_audience: string
  competitor_insights: string
  design_angles: string[]
  outcome: 'testing' | 'sold' | 'flopped' | 'not_listed' | null
  outcome_notes: string | null
  created_at: string | null
}

export interface SeoResult {
  etsy_title: string
  etsy_tags: string[]
  etsy_description: string
  shopify_meta: string
  pinterest_description: string
  printify_description: string
  primary_keyword: string
}

export interface StyleAnalysis {
  style_tags: string[]
  color_palette: string[]
  mood: string
  design_type: string
  kittl_model: string
  keywords: string[]
  replication_prompt: string
}

export interface CompetitorResult {
  saturation_level: 'low' | 'medium' | 'high' | 'very_high'
  saturation_score: number
  go_no_go: 'go' | 'proceed_with_caution' | 'no_go'
  reasoning: string
  top_buyer_queries: string[]
  winning_angle: string
  avg_price_range: string
  best_products: string[]
}

export interface SubNiche {
  keyword: string
  score: number
  competition: 'low' | 'medium' | 'high'
  product_fit: string
  hook: string
}

export interface ListingEstimate {
  listing_title: string
  niche: string
  sales_tier: 'low' | 'medium' | 'high' | 'top_seller'
  estimated_monthly_sales: string
  price_positioning: string
  review_velocity: string
  competition_verdict: 'easy_entry' | 'moderate_competition' | 'tough_market' | 'avoid'
  enter_niche: boolean
  reasoning: string
  suggested_angle: string
}

export interface PromptResult {
  prompt: string
  style: string
  product: string
  focus: 'text' | 'illustration' | 'mixed'
  background: 'transparent' | 'white'
  kittl_model: string
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

  runScrape: (topic: string = 'standard') =>
    request<{ success: boolean; saved: number; updated: number; skipped: number; total: number }>(
      '/discover/scrape',
      {
        method: 'POST',
        body: JSON.stringify({ topic }),
      }
    ),

  archiveNiche: (id: number) =>
    request<{ success: boolean }>(`/discover/${id}`, { method: 'DELETE' }),

  drillNiche: (keyword: string) =>
    request<{ success: boolean; keyword: string; sub_niches: SubNiche[] }>('/discover/drill', {
      method: 'POST',
      body: JSON.stringify({ keyword }),
    }),

  getResearch: (nicheId: number) =>
    request<{ success: boolean; research: NicheResearch | null }>(`/research/${nicheId}`),

  runResearch: (nicheId: number) =>
    request<{ success: boolean; research: NicheResearch }>(`/research/${nicheId}`, { method: 'POST' }),

  runResearchByKeyword: (keyword: string) =>
    request<{ success: boolean; research: NicheResearch }>('/research/by-keyword', {
      method: 'POST',
      body: JSON.stringify({ keyword }),
    }),

  generateSeo: (body: { keyword: string; products?: string[]; design_angles?: string[] }) =>
    request<{ success: boolean; seo: SeoResult }>('/research/seo', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  generatePrompts: (body: { niche_keyword: string; angle?: string; style?: string }) =>
    request<{ success: boolean; prompts: PromptResult[] }>('/design/prompts', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  generateDesign: (body: { niche_keyword: string; prompt: string; provider?: string; size?: string }) =>
    request<{ success: boolean; design: Design }>('/design/generate', {
      method: 'POST',
      body: JSON.stringify(body),
    }),


  listDesigns: (niche?: string) =>
    request<{ success: boolean; count: number; designs: Design[] }>(
      niche ? `/design/list?niche=${encodeURIComponent(niche)}` : '/design/list'
    ),

  estimateListing: (url: string) =>
    request<{ success: boolean; estimate: ListingEstimate }>('/research/listing-estimate', {
      method: 'POST',
      body: JSON.stringify({ url }),
    }),

  updateOutcome: (nicheId: number, outcome: string, notes?: string) =>
    request<{ success: boolean; research: NicheResearch }>(`/research/${nicheId}/outcome`, {
      method: 'PATCH',
      body: JSON.stringify({ outcome, notes: notes ?? '' }),
    }),

  analyzeStyle: (body: { image_b64: string; mime_type?: string }) =>
    request<{ success: boolean; analysis: StyleAnalysis }>('/design/analyze-style', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  checkCompetitor: (keyword: string) =>
    request<{ success: boolean; competitor: CompetitorResult }>('/research/competitor-check', {
      method: 'POST',
      body: JSON.stringify({ keyword }),
    }),
}

