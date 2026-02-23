export function Design() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-xl font-semibold text-zinc-100 tracking-tight">Design Studio</h1>
          <span className="text-xs text-zinc-600 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded-full">Sprint 3</span>
        </div>
        <p className="text-zinc-500 text-sm">AI design generation — DALL-E, Gemini, downloadable files</p>
      </div>

      <div className="flex flex-col items-center justify-center h-48 border border-dashed border-zinc-800 rounded-xl gap-2">
        <div className="text-2xl opacity-30">🎨</div>
        <p className="text-zinc-600 text-sm">Coming in Sprint 3</p>
        <p className="text-zinc-700 text-xs">Generate designs with multiple AI models, download for Printful</p>
      </div>
    </div>
  )
}
