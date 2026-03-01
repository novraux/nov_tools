import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { api, NicheResearch, SeoResult } from '../api'

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
      className={`text-[11px] font-medium px-2 py-1 rounded border transition-colors shrink-0 ${
        copied
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
  keyword,
  products,
  designAngles,
}: {
  keyword: string
  products: string[]
  designAngles: string[]
}) {
  const [seo, setSeo] = useState<SeoResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)

  const generate = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.generateSeo({ keyword, products, design_angles: designAngles })
      setSeo(data.seo)
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
            <h3 className="text-zinc-100 font-medium tracking-tight">Etsy + Shopify SEO Copy</h3>
            <p className="text-zinc-600 text-xs">Title · 13 tags · description · meta — ready to paste</p>
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
              {nicheId ? 'Sprint 2' : 'Event Radar'}
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

        {!research && !loading && (
          <button
            onClick={runAnalysis}
            disabled={analyzing}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
          >
            {analyzing ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Analyzing (Claude)...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09l2.846.813-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                </svg>
                Run Deep Analysis
              </>
            )}
          </button>
        )}
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
          <div className={`p-6 rounded-xl border flex flex-col items-center justify-center text-center ${
            research.worth_it
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
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl">🎨</span>
              <h3 className="text-zinc-100 font-medium tracking-tight">Creative Design Angles</h3>
            </div>
            {research.design_angles.length > 0 ? (
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {research.design_angles.map((angle, i) => (
                  <li key={i} className="flex flex-col gap-1.5 p-4 bg-zinc-950 rounded-lg border border-zinc-800/70 hover:border-indigo-500/30 transition-colors">
                    <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">Angle {i + 1}</span>
                    <span className="text-sm text-zinc-300 leading-relaxed">{angle}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-zinc-500 text-sm">No design angles generated.</p>
            )}

            <div className="mt-8 pt-6 border-t border-zinc-800">
              <p className="text-xs text-zinc-600 mb-3">Click an angle → Prompt Studio → Kittl-ready prompts</p>
              <div className="flex flex-wrap gap-2">
                {research.design_angles.map((angle, i) => (
                  <button
                    key={i}
                    onClick={() => navigate(`/design?niche=${encodeURIComponent(nicheKeyword)}&angle=${encodeURIComponent(angle)}`)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-indigo-600/20 hover:border-indigo-600/40 border border-zinc-700 text-zinc-300 text-xs rounded-lg transition-colors"
                  >
                    <span className="text-indigo-500 font-bold">{i + 1}</span>
                    <span className="truncate max-w-[200px]">{angle}</span>
                    <svg className="w-3 h-3 text-zinc-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                    </svg>
                  </button>
                ))}
              </div>
            </div>
          </div>

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
            Click <span className="text-zinc-400">Run Deep Analysis</span> to let Claude evaluate <b className="font-semibold">{nicheKeyword}</b>.
          </p>
        </div>
      )}
    </div>
  )
}
