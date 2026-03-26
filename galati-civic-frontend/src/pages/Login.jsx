import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from './Login.module.css';

const m = (classNames) => classNames.split(/\s+/).filter(Boolean).map((cn) => styles[cn] || cn).join(' ');

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
            setSuccess('Cont creat cu succes');
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
        <div className={m('auth-page')}>
            {/* Fundal animat */}
            <div className={m('auth-bg')}>
                <div className={m('auth-blob auth-blob-1')} />
                <div className={m('auth-blob auth-blob-2')} />
                <div className={m('auth-blob auth-blob-3')} />
                <div className={m('auth-grid')} />
            </div>

            {/* Card principal */}
            <div className={m('auth-card')} key={mode}>
                {/* Brand */}
                <div className={m('auth-brand-wrap')}>
                    <Link to="/" className={m('auth-brand-link')}>
                        <span className={m('auth-brand-icon')}></span>
                        <span className={m('auth-brand-name')}>Galați<span>Civic</span></span>
                    </Link>
                    <div className={m('auth-brand-tagline')}>Platforma civică a Municipiului Galați</div>
                </div>

                {/* Toggle login / register */}
                <div className={m('auth-toggle')}>
                    <button
                        className={m(`auth-toggle-btn ${mode === 'login' ? 'active' : ''}`)}
                        onClick={() => switchMode('login')}
                    >
                        Autentificare
                    </button>
                    <button
                        className={m(`auth-toggle-btn ${mode === 'register' ? 'active' : ''}`)}
                        onClick={() => switchMode('register')}
                    >
                        Cont nou
                    </button>
                </div>

                {/* Titlu */}
                <div className={m('auth-heading')}>
                    <h1>{mode === 'login' ? 'Bine ai revenit!' : 'Alătură-te comunității'}</h1>
                    <p>
                        {mode === 'login'
                            ? 'Loghează-te pentru a raporta și urmări sesizările din Galați'
                            : 'Creează un cont gratuit și contribuie la îmbunătățirea orașului'}
                    </p>
                </div>

                {/* Eroare / Succes */}
                {error && <div className={m('auth-alert auth-alert-error')}><span>Eroare:</span>{error}</div>}
                {success && <div className={m('auth-alert auth-alert-success')}><span>OK</span>{success}</div>}

                {/* ─── FORM LOGIN ─── */}
                {mode === 'login' && (
                    <form onSubmit={handleLogin} className={m('auth-form')}>
                        <div className={m('auth-field')}>
                            <label>Adresă email</label>
                            <div className={m('auth-input-wrap')}>
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

                        <div className={m('auth-field')}>
                            <div className={m('auth-label-row')}>
                                <label>Parolă</label>
                                <button type="button" className={m('auth-forgot')} onClick={() => alert('Funcționalitate în curând.')}>
                                    Ai uitat parola?
                                </button>
                            </div>
                            <div className={m('auth-input-wrap')}>
                                <input
                                    type={showPass ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    required
                                    autoComplete="current-password"
                                />
                                <button type="button" className={m('auth-eye')} onClick={() => setShowPass(!showPass)}>
                                    {showPass ? 'Ascunde' : 'Arata'}
                                </button>
                            </div>
                        </div>

                        <button type="submit" className={m('auth-submit-btn')} disabled={loading}>
                            {loading
                                ? <><span className={m('auth-spinner')} /> Se conectează...</>
                                : <><span>🔐</span> Intră în cont</>
                            }
                        </button>

                        <div className={m('auth-divider')}><span>sau</span></div>

                        <button type="button" className={m('auth-switch-link')} onClick={() => switchMode('register')}>
                            Nu ai cont? <strong>Înregistrează-te gratuit →</strong>
                        </button>
                    </form>
                )}

                {/* ─── FORM REGISTER ─── */}
                {mode === 'register' && (
                    <form onSubmit={handleRegister} className={m('auth-form')}>
                        {/* Nume complet */}
                        <div className={m('auth-field')}>
                            <label>Nume complet <span className={m('auth-req')}>*</span></label>
                            <div className={m('auth-input-wrap')}>
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
                        <div className={m('auth-field')}>
                            <label>Adresă email <span className={m('auth-req')}>*</span></label>
                            <div className={m('auth-input-wrap')}>
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
                        <div className={m('auth-field')}>
                            <label>Telefon <span className={m('auth-optional')}>(opțional)</span></label>
                            <div className={m('auth-input-wrap')}>
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
                        <div className={m('auth-field')}>
                            <label>Parolă <span className={m('auth-req')}>*</span></label>
                            <div className={m('auth-input-wrap')}>
                                <input
                                    type={showPass ? 'text' : 'password'}
                                    placeholder="Minim 6 caractere"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    required
                                    autoComplete="new-password"
                                    minLength={6}
                                />
                                <button type="button" className={m('auth-eye')} onClick={() => setShowPass(!showPass)}>
                                    {showPass ? 'Ascunde' : 'Arata'}
                                </button>
                            </div>
                            {/* Indicator putere parolă */}
                            {strength && (
                                <div className={m('auth-strength')}>
                                    <div className={m('auth-strength-bar')}>
                                        {[1, 2, 3].map(l => (
                                            <div
                                                key={l}
                                                className={m('auth-strength-seg')}
                                                style={{ background: l <= strength.level ? strength.color : 'rgba(255,255,255,.08)' }}
                                            />
                                        ))}
                                    </div>
                                    <span style={{ color: strength.color }}>{strength.label}</span>
                                </div>
                            )}
                        </div>

                        {/* Confirmare parolă */}
                        <div className={m('auth-field')}>
                            <label>Confirmă parola <span className={m('auth-req')}>*</span></label>
                            <div className={m('auth-input-wrap')}>
                                <input
                                    type={showConfirm ? 'text' : 'password'}
                                    placeholder="Repetă parola"
                                    value={confirmPass}
                                    onChange={e => setConfirmPass(e.target.value)}
                                    required
                                    autoComplete="new-password"
                                    style={{ borderColor: confirmPass && password !== confirmPass ? '#ef4444' : '' }}
                                />
                                <button type="button" className={m('auth-eye')} onClick={() => setShowConfirm(!showConfirm)}>
                                    {showConfirm ? 'Ascunde' : 'Arata'}
                                </button>
                            </div>
                            {confirmPass && password !== confirmPass && (
                                <span className={m('auth-field-err')}>Parolele nu coincid</span>
                            )}
                        </div>

                        {/* Termeni */}
                        <label className={m('auth-checkbox-wrap')}>
                            <input
                                type="checkbox"
                                checked={agreedTerms}
                                onChange={e => setAgreedTerms(e.target.checked)}
                                className={m('auth-checkbox')}
                            />
                            <span className={m('auth-checkbox-box')} />
                            <span className={m('auth-checkbox-label')}>
                                Am citit și accept <a href="/privacy" className={m('auth-link')}>Termenii și Condițiile</a> și{' '}
                                <a href="/privacy" className={m('auth-link')}>Politica de Confidențialitate</a>
                            </span>
                        </label>

                        <button type="submit" className={m('auth-submit-btn auth-submit-register')} disabled={loading}>
                            {loading
                                ? <><span className={m('auth-spinner')} /> Se creează contul...</>
                                : <>Creează cont gratuit</>
                            }
                        </button>

                        <div className={m('auth-divider')}><span>sau</span></div>

                        <button type="button" className={m('auth-switch-link')} onClick={() => switchMode('login')}>
                            Ai deja cont? <strong>Autentifică-te →</strong>
                        </button>
                    </form>
                )}

                {/* Beneficii înregistrare */}
                {mode === 'register' && (
                    <div className={m('auth-benefits')}>
                        <div className={m('auth-benefit')}>Raportează probleme direct pe hartă</div>
                        <div className={m('auth-benefit')}>Primești notificări la actualizări</div>
                        <div className={m('auth-benefit')}><span>▲</span>  Votezi sesizările comunității</div>
                        <div className={m('auth-benefit')}>Contribui la îmbunătățirea orașului</div>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className={m('auth-page-footer')}>
                <Link to="/" className={m('auth-page-footer-link')}>← Înapoi la hartă</Link>
                <span>·</span>
                <a href="/privacy" className={m('auth-page-footer-link')}>Confidențialitate</a>
                <span>·</span>
                <span>© 2026 Galați Civic</span>
            </div>
        </div>
    );
};

export default Login;