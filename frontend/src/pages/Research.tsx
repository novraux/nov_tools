import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { api, NicheResearch, SeoResult, CompetitorResult, ListingEstimate, FlowItem } from '../api'

// ─── Competitor Quick-Check Panel ──────────────────────────────────────────────

// sessionStorage helpers (avoids re-calling Groq when navigating away + back)
function ssGet<T>(key: string): T | null {
  try { const v = sessionStorage.getItem(key); return v ? JSON.parse(v) : null } catch { return null }
}
function ssSet(key: string, val: unknown) {
  try { sessionStorage.setItem(key, JSON.stringify(val)) } catch { /* quota, ignore */ }
}
const GO_CONFIG = {
  go: { label: '✅ Go For It', color: 'text-emerald-400', bg: 'bg-emerald-950/20 border-emerald-900/40' },
  proceed_with_caution: { label: '⚠️ Proceed with Caution', color: 'text-amber-400', bg: 'bg-amber-950/20 border-amber-900/40' },
  no_go: { label: '❌ No-Go', color: 'text-red-400', bg: 'bg-red-950/20 border-red-900/40' },
}

const SAT_COLOR: Record<string, string> = {
  low: 'text-emerald-400',
  medium: 'text-amber-400',
  high: 'text-red-400',
  very_high: 'text-red-500',
}

