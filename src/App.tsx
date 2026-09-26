import { Link, Route, Routes } from 'react-router-dom'
import { HomePage } from './pages/HomePage'
import { RepositoryDetailPage } from './pages/RepositoryDetailPage'
import { useSeo } from './hooks/useSeo'

function NotFoundPage() {
  useSeo({
    title: 'Page not found | FreeLLMAgents',
    description:
      'The page you are looking for does not exist on FreeLLMAgents.',
    noindex: true,
  })
  return (
    <div className="app">
      <main className="main detail">
        <div className="empty detail__empty">
          <h1>Page not found</h1>
          <p>The page you're looking for doesn't exist.</p>
          <Link className="detail__back" to="/">
            &larr; Back to all repositories
          </Link>
        </div>
      </main>
    </div>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/agents/:owner/:repo" element={<RepositoryDetailPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default App
