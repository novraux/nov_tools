import { useState, useEffect, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { api, PromptResult, StyleAnalysis } from '../api'

const STYLES: { value: string; label: string; hint: string }[] = [
  { value: 'auto', label: 'Auto', hint: 'AI picks the best style' },
  { value: 'minimalist', label: 'Minimalist', hint: 'Flat, clean, 2-3 colors' },
  { value: 'vintage', label: 'Vintage', hint: 'Retro badge, distressed' },
  { value: 'bold', label: 'Bold', hint: 'Chunky type, high contrast' },
  { value: 'funny', label: 'Funny', hint: 'Witty slogan, playful art' },
  { value: 'handdrawn', label: 'Hand-drawn', hint: 'Sketchy, inky, personal' },
]

const STYLE_BADGE: Record<string, string> = {
  minimalist: 'text-sky-400 bg-sky-950/40 border-sky-900/50',
  vintage: 'text-amber-400 bg-amber-950/40 border-amber-900/50',
  bold: 'text-red-400 bg-red-950/40 border-red-900/50',
  funny: 'text-yellow-400 bg-yellow-950/40 border-yellow-900/50',
  handdrawn: 'text-emerald-400 bg-emerald-950/40 border-emerald-900/50',
  mixed: 'text-purple-400 bg-purple-950/40 border-purple-900/50',
}

const PRODUCT_ICON: Record<string, string> = {
  't-shirt': '👕', mug: '☕', 'tote bag': '🛍️', poster: '🖼️', hoodie: '🧥', sweatshirt: '🥋',
}

const MODEL_BADGE: Record<string, string> = {
  'Ideogram 3 Quality': 'text-violet-400 bg-violet-950/40 border-violet-900/50',
  'FLUX 1.1 Pro': 'text-cyan-400 bg-cyan-950/40 border-cyan-900/50',
  'DALL-E 3': 'text-orange-400 bg-orange-950/40 border-orange-900/50',
}

const FOCUS_LABEL: Record<string, string> = {
  text: '🔤 Text-heavy',
  illustration: '🎨 Illustration',
  mixed: '⚖️ Mixed',
}

const BG_LABEL: Record<string, string> = {
  transparent: '✂️ Transparent',
  white: '⬜ White bg',
}

// ── Copy button ────────────────────────────────────────────────────────────────
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button
      onClick={copy}
      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${copied
          ? 'bg-emerald-950/40 border-emerald-900/50 text-emerald-400'
          : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100'
        }`}
    >
      {copied ? (
        <>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
          Copied!
        </>
      ) : (
        <>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" />
          </svg>
          Copy prompt
        </>
      )}
    </button>
  )
}

// ── Prompt card ────────────────────────────────────────────────────────────────
function PromptCard({ result, index }: { result: PromptResult; index: number }) {
  const styleCls = STYLE_BADGE[result.style] ?? STYLE_BADGE.mixed
  const modelCls = MODEL_BADGE[result.kittl_model] ?? 'text-zinc-400 bg-zinc-900 border-zinc-700'
  const productIcon = PRODUCT_ICON[result.product] ?? '🎨'

  return (
    <div className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl p-5 flex flex-col gap-4 transition-colors">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-zinc-600 font-mono text-xs shrink-0">#{index + 1}</span>
        <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full border ${styleCls}`}>
          {result.style}
        </span>
        <span className="text-xs text-zinc-500">{productIcon} {result.product}</span>
        <span className="text-xs text-zinc-600 ml-auto">{BG_LABEL[result.background] ?? result.background}</span>
      </div>
      <p className="text-zinc-300 text-sm leading-relaxed flex-1">{result.prompt}</p>
      <div className="flex items-center justify-between pt-2 border-t border-zinc-800 gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] text-zinc-600">{FOCUS_LABEL[result.focus]}</span>
          <span className="text-zinc-800">·</span>
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md border ${modelCls}`}>
            Kittl: {result.kittl_model}
          </span>
        </div>
        <CopyButton text={result.prompt} />
      </div>
    </div>
  )
}

// ── Style Extractor ────────────────────────────────────────────────────────────
function StyleExtractor({ onApply }: { onApply: (style: string, keywords: string[]) => void }) {
  const [open, setOpen] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<StyleAnalysis | null>(null)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const processFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (JPG, PNG, WEBP)')
      return
    }
    if (file.size > 4 * 1024 * 1024) {
      setError('Image must be under 4MB')
      return
    }

    setAnalyzing(true)
    setError(null)
    setAnalysis(null)

    const reader = new FileReader()
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string
      // Strip "data:image/jpeg;base64," prefix
      const b64 = dataUrl.split(',')[1]
      const mime = file.type

      try {
        const res = await api.analyzeStyle({ image_b64: b64, mime_type: mime })
        setAnalysis(res.analysis)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Analysis failed')
      } finally {
        setAnalyzing(false)
      }
    }
    reader.readAsDataURL(file)
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }

  const MODEL_BADGE_SMALL: Record<string, string> = {
    'Ideogram 3 Quality': 'text-violet-400 border-violet-900/50 bg-violet-950/30',
    'FLUX 1.1 Pro': 'text-cyan-400 border-cyan-900/50 bg-cyan-950/30',
    'DALL-E 3': 'text-orange-400 border-orange-900/50 bg-orange-950/30',
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      {/* Header toggle */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-zinc-800/40 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <span className="text-base">🖼️</span>
          <div className="text-left">
            <span className="text-sm font-medium text-zinc-200">Reference Image Analyzer</span>
            <span className="text-zinc-600 text-xs block">Upload a winning design → extract style + keywords</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-emerald-400 bg-emerald-950/40 border border-emerald-900/40 px-1.5 py-0.5 rounded-full font-medium">FREE</span>
          <svg
            className={`w-4 h-4 text-zinc-600 transition-transform ${open ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
          </svg>
        </div>
      </button>

      {open && (
        <div className="border-t border-zinc-800 p-5 space-y-4">
          {/* Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${dragging
                ? 'border-indigo-500 bg-indigo-950/20'
                : 'border-zinc-700 hover:border-zinc-500 bg-zinc-950/40'
              }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) processFile(f) }}
            />
            {analyzing ? (
              <div className="flex flex-col items-center gap-2">
                <span className="w-6 h-6 border-2 border-zinc-600 border-t-indigo-500 rounded-full animate-spin" />
                <p className="text-zinc-500 text-sm">Analyzing with Groq Vision...</p>
              </div>
            ) : (
              <>
                <div className="text-3xl mb-2">🎨</div>
                <p className="text-zinc-400 text-sm font-medium">Drop a reference design here</p>
                <p className="text-zinc-600 text-xs mt-1">or click to browse · JPG, PNG, WEBP · max 4MB</p>
              </>
            )}
          </div>

          {error && (
            <div className="px-3 py-2 bg-red-950/40 border border-red-900/50 text-red-400 text-xs rounded-lg">
              {error}
            </div>
          )}

          {/* Analysis results */}
          {analysis && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Style Analysis</span>
                <span className={`text-[10px] px-2 py-0.5 rounded border font-medium ${MODEL_BADGE_SMALL[analysis.kittl_model] ?? 'text-zinc-400 border-zinc-700'}`}>
                  Kittl: {analysis.kittl_model}
                </span>
              </div>

              {/* Style tags */}
              <div>
                <p className="text-[11px] text-zinc-600 mb-1.5 uppercase tracking-wider font-semibold">Style Tags</p>
                <div className="flex flex-wrap gap-1.5">
                  {analysis.style_tags.map((tag, i) => (
                    <span key={i} className="text-xs px-2.5 py-1 bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Color palette */}
              <div>
                <p className="text-[11px] text-zinc-600 mb-1.5 uppercase tracking-wider font-semibold">Color Palette</p>
                <div className="flex items-center gap-2 flex-wrap">
                  {analysis.color_palette.map((color, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <div
                        className="w-4 h-4 rounded border border-zinc-700 shrink-0"
                        style={{ backgroundColor: color.startsWith('#') ? color : undefined }}
                      />
                      <span className="text-xs text-zinc-400">{color}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Keywords */}
              <div>
                <p className="text-[11px] text-zinc-600 mb-1.5 uppercase tracking-wider font-semibold">Extracted Keywords</p>
                <div className="flex flex-wrap gap-1.5">
                  {analysis.keywords.map((kw, i) => (
                    <span key={i} className="text-xs px-2.5 py-1 bg-indigo-950/40 border border-indigo-900/40 text-indigo-300 rounded-full">
                      {kw}
                    </span>
                  ))}
                </div>
              </div>

              {/* Replication prompt */}
              <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[11px] text-zinc-500 uppercase tracking-wider font-semibold">Kittl Replication Prompt</p>
                  <CopyButton text={analysis.replication_prompt} />
                </div>
                <p className="text-sm text-zinc-300 leading-relaxed">{analysis.replication_prompt}</p>
              </div>

              {/* Apply button */}
              <button
                onClick={() => {
                  // Map mood to closest style value
                  const moodToStyle: Record<string, string> = {
                    funny: 'funny', bold: 'bold', minimal: 'minimalist',
                    vintage: 'vintage', playful: 'funny', inspirational: 'handdrawn'
                  }
                  const style = moodToStyle[analysis.mood] ?? 'auto'
                  onApply(style, analysis.keywords)
                }}
                className="w-full py-2 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-600/40 text-indigo-300 text-sm font-medium rounded-lg transition-colors"
              >
                ✦ Apply Style to Prompt Generator
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Design page ────────────────────────────────────────────────────────────────
export function Design() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()

  const nicheFromUrl = searchParams.get('niche') ?? ''
  const angleFromUrl = searchParams.get('angle') ?? ''

  const [style, setStyle] = useState('auto')
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [prompts, setPrompts] = useState<PromptResult[]>([])
  const [hasGenerated, setHasGenerated] = useState(false)
  const [extractedKeywords, setExtractedKeywords] = useState<string[]>([])

  // Auto-generate when arriving with both niche and angle from Research
  useEffect(() => {
    if (nicheFromUrl && angleFromUrl) {
      runGenerate()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const runGenerate = async () => {
    if (!nicheFromUrl) return
    setGenerating(true)
    setError(null)
    try {
      const data = await api.generatePrompts({
        niche_keyword: nicheFromUrl,
        angle: angleFromUrl || undefined,
        style: style !== 'auto' ? style : undefined,
      })
      setPrompts(data.prompts)
      setHasGenerated(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Generation failed')
    } finally {
      setGenerating(false)
    }
  }

  const handleStyleApply = (detectedStyle: string, keywords: string[]) => {
    setStyle(detectedStyle)
    setExtractedKeywords(keywords)
    // If no niche yet, pre-fill with first keyword
    if (!nicheFromUrl && keywords.length > 0) {
      const params = new URLSearchParams(searchParams)
      params.set('niche', keywords[0])
      setSearchParams(params)
    }
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-semibold text-zinc-100 tracking-tight">Prompt Studio</h1>
            <span className="text-xs text-indigo-400 bg-indigo-950/50 border border-indigo-900/50 px-2 py-0.5 rounded-full">
              Kittl · Etsy POD
            </span>
          </div>
          <p className="text-zinc-500 text-sm">
            AI-generated Kittl prompts optimized for Etsy best-sellers — copy, paste, vectorize, print
          </p>
        </div>
        {nicheFromUrl && (
          <button onClick={() => navigate(-1)} className="text-sm text-zinc-400 hover:text-zinc-300 shrink-0">
            ← Back
          </button>
        )}
      </div>

      {/* Style Extractor — always available */}
      <div className="mb-6">
        <StyleExtractor onApply={handleStyleApply} />
      </div>

      {/* Extracted keywords from style analysis */}
      {extractedKeywords.length > 0 && (
        <div className="mb-4 px-4 py-3 bg-indigo-950/20 border border-indigo-900/30 rounded-xl flex items-center gap-3 flex-wrap">
          <span className="text-xs text-indigo-400 font-medium shrink-0">🎨 Extracted from image:</span>
          {extractedKeywords.map((kw, i) => (
            <button
              key={i}
              onClick={() => {
                const params = new URLSearchParams(searchParams)
                params.set('niche', kw)
                setSearchParams(params)
              }}
              className="text-xs px-2.5 py-1 bg-indigo-950/40 border border-indigo-900/50 text-indigo-300 hover:bg-indigo-900/40 rounded-full transition-colors"
            >
              {kw}
            </button>
          ))}
          <span className="text-zinc-600 text-xs">← click to use as niche</span>
        </div>
      )}

      {/* How it works banner */}
      {!hasGenerated && nicheFromUrl && (
        <div className="mb-6 flex items-start gap-3 px-4 py-3 bg-indigo-950/20 border border-indigo-900/30 rounded-xl text-xs text-zinc-400">
          <span className="text-indigo-400 text-base shrink-0">ℹ️</span>
          <span>
            Each prompt tells you which <span className="text-indigo-300">Kittl AI model</span> to use and whether to set a{' '}
            <span className="text-indigo-300">transparent</span> (apparel) or{' '}
            <span className="text-indigo-300">white</span> (mug/poster) background.
            Copy the prompt → open Kittl → paste → generate → vectorize → export.
          </span>
        </div>
      )}

      {/* Config panel */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-6 space-y-5">
        {nicheFromUrl ? (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Niche</span>
            <span className="text-sm text-zinc-200 capitalize font-medium">{nicheFromUrl}</span>
            {angleFromUrl && (
              <>
                <span className="text-zinc-700">·</span>
                <span className="text-xs text-indigo-400 bg-indigo-950/40 border border-indigo-900/40 px-2 py-0.5 rounded-full truncate max-w-xs">
                  {angleFromUrl}
                </span>
              </>
            )}
          </div>
        ) : (
          <p className="text-sm text-zinc-500">
            No niche selected.{' '}
            <button onClick={() => navigate('/')} className="text-indigo-400 hover:text-indigo-300">
              Discover a niche →
            </button>
          </p>
        )}

        {/* Style picker */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Style Preference</label>
          <div className="flex flex-wrap gap-2">
            {STYLES.map(s => (
              <button
                key={s.value}
                onClick={() => setStyle(s.value)}
                className={`px-3 py-2 rounded-lg text-xs border transition-colors text-left ${style === s.value
                    ? 'bg-indigo-600/20 border-indigo-600/60 text-indigo-300'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
              >
                <span className="font-medium block">{s.label}</span>
                <span className="text-zinc-600">{s.hint}</span>
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="px-4 py-3 bg-red-950/40 border border-red-900/60 text-red-400 text-sm rounded-lg flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-red-600 hover:text-red-400 ml-4">✕</button>
          </div>
        )}

        <div className="flex items-center justify-between pt-1">
          <p className="text-xs text-zinc-600">Groq · Free · ~5s · 5 prompts</p>
          <button
            onClick={runGenerate}
            disabled={generating || !nicheFromUrl}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
          >
            {generating ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09l2.846.813-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
                {hasGenerated ? 'Regenerate' : 'Generate Prompts'}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Results */}
      {generating && (
        <div className="flex items-center justify-center h-40 border border-dashed border-zinc-800 rounded-xl gap-3">
          <div className="w-5 h-5 border-2 border-zinc-700 border-t-indigo-500 rounded-full animate-spin" />
          <p className="text-zinc-500 text-sm">Generating Etsy-optimized prompts...</p>
        </div>
      )}

      {!generating && prompts.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Generated Prompts</h2>
            <span className="text-xs text-zinc-600">{prompts.length} prompts · paste into Kittl</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {prompts.map((p, i) => (
              <PromptCard key={i} result={p} index={i} />
            ))}
          </div>

          {/* Kittl workflow reminder */}
          <div className="mt-6 p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Kittl Workflow</p>
            <div className="flex items-center gap-2 text-xs text-zinc-500 flex-wrap">
              {[
                'Copy prompt',
                '→ Open Kittl',
                '→ Select model shown',
                '→ Set background',
                '→ Generate',
                '→ AI Vectorize',
                '→ Export PNG/SVG',
                '→ Upload to Etsy/Printify',
              ].map((step, i) => (
                <span key={i} className={i === 0 ? 'text-indigo-400 font-medium' : ''}>{step}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      {!generating && !hasGenerated && nicheFromUrl && (
        <div className="flex flex-col items-center justify-center h-40 border border-dashed border-zinc-800 rounded-xl gap-2">
          <div className="text-3xl opacity-20">✏️</div>
          <p className="text-zinc-600 text-sm">Click <span className="text-zinc-400">Generate Prompts</span> to get Kittl-ready Etsy design ideas.</p>
        </div>
      )}
    </div>
  )
}
