import { Component, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import PrivateRoute from './components/PrivateRoute'

// lazy() = pagina se descarcă din rețea DOAR când userul navighează la ea
// În loc de un singur bundle de 617KB, browserul descarcă
// câte un chunk mic per pagină, la nevoie
const Home = lazy(() => import('./pages/Home'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const NewReport = lazy(() => import('./pages/NewReport'))
const MyReports = lazy(() => import('./pages/MyReports'))
const ReportDetail = lazy(() => import('./pages/ReportDetail'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))
const EditReport = lazy(() => import('./pages/EditReport'))

// Suspense arată un fallback în timp ce chunk-ul se descarcă
// Îl facem discret — doar un spinner mic în colț
function PageLoader() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      color: 'var(--text-muted)',
      fontSize: '0.9rem',
    }}>
      <div style={{
        width: 24, height: 24,
        border: '2.5px solid var(--border)',
        borderTopColor: 'var(--primary)',
        borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
      }} />
      Se încarcă...
    </div>
  )
}

class RouteErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, message: '' }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message ?? 'Eroare necunoscută la încărcarea paginii.' }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          padding: 24,
          textAlign: 'center',
          color: 'var(--text)',
        }}>
          <div>
            <h2 style={{ marginBottom: 8 }}>Nu s-a putut încărca pagina.</h2>
            <p style={{ color: 'var(--text-muted)' }}>{this.state.message}</p>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}


function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <main style={{ flex: 1 }}>
        <RouteErrorBoundary>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Rute publice */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Rute private — /report/new trebuie să fie ÎNAINTE de /report/:id */}
              <Route path="/report/new" element={
                <PrivateRoute><NewReport /></PrivateRoute>
              } />
              <Route path="/report/:id/edit" element={
                <PrivateRoute><EditReport /></PrivateRoute>
              } />
              <Route path="/report/:id" element={<ReportDetail />} />
              <Route path="/my-reports" element={
                <PrivateRoute><MyReports /></PrivateRoute>
              } />
              <Route path="/admin" element={
                <PrivateRoute><AdminDashboard /></PrivateRoute>
              } />
            </Routes>
          </Suspense>
        </RouteErrorBoundary>
      </main>
    </BrowserRouter>
  )
}

export default App
