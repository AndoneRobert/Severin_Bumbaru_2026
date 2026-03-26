import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiClient, authConfig } from '../services/apiClient';

import BaseMap from '../features/map/components/BaseMap';
import LocationPickerLayer from '../features/map/components/LocationPickerLayer';
import { SELECTED_ICON } from '../features/map/utils/mapIcons';
import styles from './Navbar.module.css';

const m = (classNames) => classNames.split(/\s+/).filter(Boolean).map((cn) => styles[cn] || cn).join(' ');

const CATEGORIES = [
    { value: 'Infrastructură', icon: '🛣️' },
    { value: 'Iluminat', icon: '💡' },
    { value: 'Apă/Canal', icon: '💧' },
    { value: 'Spații verzi', icon: '🌳' },
    { value: 'Salubritate', icon: '🗑️' },
    { value: 'Zgomot/Poluare', icon: '🔊' },
    { value: 'Vandalism', icon: '🚧' },
    { value: 'Trafic/Parcare', icon: '🚗' },
    { value: 'Altele', icon: '📋' },
];
const PRIORITIES = [
    { value: 'Scăzută', color: '#22c55e' },
    { value: 'Medie', color: '#eab308' },
    { value: 'Ridicată', color: '#f97316' },
    { value: 'Urgentă', color: '#ef4444' },
];
const GALATI_CENTER = [45.4353, 28.0080];


