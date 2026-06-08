const colours = {
  completed: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  failed:    'bg-red-50 text-red-700 border border-red-200',
  running:   'bg-amber-50 text-amber-700 border border-amber-200',
}

export default function StatusBadge({ status }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colours[status] ?? 'bg-gray-100 text-gray-600 border border-gray-200'}`}>
      {status}
    </span>
  )
}