function CompetitorPanel({ keyword }: { keyword: string }) {
  const cacheKey = `competitor_${keyword}`
  const [result, setResult] = useState<CompetitorResult | null>(() => ssGet(cacheKey))
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(!!ssGet(cacheKey))
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  const run = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.checkCompetitor(keyword)
      setResult(data.competitor)
      ssSet(cacheKey, data.competitor)
      setOpen(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Check failed')
    } finally {
      setLoading(false)
    }
  }

  const cfg = result ? GO_CONFIG[result.go_no_go] : null

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">⚡</span>
          <div>
            <h3 className="text-zinc-100 font-medium tracking-tight">Competitor Quick-Check</h3>
            <p className="text-zinc-600 text-xs">Saturation · buyer queries · winning angle · price range</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {result && (
            <button
              onClick={() => setOpen(o => !o)}
              className="text-xs text-zinc-500 hover:text-zinc-300 px-2 py-1 rounded border border-zinc-800 hover:border-zinc-700 transition-colors"
            >
              {open ? 'Collapse' : 'Expand'}
            </button>
          )}
          <button
            onClick={run}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            {loading ? (
              <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />Analyzing...</>
            ) : (
              <>{result ? '↻ Re-check' : '⚡ Quick Check'}</>
            )}
          </button>
        </div>
      </div>

      {error && <div className="mx-6 mb-4 px-3 py-2 bg-red-950/40 border border-red-900/60 text-red-400 text-xs rounded-lg">{error}</div>}

      {result && open && (
        <div className="border-t border-zinc-800 px-6 pb-6 pt-4 space-y-5">
          {/* Go / No-Go */}
          <div className={`flex items-center justify-between px-5 py-3 rounded-xl border ${cfg!.bg}`}>
            <div>
              <p className={`text-lg font-bold ${cfg!.color}`}>{cfg!.label}</p>
              <p className="text-zinc-500 text-xs mt-0.5">{result.reasoning}</p>
            </div>
            <div className="text-right shrink-0 ml-4">
              <div className={`text-3xl font-bold tabular-nums ${SAT_COLOR[result.saturation_level]}`}>
                {result.saturation_score}<span className="text-zinc-600 text-sm">/10</span>
              </div>
              <div className={`text-[10px] font-semibold uppercase ${SAT_COLOR[result.saturation_level]}`}>
                {result.saturation_level.replace('_', ' ')} saturation
              </div>
            </div>
          </div>

          {/* Top buyer queries */}
          <div>
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Top Buyer Search Queries</p>
            <div className="space-y-1.5">
              {result.top_buyer_queries.map((q, i) => (
                <div key={i} className="flex items-center gap-2 group">
                  <span className="text-zinc-700 text-xs tabular-nums w-4 shrink-0">{i + 1}.</span>
                  <span className="text-sm text-zinc-300 flex-1">{q}</span>
                  <button
                    onClick={() => navigate(`/research?niche=${encodeURIComponent(q)}`)}
                    className="text-[10px] text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  >
                    Research →
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Winning angle + meta */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
              <p className="text-[11px] text-zinc-600 uppercase tracking-wider font-semibold mb-1">Winning Angle</p>
              <p className="text-sm text-emerald-300 leading-snug">{result.winning_angle}</p>
            </div>
            <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
              <p className="text-[11px] text-zinc-600 uppercase tracking-wider font-semibold mb-1">Avg. Price Range</p>
              <p className="text-2xl font-bold text-zinc-200">{result.avg_price_range}</p>
              <div className="flex gap-1 mt-2 flex-wrap">
                {result.best_products.map((p, i) => (
                  <span key={i} className="text-[10px] px-1.5 py-0.5 bg-zinc-800 text-zinc-500 rounded">{p}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Kittl Flows Panel ─────────────────────────────────────────────────────────
const FOCUS_COLOR: Record<string, string> = {
  text: 'text-amber-400  border-amber-800/50  bg-amber-950/10',
  illustration: 'text-indigo-400 border-indigo-800/50 bg-indigo-950/10',
  mixed: 'text-violet-400 border-violet-800/50 bg-violet-950/10',
}

type FlowCache = { base_prompt: string; flows: FlowItem[] }

function KittlFlowsPanel({ niche, angle, product }: { niche: string; angle: string; product: string }) {
  const cacheKey = `flows_${niche}_${angle}_${product}`
  const cached = ssGet<FlowCache>(cacheKey)
  const [basePrompt, setBasePrompt] = useState(cached?.base_prompt ?? '')
  const [flows, setFlows] = useState<FlowItem[]>(cached?.flows ?? [])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const ranOnce = useRef(!!cached)

  const run = (force = false) => {
    if (force) {
      try { sessionStorage.removeItem(cacheKey) } catch { /* ignore */ }
    }
    setLoading(true)
    setError(null)
    api.generateFlows(niche, angle, product)
      .then(d => {
        setBasePrompt(d.base_prompt)
        setFlows(d.flows)
        ssSet(cacheKey, { base_prompt: d.base_prompt, flows: d.flows })
      })
      .catch(e => setError(e instanceof Error ? e.message : 'Generation failed'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (ranOnce.current) return
    ranOnce.current = true
    run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [niche, angle, product, cacheKey])

  if (loading) return (
    <div className="flex items-center gap-2 text-xs text-zinc-500 py-3 px-1">
      <span className="w-3 h-3 border-2 border-zinc-600 border-t-indigo-400 rounded-full animate-spin" />
      Generating base concept + audience variants for <span className="text-zinc-300 font-medium">{product}</span>...
    </div>
  )
  if (error) return <p className="text-xs text-red-400 py-2">{error}</p>
  if (!flows.length) return null

  return (
    <div className="space-y-3 pt-1">
      {/* How Kittl Flows works */}
      <div className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-[10px] text-zinc-500 leading-relaxed">
        <span className="text-zinc-400 font-semibold">How to use:</span>{' '}
        Paste the <span className="text-indigo-300">base prompt</span> into your first Kittl AI Image board to generate the master design.
        Then add connected AI Image boards for each variant — paste the <span className="text-emerald-300">short variant prompt</span> into each.
        Kittl sees the parent design visually, so variants stay consistent.
      </div>

      {/* Step 1 — Base prompt */}
      {basePrompt && (
        <div className="bg-indigo-950/20 border border-indigo-800/40 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-indigo-400 bg-indigo-950/60 border border-indigo-800/50 px-1.5 py-0.5 rounded">STEP 1</span>
              <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">Base Design Prompt</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => run(true)}
                title="Clear cache and regenerate fresh prompts"
                className="text-[10px] px-2 py-1 rounded border border-zinc-700 text-zinc-500 hover:text-zinc-300 hover:border-zinc-500 transition-colors"
              >
                ↻ Regenerate
              </button>
              <CopyBtn text={basePrompt} label="Copy" />
            </div>
          </div>
          <p className="text-sm text-zinc-300 leading-relaxed">{basePrompt}</p>
          <p className="text-[10px] text-indigo-400/60 mt-2">
            Paste into Kittl AI → generates your master artboard → use AI Background Remover after
          </p>
        </div>
      )}

      {/* Step 2 — Audience variants */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 px-1.5 py-0.5 rounded">STEP 2</span>
        <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">
          {flows.length} audience variants — connect to base, paste prompt, Kittl keeps the same design
        </p>
      </div>
      <div className="grid grid-cols-1 gap-2">
        {flows.map((f, i) => {
          const focusCls = FOCUS_COLOR[f.focus] ?? FOCUS_COLOR.mixed
          return (
            <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm leading-none">{f.emoji}</span>
                  <span className="text-xs font-semibold text-zinc-300">{f.audience}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border uppercase tracking-wide ${focusCls}`}>
                    {f.kittl_model}
                  </span>
                  <CopyBtn text={f.prompt} label="Copy" />
                </div>
              </div>
              {/* Slogan highlight */}
              {f.slogan && (
                <p className="text-xs text-emerald-300 font-medium mb-1">"{f.slogan}"
                  {f.caption && <span className="text-zinc-500 font-normal"> · {f.caption}</span>}
                </p>
              )}
              {/* Short variant prompt */}
              <p className="text-[11px] text-zinc-500 leading-relaxed italic">{f.prompt}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Angle Card ───────────────────────────────────────────────────────────────
const PRODUCTS = ['t-shirt', 'mug', 'tote bag', 'hoodie', 'sweatshirt', 'poster']

function AngleCard({ index, angle, niche }: { index: number; angle: string; niche: string }) {
  const navigate = useNavigate()
  const [showFlows, setShowFlows] = useState(false)
  const [product, setProduct] = useState('t-shirt')
  // Track the product that was last used to trigger flows (so changing product re-generates)
  const [activeProduct, setActiveProduct] = useState('t-shirt')

  const toggleFlows = () => {
    if (!showFlows) {
      setActiveProduct(product)
      setShowFlows(true)
    } else {
      setShowFlows(false)
    }
  }

  return (
    <div className="bg-zinc-950 rounded-xl border border-zinc-800/70 hover:border-zinc-700 transition-colors overflow-hidden">
      <div className="flex items-start gap-3 p-4">
        {/* Index badge */}
        <span className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-indigo-950/60 border border-indigo-800/40 text-indigo-400 text-xs font-bold mt-0.5">
          {index + 1}
        </span>

        {/* Angle text */}
        <p className="text-sm text-zinc-300 leading-relaxed flex-1">{angle}</p>

        {/* Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => navigate(`/design?niche=${encodeURIComponent(niche)}&angle=${encodeURIComponent(angle)}`)}
            title="Auto-generate 5 Kittl prompts in Prompt Studio"
            className="flex items-center gap-1 px-2.5 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-600/30 text-indigo-300 text-[11px] font-semibold rounded-lg transition-colors"
          >
            ✦ Prompts
            <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </button>
          <button
            onClick={toggleFlows}
            title="Audience-targeted Kittl Flows"
            className={`flex items-center gap-1 px-2.5 py-1.5 border text-[11px] font-semibold rounded-lg transition-colors ${showFlows
              ? 'bg-emerald-600/20 border-emerald-600/30 text-emerald-300'
              : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600'
              }`}
          >
            🔄 Flows
          </button>
        </div>
      </div>

      {/* Product selector + Flows panel */}
      {showFlows && (
        <div className="border-t border-zinc-800 px-4 pb-4 pt-3">
          {/* Product type selector */}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] text-zinc-600 uppercase tracking-wider font-semibold shrink-0">Product:</span>
            <div className="flex flex-wrap gap-1">
              {PRODUCTS.map(p => (
                <button
                  key={p}
                  onClick={() => setProduct(p)}
                  className={`text-[10px] px-2 py-0.5 rounded border capitalize transition-colors ${product === p
                    ? 'bg-indigo-600/20 border-indigo-600/40 text-indigo-300'
                    : 'bg-zinc-900 border-zinc-700 text-zinc-500 hover:text-zinc-300 hover:border-zinc-600'
                    }`}
                >
                  {p}
                </button>
              ))}
            </div>
            {product !== activeProduct && (
              <button
                onClick={() => setActiveProduct(product)}
                className="text-[10px] px-2 py-0.5 bg-emerald-700/30 border border-emerald-700/40 text-emerald-400 rounded transition-colors hover:bg-emerald-700/50"
              >
                ↻ Regenerate
              </button>
            )}
          </div>

          {/* Flows panel — re-mounts when activeProduct changes because key changes */}
          <KittlFlowsPanel key={`${niche}_${angle}_${activeProduct}`} niche={niche} angle={angle} product={activeProduct} />
        </div>
      )}
    </div>
  )
}

// ─── Outcome Tracker ────────────────────────────────────────────────
const OUTCOMES = [
  { value: 'testing', label: '🧪 Testing', desc: 'Listed, tracking results', bg: 'border-blue-700/50 bg-blue-950/20 text-blue-300' },
  { value: 'sold', label: '💰 Sold!', desc: 'Generated sales', bg: 'border-emerald-700/50 bg-emerald-950/20 text-emerald-300' },
  { value: 'flopped', label: '💔 Flopped', desc: 'No traction, archived', bg: 'border-red-700/50 bg-red-950/20 text-red-300' },
  { value: 'not_listed', label: '⏸️ Not Listed', desc: 'Skipped or on hold', bg: 'border-zinc-700/50 bg-zinc-800/20 text-zinc-400' },
]

function OutcomeTracker({ nicheId, current }: { nicheId: number; current: string | null }) {
  const [selected, setSelected] = useState<string | null>(current)
  const [saving, setSaving] = useState(false)

  const choose = async (value: string) => {
    if (saving) return
    setSaving(true)
    try {
      await api.updateOutcome(nicheId, value)
      setSelected(value)
    } catch { /* ignore */ } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">📊</span>
        <div>
          <h3 className="text-zinc-100 font-medium tracking-tight text-sm">Niche Outcome Tracker</h3>
          <p className="text-zinc-600 text-xs">Did this niche work for you? Track your results.</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {OUTCOMES.map(o => (
          <button
            key={o.value}
            onClick={() => choose(o.value)}
            disabled={saving}
            className={`text-left px-4 py-3 rounded-lg border transition-all ${selected === o.value
              ? o.bg + ' ring-1 ring-offset-1 ring-offset-zinc-900 ring-indigo-500'
              : 'border-zinc-800 bg-zinc-950 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300'
              }`}
          >
            <div className="text-sm font-medium">{o.label}</div>
            <div className="text-[10px] mt-0.5 opacity-70">{o.desc}</div>
          </button>
        ))}
      </div>
      {selected && (
        <p className="text-xs text-zinc-600 mt-3 text-center">
          Marked as <span className="text-zinc-400 font-medium">{OUTCOMES.find(o => o.value === selected)?.label}</span> · saved automatically
        </p>
      )}
    </div>
  )
}

// ─── Listing Estimator Panel ───────────────────────────────────────────────
const VERDICT_CONFIG = {
  easy_entry: { label: '✅ Easy Entry', color: 'text-emerald-400', bg: 'bg-emerald-950/20 border-emerald-900/40' },
  moderate_competition: { label: '⚠️ Moderate Competition', color: 'text-amber-400', bg: 'bg-amber-950/20 border-amber-900/40' },
  tough_market: { label: '🚨 Tough Market', color: 'text-red-400', bg: 'bg-red-950/20 border-red-900/40' },
  avoid: { label: '🚫 Avoid', color: 'text-red-500', bg: 'bg-red-950/30 border-red-900/50' },
}

const TIER_BADGE: Record<string, string> = {
  low: 'text-zinc-500 border-zinc-700',
  medium: 'text-amber-400 border-amber-800',
  high: 'text-indigo-400 border-indigo-800',
  top_seller: 'text-emerald-400 border-emerald-800',
}

function ListingEstimatorPanel() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ListingEstimate | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  const run = async () => {
    if (!url.trim()) return
    setLoading(true)
    setError(null)
    try {
      const data = await api.estimateListing(url.trim())
      setResult(data.estimate)
      setOpen(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Estimation failed')
    } finally {
      setLoading(false)
    }
  }

  const cfg = result ? VERDICT_CONFIG[result.competition_verdict] : null
  const tierCls = result ? (TIER_BADGE[result.sales_tier] ?? TIER_BADGE.medium) : ''

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">🔗</span>
          <div>
            <h3 className="text-zinc-100 font-medium tracking-tight">Listing URL Estimator</h3>
            <p className="text-zinc-600 text-xs">Paste a competitor’s Etsy URL → Groq estimates sales tier, price, and whether to enter</p>
          </div>
        </div>
        {result && (
          <button onClick={() => setOpen(o => !o)} className="text-xs text-zinc-500 hover:text-zinc-300 px-2 py-1 rounded border border-zinc-800 hover:border-zinc-700 transition-colors">
            {open ? 'Collapse' : 'Expand'}
          </button>
        )}
      </div>

      <div className="px-6 pb-4 flex gap-2">
        <input
          type="url"
          value={url}
          onChange={e => setUrl(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && run()}
          placeholder="https://www.etsy.com/listing/123456789/funny-nurse-mug-coffee-cup..."
          className="flex-1 bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-2 text-sm text-zinc-200 placeholder-zinc-700 focus:outline-none focus:border-indigo-600/60 transition-colors"
        />
        <button
          onClick={run}
          disabled={loading || !url.trim()}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-700 hover:bg-zinc-600 disabled:opacity-40 text-white text-xs font-semibold rounded-lg transition-colors shrink-0"
        >
          {loading ? <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : '❤'}
          {loading ? 'Analyzing...' : 'Estimate'}
        </button>
      </div>

      {error && <div className="mx-6 mb-4 px-3 py-2 bg-red-950/40 border border-red-900/60 text-red-400 text-xs rounded-lg">{error}</div>}

      {result && open && (
        <div className="border-t border-zinc-800 px-6 pb-6 pt-4 space-y-4">
          {/* Listing title */}
          <div>
            <p className="text-xs text-zinc-600 uppercase tracking-wider font-semibold mb-1">Detected Listing</p>
            <p className="text-zinc-200 text-sm font-medium capitalize">{result.listing_title}</p>
            <p className="text-zinc-600 text-xs mt-0.5">Niche: <span className="text-zinc-400">{result.niche}</span></p>
          </div>

          {/* Verdict */}
          <div className={`flex items-center justify-between px-5 py-3 rounded-xl border ${cfg!.bg}`}>
            <div>
              <p className={`text-lg font-bold ${cfg!.color}`}>{cfg!.label}</p>
              <p className="text-zinc-500 text-xs mt-0.5">{result.reasoning}</p>
            </div>
            <div className="text-right shrink-0 ml-4">
              <div className={`text-xs font-semibold px-2 py-1 rounded border ${tierCls}`}>
                {result.sales_tier.replace('_', ' ')} sales
              </div>
              <div className="text-zinc-500 text-[10px] mt-1">{result.estimated_monthly_sales}</div>
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Price Range', value: result.price_positioning },
              { label: 'Review Velocity', value: result.review_velocity },
              { label: 'Sales Tier', value: result.sales_tier.replace('_', ' ') },
            ].map(s => (
              <div key={s.label} className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5">
                <p className="text-[10px] text-zinc-600 uppercase tracking-wider font-semibold mb-0.5">{s.label}</p>
                <p className="text-sm text-zinc-300 capitalize">{s.value}</p>
              </div>
            ))}
          </div>

          {/* Suggested angle */}
          <div className="bg-zinc-950 border border-emerald-900/30 rounded-lg px-4 py-3">
            <p className="text-[11px] text-zinc-600 uppercase tracking-wider font-semibold mb-1">🎯 Suggested Winning Angle</p>
            <p className="text-sm text-emerald-300 leading-snug">{result.suggested_angle}</p>
            <button
              onClick={() => navigate(`/research?niche=${encodeURIComponent(result.suggested_angle)}`)}
              className="mt-2 text-[10px] text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Research this angle →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Mini copy button ────────────────────────────────────────────────────────
function CopyBtn({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }
  return (
    <button
      onClick={copy}
      className={`text-[11px] font-medium px-2 py-1 rounded border transition-colors shrink-0 ${copied
        ? 'text-emerald-400 border-emerald-900/60 bg-emerald-950/30'
        : 'text-zinc-500 border-zinc-700 hover:text-zinc-300 hover:border-zinc-600'
        }`}
    >
      {copied ? '✓ Copied' : label}
    </button>
  )
}

// ─── SEO Panel ───────────────────────────────────────────────────────────────
function SeoPanel({
  keyword, products, designAngles,
}: {
  keyword: string
  products: string[]
  designAngles: string[]
}) {
  const cacheKey = `seo_${keyword}`
  const [seo, setSeo] = useState<SeoResult | null>(() => ssGet(cacheKey))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState(!!ssGet(cacheKey))

  const generate = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.generateSeo({ keyword, products, design_angles: designAngles })
      setSeo(data.seo)
      ssSet(cacheKey, data.seo)
      setOpen(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'SEO generation failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-sm">
      {/* Header row */}
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">🏷️</span>
          <div>
            <h3 className="text-zinc-100 font-medium tracking-tight">Full Listing Copy</h3>
            <p className="text-zinc-600 text-xs">Etsy · Shopify · Pinterest · Printify — ready to paste</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {seo && (
            <button
              onClick={() => setOpen(o => !o)}
              className="text-xs text-zinc-500 hover:text-zinc-300 px-2 py-1 rounded border border-zinc-800 hover:border-zinc-700 transition-colors"
            >
              {open ? 'Collapse' : 'Expand'}
            </button>
          )}
          <button
            onClick={generate}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            {loading ? (
              <>
                <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Generating...
              </>
            ) : (
              <>{seo ? '↻ Regenerate SEO' : '✦ Generate SEO Copy'}</>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="mx-6 mb-4 px-3 py-2 bg-red-950/40 border border-red-900/60 text-red-400 text-xs rounded-lg">
          {error}
        </div>
      )}

      {seo && open && (
        <div className="px-6 pb-6 space-y-4 border-t border-zinc-800 pt-4">
          {/* Primary keyword */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider w-28 shrink-0">Primary KW</span>
            <span className="text-sm text-indigo-300 font-medium flex-1">{seo.primary_keyword}</span>
          </div>

          {/* Etsy title */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Etsy Title</span>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] ${seo.etsy_title.length > 130 ? 'text-amber-400' : 'text-zinc-600'}`}>
                  {seo.etsy_title.length}/140
                </span>
                <CopyBtn text={seo.etsy_title} />
              </div>
            </div>
            <p className="text-sm text-zinc-300 bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 leading-relaxed">
              {seo.etsy_title}
            </p>
          </div>

          {/* Etsy tags */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Etsy Tags <span className="normal-case font-normal text-zinc-600">({seo.etsy_tags.length}/13)</span>
              </span>
              <CopyBtn text={seo.etsy_tags.join(', ')} label="Copy all tags" />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {seo.etsy_tags.map((tag, i) => (
                <button
                  key={i}
                  onClick={() => navigator.clipboard.writeText(tag)}
                  title={`${tag.length}/20 chars — click to copy`}
                  className="text-xs px-2.5 py-1 bg-zinc-950 border border-zinc-700 hover:border-indigo-600/50 text-zinc-400 hover:text-zinc-200 rounded-full transition-colors"
                >
                  {tag}
                  <span className="text-zinc-700 ml-1">{tag.length}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Etsy description */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Etsy Description (hook)</span>
              <CopyBtn text={seo.etsy_description} />
            </div>
            <p className="text-sm text-zinc-300 bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 leading-relaxed">
              {seo.etsy_description}
            </p>
          </div>

          {/* Shopify meta */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Shopify Meta Description</span>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] ${seo.shopify_meta.length > 145 ? 'text-amber-400' : 'text-zinc-600'}`}>
                  {seo.shopify_meta.length}/155
                </span>
                <CopyBtn text={seo.shopify_meta} />
              </div>
            </div>
            <p className="text-sm text-zinc-400 bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 leading-relaxed italic">
              {seo.shopify_meta}
            </p>
          </div>

          {/* Pinterest description */}
          {seo.pinterest_description && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">📌 Pinterest Pin</span>
                <CopyBtn text={seo.pinterest_description} />
              </div>
              <p className="text-sm text-pink-300/80 bg-zinc-950 border border-pink-900/20 rounded-lg px-4 py-3 leading-relaxed italic">
                {seo.pinterest_description}
              </p>
            </div>
          )}

          {/* Printify description */}
          {seo.printify_description && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">🖨️ Printify Product Description</span>
                <CopyBtn text={seo.printify_description} />
              </div>
              <p className="text-sm text-zinc-300 bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 leading-relaxed">
                {seo.printify_description}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Main Research page ───────────────────────────────────────────────────────
export function Research() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const nicheKeyword = searchParams.get('niche') || ''
  const nicheIdStr = searchParams.get('id')
  const nicheId = nicheIdStr ? parseInt(nicheIdStr, 10) : null

  const [research, setResearch] = useState<NicheResearch | null>(null)
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Only load from DB when we have a niche ID (coming from Discover)
  const loadResearch = useCallback(async () => {
    if (!nicheId) {
      setLoading(false)
      return
    }
    try {
      const data = await api.getResearch(nicheId)
      setResearch(data.research)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load research')
    } finally {
      setLoading(false)
    }
  }, [nicheId])

  useEffect(() => {
    loadResearch()
  }, [loadResearch])

  const runAnalysis = async () => {
    setAnalyzing(true)
    setError(null)
    try {
      let data: { success: boolean; research: NicheResearch }
      if (nicheId) {
        data = await api.runResearch(nicheId)
      } else {
        data = await api.runResearchByKeyword(nicheKeyword)
      }
      setResearch(data.research)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Analysis failed')
    } finally {
      setAnalyzing(false)
    }
  }

  if (!nicheKeyword) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center">
        <p className="text-zinc-500 mb-4">No niche selected for research.</p>
        <button onClick={() => navigate('/')} className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded hover:bg-zinc-700 transition">
          Back to Discover
        </button>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-semibold text-zinc-100 tracking-tight">Niche Research</h1>
            <span className="text-xs text-indigo-400 bg-indigo-950/50 border border-indigo-900/50 px-2 py-0.5 rounded-full">
              {nicheId ? 'Groq Analysis' : 'Event Radar'}
            </span>
          </div>
          <p className="text-zinc-500 text-sm">Deep AI analysis — competition, demand, design angles + Etsy SEO copy</p>
        </div>
        <button onClick={() => navigate(-1)} className="text-sm text-zinc-400 hover:text-zinc-300">
          ← Back
        </button>
      </div>

      {/* Niche header + run button */}
      <div className="mb-6 px-5 py-4 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🎯</span>
          <div>
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Target Niche</span>
            <h2 className="text-lg font-medium text-zinc-200 capitalize">{nicheKeyword}</h2>
          </div>
        </div>

        {/* Run / Re-analyze button — always show if we have a keyword */}
        <div className="flex items-center gap-2">
          {research && (
            <span className="text-xs text-zinc-600">Last run: {research.created_at ? new Date(research.created_at).toLocaleDateString() : 'just now'}</span>
          )}
          <button
            onClick={runAnalysis}
            disabled={analyzing}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
          >
            {analyzing ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Analyzing (Groq)...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09l2.846.813-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                </svg>
                {research ? '↻ Re-analyze' : 'Run Deep Analysis'}
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 px-4 py-3 bg-red-950/40 border border-red-900/60 text-red-400 text-sm rounded-lg flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-600 hover:text-red-400 ml-4">✕</button>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-48 border border-dashed border-zinc-800 rounded-xl">
          <div className="w-5 h-5 border-2 border-zinc-700 border-t-zinc-400 rounded-full animate-spin" />
        </div>
      ) : research ? (
        <div className="space-y-6">
          {/* Verdict */}
          <div className={`p-6 rounded-xl border flex flex-col items-center justify-center text-center ${research.worth_it
            ? 'bg-emerald-950/20 border-emerald-900/40 shadow-[0_0_30px_-5px_var(--tw-shadow-color)] shadow-emerald-500/10'
            : 'bg-red-950/20 border-red-900/40 shadow-[0_0_30px_-5px_var(--tw-shadow-color)] shadow-red-500/10'
            }`}>
            <span className={`text-sm font-semibold tracking-wide uppercase mb-1 ${research.worth_it ? 'text-emerald-500' : 'text-red-500'}`}>
              AI Verdict
            </span>
            <h3 className={`text-4xl font-bold ${research.worth_it ? 'text-emerald-400' : 'text-red-400'}`}>
              {research.worth_it ? 'Worth It ✅' : 'Skip It ❌'}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">👥</span>
                <h3 className="text-zinc-200 font-medium tracking-tight">Target Audience</h3>
              </div>
              <p className="text-zinc-400 text-sm leading-relaxed">{research.target_audience}</p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">⚔️</span>
                <h3 className="text-zinc-200 font-medium tracking-tight">Competitor Insights</h3>
              </div>
              <p className="text-zinc-400 text-sm leading-relaxed">{research.competitor_insights}</p>
            </div>
          </div>

          {/* Design Angles */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">🎨</span>
              <div>
                <h3 className="text-zinc-100 font-medium tracking-tight">Creative Design Angles</h3>
                <p className="text-zinc-600 text-xs mt-0.5">Click <span className="text-indigo-400">✦ Prompts</span> to auto-generate Kittl prompts · <span className="text-emerald-400">🔄 Flows</span> for 10 seasonal variants</p>
              </div>
            </div>

            {research.design_angles.length > 0 ? (
              <div className="mt-4 space-y-3">
                {research.design_angles.map((angle, i) => (
                  <AngleCard key={i} index={i} angle={angle} niche={nicheKeyword} />
                ))}
              </div>
            ) : (
              <p className="text-zinc-500 text-sm mt-4">No design angles generated.</p>
            )}
          </div>

          {/* Competitor Quick-Check — shown after research is done */}
          <CompetitorPanel keyword={nicheKeyword} />

          {/* Listing URL Estimator */}
          <ListingEstimatorPanel />

          {/* Outcome Tracker */}
          {nicheId && <OutcomeTracker nicheId={nicheId} current={research?.outcome ?? null} />}

          {/* SEO Panel — only shown after research is done */}
          <SeoPanel
            keyword={nicheKeyword}
            products={[]}
            designAngles={research.design_angles}
          />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-48 border border-dashed border-zinc-800 rounded-xl gap-2">
          <div className="text-3xl opacity-30">🔬</div>
          <p className="text-zinc-400 text-sm">Ready for Deep Analysis.</p>
          <p className="text-zinc-600 text-xs">
            Click <span className="text-zinc-400">Run Deep Analysis</span> to let Groq evaluate <b className="font-semibold text-zinc-400">{nicheKeyword}</b> for POD potential.
          </p>
        </div>
      )}
    </div>
  )
}
