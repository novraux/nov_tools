import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, Niche } from '../api'

export function Discover() {
  const [niches, setNiches] = useState<Niche[]>([])
  const [loading, setLoading] = useState(true)
  const [scraping, setScraping] = useState(false)
  const [scrapeResult, setScrapeResult] = useState<{ saved: number; updated: number; skipped: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  const load = useCallback(async () => {
    try {
      const data = await api.listNiches()
      setNiches(data.niches)
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
      const result = await api.runScrape()
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
      setNiches(prev => prev.filter(n => n.id !== id))
    } catch {
      // silently ignore archive errors
    }
  }

  const rising = niches.filter(n => n.velocity === 'rising').length
  const highScore = niches.filter(n => n.score >= 7).length

  return (
    <div className="p-8 max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100 tracking-tight">Niche Discovery</h1>
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

      {/* Stats bar */}
      {niches.length > 0 && (
        <div className="flex items-center gap-5 mb-6 text-sm">
          <span className="text-zinc-500">{niches.length} niches</span>
          <span className="text-zinc-700">·</span>
          <span className="text-emerald-400">{rising} rising</span>
          <span className="text-zinc-700">·</span>
          <span className="text-indigo-400">{highScore} score 7+</span>
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
          {niches.map(niche => (
            <NicheCard
              key={niche.id}
              niche={niche}
              onResearch={() => navigate(`/research?id=${niche.id}&niche=${encodeURIComponent(niche.keyword)}`)}
              onArchive={() => archiveNiche(niche.id)}
            />
          ))}
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
}

function NicheCard({ niche, onResearch, onArchive }: NicheCardProps) {
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
        <button
          onClick={onArchive}
          className="text-zinc-700 hover:text-zinc-500 text-xs transition-colors"
        >
          Archive
        </button>
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
    </div>
  )
}
