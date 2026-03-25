import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import './Auth.css'

function Register() {
  const [form, setForm]       = useState({ fullName: '', email: '', password: '' })
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        // Trimitem numele complet în metadata — îl vom salva în profiles printr-un trigger
        data: { full_name: form.fullName }
      }
    })

    if (error) {
      setError(translateError(error.message))
    } else {
      // Supabase trimite email de confirmare — arătăm mesaj de succes
      setSuccess(true)
    }
    setLoading(false)
  }

  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-card auth-card--success">
          <div className="auth-success">
            <div className="auth-success__icon">✉️</div>
            <h2>Verifică emailul!</h2>
            <p>
              Am trimis un link de confirmare la <strong>{form.email}</strong>.
              <br />Apasă pe link pentru a-ți activa contul.
            </p>
            <Link to="/login" className="btn btn-primary" style={{ marginTop: 16 }}>
              Mergi la autentificare
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card__header">
          <div className="auth-card__logo">🏙️</div>
          <h2>Creează cont</h2>
          <p>Alătură-te comunității și ajută la îmbunătățirea orașului</p>
        </div>

        {error && (
          <div className="auth-alert auth-alert--error">
            ⚠️ {error}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="fullName">Nume complet</label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              className="form-input"
              placeholder="Ion Popescu"
              value={form.fullName}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="email">Adresă email</label>
            <input
              id="email"
              name="email"
              type="email"
              className="form-input"
              placeholder="exemplu@email.com"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Parolă</label>
            <input
              id="password"
              name="password"
              type="password"
              className="form-input"
              placeholder="Minim 8 caractere"
              value={form.password}
              onChange={handleChange}
              minLength={8}
              required
            />
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Minim 8 caractere
            </span>
          </div>

          <div className="auth-form__terms">
            <input type="checkbox" id="terms" required />
            <label htmlFor="terms">
              Sunt de acord cu <a href="#">Termenii și Condițiile</a> platformei
            </label>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center' }}
            disabled={loading}
          >
            {loading ? '⏳ Se creează contul...' : 'Creează cont gratuit'}
          </button>
        </form>

        <p className="auth-card__footer">
          Ai deja cont?{' '}
          <Link to="/login" className="auth-card__link">Autentifică-te</Link>
        </p>
      </div>
    </div>
  )
}

function translateError(msg) {
  if (msg.includes('already registered')) return 'Există deja un cont cu acest email.'
  if (msg.includes('Password should be')) return 'Parola trebuie să aibă cel puțin 8 caractere.'
  if (msg.includes('valid email')) return 'Adresa de email nu este validă.'
  if (msg.includes('Too many requests')) return 'Prea multe cereri. Încearcă din nou mai târziu.'
  return msg
}

export default Register
