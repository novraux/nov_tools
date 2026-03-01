import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { getUpcomingEvents, EventCategory, PodPotential } from '../lib/holidays'

const CATEGORIES: { value: EventCategory | 'all'; label: string }[] = [
  { value: 'all',       label: 'All' },
  { value: 'holiday',   label: 'Holidays' },
  { value: 'awareness', label: 'Awareness' },
  { value: 'seasonal',  label: 'Seasonal' },
  { value: 'shopping',  label: 'Shopping' },
  { value: 'sports',    label: 'Sports' },
  { value: 'cultural',  label: 'Cultural' },
]

const TIME_FILTERS: { value: number | null; label: string }[] = [
  { value: null, label: 'All' },
  { value: 30,  label: '30d' },
  { value: 60,  label: '60d' },
  { value: 90,  label: '90d' },
  { value: 180, label: '180d' },
]

const POD_COLORS: Record<PodPotential, string> = {
  high:   'text-emerald-400 bg-emerald-950/50 border-emerald-900/50',
  medium: 'text-amber-400 bg-amber-950/50 border-amber-900/50',
  low:    'text-zinc-500 bg-zinc-900 border-zinc-800',
}

const COMPETITION_COLORS: Record<string, string> = {
  low:    'text-emerald-400',
  medium: 'text-amber-400',
  high:   'text-red-400',
}

const PREP_CONFIG = {
  urgent:  { label: 'Act Now',   cls: 'text-red-400 bg-red-950/50 border-red-900/50',     dot: 'bg-red-400' },
  watch:   { label: 'Prep Soon', cls: 'text-amber-400 bg-amber-950/50 border-amber-900/50', dot: 'bg-amber-400' },
  ontrack: { label: 'On Track',  cls: 'text-zinc-500 bg-zinc-900 border-zinc-800',         dot: 'bg-zinc-600' },
}

export function Holidays() {
  const navigate = useNavigate()
  const [category, setCategory] = useState<EventCategory | 'all'>('all')
  const [days, setDays] = useState<number | null>(null)
  const [highOnly, setHighOnly] = useState(false)

  const allEvents = useMemo(() => getUpcomingEvents(), [])

  const filtered = useMemo(() => {
    return allEvents.filter(e => {
      if (category !== 'all' && e.category !== category) return false
      if (days !== null && e.daysLeft > days) return false
      if (highOnly && e.podPotential !== 'high') return false
      return true
    })
  }, [allEvents, category, days, highOnly])

  // Stats (always from unfiltered)
  const stats = useMemo(() => ({
    total:   allEvents.length,
    highPod: allEvents.filter(e => e.podPotential === 'high').length,
    month:   allEvents.filter(e => e.daysLeft <= 30).length,
    urgent:  allEvents.filter(e => e.prepStatus === 'urgent').length,
  }), [allEvents])

  return (
    <div className="p-8 max-w-6xl mx-auto">

      {/* Header */}
      <div className="mb-7">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-xl font-semibold text-zinc-100 tracking-tight">Event Radar</h1>
          <span className="text-xs text-indigo-400 bg-indigo-950/50 border border-indigo-900/50 px-2 py-0.5 rounded-full">
            POD Calendar
          </span>
        </div>
        <p className="text-zinc-500 text-sm">
          {allEvents.length} upcoming events — spot high-potential niches before the rush.
        </p>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-4 gap-3 mb-7">
        {[
          { label: 'Total Events',  value: stats.total,   color: 'text-zinc-100' },
          { label: '🔥 High POD',   value: stats.highPod, color: 'text-emerald-400' },
          { label: 'Next 30 Days',  value: stats.month,   color: 'text-indigo-400' },
          { label: '🚨 Act Now',    value: stats.urgent,  color: 'text-red-400' },
        ].map(s => (
          <div key={s.label} className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-zinc-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {/* Category */}
        <div className="flex flex-wrap gap-1">
          {CATEGORIES.map(c => (
            <button
              key={c.value}
              onClick={() => setCategory(c.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                category === c.value
                  ? 'bg-indigo-600/20 border-indigo-600/50 text-indigo-300'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-300'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="w-px h-5 bg-zinc-800 hidden sm:block" />

        {/* Time range */}
        <div className="flex gap-1">
          {TIME_FILTERS.map(t => (
            <button
              key={String(t.value)}
              onClick={() => setDays(t.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                days === t.value
                  ? 'bg-zinc-700 border-zinc-600 text-zinc-100'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-400'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="w-px h-5 bg-zinc-800 hidden sm:block" />

        {/* High POD toggle */}
        <button
          onClick={() => setHighOnly(v => !v)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
            highOnly
              ? 'bg-emerald-950/40 border-emerald-900/50 text-emerald-400'
              : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-400'
          }`}
        >
          🔥 High POD only
        </button>

        <span className="ml-auto text-xs text-zinc-600">{filtered.length} events</span>
      </div>

      {/* Event grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 border border-dashed border-zinc-800 rounded-xl gap-2">
          <div className="text-3xl opacity-20">📅</div>
          <p className="text-zinc-500 text-sm">No events match your filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(event => {
            const prep = PREP_CONFIG[event.prepStatus]
            return (
              <div
                key={event.id}
                className="group bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl p-5 flex flex-col gap-4 transition-colors"
              >
                {/* Row 1: icon + name + badges */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center text-xl shrink-0">
                    {event.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-zinc-100 font-medium text-sm leading-snug truncate">
                      {event.name}
                    </h3>
                    <p className="text-zinc-500 text-xs mt-0.5">
                      {format(event.nextDate, 'MMM d, yyyy')}
                    </p>
                  </div>
                  <span className={`shrink-0 text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full border ${POD_COLORS[event.podPotential]}`}>
                    {event.podPotential === 'high' ? '🔥 High' : event.podPotential === 'medium' ? '⚡ Med' : '· Low'}
                  </span>
                </div>

                {/* Row 2: stats */}
                <div className="flex items-center gap-2 text-xs flex-wrap">
                  <span className={`flex items-center gap-1 px-2 py-1 rounded-md border font-medium ${prep.cls}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${prep.dot}`} />
                    {prep.label}
                  </span>
                  <span className="text-zinc-600">·</span>
                  <span className="text-zinc-400">{event.daysLeft}d away</span>
                  <span className="text-zinc-600">·</span>
                  <span className={`font-medium ${COMPETITION_COLORS[event.competition]}`}>
                    {event.competition} comp
                  </span>
                </div>

                {/* Row 3: niche previews */}
                <div className="flex-1">
                  <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider mb-2">
                    Top Niches
                  </p>
                  <div className="flex flex-col gap-1.5">
                    {event.topNiches.map((niche, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-zinc-400">
                        <span className="text-zinc-700 font-mono">{i + 1}</span>
                        <span className="truncate">{niche}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Row 4: markets + CTA */}
                <div className="pt-3 border-t border-zinc-800 space-y-3">
                  <div className="flex items-center gap-1 flex-wrap">
                    {event.targetMarkets.map(m => (
                      <span key={m} className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-500 font-medium">
                        {m}
                      </span>
                    ))}
                  </div>
                  <button
                    onClick={() => navigate(`/research?niche=${encodeURIComponent(event.name)}`)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-indigo-600 text-zinc-200 hover:text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09l2.846.813-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                    </svg>
                    Research Event
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
