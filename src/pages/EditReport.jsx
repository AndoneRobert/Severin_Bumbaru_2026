import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import './InnerPage.css'
import './NewReport.css'

const CATEGORIES = [
  { id: 1, name: 'Drumuri & Asfalt', icon: '🚧' },
  { id: 2, name: 'Iluminat Stradal', icon: '💡' },
  { id: 3, name: 'Salubritate', icon: '🗑️' },
  { id: 4, name: 'Spații Verzi', icon: '🌳' },
  { id: 5, name: 'Apă & Canalizare', icon: '🚰' },
  { id: 6, name: 'Transport Public', icon: '🚌' },
]

function EditReport() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({ title: '', description: '', category_id: '', address: '' })
  const [image, setImage] = useState(null)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 8000)

    async function fetchReport() {
      try {
        const { data, error } = await supabase
          .from('reports')
          .select('*')
          .eq('id', id)
          .abortSignal(controller.signal)
          .single()

        if (error || !data) { navigate('/my-reports'); return }

        // Numai owner-ul poate edita
        if (data.user_id !== user.id) { navigate('/my-reports'); return }

        // Numai sesizările noi pot fi editate
        if (data.status !== 'new') { navigate(`/report/${id}`); return }

        setForm({
          title: data.title,
          description: data.description,
          category_id: String(data.category_id),
          address: data.address,
        })
        if (data.image_url) setPreview(data.image_url)
      } catch (e) {
        if (e.name === 'AbortError') setError('Timeout: serverul nu răspunde în 8 secunde.')
        else setError(e?.message ?? 'Eroare la încărcare.')
      } finally {
        clearTimeout(timer)
        setLoading(false)
      }
    }

    fetchReport()
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [id, user.id, navigate])

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function handleImage(e) {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { setError('Poza nu poate depăși 5MB.'); return }
    setImage(file)
    setPreview(URL.createObjectURL(file))
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      let image_url = undefined   // undefined = nu schimbăm câmpul

      if (image) {
        const ext = image.name.split('.').pop()
        const fileName = `${user.id}/${Date.now()}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('report-images').upload(fileName, image)
        if (uploadError) throw uploadError
        const { data: { publicUrl } } = supabase.storage
          .from('report-images').getPublicUrl(fileName)
        image_url = publicUrl
      }

      const update = {
        title: form.title,
        description: form.description,
        category_id: Number(form.category_id),
        address: form.address,
        updated_at: new Date().toISOString(),
        ...(image_url !== undefined && { image_url }),
      }

      const { error: updateError } = await supabase
        .from('reports').update(update).eq('id', id)

      if (updateError) throw updateError
      navigate(`/report/${id}`)

    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
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

  const isValid = form.title && form.description && form.category_id && form.address

  return (
    <div className="inner-page">
      <div className="inner-page__container">

        <div className="inner-page__header">
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>← Înapoi</button>
          <div>
            <h1 className="inner-page__title">✏️ Editează sesizarea</h1>
            <p className="inner-page__subtitle">Poți edita sesizarea cât timp are statusul <strong>Nouă</strong></p>
          </div>
        </div>

        <div className="new-report__layout">
          <form className="new-report__form card" onSubmit={handleSubmit}>

            {error && <div className="auth-alert auth-alert--error">{error}</div>}

            {/* CATEGORIE */}
            <div className="form-group">
              <label className="form-label">Categoria *</label>
              <div className="category-picker">
                {CATEGORIES.map(cat => (
                  <label key={cat.id}
                    className={`category-option ${form.category_id == cat.id ? 'selected' : ''}`}>
                    <input type="radio" name="category_id" value={cat.id}
                      onChange={handleChange} style={{ display: 'none' }} />
                    <span className="category-option__icon">{cat.icon}</span>
                    <span className="category-option__label">{cat.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* TITLU */}
            <div className="form-group">
              <label className="form-label" htmlFor="title">
                Titlu *
                <span className="form-hint">{form.title.length}/100</span>
              </label>
              <input id="title" name="title" type="text" className="form-input"
                value={form.title} onChange={handleChange} maxLength={100} required />
            </div>

            {/* DESCRIERE */}
            <div className="form-group">
              <label className="form-label" htmlFor="description">Descriere *</label>
              <textarea id="description" name="description" className="form-input"
                value={form.description} onChange={handleChange}
                rows={4} required style={{ resize: 'vertical', minHeight: 100 }} />
            </div>

            {/* ADRESĂ */}
            <div className="form-group">
              <label className="form-label" htmlFor="address">Adresa exactă *</label>
              <input id="address" name="address" type="text" className="form-input"
                value={form.address} onChange={handleChange} required />
            </div>

            {/* UPLOAD POZĂ */}
            <div className="form-group">
              <label className="form-label">Fotografie</label>
              <label className={`file-upload ${preview ? 'file-upload--has-file' : ''}`}>
                <input type="file" accept="image/*" onChange={handleImage} style={{ display: 'none' }} />
                {preview ? (
                  <div className="file-upload__preview">
                    <img src={preview} alt="Preview" />
                    <span className="file-upload__change">Schimbă poza</span>
                  </div>
                ) : (
                  <div className="file-upload__placeholder">
                    <span className="file-upload__icon">📷</span>
                    <span className="file-upload__text">Adaugă o fotografie</span>
                    <span className="file-upload__hint">JPG, PNG, max 5MB</span>
                  </div>
                )}
              </label>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" className="btn btn-ghost"
                onClick={() => navigate(-1)} style={{ flex: 1, justifyContent: 'center' }}>
                Anulează
              </button>
              <button type="submit" className="btn btn-primary"
                style={{ flex: 2, justifyContent: 'center' }} disabled={saving || !isValid}>
                {saving ? '⏳ Se salvează...' : '💾 Salvează modificările'}
              </button>
            </div>

          </form>

          <div className="new-report__sidebar">
            <div className="card info-card">
              <h3>⚠️ De reținut</h3>
              <ul className="tips-list">
                <li>Poți edita doar sesizările cu status <strong>Nouă</strong></li>
                <li>Odată preluată de primărie (În lucru), sesizarea nu mai poate fi modificată</li>
                <li>Modificările sunt vizibile imediat public</li>
              </ul>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

export default EditReport
