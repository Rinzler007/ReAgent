import { useQuery } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import { fetchReplays, fetchRun } from '../api'
import DiffBlock from '../components/DiffBlock'
import DotsPattern from '../components/DotsPattern'
import { formatTime } from '../utils'

export default function ReplayDiffPage() {
  const { runId, diffId } = useParams()

  const { data: replays, isLoading, isError } = useQuery({
    queryKey: ['replays', runId],
    queryFn: () => fetchReplays(runId),
    retry: false,
  })

  const { data: originalRun } = useQuery({
    queryKey: ['run', runId],
    queryFn: () => fetchRun(runId),
  })

  const diff = replays?.find(r => r.id === diffId)

  const { data: replayRun } = useQuery({
    queryKey: ['run', diff?.replay_run_id],
    queryFn: () => fetchRun(diff?.replay_run_id),
    enabled: !!diff?.replay_run_id,
  })

  return (
    <div className="relative min-h-screen bg-white overflow-hidden">
      <DotsPattern id="diff-dots" opacity={0.14} />
      <div className="absolute top-16 right-10 w-64 h-64 rounded-full bg-[#34A853]/8 blur-3xl pointer-events-none" />
      <div className="absolute bottom-16 left-20 w-72 h-72 rounded-full bg-[#EA4335]/6 blur-3xl pointer-events-none" />

      <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white/90 backdrop-blur-md px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <Link to="/" className="font-bold tracking-tight bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">
            ReAgent
          </Link>
          <span className="text-gray-300 select-none">/</span>
          <Link to="/explorer" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
            All runs
          </Link>
          <span className="text-gray-300 select-none">/</span>
          <Link to={`/runs/${runId}`} className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
            Run detail
          </Link>
          <span className="text-gray-300 select-none">/</span>
          <span className="text-sm text-gray-900">Diff</span>
        </div>
      </nav>

      <div className="relative max-w-5xl mx-auto p-6">
        {isLoading && <p className="text-gray-400 text-sm">Loading...</p>}
        {isError && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200">
            <p className="text-red-600 text-sm">Could not load diff.</p>
          </div>
        )}
        {replays && !diff && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200">
            <p className="text-red-600 text-sm">Diff not found.</p>
          </div>
        )}

        {diff && (
          <>
            <div className="mb-6 p-5 rounded-xl bg-white border border-gray-200 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Replay diff</h2>
              <div className="grid grid-cols-2 gap-x-8 gap-y-1.5 text-sm">
                <Row label="Created"               value={formatTime(diff.created_at)} />
                <Row label="LLM outputs changed"   value={diff.summary.llm_output_changes ?? 0} />
                <Row label="Original LLM calls"    value={diff.summary.original_llm_calls ?? 0} />
                <Row label="Replay LLM calls"      value={diff.summary.new_llm_calls ?? 0} />
                <Row label="Tool calls (original)" value={diff.summary.original_tool_calls ?? 0} />
                <Row label="Tool calls (replay)"   value={diff.summary.new_tool_calls ?? 0} />
              </div>

              <div className="mt-5 pt-4 border-t border-gray-100 grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="text-gray-400 mb-1">Original run</p>
                  <p className="font-mono text-gray-600 truncate">{runId}</p>
                  {originalRun?.metadata?.model && (
                    <span className="mt-1 inline-block font-mono bg-gray-50 border border-gray-200 px-2 py-0.5 rounded text-gray-500">
                      {originalRun.metadata.model}
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-gray-400 mb-1">Replay run</p>
                  <p className="font-mono text-gray-600 truncate">{diff.replay_run_id}</p>
                  {replayRun?.metadata?.model && (
                    <span className="mt-1 inline-block font-mono bg-gray-50 border border-gray-200 px-2 py-0.5 rounded text-gray-500">
                      {replayRun.metadata.model}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {diff.summary.changes?.length === 0 && (
              <p className="text-gray-400 text-sm">No LLM output differences detected.</p>
            )}

            {diff.summary.changes?.map((change, i) => (
              <div key={i} className="mb-8">
                <p className="text-sm font-medium text-gray-900 mb-3">
                  LLM call {change.call_index + 1}
                  {change.span_name && (
                    <span className="ml-2 text-xs font-mono text-gray-400">{change.span_name}</span>
                  )}
                </p>
                <DiffBlock
                  originalText={change.original_text}
                  newText={change.new_text}
                />
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <>
      <span className="text-gray-400">{label}</span>
      <span className="text-gray-700">{value}</span>
    </>
  )
}
