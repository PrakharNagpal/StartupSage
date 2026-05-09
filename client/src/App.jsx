import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { Layout } from './components/Layout.jsx'
import { Home } from './pages/Home.jsx'
import { SubmitIdea } from './pages/SubmitIdea.jsx'
import { LiveSession } from './pages/LiveSession.jsx'
import { Report } from './pages/Report.jsx'
import './App.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

function AnimatedRoutes() {
  const location = useLocation()

  return (
    <Layout>
      <main className="route-shell" key={location.pathname}>
        <Routes location={location}>
          <Route path="/" element={<Home />} />
          <Route path="/submit" element={<SubmitIdea />} />
          <Route path="/session/:id" element={<LiveSession />} />
          <Route path="/report/:id" element={<Report />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </Layout>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AnimatedRoutes />
      </BrowserRouter>
    </QueryClientProvider>
  )
}
