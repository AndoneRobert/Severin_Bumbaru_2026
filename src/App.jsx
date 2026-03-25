import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar       from './components/Navbar'
import PrivateRoute from './components/PrivateRoute'

// lazy() = pagina se descarcă din rețea DOAR când userul navighează la ea
// În loc de un singur bundle de 617KB, browserul descarcă
// câte un chunk mic per pagină, la nevoie
const Home           = lazy(() => import('./pages/Home'))
const Login          = lazy(() => import('./pages/Login'))
const Register       = lazy(() => import('./pages/Register'))
const NewReport      = lazy(() => import('./pages/NewReport'))
const MyReports      = lazy(() => import('./pages/MyReports'))
const ReportDetail   = lazy(() => import('./pages/ReportDetail'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))
const EditReport     = lazy(() => import('./pages/EditReport'))

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

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <main style={{ flex: 1 }}>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Rute publice */}
            <Route path="/"           element={<Home />} />
            <Route path="/login"      element={<Login />} />
            <Route path="/register"   element={<Register />} />

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
      </main>
    </BrowserRouter>
  )
}

export default App
