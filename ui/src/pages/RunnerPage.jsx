import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { triggerRun } from '../api'
import DotsPattern from '../components/DotsPattern'

const MODELS = [
  { id: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5', note: 'Fast, cheap' },
  { id: 'claude-sonnet-4-6',         label: 'Claude Sonnet 4.6', note: 'Smarter, slower' },
]

export default function RunnerPage() {
  const [question, setQuestion] = useState('')
  const [model, setModel]       = useState(MODELS[0].id)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)
  const navigate = useNavigate()

  async function handleRun() {
    if (!question.trim() || loading) return
    setLoading(true)
    setError(null)
    try {
      const { run_id } = await triggerRun(question.trim(), model)
      navigate(`/runs/${run_id}`)
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleRun()
  }

  return (
    <div className="relative min-h-screen bg-white overflow-hidden">
      <DotsPattern id="runner-dots" opacity={0.14} />
      <div className="absolute top-16 right-20 w-64 h-64 rounded-full bg-[#FBBC05]/8 blur-3xl pointer-events-none" />
      <div className="absolute bottom-16 left-10 w-72 h-72 rounded-full bg-[#EA4335]/6 blur-3xl pointer-events-none" />

      <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white/90 backdrop-blur-md px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link to="/" className="font-bold tracking-tight bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">
            ReAgent
          </Link>
          <span className="text-gray-300 select-none">/</span>
          <Link to="/explorer" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
            Explorer
          </Link>
          <span className="text-gray-300 select-none">/</span>
          <span className="text-sm text-gray-900">New run</span>
        </div>
      </nav>

      <div className="relative max-w-2xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Run agent</h1>
          <p className="text-gray-500 text-sm">
            Ask the agent anything. The full trace will appear in the explorer when complete.
          </p>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">
              Question
            </label>
            <textarea
              value={question}
              onChange={e => setQuestion(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="What caused the 2008 financial crisis ?"
              rows={5}
              disabled={loading}
              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900
                placeholder-gray-300 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100
                disabled:opacity-50 transition-colors resize-none"
            />
            <p className="text-xs text-gray-400 mt-1.5">Cmd+Enter to run</p>
          </div>

          <div>
            <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">
              Model
            </label>
            <div className="grid grid-cols-2 gap-3">
              {MODELS.map(m => (
                <button
                  key={m.id}
                  onClick={() => setModel(m.id)}
                  disabled={loading}
                  className={`p-3 rounded-xl border text-left transition-all
                    ${model === m.id
                      ? 'border-sky-400 bg-sky-50 ring-2 ring-sky-100'
                      : 'border-gray-200 hover:border-gray-300 bg-white'}
                    disabled:opacity-50`}
                >
                  <p className={`text-sm font-medium ${model === m.id ? 'text-sky-700' : 'text-gray-700'}`}>
                    {m.label}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{m.note}</p>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <button
            onClick={handleRun}
            disabled={loading || !question.trim()}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500
              hover:from-sky-400 hover:to-indigo-400
              disabled:opacity-40 disabled:cursor-not-allowed
              text-white font-semibold text-sm transition-all
              shadow-lg shadow-sky-200/60"
          >
            {loading ? <LoadingLabel /> : 'Run'}
          </button>

          {loading && (
            <p className="text-gray-400 text-xs text-center">
              Agent is running. This usually takes 5 to 15 seconds.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function LoadingLabel() {
  return (
    <span className="flex items-center justify-center gap-2">
      <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
      Running
    </span>
  )
}
