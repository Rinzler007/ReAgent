import { useState } from 'react'
import KindBadge from './KindBadge'
import { formatDuration } from '../utils'

function JsonBlock({ label, data }) {
  if (!data || Object.keys(data).length === 0) return null
  return (
    <div className="mt-2">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <pre className="text-xs bg-gray-900 rounded p-3 overflow-x-auto text-gray-300 whitespace-pre-wrap">
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
    <div className="my-0.5">
      <div
        className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors
          ${span.error
            ? 'border border-red-200 bg-red-50 hover:bg-red-100/60'
            : 'bg-gray-50 hover:bg-gray-100 border border-transparent hover:border-gray-200'}`}
        style={{ marginLeft: depth * 20 }}
        onClick={() => setDetailOpen(v => !v)}
      >
        {hasChildren && (
          <button
            className="text-gray-400 w-4 text-center text-xs shrink-0"
            onClick={e => { e.stopPropagation(); setOpen(v => !v) }}
          >
            {open ? '▾' : '▸'}
          </button>
        )}
        {!hasChildren && <span className="w-4 shrink-0" />}

        <KindBadge kind={span.kind} />
        <span className="text-sm font-medium text-gray-900 flex-1 truncate">{span.name}</span>
        {span.error && <span className="text-xs text-red-500 shrink-0">error</span>}
        <span className="text-xs text-gray-400 shrink-0">{duration}</span>
      </div>

      {detailOpen && (
        <div
          className="mx-3 mb-2 px-3 py-2 rounded-lg bg-gray-50 border border-gray-200"
          style={{ marginLeft: depth * 20 + 12 }}
        >
          <JsonBlock label="input"  data={span.input} />
          <JsonBlock label="output" data={span.output} />
          {span.error && (
            <div className="mt-2">
              <p className="text-xs text-red-500 mb-1">error</p>
              <pre className="text-xs bg-gray-900 rounded p-3 text-red-300 whitespace-pre-wrap overflow-x-auto">
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
