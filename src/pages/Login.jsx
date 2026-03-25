import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import './Auth.css'

function Login() {
  const navigate = useNavigate()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(translateError(error.message))
    } else {
      navigate('/')
    }
    setLoading(false)
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card__header">
          <div className="auth-card__logo">📍</div>
          <h2>Bun revenit!</h2>
          <p>Autentifică-te pentru a gestiona sesizările tale</p>
        </div>

        {error && (
          <div className="auth-alert auth-alert--error">
            ⚠️ {error}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Adresă email</label>
            <input
              id="email"
              type="email"
              className="form-input"
              placeholder="exemplu@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">
              Parolă
            </label>
            <input
              id="password"
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center' }}
            disabled={loading}
          >
            {loading ? '⏳ Se autentifică...' : 'Autentificare'}
          </button>
        </form>

        <p className="auth-card__footer">
          Nu ai cont?{' '}
          <Link to="/register" className="auth-card__link">Înregistrează-te gratuit</Link>
        </p>
      </div>
    </div>
  )
}

// Supabase returnează mesaje în engleză — le traducem
function translateError(msg) {
  if (msg.includes('Invalid login')) return 'Email sau parolă incorectă.'
  if (msg.includes('Email not confirmed')) return 'Confirmă-ți emailul înainte să te autentifici.'
  if (msg.includes('Too many requests')) return 'Prea multe încercări. Încearcă din nou mai târziu.'
  return msg
}

export default Login
