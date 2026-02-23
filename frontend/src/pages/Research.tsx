import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { api, NicheResearch } from '../api'

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
    if (!nicheId) return

    setAnalyzing(true)
    setError(null)
    try {
      const data = await api.runResearch(nicheId)
      setResearch(data.research)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Analysis failed')
    } finally {
      setAnalyzing(false)
    }
  }

  if (!nicheId || !nicheKeyword) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center">
        <p className="text-zinc-500 mb-4">No niche selected for research.</p>
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded hover:bg-zinc-700 transition"
        >
          Back to Discover
        </button>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-semibold text-zinc-100 tracking-tight">Niche Research</h1>
            <span className="text-xs text-indigo-400 bg-indigo-950/50 border border-indigo-900/50 px-2 py-0.5 rounded-full">Sprint 2</span>
          </div>
          <p className="text-zinc-500 text-sm">Deep AI analysis — competition, demand, design angles</p>
        </div>

        <button
          onClick={() => navigate('/')}
          className="text-sm text-zinc-400 hover:text-zinc-300"
        >
          ← Back
        </button>
      </div>

      {/* Selected Niche Header */}
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
          {/* Verdict Badge */}
          <div className={`p-6 rounded-xl border flex flex-col items-center justify-center text-center ${research.worth_it
            ? 'bg-emerald-950/20 border-emerald-900/40 shadow-[0_0_30px_-5px_var(--tw-shadow-color)] shadow-emerald-500/10'
            : 'bg-red-950/20 border-red-900/40 shadow-[0_0_30px_-5px_var(--tw-shadow-color)] shadow-red-500/10'
            }`}>
            <span className={`text-sm font-semibold tracking-wide uppercase mb-1 ${research.worth_it ? 'text-emerald-500' : 'text-red-500'
              }`}>
              AI Verdict
            </span>
            <h3 className={`text-4xl font-bold ${research.worth_it ? 'text-emerald-400' : 'text-red-400'
              }`}>
              {research.worth_it ? 'Worth It ✅' : 'Skip It ❌'}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Target Audience */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">👥</span>
                <h3 className="text-zinc-200 font-medium tracking-tight">Target Audience</h3>
              </div>
              <p className="text-zinc-400 text-sm leading-relaxed">
                {research.target_audience}
              </p>
            </div>

            {/* Competitor Insights */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">⚔️</span>
                <h3 className="text-zinc-200 font-medium tracking-tight">Competitor Insights</h3>
              </div>
              <p className="text-zinc-400 text-sm leading-relaxed">
                {research.competitor_insights}
              </p>
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

            <div className="mt-8 pt-6 border-t border-zinc-800 flex justify-end">
              <button
                onClick={() => navigate('/design')}
                disabled={!research.design_angles.length}
                className="flex items-center gap-2 px-5 py-2.5 bg-zinc-100 hover:bg-white text-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold rounded-lg transition-colors"
              >
                Go to Design Studio →
              </button>
            </div>
          </div>

        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-48 border border-dashed border-zinc-800 rounded-xl gap-2">
          <div className="text-3xl opacity-30">🔬</div>
          <p className="text-zinc-400 text-sm">Ready for Deep Analysis.</p>
          <p className="text-zinc-600 text-xs">Click <span className="text-zinc-400">Run Deep Analysis</span> to let Claude evaluate <b className="font-semibold">{nicheKeyword}</b>.</p>
        </div>
      )}
    </div>
  )
}
