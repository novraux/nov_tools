import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { api, Niche, SubNiche } from '../api'

// ── Listing Tracker (localStorage) ────────────────────────────────────────────
type TrackerState = { date: string; count: number; streak: number }

function useListingTracker() {
  const today = new Date().toISOString().split('T')[0]

  const getState = () => {
    try {
      const raw = localStorage.getItem('novraux_tracker')
      if (!raw) return { date: today, count: 0, streak: 1 }
      const s = JSON.parse(raw)
      if (s.date !== today) {
        const prev = new Date(s.date)
        const now = new Date(today)
        const diff = Math.round((now.getTime() - prev.getTime()) / 86400000)
        const newStreak = diff === 1 ? (s.streak || 1) + 1 : 1
        return { date: today, count: 0, streak: newStreak }
      }
      return s
    } catch { return { date: today, count: 0, streak: 1 } }
  }

  const [state, setState] = useState(getState)

  const increment = () => {
    setState((s: TrackerState) => {
      const next = { ...s, count: s.count + 1 }
      localStorage.setItem('novraux_tracker', JSON.stringify(next))
      return next
    })
  }
  const decrement = () => {
    setState((s: TrackerState) => {
      const next = { ...s, count: Math.max(0, s.count - 1) }
      localStorage.setItem('novraux_tracker', JSON.stringify(next))
      return next
    })
  }

  useEffect(() => {
    localStorage.setItem('novraux_tracker', JSON.stringify(state))
  }, [state])

  return { count: state.count, streak: state.streak, increment, decrement }
}

