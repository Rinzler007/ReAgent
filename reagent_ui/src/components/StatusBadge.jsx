const colours = {
  completed: 'bg-emerald-900/50 text-emerald-300 border border-emerald-700',
  failed:    'bg-red-900/50 text-red-300 border border-red-700',
  running:   'bg-yellow-900/50 text-yellow-300 border border-yellow-700',
}

export default function StatusBadge({ status }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colours[status] ?? 'bg-slate-700 text-slate-300'}`}>
      {status}
    </span>
  )
}
