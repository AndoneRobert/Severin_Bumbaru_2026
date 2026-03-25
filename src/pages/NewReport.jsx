import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import './InnerPage.css'
import './NewReport.css'

// Categoriile hardcodate — le vom lua din DB după ce creăm tabelele
const CATEGORIES = [
  { id: 1, name: 'Drumuri & Asfalt',   icon: '🚧' },
  { id: 2, name: 'Iluminat Stradal',   icon: '💡' },
  { id: 3, name: 'Salubritate',        icon: '🗑️' },
  { id: 4, name: 'Spații Verzi',       icon: '🌳' },
  { id: 5, name: 'Apă & Canalizare',   icon: '🚰' },
  { id: 6, name: 'Transport Public',   icon: '🚌' },
]

const INITIAL_FORM = {
  title:       '',
  description: '',
  category_id: '',
  address:     '',
}

function NewReport() {
  const { user }   = useAuth()
  const navigate   = useNavigate()

  const [form, setForm]         = useState(INITIAL_FORM)
  const [image, setImage]       = useState(null)
  const [preview, setPreview]   = useState(null)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function handleImage(e) {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setError('Poza nu poate depăși 5MB.')
      return
    }
    setImage(file)
    // Preview local fără să urcăm în storage încă
    setPreview(URL.createObjectURL(file))
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      let image_url = null

      // 1. Upload poză — dacă eșuează, continuăm fără poză
      if (image) {
        try {
          const ext      = image.name.split('.').pop()
          const fileName = `${user.id}/${Date.now()}.${ext}`
          const { error: uploadError } = await supabase.storage
            .from('report-images').upload(fileName, image)

          if (!uploadError) {
            const { data: { publicUrl } } = supabase.storage
              .from('report-images').getPublicUrl(fileName)
            image_url = publicUrl
          } else {
            console.warn('Upload poză eșuat, continuăm fără:', uploadError.message)
          }
        } catch {
          console.warn('Storage indisponibil, continuăm fără poză')
        }
      }

      // 2. Insert sesizare
      const { error: insertError } = await supabase
        .from('reports')
        .insert({
          user_id:     user.id,
          category_id: Number(form.category_id),
          title:       form.title,
          description: form.description,
          address:     form.address,
          image_url,
          status:      'new',
        })

      if (insertError) {
        console.error('Insert error:', insertError)
        throw insertError
      }

      navigate('/my-reports')

    } catch (err) {
      const msg = err.message ?? 'Eroare necunoscută'
      setError(
        msg.includes('does not exist')  ? '⚠️ Tabelele lipsesc din Supabase.' :
        msg.includes('violates foreign') ? '⚠️ Profilul tău nu există. Deconectează-te și loghează-te din nou.' :
        msg.includes('row-level')        ? '⚠️ Permisiune refuzată. Verifică că ești logat.' :
        msg
      )
    } finally {
      setLoading(false)
    }
  }

  const isValid = form.title && form.description && form.category_id && form.address

  return (
    <div className="inner-page">
      <div className="inner-page__container">

        {/* HEADER */}
        <div className="inner-page__header">
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>
            ← Înapoi
          </button>
          <div>
            <h1 className="inner-page__title">Sesizare nouă</h1>
            <p className="inner-page__subtitle">
              Completează formularul — primăria va fi notificată instant
            </p>
          </div>
        </div>

        <div className="new-report__layout">

          {/* FORMULAR */}
          <form className="new-report__form card" onSubmit={handleSubmit}>

            {error && (
              <div className="auth-alert auth-alert--error">{error}</div>
            )}

            {/* CATEGORIE */}
            <div className="form-group">
              <label className="form-label">Categoria problemei *</label>
              <div className="category-picker">
                {CATEGORIES.map(cat => (
                  <label
                    key={cat.id}
                    className={`category-option ${form.category_id == cat.id ? 'selected' : ''}`}
                  >
                    <input
                      type="radio"
                      name="category_id"
                      value={cat.id}
                      onChange={handleChange}
                      style={{ display: 'none' }}
                    />
                    <span className="category-option__icon">{cat.icon}</span>
                    <span className="category-option__label">{cat.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* TITLU */}
            <div className="form-group">
              <label className="form-label" htmlFor="title">
                Titlu scurt *
                <span className="form-hint">{form.title.length}/100</span>
              </label>
              <input
                id="title"
                name="title"
                type="text"
                className="form-input"
                placeholder="ex: Groapă mare pe strada Brăilei, nr. 12"
                value={form.title}
                onChange={handleChange}
                maxLength={100}
                required
              />
            </div>

            {/* DESCRIERE */}
            <div className="form-group">
              <label className="form-label" htmlFor="description">
                Descriere detaliată *
              </label>
              <textarea
                id="description"
                name="description"
                className="form-input"
                placeholder="Descrie problema cât mai detaliat: dimensiune, pericol, când a apărut..."
                value={form.description}
                onChange={handleChange}
                rows={4}
                required
                style={{ resize: 'vertical', minHeight: 100 }}
              />
            </div>

            {/* ADRESĂ */}
            <div className="form-group">
              <label className="form-label" htmlFor="address">Adresa exactă *</label>
              <input
                id="address"
                name="address"
                type="text"
                className="form-input"
                placeholder="ex: Str. Brăilei, nr. 45, lângă Blocul C2"
                value={form.address}
                onChange={handleChange}
                required
              />
            </div>

            {/* UPLOAD POZĂ */}
            <div className="form-group">
              <label className="form-label">Fotografie (opțional)</label>
              <label className={`file-upload ${preview ? 'file-upload--has-file' : ''}`}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImage}
                  style={{ display: 'none' }}
                />
                {preview ? (
                  <div className="file-upload__preview">
                    <img src={preview} alt="Preview" />
                    <span className="file-upload__change">Schimbă poza</span>
                  </div>
                ) : (
                  <div className="file-upload__placeholder">
                    <span className="file-upload__icon">📷</span>
                    <span className="file-upload__text">
                      Apasă pentru a adăuga o fotografie
                    </span>
                    <span className="file-upload__hint">JPG, PNG, max 5MB</span>
                  </div>
                )}
              </label>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ justifyContent: 'center' }}
              disabled={loading || !isValid}
            >
              {loading ? '⏳ Se trimite sesizarea...' : '📨 Trimite sesizarea'}
            </button>

          </form>

          {/* SIDEBAR INFO */}
          <div className="new-report__sidebar">
            <div className="card info-card">
              <h3>📋 Ce se întâmplă după?</h3>
              <div className="info-steps">
                <div className="info-step">
                  <div className="info-step__dot" style={{ background: '#3b82f6' }} />
                  <p><strong>Sesizarea e înregistrată</strong> cu status <em>Nouă</em></p>
                </div>
                <div className="info-step">
                  <div className="info-step__dot" style={{ background: '#f59e0b' }} />
                  <p><strong>Primăria o preia</strong> → status <em>În lucru</em></p>
                </div>
                <div className="info-step">
                  <div className="info-step__dot" style={{ background: '#10b981' }} />
                  <p><strong>Problema e rezolvată</strong> → status <em>Rezolvată</em></p>
                </div>
              </div>
            </div>

            <div className="card info-card">
              <h3>⚡ Sfaturi utile</h3>
              <ul className="tips-list">
                <li>Fii specific cu locația (număr, bloc, reper)</li>
                <li>Adaugă o fotografie — crește șansele de rezolvare rapidă</li>
                <li>Titlul scurt ajută la prioritizare</li>
                <li>Nu sesiza același lucru de două ori</li>
              </ul>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

export default NewReport
