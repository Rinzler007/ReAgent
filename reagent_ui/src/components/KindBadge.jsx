const colours = {
  graph:     'bg-violet-900/50 text-violet-300 border border-violet-700',
  node:      'bg-blue-900/50 text-blue-300 border border-blue-700',
  llm_call:  'bg-amber-900/50 text-amber-300 border border-amber-700',
  tool_call: 'bg-teal-900/50 text-teal-300 border border-teal-700',
}

export default function KindBadge({ kind }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded font-mono ${colours[kind] ?? 'bg-slate-700 text-slate-300'}`}>
      {kind}
    </span>
  )
}
