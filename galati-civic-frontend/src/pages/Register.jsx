import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Register = () => {
    const [form, setForm]       = useState({ name: '', email: '', password: '', confirm: '' });
    const [error, setError]     = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (form.password !== form.confirm) { setError('Parolele nu coincid.'); return; }
        if (form.password.length < 6)        { setError('Parola trebuie să aibă cel puțin 6 caractere.'); return; }

        setLoading(true);
        try {
            await register(form.email, form.password, form.name);
            // Supabase trimite email de confirmare; afișăm mesaj sau redirectăm
            setSuccess(true);
            setTimeout(() => navigate('/'), 2000);
        } catch (err) {
            setError(err.message || 'Eroare la înregistrare.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="auth-page">
                <div className="auth-card glass-card" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '12px' }}>✅</div>
                    <h2 style={{ color: '#e8f0fe', marginBottom: '10px' }}>Cont creat cu succes!</h2>
                    <p style={{ color: '#4d6380', fontSize: '14px' }}>
                        Verifică emailul pentru confirmare. Vei fi redirecționat...
                    </p>
                </div>
                <style>{`.auth-page{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;background:#080f1e;}`}</style>
            </div>
        );
    }

    return (
        <div className="auth-page">
            <div className="auth-glow auth-glow-green" />
            <div className="auth-card glass-card">
                <div className="auth-header">
                    <div className="auth-icon">✨</div>
                    <div className="auth-brand">Galați<span>Civic</span></div>
                    <h1 className="auth-title">Creează cont</h1>
                    <p className="auth-subtitle">Alătură-te comunității civice din Galați</p>
                </div>

                {error && (
                    <div className="auth-error-box">
                        <span>⚠️</span> {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="input-group">
                        <label>Nume complet</label>
                        <input name="name" type="text" placeholder="Ion Popescu"
                            value={form.name} onChange={handleChange} required autoComplete="name" />
                    </div>
                    <div className="input-group">
                        <label>Adresă Email</label>
                        <input name="email" type="email" placeholder="exemplu@galati.ro"
                            value={form.email} onChange={handleChange} required autoComplete="email" />
                    </div>
                    <div className="input-group">
                        <label>Parolă</label>
                        <input name="password" type="password" placeholder="Minimum 6 caractere"
                            value={form.password} onChange={handleChange} required autoComplete="new-password" />
                    </div>
                    <div className="input-group">
                        <label>Confirmă parola</label>
                        <input name="confirm" type="password" placeholder="Repetă parola"
                            value={form.confirm} onChange={handleChange} required autoComplete="new-password" />
                    </div>

                    <p className="terms-note">
                        Prin înregistrare ești de acord cu <Link to="/privacy" className="auth-link">Politica de confidențialitate</Link>.
                    </p>

                    <button type="submit" className="btn-primary auth-btn" disabled={loading}>
                        {loading ? <><span className="btn-spinner" /> Se înregistrează...</> : '🚀 Creează contul'}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>Ai deja cont? <Link to="/login" className="auth-link">Autentifică-te →</Link></p>
                    <p style={{ marginTop: '8px' }}>
                        <Link to="/" className="auth-link-muted">← Înapoi la hartă</Link>
                    </p>
                </div>
            </div>

            <style>{`
                .auth-page {
                    min-height: 100vh; display: flex; align-items: center; justify-content: center;
                    padding: 24px; background: var(--bg, #080f1e); position: relative; overflow: hidden;
                }
                .auth-glow {
                    position: fixed; top: -150px; left: 50%; transform: translateX(-50%);
                    width: 700px; height: 500px; pointer-events: none; z-index: 0;
                    background: radial-gradient(ellipse, rgba(59,130,246,.14) 0%, transparent 70%);
                }
                .auth-glow-green { background: radial-gradient(ellipse, rgba(16,185,129,.12) 0%, transparent 70%) !important; }
                .auth-card { width: 100%; max-width: 420px; position: relative; z-index: 1; animation: authIn .35s ease both; }
                @keyframes authIn { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
                .auth-header { text-align: center; margin-bottom: 22px; }
                .auth-icon { font-size: 2.2rem; margin-bottom: 8px; }
                .auth-brand { font-family: 'Playfair Display', Georgia, serif; font-size: 1.2rem; font-weight: 700; color: var(--text, #e8f0fe); margin-bottom: 12px; }
                .auth-brand span { color: #3b82f6; }
                .auth-title { font-size: 1.4rem; font-weight: 700; margin-bottom: 5px; color: var(--text, #e8f0fe); }
                .auth-subtitle { font-size: 13px; color: var(--text-muted, #4d6380); }
                .auth-error-box { background: rgba(239,68,68,.1); border: 1px solid rgba(239,68,68,.25); border-radius: 8px; padding: 10px 13px; font-size: 13px; color: #fca5a5; margin-bottom: 14px; display: flex; align-items: center; gap: 8px; }
                .auth-form { display: flex; flex-direction: column; gap: 13px; }
                .input-group { display: flex; flex-direction: column; gap: 5px; }
                .input-group label { font-size: 12px; font-weight: 600; color: var(--text-dim, #8fa3c0); text-transform: uppercase; letter-spacing: .5px; }
                .input-group input { width: 100%; padding: 11px 14px; background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.08); border-radius: 9px; color: var(--text, #e8f0fe); font-family: inherit; font-size: 14px; transition: border .2s; }
                .input-group input:focus { outline: none; border-color: #3b82f6; background: rgba(59,130,246,.04); }
                .input-group input::placeholder { color: var(--text-muted, #4d6380); }
                .terms-note { font-size: 12px; color: var(--text-muted, #4d6380); }
                .auth-btn { width: 100%; justify-content: center; padding: 13px; font-size: 14px; display: flex; align-items: center; gap: 8px; }
                .btn-spinner { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,.3); border-top-color: #fff; border-radius: 50%; animation: spin .6s linear infinite; display: inline-block; flex-shrink: 0; }
                @keyframes spin { to { transform: rotate(360deg); } }
                .auth-footer { text-align: center; margin-top: 20px; font-size: 13px; color: var(--text-muted, #4d6380); }
                .auth-link { color: #3b82f6; text-decoration: none; font-weight: 600; }
                .auth-link:hover { text-decoration: underline; }
                .auth-link-muted { color: var(--text-muted, #4d6380); text-decoration: none; font-size: 12px; }
                .auth-link-muted:hover { color: #8fa3c0; }
            `}</style>
        </div>
    );
};

export default Register;