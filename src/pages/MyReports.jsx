import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import './InnerPage.css'
import './MyReports.css'

const STATUS_MAP = {
  new:         { label: 'Nouă',       cls: 'badge-new',      icon: '🔵' },
  in_progress: { label: 'În lucru',   cls: 'badge-progress', icon: '🟡' },
  resolved:    { label: 'Rezolvată',  cls: 'badge-resolved', icon: '🟢' },
  rejected:    { label: 'Respinsă',   cls: 'badge-rejected', icon: '🔴' },
}

const CAT_ICONS = { 1:'🚧', 2:'💡', 3:'🗑️', 4:'🌳', 5:'🚰', 6:'🚌' }

function MyReports() {
  const { user }    = useAuth()
  const navigate    = useNavigate()
  const [reports, setReports]       = useState([])
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')
  const [filter, setFilter]         = useState('all')
  const [confirmId, setConfirmId]   = useState(null)
  const [deleting, setDeleting]     = useState(false)

  useEffect(() => {
    if (!user?.id) return
    fetchReports()
  }, [user?.id])

  async function fetchReports() {
    setLoading(true)
    setError('')

    let done = false
    const timer = setTimeout(() => {
      if (!done) {
        done = true
        setError('Serverul nu răspunde. Verifică conexiunea la internet.')
        setLoading(false)
      }
    }, 8000)

    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (done) return
      done = true
      clearTimeout(timer)

      if (error) {
        setError(error.message.includes('does not exist') ? 'db_missing' : error.message)
      } else {
        setReports(data ?? [])
      }
    } catch (e) {
      if (done) return
      done = true
      clearTimeout(timer)
      setError('Eroare: ' + e.message)
    } finally {
      if (!done) { done = true; clearTimeout(timer) }
      setLoading(false)
    }
  }

  async function handleDelete(id) {
    setDeleting(true)
    const { error } = await supabase.from('reports').delete().eq('id', id)
    if (!error) {
      setReports(prev => prev.filter(r => r.id !== id))
    }
    setConfirmId(null)
    setDeleting(false)
  }

  const filtered = filter === 'all' ? reports : reports.filter(r => r.status === filter)

  if (loading) {
    return (
      <div className="inner-page">
        <div className="inner-page__container">
          <div className="loading-spinner"><div className="spinner" /><p>Se încarcă...</p></div>
        </div>
      </div>
    )
  }

  return (
    <div className="inner-page">
      <div className="inner-page__container">

        <div className="my-reports__header">
          <div>
            <h1 className="inner-page__title">📁 Sesizările mele</h1>
            <p className="inner-page__subtitle">
              {reports.length > 0
                ? `${reports.length} sesizare${reports.length !== 1 ? 'i' : ''} înregistrată${reports.length !== 1 ? 'e' : ''}`
                : 'Nu ai sesizări înregistrate încă'}
            </p>
          </div>
          <Link to="/report/new" className="btn btn-primary">➕ Sesizare nouă</Link>
        </div>

        {error === 'db_missing' && (
          <div className="auth-alert auth-alert--error" style={{ marginBottom: 24 }}>
            ⚠️ Tabelele lipsesc. Rulează SQL-ul și reîncarcă.
          </div>
        )}
        {error && error !== 'db_missing' && (
          <div className="auth-alert auth-alert--error" style={{ marginBottom: 24 }}>
            ⚠️ {error}
          </div>
        )}

        {reports.length > 0 && (
          <div className="my-reports__filters">
            {['all', 'new', 'in_progress', 'resolved', 'rejected'].map(f => (
              <button key={f} className={`filter-btn ${filter === f ? 'active' : ''}`}
                onClick={() => setFilter(f)}>
                {f === 'all' ? `Toate (${reports.length})` : STATUS_MAP[f]?.label}
              </button>
            ))}
          </div>
        )}

        {/* MODAL CONFIRMARE ȘTERGERE — randat direct pe body ca să nu fie afectat de container */}
        {confirmId && createPortal(
          <div className="confirm-overlay">
            <div className="confirm-modal">
              <div className="confirm-modal__icon">🗑️</div>
              <h3>Ștergi sesizarea?</h3>
              <p>Această acțiune este ireversibilă. Sesizarea și toate datele asociate vor fi șterse definitiv.</p>
              <div className="confirm-modal__actions">
                <button className="btn btn-ghost" onClick={() => setConfirmId(null)}>
                  Anulează
                </button>
                <button
                  className="btn"
                  style={{ background:'#ef4444', color:'#fff' }}
                  disabled={deleting}
                  onClick={() => handleDelete(confirmId)}
                >
                  {deleting ? 'Se șterge...' : 'Da, șterge'}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

        {filtered.length === 0 && !error ? (
          <div className="empty-state">
            <div className="empty-state__icon">📋</div>
            <h3 className="empty-state__title">
              {filter === 'all' ? 'Nu ai sesizări încă' : `Nicio sesizare "${STATUS_MAP[filter]?.label}"`}
            </h3>
            <p className="empty-state__desc">Raportează prima problemă din cartierul tău.</p>
            {filter === 'all' && (
              <Link to="/report/new" className="btn btn-primary">➕ Adaugă prima sesizare</Link>
            )}
          </div>
        ) : (
          <div className="reports-grid">
            {filtered.map(report => (
              <ReportCard
                key={report.id}
                report={report}
                onView={() => navigate(`/report/${report.id}`)}
                onEdit={() => navigate(`/report/${report.id}/edit`)}
                onDelete={() => setConfirmId(report.id)}
              />
            ))}
          </div>
        )}

      </div>
    </div>
  )
}

function ReportCard({ report, onView, onEdit, onDelete }) {
  const s    = STATUS_MAP[report.status] ?? STATUS_MAP.new
  const icon = CAT_ICONS[report.category_id] ?? '📍'
  const date = new Date(report.created_at).toLocaleDateString('ro-RO', {
    day: 'numeric', month: 'short', year: 'numeric'
  })
  const canEdit = report.status === 'new'

  return (
    <div className="report-card">
      {report.image_url && (
        <div className="report-card__image" onClick={onView}>
          <img src={report.image_url} alt={report.title} />
        </div>
      )}

      <div className="report-card__body">
        <div className="report-card__top">
          <span className="report-card__cat-icon">{icon}</span>
          <span className={`badge ${s.cls}`}>{s.label}</span>
        </div>

        <h3 className="report-card__title" onClick={onView} style={{cursor:'pointer'}}>
          {report.title}
        </h3>
        <p className="report-card__address">📍 {report.address}</p>
        {report.categories?.name && (
          <p className="report-card__category">{report.categories.name}</p>
        )}

        <div className="report-card__footer">
          <span className="report-card__date">{date}</span>
        </div>

        {/* BUTOANE ACȚIUNI */}
        <div className="report-card__actions">
          <button className="btn btn-ghost btn-sm" onClick={onView}>
            👁 Vezi
          </button>
          {canEdit && (
            <button className="btn btn-outline btn-sm" onClick={onEdit}>
              ✏️ Editează
            </button>
          )}
          <button
            className="btn btn-sm"
            style={{ background:'#fee2e2', color:'#991b1b', border:'1px solid #fecaca' }}
            onClick={onDelete}
          >
            🗑️ Șterge
          </button>
        </div>
      </div>
    </div>
  )
}

export default MyReports
