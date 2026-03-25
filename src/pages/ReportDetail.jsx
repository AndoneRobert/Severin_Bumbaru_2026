import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import './InnerPage.css'
import './ReportDetail.css'

const STATUS_MAP = {
  new:         { label: 'Nouă',       cls: 'badge-new',      color: '#3b82f6' },
  in_progress: { label: 'În lucru',   cls: 'badge-progress', color: '#f59e0b' },
  resolved:    { label: 'Rezolvată',  cls: 'badge-resolved', color: '#10b981' },
  rejected:    { label: 'Respinsă',   cls: 'badge-rejected', color: '#ef4444' },
}

const STATUS_STEPS = ['new', 'in_progress', 'resolved']

function ReportDetail() {
  const { id }         = useParams()
  const navigate       = useNavigate()
  const { user }       = useAuth()

  const [report, setReport]       = useState(null)
  const [comments, setComments]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')
  const [showConfirm, setShowConfirm] = useState(false)

  async function handleDelete() {
    const { error } = await supabase.from('reports').delete().eq('id', id)
    if (!error) navigate('/my-reports')
  }

  useEffect(() => {
    async function fetchData() {
      setLoading(true)

      // Fetch sesizarea
      const { data: reportData, error: rErr } = await supabase
        .from('reports')
        .select('*, categories(name), profiles(full_name)')
        .eq('id', id)
        .single()

      if (rErr) {
        setError(
          rErr.message.includes('does not exist')
            ? 'db_missing'
            : rErr.code === 'PGRST116'
              ? 'Sesizarea nu a fost găsită.'
              : rErr.message
        )
        setLoading(false)
        return
      }

      setReport(reportData)

      // Fetch comentariile publice
      const { data: commentsData } = await supabase
        .from('comments')
        .select('*, profiles(full_name)')
        .eq('report_id', id)
        .eq('is_public', true)
        .order('created_at', { ascending: true })

      setComments(commentsData ?? [])
      setLoading(false)
    }

    fetchData()
  }, [id])

  if (loading) {
    return (
      <div className="inner-page">
        <div className="inner-page__container">
          <div className="loading-spinner"><div className="spinner" /><p>Se încarcă...</p></div>
        </div>
      </div>
    )
  }

  if (error === 'db_missing') {
    return (
      <div className="inner-page">
        <div className="inner-page__container">
          <div className="empty-state">
            <div className="empty-state__icon">⚠️</div>
            <h3 className="empty-state__title">Tabelele nu există încă</h3>
            <p className="empty-state__desc">Rulează SQL-ul din Pasul 3 în Supabase.</p>
            <button className="btn btn-outline" onClick={() => navigate(-1)}>← Înapoi</button>
          </div>
        </div>
      </div>
    )
  }

  if (error || !report) {
    return (
      <div className="inner-page">
        <div className="inner-page__container">
          <div className="empty-state">
            <div className="empty-state__icon">🔍</div>
            <h3 className="empty-state__title">Sesizarea nu a fost găsită</h3>
            <p className="empty-state__desc">{error || 'ID invalid sau sesizarea a fost ștearsă.'}</p>
            <Link to="/" className="btn btn-outline">← Acasă</Link>
          </div>
        </div>
      </div>
    )
  }

  const s    = STATUS_MAP[report.status] ?? STATUS_MAP.new
  const date = new Date(report.created_at).toLocaleDateString('ro-RO', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
  })

  const stepIndex = STATUS_STEPS.indexOf(report.status)

  return (
    <div className="inner-page">
      <div className="inner-page__container">

        <div className="detail__header">
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>← Înapoi</button>
        </div>

        <div className="detail__layout">

          {/* LEFT — conținut principal */}
          <div className="detail__main">

            {/* IMAGINE */}
            {report.image_url && (
              <div className="detail__image-wrapper">
                <img src={report.image_url} alt={report.title} className="detail__image" />
              </div>
            )}

            {/* TITLU & META */}
            <div className="card detail__content">
              <div className="detail__meta-top">
                <span className={`badge ${s.cls}`} style={{ fontSize: '0.85rem', padding: '6px 14px' }}>
                  {s.label}
                </span>
                {report.categories?.name && (
                  <span className="detail__category">{report.categories.name}</span>
                )}
              </div>

              <h1 className="detail__title">{report.title}</h1>

              <div className="detail__info-row">
                <span>📍 {report.address}</span>
                <span>👤 {report.profiles?.full_name ?? 'Anonim'}</span>
                <span>🕐 {date}</span>
              </div>

              <div className="divider" style={{ margin: '20px 0' }} />
              <p className="detail__description">{report.description}</p>
            </div>

            {/* PROGRES STATUS */}
            {report.status !== 'rejected' && (
              <div className="card detail__progress">
                <h3>Stadiul sesizării</h3>
                <div className="progress-steps">
                  {STATUS_STEPS.map((step, i) => {
                    const done    = i <= stepIndex
                    const current = i === stepIndex
                    const st      = STATUS_MAP[step]
                    return (
                      <div key={step} className={`progress-step ${done ? 'done' : ''} ${current ? 'current' : ''}`}>
                        <div className="progress-step__circle" style={{ background: done ? st.color : undefined }}>
                          {done ? '✓' : i + 1}
                        </div>
                        <span className="progress-step__label">{st.label}</span>
                        {i < STATUS_STEPS.length - 1 && (
                          <div className={`progress-step__line ${i < stepIndex ? 'done' : ''}`} />
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* COMENTARII */}
            <div className="card detail__comments">
              <h3>💬 Răspunsuri oficiale ({comments.length})</h3>
              {comments.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  Niciun răspuns oficial încă. Vei fi notificat când primăria adaugă un comentariu.
                </p>
              ) : (
                <div className="comments-list">
                  {comments.map(c => (
                    <div key={c.id} className="comment">
                      <div className="comment__header">
                        <div className="comment__avatar">🏛️</div>
                        <div>
                          <strong>{c.profiles?.full_name ?? 'Admin'}</strong>
                          <span className="comment__date">
                            {new Date(c.created_at).toLocaleDateString('ro-RO')}
                          </span>
                        </div>
                      </div>
                      <p className="comment__text">{c.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* RIGHT — sidebar */}
          <div className="detail__sidebar">
            <div className="card">
              <h3 style={{ marginBottom: 16, fontSize: '1rem' }}>📋 Informații</h3>
              <div className="detail__sidebar-info">
                <div className="sidebar-info-row">
                  <span>ID sesizare</span>
                  <strong>#{report.id}</strong>
                </div>
                <div className="sidebar-info-row">
                  <span>Status</span>
                  <span className={`badge ${s.cls}`}>{s.label}</span>
                </div>
                {report.categories?.name && (
                  <div className="sidebar-info-row">
                    <span>Categorie</span>
                    <strong>{report.categories.name}</strong>
                  </div>
                )}
                <div className="sidebar-info-row">
                  <span>Data</span>
                  <strong>{new Date(report.created_at).toLocaleDateString('ro-RO')}</strong>
                </div>
              </div>
            </div>

            {/* Acțiuni owner */}
            {user && user.id === report.user_id && (
              <div className="card" style={{ display:'flex', flexDirection:'column', gap:10 }}>
                <p style={{ fontSize:'0.85rem', color:'var(--text-muted)' }}>
                  Aceasta este sesizarea ta.
                </p>
                {report.status === 'new' && (
                  <Link to={`/report/${report.id}/edit`}
                    className="btn btn-outline"
                    style={{ width:'100%', justifyContent:'center' }}>
                    ✏️ Editează sesizarea
                  </Link>
                )}
                <button
                  className="btn btn-sm"
                  style={{ background:'#fee2e2', color:'#991b1b', border:'1px solid #fecaca', justifyContent:'center' }}
                  onClick={() => setShowConfirm(true)}
                >
                  🗑️ Șterge sesizarea
                </button>
                <Link to="/my-reports" className="btn btn-ghost btn-sm"
                  style={{ justifyContent:'center' }}>
                  ← Sesizările mele
                </Link>
              </div>
            )}

            {/* MODAL CONFIRMARE */}
            {showConfirm && (
              <div className="confirm-overlay">
                <div className="confirm-modal">
                  <div className="confirm-modal__icon">🗑️</div>
                  <h3>Ștergi sesizarea?</h3>
                  <p>Acțiunea este ireversibilă.</p>
                  <div className="confirm-modal__actions">
                    <button className="btn btn-ghost" onClick={() => setShowConfirm(false)}>
                      Anulează
                    </button>
                    <button className="btn"
                      style={{ background:'#ef4444', color:'#fff' }}
                      onClick={handleDelete}>
                      Da, șterge
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}

export default ReportDetail
