import { useState } from 'react'
import KindBadge from './KindBadge'
import { formatDuration } from '../utils'

function JsonBlock({ label, data }) {
  if (!data || Object.keys(data).length === 0) return null
  return (
    <div className="mt-2">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <pre className="text-xs bg-slate-900 rounded p-3 overflow-x-auto text-slate-300 whitespace-pre-wrap">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  )
}

export default function SpanNode({ span, depth = 0 }) {
  const [open, setOpen] = useState(depth === 0)
  const [detailOpen, setDetailOpen] = useState(false)
  const hasChildren = span.children?.length > 0
  const duration = formatDuration(span.started_at, span.finished_at)

  return (
    <div className="my-1">
      <div
        className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer
          hover:bg-slate-700/50 transition-colors
          ${span.error ? 'border border-red-800/50 bg-red-900/10' : 'bg-slate-800/50'}`}
        style={{ marginLeft: depth * 20 }}
        onClick={() => setDetailOpen(v => !v)}
      >
        {hasChildren && (
          <button
            className="text-slate-400 w-4 text-center text-xs shrink-0"
            onClick={e => { e.stopPropagation(); setOpen(v => !v) }}
          >
            {open ? '▾' : '▸'}
          </button>
        )}
        {!hasChildren && <span className="w-4 shrink-0" />}

        <KindBadge kind={span.kind} />
        <span className="text-sm font-medium text-slate-200 flex-1 truncate">{span.name}</span>
        {span.error && <span className="text-xs text-red-400 shrink-0">error</span>}
        <span className="text-xs text-slate-500 shrink-0">{duration}</span>
      </div>

      {detailOpen && (
        <div
          className="mx-3 mb-2 px-3 py-2 rounded-lg bg-slate-900/70 border border-slate-700"
          style={{ marginLeft: depth * 20 + 12 }}
        >
          <JsonBlock label="input"  data={span.input} />
          <JsonBlock label="output" data={span.output} />
          {span.error && (
            <div className="mt-2">
              <p className="text-xs text-red-400 mb-1">error</p>
              <pre className="text-xs bg-slate-900 rounded p-3 text-red-300 whitespace-pre-wrap overflow-x-auto">
                {span.error}
              </pre>
            </div>
          )}
        </div>
      )}

      {open && hasChildren && span.children.map(child => (
        <SpanNode key={child.id} span={child} depth={depth + 1} />
      ))}
    </div>
  )
}
