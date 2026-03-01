import { Routes, Route, NavLink, useLocation } from 'react-router-dom'
import { Discover } from './pages/Discover'
import { Research } from './pages/Research'
import { Design } from './pages/Design'

import { Holidays } from './pages/Holidays'

const navClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${isActive
    ? 'bg-zinc-800 text-zinc-100 font-medium'
    : 'text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800/50'
  }`

export default function App() {
  const location = useLocation()
  const topic = new URLSearchParams(location.search).get('topic')
  const isStandardActive = location.pathname === '/' && (!topic || topic === 'standard')

  return (
    <div className="flex h-screen bg-zinc-950 font-sans">
      {/* Sidebar */}
      <aside className="w-52 shrink-0 border-r border-zinc-800 flex flex-col py-6 px-3">
        {/* Brand */}
        <div className="px-3 mb-8 flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-indigo-600 flex items-center justify-center text-xs font-bold text-white">
            N
          </div>
          <span className="text-zinc-100 font-semibold tracking-tight">Novraux</span>
          <span className="ml-auto text-[10px] text-zinc-600 bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded">
            v2
          </span>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-0.5">
          <div className="px-3 pt-2 pb-1 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
            Discovery
          </div>
          <NavLink
            to="/?topic=standard"
            className={() => navClass({ isActive: isStandardActive })}
          >
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            Standard Niches
          </NavLink>
          <NavLink to="/holidays" className={navClass}>
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.866 8.21 8.21 0 0 0 3 2.48Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 0 0 .495-7.468 5.99 5.99 0 0 0-1.925 3.547 5.975 5.975 0 0 1-2.133-1.001A3.75 3.75 0 0 0 12 18Z" />
            </svg>
            Event Radar
          </NavLink>
          <NavLink to="/research" className={navClass}>
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5" />
            </svg>
            Research
          </NavLink>
          <NavLink to="/design" className={navClass}>
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.4 2.245 4.5 4.5 0 0 0 8.4-2.245c0-.399-.078-.78-.22-1.128Zm0 0a15.998 15.998 0 0 0 3.388-1.62m-5.043-.025a15.994 15.994 0 0 1 1.622-3.395m3.42 3.42a15.995 15.995 0 0 0 4.764-4.648l3.876-5.814a1.151 1.151 0 0 0-1.597-1.597L14.146 6.32a15.996 15.996 0 0 0-4.649 4.763m3.42 3.42a6.776 6.776 0 0 0-3.42-3.42" />
            </svg>
            Prompt Studio
          </NavLink>
        </nav>

        {/* Footer */}
        <div className="mt-auto px-3">
          <div className="text-[11px] text-zinc-700">Sprint 3 · Prompts</div>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <Routes>
          <Route path="/" element={<Discover />} />
          <Route path="/holidays" element={<Holidays />} />
          <Route path="/research" element={<Research />} />
          <Route path="/design" element={<Design />} />
        </Routes>
      </main>
    </div>
  )
}
