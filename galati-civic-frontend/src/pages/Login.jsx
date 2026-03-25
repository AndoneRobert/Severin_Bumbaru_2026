import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
    const [mode, setMode] = useState('login'); // 'login' | 'register'
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPass, setConfirmPass] = useState('');
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [agreedTerms, setAgreedTerms] = useState(false);

    const { login, register } = useAuth();
    const navigate = useNavigate();

    const switchMode = (m) => {
        setMode(m);
        setError('');
        setSuccess('');
        setEmail('');
        setPassword('');
        setConfirmPass('');
        setFullName('');
        setPhone('');
        setAgreedTerms(false);
    };

    const validateRegister = () => {
        if (!fullName.trim()) return 'Numele complet este obligatoriu.';
        if (fullName.trim().length < 3) return 'Numele trebuie să aibă cel puțin 3 caractere.';
        if (!email.includes('@')) return 'Adresa de email nu este validă.';
        if (password.length < 6) return 'Parola trebuie să aibă cel puțin 6 caractere.';
        if (password !== confirmPass) return 'Parolele nu coincid.';
        if (!agreedTerms) return 'Trebuie să accepți termenii și condițiile.';
        return null;
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(email, password);
            navigate('/');
        } catch (err) {
            setError(err.message || 'Email sau parolă incorectă.');
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        const validationErr = validateRegister();
        if (validationErr) { setError(validationErr); return; }
        setLoading(true);
        try {
            // Supabase register — dacă AuthContext are funcția register:
            if (register) {
                await register(email, password, { full_name: fullName, phone });
            }
            setSuccess('Cont creat cu succes! Verifică emailul pentru confirmare, apoi autentifică-te.');
            setTimeout(() => switchMode('login'), 3000);
        } catch (err) {
            setError(err.message || 'Eroare la înregistrare. Încearcă din nou.');
        } finally {
            setLoading(false);
        }
    };

    const passwordStrength = (p) => {
        if (!p) return null;
        if (p.length < 6) return { level: 1, label: 'Slabă', color: '#ef4444' };
        if (p.length < 10 && !/[^a-zA-Z0-9]/.test(p)) return { level: 2, label: 'Medie', color: '#f59e0b' };
        if (p.length >= 10 || /[^a-zA-Z0-9]/.test(p)) return { level: 3, label: 'Bună', color: '#10b981' };
        return null;
    };
    const strength = passwordStrength(password);

    return (
        <div className="auth-page">
            {/* Fundal animat */}
            <div className="auth-bg">
                <div className="auth-blob auth-blob-1" />
                <div className="auth-blob auth-blob-2" />
                <div className="auth-blob auth-blob-3" />
                <div className="auth-grid" />
            </div>

            {/* Card principal */}
            <div className="auth-card" key={mode}>
                {/* Brand */}
                <div className="auth-brand-wrap">
                    <Link to="/" className="auth-brand-link">
                        <span className="auth-brand-icon">🏙️</span>
                        <span className="auth-brand-name">Galați<span>Civic</span></span>
                    </Link>
                    <div className="auth-brand-tagline">Platforma civică a Municipiului Galați</div>
                </div>

                {/* Toggle login / register */}
                <div className="auth-toggle">
                    <button
                        className={`auth-toggle-btn ${mode === 'login' ? 'active' : ''}`}
                        onClick={() => switchMode('login')}
                    >
                        🔐 Autentificare
                    </button>
                    <button
                        className={`auth-toggle-btn ${mode === 'register' ? 'active' : ''}`}
                        onClick={() => switchMode('register')}
                    >
                        ✨ Cont nou
                    </button>
                </div>

                {/* Titlu */}
                <div className="auth-heading">
                    <h1>{mode === 'login' ? 'Bine ai revenit!' : 'Alătură-te comunității'}</h1>
                    <p>
                        {mode === 'login'
                            ? 'Loghează-te pentru a raporta și urmări sesizările din Galați'
                            : 'Creează un cont gratuit și contribuie la îmbunătățirea orașului'}
                    </p>
                </div>

                {/* Eroare / Succes */}
                {error && <div className="auth-alert auth-alert-error"><span>⚠️</span>{error}</div>}
                {success && <div className="auth-alert auth-alert-success"><span>✓</span>{success}</div>}

                {/* ─── FORM LOGIN ─── */}
                {mode === 'login' && (
                    <form onSubmit={handleLogin} className="auth-form">
                        <div className="auth-field">
                            <label>Adresă email</label>
                            <div className="auth-input-wrap">
                                <input
                                    type="email"
                                    placeholder="exemplu@galati.ro"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    required
                                    autoComplete="email"
                                />
                            </div>
                        </div>

                        <div className="auth-field">
                            <div className="auth-label-row">
                                <label>Parolă</label>
                                <button type="button" className="auth-forgot" onClick={() => alert('Funcționalitate în curând.')}>
                                    Ai uitat parola?
                                </button>
                            </div>
                            <div className="auth-input-wrap">
                                <input
                                    type={showPass ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    required
                                    autoComplete="current-password"
                                />
                                <button type="button" className="auth-eye" onClick={() => setShowPass(!showPass)}>
                                    {showPass ? 'Ascunde' : 'Arata'}
                                </button>
                            </div>
                        </div>

                        <button type="submit" className="auth-submit-btn" disabled={loading}>
                            {loading
                                ? <><span className="auth-spinner" /> Se conectează...</>
                                : <><span>🔐</span> Intră în cont</>
                            }
                        </button>

                        <div className="auth-divider"><span>sau</span></div>

                        <button type="button" className="auth-switch-link" onClick={() => switchMode('register')}>
                            Nu ai cont? <strong>Înregistrează-te gratuit →</strong>
                        </button>
                    </form>
                )}

                {/* ─── FORM REGISTER ─── */}
                {mode === 'register' && (
                    <form onSubmit={handleRegister} className="auth-form">
                        {/* Nume complet */}
                        <div className="auth-field">
                            <label>Nume complet <span className="auth-req">*</span></label>
                            <div className="auth-input-wrap">
                                <input
                                    type="text"
                                    placeholder="Ex: Ion Ionescu"
                                    value={fullName}
                                    onChange={e => setFullName(e.target.value)}
                                    required
                                    autoComplete="name"
                                    maxLength={60}
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div className="auth-field">
                            <label>Adresă email <span className="auth-req">*</span></label>
                            <div className="auth-input-wrap">
                                <input
                                    type="email"
                                    placeholder="exemplu@galati.ro"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    required
                                    autoComplete="email"
                                />
                            </div>
                        </div>

                        {/* Telefon (opțional) */}
                        <div className="auth-field">
                            <label>Telefon <span className="auth-optional">(opțional)</span></label>
                            <div className="auth-input-wrap">
                                <input
                                    type="tel"
                                    placeholder="07xx xxx xxx"
                                    value={phone}
                                    onChange={e => setPhone(e.target.value)}
                                    autoComplete="tel"
                                    maxLength={15}
                                />
                            </div>
                        </div>

                        {/* Parolă */}
                        <div className="auth-field">
                            <label>Parolă <span className="auth-req">*</span></label>
                            <div className="auth-input-wrap">
                                <input
                                    type={showPass ? 'text' : 'password'}
                                    placeholder="Minim 6 caractere"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    required
                                    autoComplete="new-password"
                                    minLength={6}
                                />
                                <button type="button" className="auth-eye" onClick={() => setShowPass(!showPass)}>
                                    {showPass ? 'Ascunde' : 'Arata'}
                                </button>
                            </div>
                            {/* Indicator putere parolă */}
                            {strength && (
                                <div className="auth-strength">
                                    <div className="auth-strength-bar">
                                        {[1, 2, 3].map(l => (
                                            <div
                                                key={l}
                                                className="auth-strength-seg"
                                                style={{ background: l <= strength.level ? strength.color : 'rgba(255,255,255,.08)' }}
                                            />
                                        ))}
                                    </div>
                                    <span style={{ color: strength.color }}>{strength.label}</span>
                                </div>
                            )}
                        </div>

                        {/* Confirmare parolă */}
                        <div className="auth-field">
                            <label>Confirmă parola <span className="auth-req">*</span></label>
                            <div className="auth-input-wrap">
                                <input
                                    type={showConfirm ? 'text' : 'password'}
                                    placeholder="Repetă parola"
                                    value={confirmPass}
                                    onChange={e => setConfirmPass(e.target.value)}
                                    required
                                    autoComplete="new-password"
                                    style={{ borderColor: confirmPass && password !== confirmPass ? '#ef4444' : '' }}
                                />
                                <button type="button" className="auth-eye" onClick={() => setShowConfirm(!showConfirm)}>
                                    {showConfirm ? 'Ascunde' : 'Arata'}
                                </button>
                            </div>
                            {confirmPass && password !== confirmPass && (
                                <span className="auth-field-err">Parolele nu coincid</span>
                            )}
                        </div>

                        {/* Termeni */}
                        <label className="auth-checkbox-wrap">
                            <input
                                type="checkbox"
                                checked={agreedTerms}
                                onChange={e => setAgreedTerms(e.target.checked)}
                                className="auth-checkbox"
                            />
                            <span className="auth-checkbox-box" />
                            <span className="auth-checkbox-label">
                                Am citit și accept <a href="/privacy" className="auth-link">Termenii și Condițiile</a> și{' '}
                                <a href="/privacy" className="auth-link">Politica de Confidențialitate</a>
                            </span>
                        </label>

                        <button type="submit" className="auth-submit-btn auth-submit-register" disabled={loading}>
                            {loading
                                ? <><span className="auth-spinner" /> Se creează contul...</>
                                : <><span>🚀</span> Creează cont gratuit</>
                            }
                        </button>

                        <div className="auth-divider"><span>sau</span></div>

                        <button type="button" className="auth-switch-link" onClick={() => switchMode('login')}>
                            Ai deja cont? <strong>Autentifică-te →</strong>
                        </button>
                    </form>
                )}

                {/* Beneficii înregistrare */}
                {mode === 'register' && (
                    <div className="auth-benefits">
                        <div className="auth-benefit"><span>📍</span> Raportează probleme direct pe hartă</div>
                        <div className="auth-benefit"><span>🔔</span> Primești notificări la actualizări</div>
                        <div className="auth-benefit"><span>▲</span>  Votezi sesizările comunității</div>
                        <div className="auth-benefit"><span>🏆</span> Contribui la îmbunătățirea orașului</div>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="auth-page-footer">
                <Link to="/" className="auth-page-footer-link">← Înapoi la hartă</Link>
                <span>·</span>
                <a href="/privacy" className="auth-page-footer-link">Confidențialitate</a>
                <span>·</span>
                <span>© 2026 Galați Civic</span>
            </div>

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Playfair+Display:wght@700&display=swap');

                .auth-page {
                    min-height: 100vh;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 32px 16px 24px;
                    background: #080f1e;
                    position: relative;
                    overflow: hidden;
                    font-family: 'Outfit', system-ui, sans-serif;
                }

                /* Fundal */
                .auth-bg { position: fixed; inset: 0; pointer-events: none; z-index: 0; }
                .auth-grid {
                    position: absolute; inset: 0;
                    background-image:
                        linear-gradient(rgba(59,130,246,.04) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(59,130,246,.04) 1px, transparent 1px);
                    background-size: 48px 48px;
                }
                .auth-blob {
                    position: absolute; border-radius: 50%; filter: blur(80px);
                    animation: blobFloat 8s ease-in-out infinite;
                }
                .auth-blob-1 { width: 500px; height: 500px; background: rgba(59,130,246,.09); top: -180px; left: -100px; animation-delay: 0s; }
                .auth-blob-2 { width: 400px; height: 400px; background: rgba(16,185,129,.07); bottom: -150px; right: -80px; animation-delay: 2.5s; }
                .auth-blob-3 { width: 300px; height: 300px; background: rgba(168,85,247,.06); top: 40%; left: 60%; animation-delay: 5s; }
                @keyframes blobFloat {
                    0%, 100% { transform: translate(0,0) scale(1); }
                    33%  { transform: translate(20px,-15px) scale(1.03); }
                    66%  { transform: translate(-15px,10px) scale(.97); }
                }

                /* Card */
                .auth-card {
                    width: 100%;
                    max-width: 460px;
                    background: rgba(15,26,46,.85);
                    border: 1px solid rgba(255,255,255,.09);
                    border-radius: 22px;
                    padding: 28px 28px 24px;
                    backdrop-filter: blur(20px);
                    box-shadow: 0 32px 80px rgba(0,0,0,.45), 0 0 0 1px rgba(255,255,255,.04) inset;
                    position: relative; z-index: 1;
                    animation: cardIn .4s cubic-bezier(.34,1.56,.64,1) both;
                }
                @keyframes cardIn {
                    from { opacity: 0; transform: translateY(28px) scale(.97); }
                    to   { opacity: 1; transform: translateY(0) scale(1); }
                }

                /* Brand */
                .auth-brand-wrap { text-align: center; margin-bottom: 20px; }
                .auth-brand-link { display: inline-flex; align-items: center; gap: 8px; text-decoration: none; }
                .auth-brand-icon { font-size: 1.8rem; }
                .auth-brand-name {
                    font-family: 'Playfair Display', Georgia, serif;
                    font-size: 1.3rem; font-weight: 700; color: #e8f0fe;
                }
                .auth-brand-name span { color: #3b82f6; }
                .auth-brand-tagline { font-size: 11px; color: #4d6380; margin-top: 4px; letter-spacing: .3px; }

                /* Toggle */
                .auth-toggle {
                    display: flex; gap: 4px;
                    background: rgba(255,255,255,.04);
                    border: 1px solid rgba(255,255,255,.07);
                    border-radius: 12px; padding: 4px;
                    margin-bottom: 20px;
                }
                .auth-toggle-btn {
                    flex: 1; background: none; border: none;
                    color: #4d6380; font-size: 13px; font-weight: 500;
                    font-family: inherit; cursor: pointer; padding: 9px 12px;
                    border-radius: 9px; transition: all .2s;
                }
                .auth-toggle-btn:hover { color: #8fa3c0; }
                .auth-toggle-btn.active {
                    background: linear-gradient(135deg, #1d4ed8, #3b82f6);
                    color: #fff; box-shadow: 0 4px 14px rgba(59,130,246,.35);
                }

                /* Heading */
                .auth-heading { text-align: center; margin-bottom: 20px; }
                .auth-heading h1 { font-size: 1.35rem; font-weight: 700; color: #e8f0fe; margin-bottom: 5px; }
                .auth-heading p  { font-size: 13px; color: #4d6380; line-height: 1.55; }

                /* Alertă */
                .auth-alert {
                    display: flex; align-items: flex-start; gap: 8px;
                    border-radius: 9px; padding: 10px 13px; font-size: 13px;
                    margin-bottom: 14px; line-height: 1.5;
                }
                .auth-alert-error   { background: rgba(239,68,68,.1);  border: 1px solid rgba(239,68,68,.25);  color: #fca5a5; }
                .auth-alert-success { background: rgba(16,185,129,.1); border: 1px solid rgba(16,185,129,.25); color: #6ee7b7; }

                /* Form */
                .auth-form { display: flex; flex-direction: column; gap: 14px; }
                .auth-field { display: flex; flex-direction: column; gap: 5px; }
                .auth-field label { font-size: 11px; font-weight: 600; color: #8fa3c0; text-transform: uppercase; letter-spacing: .55px; }
                .auth-label-row { display: flex; justify-content: space-between; align-items: center; }
                .auth-req { color: #ef4444; }
                .auth-optional { color: #4d6380; font-size: 10px; text-transform: none; letter-spacing: 0; font-weight: 400; }
                .auth-forgot { background: none; border: none; color: #3b82f6; font-size: 11px; cursor: pointer; font-family: inherit; font-weight: 500; padding: 0; transition: color .15s; }
                .auth-forgot:hover { color: #60a5fa; }

                .auth-input-wrap {
                    position: relative; display: flex; align-items: center;
                }
                
                .auth-input-wrap input {
                    width: 100%; padding: 11px 42px 11px 14px;
                    background: rgba(255,255,255,.04);
                    border: 1px solid rgba(255,255,255,.09);
                    border-radius: 10px; color: #e8f0fe; font-family: inherit;
                    font-size: 14px; transition: border .2s, background .2s; outline: none;
                }
                .auth-input-wrap input:focus {
                    border-color: #3b82f6;
                    background: rgba(59,130,246,.04);
                    box-shadow: 0 0 0 3px rgba(59,130,246,.12);
                }
                .auth-input-wrap input::placeholder { color: #4d6380; }
                .auth-eye {
                    position: absolute; right: 10px; background: none; border: none;
                    cursor: pointer; font-size: 14px; padding: 4px; border-radius: 5px;
                    color: #4d6380; transition: color .15s;
                }
                .auth-eye:hover { color: #8fa3c0; }
                .auth-field-err { font-size: 11px; color: #fca5a5; margin-top: 3px; }

                /* Indicator putere parolă */
                .auth-strength { display: flex; align-items: center; gap: 8px; margin-top: 6px; }
                .auth-strength-bar { display: flex; gap: 4px; flex: 1; }
                .auth-strength-seg { flex: 1; height: 3px; border-radius: 2px; transition: background .3s; }
                .auth-strength span { font-size: 11px; font-weight: 600; white-space: nowrap; }

                /* Checkbox termeni */
                .auth-checkbox-wrap {
                    display: flex; align-items: flex-start; gap: 10px; cursor: pointer;
                }
                .auth-checkbox { display: none; }
                .auth-checkbox-box {
                    width: 18px; height: 18px; border: 1.5px solid rgba(255,255,255,.15);
                    border-radius: 5px; flex-shrink: 0; margin-top: 1px;
                    background: rgba(255,255,255,.04); transition: all .2s;
                    position: relative; display: flex; align-items: center; justify-content: center;
                }
                .auth-checkbox:checked + .auth-checkbox-box {
                    background: #3b82f6; border-color: #3b82f6;
                }
                .auth-checkbox:checked + .auth-checkbox-box::after {
                    content: '✓'; font-size: 11px; color: #fff; font-weight: 700;
                }
                .auth-checkbox-label { font-size: 12px; color: #4d6380; line-height: 1.5; }
                .auth-link { color: #3b82f6; text-decoration: none; font-weight: 500; }
                .auth-link:hover { text-decoration: underline; }

                /* Submit */
                .auth-submit-btn {
                    width: 100%; padding: 13px; border-radius: 11px;
                    border: none; font-size: 14px; font-weight: 600; font-family: inherit;
                    cursor: pointer; transition: all .2s;
                    display: flex; align-items: center; justify-content: center; gap: 8px;
                    background: linear-gradient(135deg, #1d4ed8, #3b82f6);
                    color: #fff;
                    box-shadow: 0 4px 18px rgba(59,130,246,.35);
                    margin-top: 4px;
                }
                .auth-submit-btn:hover:not(:disabled) {
                    transform: translateY(-1px);
                    box-shadow: 0 6px 24px rgba(59,130,246,.45);
                }
                .auth-submit-btn:disabled { opacity: .55; cursor: not-allowed; transform: none; }
                .auth-submit-register {
                    background: linear-gradient(135deg, #065f46, #10b981);
                    box-shadow: 0 4px 18px rgba(16,185,129,.3);
                }
                .auth-submit-register:hover:not(:disabled) {
                    box-shadow: 0 6px 24px rgba(16,185,129,.4);
                }

                .auth-spinner {
                    width: 14px; height: 14px;
                    border: 2px solid rgba(255,255,255,.3); border-top-color: #fff;
                    border-radius: 50%; animation: spin .6s linear infinite; display: inline-block;
                }
                @keyframes spin { to { transform: rotate(360deg); } }

                /* Divider */
                .auth-divider {
                    display: flex; align-items: center; gap: 12px;
                    color: #4d6380; font-size: 11px;
                }
                .auth-divider::before, .auth-divider::after {
                    content: ''; flex: 1; height: 1px; background: rgba(255,255,255,.07);
                }

                /* Switch link */
                .auth-switch-link {
                    background: none; border: none; color: #4d6380;
                    font-size: 13px; font-family: inherit; cursor: pointer;
                    text-align: center; line-height: 1.5; padding: 0;
                }
                .auth-switch-link strong { color: #3b82f6; font-weight: 600; }
                .auth-switch-link:hover strong { text-decoration: underline; }

                /* Beneficii */
                .auth-benefits {
                    display: grid; grid-template-columns: 1fr 1fr; gap: 7px;
                    margin-top: 18px; padding-top: 18px;
                    border-top: 1px solid rgba(255,255,255,.06);
                }
                .auth-benefit {
                    display: flex; align-items: center; gap: 7px;
                    font-size: 12px; color: #4d6380;
                    background: rgba(255,255,255,.03);
                    border: 1px solid rgba(255,255,255,.06);
                    border-radius: 8px; padding: 8px 10px;
                }
                .auth-benefit span { font-size: 13px; }

                /* Footer */
                .auth-page-footer {
                    display: flex; align-items: center; gap: 10px;
                    font-size: 12px; color: #4d6380; margin-top: 20px;
                    position: relative; z-index: 1;
                }
                .auth-page-footer-link { color: #4d6380; text-decoration: none; transition: color .15s; }
                .auth-page-footer-link:hover { color: #3b82f6; }

                @media (max-width: 480px) {
                    .auth-card { padding: 22px 18px 20px; }
                    .auth-benefits { grid-template-columns: 1fr; }
                }
            `}</style>
        </div>
    );
};

export default Login;