// ── Listing Tracker Banner ─────────────────────────────────────────────────────
function ListingTrackerBanner() {
  const { count, streak, increment, decrement } = useListingTracker()
  const goal = 20
  const pct = Math.min(100, (count / goal) * 100)
  const done = count >= goal

  return (
    <div className={`mb-6 px-5 py-4 rounded-xl border flex items-center gap-5 ${done
      ? 'bg-emerald-950/20 border-emerald-900/40'
      : 'bg-zinc-900 border-zinc-800'
      }`}>
      {/* Left: goal */}
      <div className="shrink-0">
        <div className={`text-3xl font-bold tabular-nums leading-none ${done ? 'text-emerald-400' : 'text-zinc-100'}`}>
          {count}<span className="text-zinc-600 text-lg font-normal">/{goal}</span>
        </div>
        <div className="text-[11px] text-zinc-500 mt-0.5">listings today</div>
      </div>

      {/* Progress bar */}
      <div className="flex-1 min-w-0">
        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${done ? 'bg-emerald-500' : 'bg-indigo-600'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-[11px] text-zinc-600">
            {done ? '🎉 Daily goal hit!' : `${goal - count} more to hit goal`}
          </span>
          {streak > 1 && (
            <span className="text-[11px] text-amber-500">🔥 {streak}-day streak</span>
          )}
        </div>
      </div>

      {/* Buttons */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={decrement}
          className="w-7 h-7 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 text-sm font-bold transition-colors flex items-center justify-center"
        >
          −
        </button>
        <button
          onClick={increment}
          className="px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors"
        >
          + Listed
        </button>
      </div>
    </div>
  )
}

// ── Sub-niche Driller Panel ────────────────────────────────────────────────────
const COMP_COLOR: Record<string, string> = {
  low: 'text-emerald-400 bg-emerald-950/40 border-emerald-900/40',
  medium: 'text-amber-400 bg-amber-950/40 border-amber-900/40',
  high: 'text-red-400 bg-red-950/40 border-red-900/40',
}

const PRODUCT_ICON: Record<string, string> = {
  mug: '☕', 't-shirt': '👕', 'tote bag': '🛍️', poster: '🖼️', hoodie: '🧥',
}

function DrillPanel({ keyword, onClose, profileKeywords }: { keyword: string; onClose: () => void; profileKeywords: string[] }) {
  const [loading, setLoading] = useState(true)
  const [subNiches, setSubNiches] = useState<SubNiche[]>([])
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    let cancelled = false
    api.drillNiche(keyword).then(res => {
      if (!cancelled) setSubNiches(res.sub_niches)
    }).catch(e => {
      if (!cancelled) setError(e instanceof Error ? e.message : 'Drill failed')
    }).finally(() => {
      if (!cancelled) setLoading(false)
    })
    return () => { cancelled = true }
  }, [keyword])

  return (
    <div className="mt-3 -mx-1 rounded-xl border border-indigo-900/40 bg-indigo-950/10 overflow-hidden">
      {/* Panel header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-indigo-900/30">
        <div className="flex items-center gap-2">
          <span className="text-indigo-400 text-xs font-semibold uppercase tracking-wider">Sub-niche Drill</span>
          <span className="text-zinc-600 text-xs">→ "{keyword}"</span>
        </div>
        <button onClick={onClose} className="text-zinc-600 hover:text-zinc-400 text-xs">✕ close</button>
      </div>

      {loading && (
        <div className="flex items-center gap-2.5 px-4 py-5 text-zinc-500 text-xs">
          <span className="w-3.5 h-3.5 border-2 border-zinc-700 border-t-indigo-500 rounded-full animate-spin shrink-0" />
          Drilling into sub-niches with Groq...
        </div>
      )}

      {error && (
        <div className="px-4 py-3 text-red-400 text-xs">{error}</div>
      )}

      {!loading && !error && subNiches.length === 0 && (
        <div className="px-4 py-5 text-zinc-500 text-xs">No sub-niches found. Try a broader keyword.</div>
      )}

      {!loading && subNiches.length > 0 && (
        <div className="p-3 grid grid-cols-1 gap-2">
          {subNiches.map((sn, i) => {
            const scoreColor = sn.score >= 7 ? 'text-emerald-400' : sn.score >= 5 ? 'text-amber-400' : 'text-red-400'
            const compCls = COMP_COLOR[sn.competition] ?? COMP_COLOR.medium
            const icon = PRODUCT_ICON[sn.product_fit?.toLowerCase()] ?? '🎨'

            return (
              <div
                key={i}
                className="group flex items-start gap-3 px-3 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-indigo-600/40 transition-colors"
              >
                <span className="text-zinc-700 text-xs tabular-nums mt-0.5 shrink-0">#{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-zinc-200 text-xs font-medium capitalize leading-snug">{sn.keyword}</p>
                    <span className={`text-base font-bold tabular-nums shrink-0 ${scoreColor}`}>{sn.score}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${compCls}`}>
                      {sn.competition} comp.
                    </span>
                    <span className="text-[10px] text-zinc-600">{icon} {sn.product_fit}</span>
                    {profileKeywords.some(pk => {
                      const pkLower = pk.toLowerCase()
                      const snLower = sn.keyword.toLowerCase()
                      return pkLower.includes(snLower) || snLower.includes(pkLower)
                    }) && (
                        <span className="text-[10px] text-orange-400 border border-orange-900/50 bg-orange-950/20 px-1.5 py-0.5 rounded-full" title="You already researched a similar niche — warning: cannibalization risk">
                          ⚠️ Overlap
                        </span>
                      )}
                  </div>
                  {sn.hook && (
                    <p className="text-zinc-600 text-[11px] mt-1 leading-snug">{sn.hook}</p>
                  )}
                </div>
                <button
                  onClick={() => navigate(`/research?niche=${encodeURIComponent(sn.keyword)}`)}
                  className="shrink-0 self-center text-[10px] text-indigo-400 hover:text-indigo-300 font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  Research →
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Niche Card ─────────────────────────────────────────────────────────────────
interface NicheCardProps {
  niche: Niche
  onResearch: () => void
  onArchive: () => void
  profileKeywords: string[]
}

function NicheCard({ niche, onResearch, onArchive, profileKeywords }: NicheCardProps) {
  const [drillOpen, setDrillOpen] = useState(false)

  const score = niche.score ?? 0
  const scoreColor =
    score >= 7 ? 'text-emerald-400' :
      score >= 5 ? 'text-amber-400' :
        'text-red-400'

  const velocityConfig = {
    rising: { label: '↑ Rising', color: 'text-emerald-400 bg-emerald-950/60 border-emerald-900/50' },
    declining: { label: '↓ Declining', color: 'text-red-400 bg-red-950/60 border-red-900/50' },
    stable: { label: '→ Stable', color: 'text-zinc-400 bg-zinc-800/60 border-zinc-700/50' },
  }
  const vel = velocityConfig[niche.velocity] ?? velocityConfig.stable

  const compColor =
    niche.competition === 'low' ? 'text-emerald-400' :
      niche.competition === 'high' ? 'text-red-400' :
        'text-amber-400'

  let decayWarning: string | null = null
  if (niche.history && niche.history.length >= 2) {
    const sortedHistory = [...niche.history].sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime())
    const maxEntry = sortedHistory.reduce((prev, current) => (prev.avg_interest > current.avg_interest) ? prev : current)
    const latestEntry = sortedHistory[sortedHistory.length - 1]

    // Warn if peak was > 30 interest, but we've dropped by 30%+ since peak
    if (maxEntry.avg_interest > 30 && latestEntry.avg_interest < maxEntry.avg_interest * 0.7) {
      const msDiff = new Date().getTime() - new Date(maxEntry.recorded_at).getTime()
      const weeksAgo = Math.max(1, Math.round(msDiff / (1000 * 60 * 60 * 24 * 7)))
      decayWarning = `⚠️ Peak: ${weeksAgo}w ago`
    }
  }

  return (
    <div className="group bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl p-5 flex flex-col gap-3 transition-colors">

      {/* Keyword + Score */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-zinc-100 font-medium text-sm capitalize leading-snug">
          {niche.keyword}
        </h3>
        <span className={`text-2xl font-bold tabular-nums shrink-0 ${scoreColor}`}>
          {score.toFixed(1)}
        </span>
      </div>

      {/* Badges */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`text-xs px-2 py-0.5 rounded-full border ${vel.color}`}>
          {vel.label}
        </span>
        <span className={`text-xs ${compColor} capitalize`}>
          {niche.competition ?? '—'} comp.
        </span>
        {decayWarning && (
          <span className="text-[10px] text-red-400 font-medium px-2 py-0.5 rounded-full border border-red-900/50 bg-red-950/20" title="Interest has decayed significantly since peak">
            {decayWarning}
          </span>
        )}
      </div>

      {/* Product ideas */}
      {niche.product_ideas.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {niche.product_ideas.slice(0, 3).map((idea, i) => (
            <span
              key={i}
              className="px-2 py-0.5 bg-zinc-800 text-zinc-400 text-xs rounded-full"
            >
              {idea}
            </span>
          ))}
        </div>
      )}

      {/* Reasoning */}
      {niche.reasoning && (
        <p className="text-zinc-600 text-xs leading-relaxed line-clamp-2">
          {niche.reasoning}
        </p>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between mt-auto pt-1 border-t border-zinc-800">
        <div className="flex items-center gap-3">
          <button
            onClick={onArchive}
            className="text-zinc-700 hover:text-zinc-500 text-xs transition-colors"
          >
            Archive
          </button>
          <button
            onClick={() => setDrillOpen(o => !o)}
            className={`flex items-center gap-1 text-xs font-medium transition-colors ${drillOpen ? 'text-indigo-400' : 'text-zinc-500 hover:text-indigo-400'
              }`}
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M12 17.25h8.25" />
            </svg>
            {drillOpen ? 'Close Drill' : 'Drill Down'}
          </button>
        </div>
        <button
          onClick={onResearch}
          className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 text-xs font-medium transition-colors"
        >
          Research
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
          </svg>
        </button>
      </div>

      {/* Drill panel — only mounts when open */}
      {drillOpen && (
        <DrillPanel keyword={niche.keyword} onClose={() => setDrillOpen(false)} profileKeywords={profileKeywords} />
      )}
    </div>
  )
}

// ── Discover page ──────────────────────────────────────────────────────────────
export function Discover() {
  const [searchParams] = useSearchParams()
  const topic = searchParams.get('topic') || 'standard'

  const [allNiches, setAllNiches] = useState<Niche[]>([])
  const [loading, setLoading] = useState(true)
  const [scraping, setScraping] = useState(false)
  const [scrapeResult, setScrapeResult] = useState<{ saved: number; updated: number; skipped: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [filterScore, setFilterScore] = useState(false)
  const [filterRising, setFilterRising] = useState(false)
  const [filterLowComp, setFilterLowComp] = useState(false)
  const [profileKeywords, setProfileKeywords] = useState<string[]>([])
  const navigate = useNavigate()

  useEffect(() => {
    api.getResearchProfile().then(d => setProfileKeywords(d.profile_keywords || [])).catch(() => { })
  }, [])


  const load = useCallback(async () => {
    try {
      const data = await api.listNiches()
      setAllNiches(data.niches)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load niches')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const runScrape = async () => {
    setScraping(true)
    setError(null)
    setScrapeResult(null)
    try {
      const result = await api.runScrape(topic)
      setScrapeResult({ saved: result.saved, updated: result.updated, skipped: result.skipped })
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Scrape failed')
    } finally {
      setScraping(false)
    }
  }

  const archiveNiche = async (id: number) => {
    try {
      await api.archiveNiche(id)
      setAllNiches(prev => prev.filter(n => n.id !== id))
    } catch {
      // silently ignore archive errors
    }
  }

  const baseNiches = allNiches.filter(n => n.source.includes(topic))
  const niches = baseNiches
    .filter(n => !filterScore || (n.score ?? 0) >= 7)
    .filter(n => !filterRising || n.velocity === 'rising')
    .filter(n => !filterLowComp || n.competition === 'low')
  const rising = baseNiches.filter(n => n.velocity === 'rising').length
  const highScore = baseNiches.filter(n => n.score >= 7).length

  return (
    <div className="p-8 max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100 tracking-tight capitalize">{topic} Niche Discovery</h1>
          <p className="text-zinc-500 text-sm mt-1">
            Google Trends → Groq scoring → ranked POD opportunities
          </p>
        </div>
        <button
          onClick={runScrape}
          disabled={scraping}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
        >
          {scraping ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Scraping...
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
              Run Scrape
            </>
          )}
        </button>
      </div>

      {/* Listing Tracker */}
      <ListingTrackerBanner />

      {/* Scrape result toast */}
      {scrapeResult && (
        <div className="mb-6 flex items-center gap-4 px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-sm">
          <span className="text-green-400 font-medium">Scrape complete</span>
          <span className="text-zinc-400">{scrapeResult.saved} new · {scrapeResult.updated} updated · {scrapeResult.skipped} skipped</span>
          <button onClick={() => setScrapeResult(null)} className="ml-auto text-zinc-600 hover:text-zinc-400">✕</button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-6 px-4 py-3 bg-red-950/40 border border-red-900/60 text-red-400 text-sm rounded-lg flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-600 hover:text-red-400 ml-4">✕</button>
        </div>
      )}

      {/* Stats bar + filters */}
      {baseNiches.length > 0 && (
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <span className="text-zinc-500 text-sm">{niches.length}<span className="text-zinc-700">/{baseNiches.length}</span> niches</span>
          <span className="text-zinc-700">·</span>
          <span className="text-emerald-400 text-sm">{rising} rising</span>
          <span className="text-zinc-700">·</span>
          <span className="text-indigo-400 text-sm">{highScore} score 7+</span>
          <div className="ml-auto flex items-center gap-2 flex-wrap">
            <span className="text-[11px] text-zinc-600 uppercase tracking-wider font-semibold">Filter:</span>
            {([
              { label: 'Score 7+', active: filterScore, toggle: () => setFilterScore(f => !f) },
              { label: '↑ Rising', active: filterRising, toggle: () => setFilterRising(f => !f) },
              { label: 'Low comp.', active: filterLowComp, toggle: () => setFilterLowComp(f => !f) },
            ] as const).map(f => (
              <button
                key={f.label}
                onClick={f.toggle}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${f.active
                  ? 'bg-indigo-600/20 border-indigo-600/50 text-indigo-300'
                  : 'bg-zinc-900 border-zinc-700 text-zinc-500 hover:border-zinc-500 hover:text-zinc-300'
                  }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-5 h-5 border-2 border-zinc-700 border-t-zinc-400 rounded-full animate-spin" />
        </div>
      ) : niches.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center border border-dashed border-zinc-800 rounded-xl">
          <div className="text-3xl mb-3 opacity-40">🔍</div>
          <p className="text-zinc-400 text-sm">No niches yet.</p>
          <p className="text-zinc-600 text-sm mt-1">Click <span className="text-zinc-400">Run Scrape</span> to pull rising trends from Google.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {niches.map(n => (
            <NicheCard
              key={n.id}
              niche={n}
              onResearch={() => navigate(`/research?niche=${encodeURIComponent(n.keyword)}`)}
              onArchive={() => archiveNiche(n.id)}
              profileKeywords={profileKeywords}
            />
          ))}
        </div>
      )}
    </div>
  )
}
