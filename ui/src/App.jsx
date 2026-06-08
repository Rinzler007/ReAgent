import { Component } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import LandingPage    from './pages/LandingPage'
import RunsPage       from './pages/RunsPage'
import RunDetailPage  from './pages/RunDetailPage'
import ReplayDiffPage from './pages/ReplayDiffPage'
import RunnerPage     from './pages/RunnerPage'

const queryClient = new QueryClient()

class ErrorBoundary extends Component {
  state = { error: null }
  static getDerivedStateFromError(error) { return { error } }
  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
          <div className="max-w-lg w-full p-6 rounded-xl bg-white border border-red-200 shadow-sm">
            <p className="text-red-600 font-medium mb-2">Something went wrong</p>
            <pre className="text-xs text-gray-500 whitespace-pre-wrap break-words">
              {this.state.error.message}
            </pre>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            <Route path="/"                              element={<LandingPage />} />
            <Route path="/explorer"                      element={<RunsPage />} />
            <Route path="/run"                           element={<RunnerPage />} />
            <Route path="/runs/:id"                      element={<RunDetailPage />} />
            <Route path="/runs/:runId/replays/:diffId"   element={<ReplayDiffPage />} />
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}
