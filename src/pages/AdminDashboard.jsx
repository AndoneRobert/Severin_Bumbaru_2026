import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import './InnerPage.css'
import './AdminDashboard.css'

const STATUS_MAP = {
  new:         { label: 'Nouă',       cls: 'badge-new'      },
  in_progress: { label: 'În lucru',   cls: 'badge-progress' },
  resolved:    { label: 'Rezolvată',  cls: 'badge-resolved' },
  rejected:    { label: 'Respinsă',   cls: 'badge-rejected' },
}

const NEXT_STATUS = {
  new:         'in_progress',
  in_progress: 'resolved',
  resolved:    null,
  rejected:    null,
}

const NEXT_LABEL = {
  new:         '▶ Marchează În lucru',
  in_progress: '✅ Marchează Rezolvată',
}

function AdminDashboard() {
  const { user }          = useAuth()
  const [reports, setReports]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [updating, setUpdating] = useState(null)   // ID-ul sesizării în curs de update
  const [commentOpen, setCommentOpen] = useState(null)
  const [commentText, setCommentText] = useState('')

  useEffect(() => {
    fetchReports()
  }, [])

  async function fetchReports() {
    setLoading(true)
    const { data, error } = await supabase
      .from('reports')
      .select('*, categories(name), profiles!reports_user_id_fkey(full_name)')
      .order('created_at', { ascending: false })

    if (error) {
      setError(
        error.message.includes('does not exist')
          ? 'db_missing'
          : error.message
      )
    } else {
      setReports(data)
    }
    setLoading(false)
  }

  async function handleStatusChange(reportId, newStatus) {
    setUpdating(reportId)
    const { error } = await supabase
      .from('reports')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', reportId)

    if (!error) {
      setReports(prev =>
        prev.map(r => r.id === reportId ? { ...r, status: newStatus } : r)
      )
      // Trimite notificare proprietarului sesizării
      const report = reports.find(r => r.id === reportId)
      if (report) {
        const statusLabels = { in_progress: 'În lucru', resolved: 'Rezolvată', rejected: 'Respinsă' }
        await supabase.from('notifications').insert({
          user_id:   report.user_id,
          report_id: reportId,
          type:      'status_change',
          message:   `Sesizarea ta „${report.title}" a fost marcată ca ${statusLabels[newStatus] ?? newStatus}.`,
        })
      }
    }
    setUpdating(null)
  }

  async function handleReject(reportId) {
    await handleStatusChange(reportId, 'rejected')
  }

  async function handleAddComment(reportId) {
    if (!commentText.trim()) return
    setUpdating(reportId)

    const { error } = await supabase
      .from('comments')
      .insert({
        report_id: reportId,
        admin_id:  user.id,
        content:   commentText.trim(),
        is_public: true,
      })

    if (!error) {
      // Notificare pentru proprietarul sesizării
      const report = reports.find(r => r.id === reportId)
      if (report) {
        await supabase.from('notifications').insert({
          user_id:   report.user_id,
          report_id: reportId,
          type:      'comment',
          message:   `Primăria a răspuns la sesizarea ta „${report.title}".`,
        })
      }
      setCommentOpen(null)
      setCommentText('')
    }
    setUpdating(null)
  }

  const filtered = filterStatus === 'all'
    ? reports
    : reports.filter(r => r.status === filterStatus)

  const counts = {
    all:         reports.length,
    new:         reports.filter(r => r.status === 'new').length,
    in_progress: reports.filter(r => r.status === 'in_progress').length,
    resolved:    reports.filter(r => r.status === 'resolved').length,
    rejected:    reports.filter(r => r.status === 'rejected').length,
  }

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

        <div className="admin__header">
          <div>
            <h1 className="inner-page__title">⚙️ Panou Administrator</h1>
            <p className="inner-page__subtitle">
              {reports.length} sesizări totale · {counts.new} noi
            </p>
          </div>
          <button className="btn btn-outline btn-sm" onClick={fetchReports}>
            🔄 Reîncarcă
          </button>
        </div>

        {error === 'db_missing' && (
          <div className="auth-alert auth-alert--error" style={{ marginBottom: 24 }}>
            ⚠️ Tabelele nu există în Supabase. Rulează SQL-ul din Pasul 3.
          </div>
        )}

        {/* STATS CARDS */}
        <div className="admin__stats">
          {[
            { key: 'new',         label: 'Noi',       color: '#3b82f6', icon: '🔵' },
            { key: 'in_progress', label: 'În lucru',  color: '#f59e0b', icon: '🟡' },
            { key: 'resolved',    label: 'Rezolvate', color: '#10b981', icon: '🟢' },
            { key: 'rejected',    label: 'Respinse',  color: '#ef4444', icon: '🔴' },
          ].map(s => (
            <div key={s.key} className="admin-stat" style={{ '--stat-color': s.color }}>
              <span className="admin-stat__icon">{s.icon}</span>
              <span className="admin-stat__number">{counts[s.key]}</span>
              <span className="admin-stat__label">{s.label}</span>
            </div>
          ))}
        </div>

        {/* FILTRE */}
        <div className="my-reports__filters" style={{ marginBottom: 20 }}>
          {['all', 'new', 'in_progress', 'resolved', 'rejected'].map(f => (
            <button
              key={f}
              className={`filter-btn ${filterStatus === f ? 'active' : ''}`}
              onClick={() => setFilterStatus(f)}
            >
              {f === 'all' ? `Toate (${counts.all})` : `${STATUS_MAP[f]?.label} (${counts[f]})`}
            </button>
          ))}
        </div>

        {/* TABEL */}
        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon">📋</div>
            <h3 className="empty-state__title">Nicio sesizare</h3>
            <p className="empty-state__desc">Nu există sesizări cu filtrul selectat.</p>
          </div>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Titlu</th>
                  <th>Categorie</th>
                  <th>Adresă</th>
                  <th>Cetățean</th>
                  <th>Data</th>
                  <th>Status</th>
                  <th>Acțiuni</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(report => {
                  const s    = STATUS_MAP[report.status]
                  const next = NEXT_STATUS[report.status]
                  const date = new Date(report.created_at).toLocaleDateString('ro-RO')
                  const isUpdating = updating === report.id

                  return (
                    <tr key={report.id} className={`admin-table__row admin-table__row--${report.status}`}>
                      <td className="admin-table__id">#{report.id}</td>

                      <td className="admin-table__title">
                        <a href={`/report/${report.id}`} target="_blank" rel="noreferrer">
                          {report.title}
                        </a>
                      </td>

                      <td>{report.categories?.name ?? '—'}</td>
                      <td className="admin-table__address">{report.address}</td>
                      <td>{report.profiles?.full_name ?? 'N/A'}</td>
                      <td>{date}</td>

                      <td>
                        <span className={`badge ${s.cls}`}>{s.label}</span>
                      </td>

                      <td>
                        <div className="admin-actions">
                          {next && (
                            <button
                              className="btn btn-primary btn-sm"
                              disabled={isUpdating}
                              onClick={() => handleStatusChange(report.id, next)}
                            >
                              {isUpdating ? '...' : NEXT_LABEL[report.status]}
                            </button>
                          )}

                          {report.status !== 'rejected' && report.status !== 'resolved' && (
                            <button
                              className="btn btn-sm"
                              style={{ background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca' }}
                              disabled={isUpdating}
                              onClick={() => handleReject(report.id)}
                            >
                              ✕ Respinge
                            </button>
                          )}

                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => {
                              setCommentOpen(commentOpen === report.id ? null : report.id)
                              setCommentText('')
                            }}
                          >
                            💬 Comentariu
                          </button>
                        </div>

                        {/* INLINE COMMENT FORM */}
                        {commentOpen === report.id && (
                          <div className="comment-form">
                            <textarea
                              className="form-input"
                              placeholder="Scrie un răspuns public pentru cetățean..."
                              rows={3}
                              value={commentText}
                              onChange={e => setCommentText(e.target.value)}
                              style={{ fontSize: '0.85rem', resize: 'vertical' }}
                            />
                            <div className="comment-form__actions">
                              <button
                                className="btn btn-primary btn-sm"
                                disabled={!commentText.trim() || isUpdating}
                                onClick={() => handleAddComment(report.id)}
                              >
                                {isUpdating ? '...' : 'Publică'}
                              </button>
                              <button
                                className="btn btn-ghost btn-sm"
                                onClick={() => setCommentOpen(null)}
                              >
                                Anulează
                              </button>
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  )
}

export default AdminDashboard
