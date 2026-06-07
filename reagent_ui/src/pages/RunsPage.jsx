import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { fetchRuns } from '../api'
import StatusBadge from '../components/StatusBadge'
import { formatDuration, formatTime } from '../utils'

export default function RunsPage() {
  const { data: runs, isLoading, isError } = useQuery({
    queryKey: ['runs'],
    queryFn: fetchRuns,
    refetchInterval: 5000,
  })

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">ReAgent</h1>
          <p className="text-slate-400 text-sm mt-1">Trace explorer</p>
        </div>

        {isLoading && (
          <p className="text-slate-400 text-sm">Loading runs...</p>
        )}

        {isError && (
          <p className="text-red-400 text-sm">Could not reach the server. Is it running?</p>
        )}

        {runs && runs.length === 0 && (
          <p className="text-slate-500 text-sm">No runs yet. Run an agent to see traces here.</p>
        )}

        {runs && runs.map(run => (
          <Link
            key={run.id}
            to={`/runs/${run.id}`}
            className="block mb-3 p-4 rounded-xl bg-slate-800/60 border border-slate-700
              hover:border-slate-500 hover:bg-slate-800 transition-colors"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <StatusBadge status={run.status} />
                <span className="text-sm font-medium text-slate-200 truncate">
                  {run.agent_name}
                </span>
              </div>
              <div className="flex items-center gap-4 shrink-0 text-xs text-slate-500">
                <span>{run.span_count} spans</span>
                <span>{formatDuration(run.started_at, run.finished_at)}</span>
              </div>
            </div>

            <div className="mt-2 flex items-center gap-4 text-xs text-slate-500">
              <span>{formatTime(run.started_at)}</span>
              {run.metadata?.model && (
                <span className="font-mono bg-slate-900 px-2 py-0.5 rounded text-slate-400">
                  {run.metadata.model}
                </span>
              )}
              {run.metadata?.question && (
                <span className="truncate text-slate-400 italic">
                  "{run.metadata.question}"
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
