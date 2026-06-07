import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import RunsPage from './pages/RunsPage'
import RunDetailPage from './pages/RunDetailPage'

const queryClient = new QueryClient()

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/"         element={<RunsPage />} />
          <Route path="/runs/:id" element={<RunDetailPage />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
