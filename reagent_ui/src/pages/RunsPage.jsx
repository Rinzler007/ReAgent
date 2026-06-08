import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { fetchRuns } from '../api'
import StatusBadge from '../components/StatusBadge'
import DotsPattern from '../components/DotsPattern'
import { formatDuration, formatTime } from '../utils'

export default function RunsPage() {
  const { data: runs, isLoading, isError } = useQuery({
    queryKey: ['runs'],
    queryFn: fetchRuns,
    refetchInterval: 5000,
  })

  return (
    <div className="relative min-h-screen bg-white overflow-hidden">
      <DotsPattern id="explorer-dots" opacity={0.14} />
      <div className="absolute top-20 right-16 w-72 h-72 rounded-full bg-[#4285F4]/8 blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 left-16 w-64 h-64 rounded-full bg-[#34A853]/8 blur-3xl pointer-events-none" />

      <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white/90 backdrop-blur-md px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="font-bold tracking-tight text-lg bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">
              ReAgent
            </Link>
            <span className="text-gray-300 select-none">/</span>
            <span className="text-sm text-gray-500">Explorer</span>
          </div>
          <Link
            to="/run"
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-400 hover:to-indigo-400 text-white text-sm font-semibold transition-all shadow-lg shadow-sky-200/60"
          >
            New run
          </Link>
        </div>
      </nav>

      <div className="relative max-w-4xl mx-auto p-6">
        {isLoading && (
          <p className="text-gray-400 text-sm">Loading runs...</p>
        )}

        {isError && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200">
            <p className="text-red-600 text-sm">Could not reach the server. Is it running ?</p>
          </div>
        )}

        {runs && runs.length === 0 && (
          <p className="text-gray-400 text-sm">No runs yet. Run an agent to see traces here.</p>
        )}

        {runs && runs.map(run => (
          <Link
            key={run.id}
            to={`/runs/${run.id}`}
            className="block mb-3 p-4 rounded-xl bg-white border border-gray-200 shadow-sm
              hover:border-sky-300 hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <StatusBadge status={run.status} />
                <span className="text-sm font-medium text-gray-900 truncate">
                  {run.agent_name}
                </span>
              </div>
              <div className="flex items-center gap-4 shrink-0 text-xs text-gray-400">
                <span>{run.span_count} spans</span>
                <span>{formatDuration(run.started_at, run.finished_at)}</span>
              </div>
            </div>

            <div className="mt-2 flex items-center gap-4 text-xs text-gray-400">
              <span>{formatTime(run.started_at)}</span>
              {run.metadata?.model && (
                <span className="font-mono bg-gray-50 border border-gray-200 px-2 py-0.5 rounded text-gray-500">
                  {run.metadata.model}
                </span>
              )}
              {run.metadata?.question && (
                <span className="truncate text-gray-500 italic">
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