export default function Navbar() {
    const { user, isAdmin, isAuthenticated, logout, displayName, avatarInitial, getToken } = useAuth();
    const [menuOpen, setMenuOpen] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [reportOpen, setReportOpen] = useState(false); // Panoul de raportare
    const [step, setStep] = useState(1);     // 1=locație, 2=detalii, 3=succes

    // Form state
    const [form, setForm] = useState({ title: '', description: '', category: 'Infrastructură', priority: 'Medie' });
    const [location, setLocation] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [formErrors, setFormErrors] = useState({});

    const menuRef = useRef(null);
    const panelRef = useRef(null);
    const location_ = useLocation();
    const navigate = useNavigate();
    const useMock = import.meta.env.VITE_USE_MOCK === 'true';

    // Închide dropdown la click afară
    useEffect(() => {
        const h = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, []);

    // Închide mobile menu la schimbare rută
    useEffect(() => { setMobileOpen(false); }, [location_.pathname]);

    // Blochează scroll când panoul e deschis
    useEffect(() => {
        document.body.style.overflow = reportOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [reportOpen]);

    const openReport = () => {
        if (!isAuthenticated) { navigate('/login'); return; }
        navigate('/create-issue');
    };

    const closeReport = () => { setReportOpen(false); setStep(1); };

    const handleLogout = async () => {
        setMenuOpen(false);
        await logout();
        navigate('/');
    };

    const validate = () => {
        const errs = {};
        if (!form.title.trim()) errs.title = 'Titlul este obligatoriu.';
        if (!form.description.trim()) errs.description = 'Descrierea este obligatorie.';
        if (!location) errs.location = 'Selectează locația pe hartă.';
        return errs;
    };

    const resolveSubmitError = (error, fallbackMessage = 'Eroare la trimitere. Încearcă din nou.') => {
        const status = error?.status;
        const apiMessage = error?.apiMessage;

        if (status === 401) {
            return 'Sesiunea a expirat. Te rugăm să te autentifici din nou.';
        }
        if (status === 400 && apiMessage) {
            return `Date invalide: ${apiMessage}`;
        }
        if (status === 500) {
            return apiMessage || 'Serverul a întâmpinat o eroare la trimitere. Încearcă din nou în câteva momente.';
        }
        if (apiMessage) return apiMessage;
        if (error?.message) return error.message;
        return fallbackMessage;
    };

    const handleSubmit = async () => {
        const errs = validate();
        if (Object.keys(errs).length) { setFormErrors(errs); return; }
        setSubmitting(true);
        try {
            if (useMock) {
                await new Promise(r => setTimeout(r, 900));
            } else {
                const token = (await getToken?.()) || user?.token;
                const response = await fetch(`${apiUrl}/issues`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                    body: JSON.stringify({
                        ...form,
                        lat: location.lat,
                        lng: location.lng,
                        user_id: user?.id ?? null,
                    }),
                });
                if (!response.ok) {
                    let apiMessage = '';
                    try {
                        const payload = await response.json();
                        apiMessage = payload?.error || payload?.message || '';
                    } catch {
                        // ignore parse errors and keep fallback below
                    }

                    const submitError = new Error('Eroare la trimitere. Încearcă din nou.');
                    submitError.status = response.status;
                    submitError.apiMessage = apiMessage;
                    throw submitError;
                }
            }
            setStep(3);
        } catch (error) {
            setFormErrors({ submit: resolveSubmitError(error) });
        } finally { setSubmitting(false); }
    };

    const isActive = (path) => location_.pathname === path;
    const charCount = (val, max) => (
        <span style={{ fontSize: '10px', color: val.length > max * .85 ? '#f59e0b' : '#4d6380' }}>
            {val.length}/{max}
        </span>
    );

    return (
        <>
            {/* ═══════════════════════════ NAVBAR ═══════════════════════════ */}
            <nav className={m('navbar')}>
                {/* Brand */}
                <div className={m('nav-brand')}>
                    <Link to="/">
                        <span className={m('nav-logo-icon')}>🏙️</span>
                        Galați<span>Civic</span>
                    </Link>
                </div>

                {/* Links desktop */}
                <div className={m(`nav-links ${mobileOpen ? 'nav-links-open' : ''}`)}>
                    <Link to="/" className={m(`nav-link ${isActive('/') ? 'nav-link-active' : ''}`)}>🗺 Hartă</Link>
                    <Link to="/dashboard" className={m(`nav-link ${isActive('/dashboard') ? 'nav-link-active' : ''}`)}>📋 Sesizări</Link>
                    {isAuthenticated && (
                        <>
                            <Link to="/my-issues" className={m(`nav-link ${isActive('/my-issues') ? 'nav-link-active' : ''}`)}>📂 Sesizările mele</Link>
                            <Link to="/create-issue" className={m(`nav-link ${isActive('/create-issue') ? 'nav-link-active' : ''}`)}>✚ Raportează</Link>
                        </>
                    )}
                    {isAdmin && (
                        <Link to="/admin" className={m(`nav-link nav-link-admin ${isActive('/admin') ? 'nav-link-active' : ''}`)}>⚙️ Admin</Link>
                    )}
                </div>

                {/* Dreapta */}
                <div className={m('nav-right')}>
                    {/* Buton Raportează — navighează către pagina dedicată */}
                    <button className={m('nav-report-btn')} onClick={openReport}>
                        <span className={m('nav-report-pulse')} />
                        <span>✚</span>
                        <span>Raportează</span>
                    </button>

                    {isAuthenticated ? (
                        <div className={m('nav-user-menu')} ref={menuRef}>
                            <button className={m('nav-avatar-btn')} onClick={() => setMenuOpen(!menuOpen)} aria-expanded={menuOpen}>
                                <span className={m('nav-avatar')}>{avatarInitial}</span>
                                <span className={m('nav-username')}>{displayName}</span>
                                <span className={m(`nav-chevron ${menuOpen ? 'open' : ''}`)}>▾</span>
                            </button>
                            {menuOpen && (
                                <div className={m('nav-dropdown')}>
                                    <div className={m('dropdown-header')}>
                                        <span className={m('dropdown-name')}>{displayName}</span>
                                        <span className={m('dropdown-email')}>{user?.email}</span>
                                        {isAdmin && <span className={m('dropdown-role')}>⚙️ Administrator</span>}
                                    </div>
                                    <div className={m('dropdown-divider')} />
                                    <Link to="/profile" className={m('dropdown-item')} onClick={() => setMenuOpen(false)}>👤 Profilul meu</Link>
                                    <Link to="/my-issues" className={m('dropdown-item')} onClick={() => setMenuOpen(false)}>📋 Sesizările mele</Link>
                                    <Link to="/create-issue" className={m('dropdown-item')} onClick={() => setMenuOpen(false)}>✚ Raportează o sesizare</Link>
                                    {isAdmin && (
                                        <Link to="/admin" className={m('dropdown-item dropdown-item-admin')} onClick={() => setMenuOpen(false)}>⚙️ Panou Admin</Link>
                                    )}
                                    <div className={m('dropdown-divider')} />
                                    <button className={m('dropdown-item dropdown-logout')} onClick={handleLogout}>🚪 Deconectare</button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className={m('nav-auth-btns')}>
                            <Link to="/login" className={m('nav-link')}>Autentificare</Link>
                            <Link to="/login" className={m('btn-login')}>Înregistrare</Link>
                        </div>
                    )}

                    {/* Hamburger mobile */}
                    <button className={m(`nav-hamburger ${mobileOpen ? 'open' : ''}`)} onClick={() => setMobileOpen(!mobileOpen)} aria-label="Meniu">
                        <span /><span /><span />
                    </button>
                </div>
            </nav>

            {/* ═══════════════════════ PANOU RAPORTARE ═══════════════════════ */}
            {/* Overlay */}
            <div className={m(`rp-overlay ${reportOpen ? 'rp-overlay-open' : ''}`)} onClick={closeReport} />

            {/* Panel slide-in din dreapta */}
            <div className={m(`rp-panel ${reportOpen ? 'rp-panel-open' : ''}`)} ref={panelRef}>
                {/* Header panel */}
                <div className={m('rp-header')}>
                    <div className={m('rp-header-left')}>
                        <div className={m('rp-header-icon')}>🚨</div>
                        <div>
                            <div className={m('rp-header-title')}>Raportează o problemă</div>
                            <div className={m('rp-header-sub')}>Galați · Sesizare urbană</div>
                        </div>
                    </div>
                    <button className={m('rp-close')} onClick={closeReport} aria-label="Închide">✕</button>
                </div>

                {/* Stepper */}
                {step < 3 && (
                    <div className={m('rp-stepper')}>
                        {['Locație', 'Detalii', 'Trimite'].map((label, i) => (
                            <React.Fragment key={i}>
                                <div className={m(`rp-step ${step === i + 1 ? 'active' : step > i + 1 ? 'done' : ''}`)}>
                                    <div className={m('rp-step-num')}>{step > i + 1 ? '✓' : i + 1}</div>
                                    <span>{label}</span>
                                </div>
                                {i < 2 && <div className={m('rp-step-line')} />}
                            </React.Fragment>
                        ))}
                    </div>
                )}

                {/* ── STEP 1: Locație ── */}
                {step === 1 && (
                    <div className={m('rp-body')}>
                        <div className={m('rp-section-label')}>
                            <span>📍</span> Click pe hartă unde se află problema
                        </div>
                        {formErrors.location && <div className={m('rp-err')}>{formErrors.location}</div>}

                        <div className={m('rp-map-wrap')}>
                            {reportOpen && (
                                <BaseMap center={GALATI_CENTER} zoom={13} style={{ height: '100%', width: '100%' }}>
                                    <LocationPickerLayer
                                        enabled
                                        location={location}
                                        icon={SELECTED_ICON}
                                        onPickLocation={(latlng) => { setLocation(latlng); setFormErrors(e => ({ ...e, location: '' })); }}
                                    />
                                </BaseMap>
                            )}
                        </div>

                        {location ? (
                            <div className={m('rp-loc-ok')}>
                                <span>✓ Locație: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}</span>
                                <button className={m('rp-loc-change')} onClick={() => setLocation(null)}>Schimbă</button>
                            </div>
                        ) : (
                            <div className={m('rp-loc-hint')}>👆 Dă click pe hartă pentru a marca locația</div>
                        )}

                        <div className={m('rp-footer')}>
                            <button className={m('rp-btn-cancel')} onClick={closeReport}>Anulează</button>
                            <button
                                className={m('rp-btn-primary')}
                                disabled={!location}
                                onClick={() => { setFormErrors({}); setStep(2); }}
                            >
                                Continuă →
                            </button>
                        </div>
                    </div>
                )}

                {/* ── STEP 2: Detalii ── */}
                {step === 2 && (
                    <div className={m('rp-body')}>
                        {formErrors.submit && <div className={m('rp-err')}>{formErrors.submit}</div>}

                        {/* Titlu */}
                        <div className={m('rp-field')}>
                            <div className={m('rp-field-label-row')}>
                                <label>Titlu sesizare <span className={m('rp-req')}>*</span></label>
                                {charCount(form.title, 100)}
                            </div>
                            <input
                                type="text"
                                placeholder="Ex: Groapă periculoasă pe strada Brăilei"
                                value={form.title}
                                onChange={e => { setForm(f => ({ ...f, title: e.target.value })); setFormErrors(fe => ({ ...fe, title: '' })); }}
                                maxLength={100}
                                className={m(formErrors.title ? 'rp-input-err' : '')}
                                autoFocus
                            />
                            {formErrors.title && <span className={m('rp-field-err')}>{formErrors.title}</span>}
                        </div>

                        {/* Descriere */}
                        <div className={m('rp-field')}>
                            <div className={m('rp-field-label-row')}>
                                <label>Descriere <span className={m('rp-req')}>*</span></label>
                                {charCount(form.description, 500)}
                            </div>
                            <textarea
                                placeholder="Descrie problema: ce, de când, riscuri..."
                                value={form.description}
                                onChange={e => { setForm(f => ({ ...f, description: e.target.value })); setFormErrors(fe => ({ ...fe, description: '' })); }}
                                rows={4}
                                maxLength={500}
                                className={m(formErrors.description ? 'rp-input-err' : '')}
                            />
                            {formErrors.description && <span className={m('rp-field-err')}>{formErrors.description}</span>}
                        </div>

                        {/* Categorie */}
                        <div className={m('rp-field')}>
                            <label>Categorie</label>
                            <div className={m('rp-cat-grid')}>
                                {CATEGORIES.map(cat => (
                                    <button
                                        key={cat.value}
                                        type="button"
                                        className={m(`rp-cat-btn ${form.category === cat.value ? 'active' : ''}`)}
                                        onClick={() => setForm(f => ({ ...f, category: cat.value }))}
                                        title={cat.value}
                                    >
                                        <span>{cat.icon}</span>
                                        <span>{cat.value.split('/')[0]}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Prioritate */}
                        <div className={m('rp-field')}>
                            <label>Prioritate</label>
                            <div className={m('rp-prio-row')}>
                                {PRIORITIES.map(p => (
                                    <button
                                        key={p.value}
                                        type="button"
                                        className={m(`rp-prio-btn ${form.priority === p.value ? 'active' : ''}`)}
                                        style={{ '--pc': p.color }}
                                        onClick={() => setForm(f => ({ ...f, priority: p.value }))}
                                    >
                                        <span className={m('rp-prio-dot')} style={{ background: p.color }} />
                                        {p.value}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Preview locație */}
                        <div className={m('rp-loc-bar')}>
                            📍 {location?.lat.toFixed(4)}, {location?.lng.toFixed(4)}
                            <button className={m('rp-loc-change')} onClick={() => setStep(1)}>Schimbă locația</button>
                        </div>

                        <div className={m('rp-footer')}>
                            <button className={m('rp-btn-cancel')} onClick={() => setStep(1)}>← Înapoi</button>
                            <button
                                className={m('rp-btn-primary')}
                                onClick={handleSubmit}
                                disabled={submitting}
                            >
                                {submitting ? <><span className={m('rp-spin')} /> Se trimite...</> : '📤 Trimite sesizarea'}
                            </button>
                        </div>
                    </div>
                )}

                {/* ── STEP 3: Succes ── */}
                {step === 3 && (
                    <div className={m('rp-body rp-success-body')}>
                        <div className={m('rp-success-anim')}>
                            <div className={m('rp-success-ring')} />
                            <div className={m('rp-success-icon')}>✓</div>
                        </div>
                        <h2 className={m('rp-success-title')}>Sesizare trimisă!</h2>
                        <p className={m('rp-success-msg')}>
                            Sesizarea ta a fost înregistrată și va apărea pe hartă.
                            Departamentul responsabil a fost notificat.
                        </p>
                        <div className={m('rp-success-details')}>
                            <div className={m('rp-sd-row')}>
                                <span>📋 Titlu</span>
                                <strong>{form.title}</strong>
                            </div>
                            <div className={m('rp-sd-row')}>
                                <span>🏷️ Categorie</span>
                                <strong>{form.category}</strong>
                            </div>
                            <div className={m('rp-sd-row')}>
                                <span>⚡ Prioritate</span>
                                <strong style={{ color: PRIORITIES.find(p => p.value === form.priority)?.color }}>
                                    {form.priority}
                                </strong>
                            </div>
                            <div className={m('rp-sd-row')}>
                                <span>🔵 Status</span>
                                <strong style={{ color: '#fca5a5' }}>Nou</strong>
                            </div>
                        </div>
                        <div className={m('rp-success-actions')}>
                            <button className={m('rp-btn-primary')} onClick={closeReport}>
                                ✓ Închide
                            </button>
                            <button
                                className={m('rp-btn-secondary')}
                                onClick={() => {
                                    closeReport();
                                    navigate('/my-issues');
                                }}
                            >
                                📋 Vezi sesizările mele
                            </button>
                        </div>
                        {/* Confetti dots */}
                        <div className={m('rp-confetti')} aria-hidden="true">
                            {[...Array(12)].map((_, i) => (
                                <div key={i} className={m('rp-dot')} style={{
                                    '--delay': `${i * 0.1}s`,
                                    '--x': `${Math.random() * 100}%`,
                                    '--c': ['#3b82f6', '#10b981', '#f59e0b', '#a855f7', '#ef4444'][i % 5],
                                }} />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
