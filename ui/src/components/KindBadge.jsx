const colours = {
  graph:     'bg-violet-50 text-violet-700 border border-violet-200',
  node:      'bg-sky-50 text-sky-700 border border-sky-200',
  llm_call:  'bg-amber-50 text-amber-700 border border-amber-200',
  tool_call: 'bg-teal-50 text-teal-700 border border-teal-200',
}

export default function KindBadge({ kind }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded font-mono ${colours[kind] ?? 'bg-gray-100 text-gray-600 border border-gray-200'}`}>
      {kind}
    </span>
  )
}
