import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useAuth } from '../context/AuthContext';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl: markerIcon2x, iconUrl: markerIcon, shadowUrl: markerShadow });

const SELECTED_ICON = L.divIcon({
    className: '',
    html: `<div style="width:26px;height:26px;border-radius:50% 50% 50% 0;background:#a855f7;border:2.5px solid #fff;box-shadow:0 3px 10px rgba(0,0,0,0.5);transform:rotate(-45deg);"></div>`,
    iconSize: [26, 26], iconAnchor: [13, 26], popupAnchor: [0, -30],
});

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

// Map click handler
const MapPicker = ({ onPick, active }) => {
    useMapEvents({ click(e) { if (active) onPick(e.latlng); } });
    return null;
};

export default function Navbar() {
    const { user, isAdmin, isAuthenticated, logout, displayName, avatarInitial } = useAuth();
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
    const apiUrl = (import.meta.env.VITE_API_URL || 'https://severin-bumbaru-2026.onrender.com/api').replace(/\/+$/, '');
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
        setReportOpen(true);
        setStep(1);
        setForm({ title: '', description: '', category: 'Infrastructură', priority: 'Medie' });
        setLocation(null);
        setFormErrors({});
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

    const handleSubmit = async () => {
        const errs = validate();
        if (Object.keys(errs).length) { setFormErrors(errs); return; }
        setSubmitting(true);
        try {
            if (useMock) {
                await new Promise(r => setTimeout(r, 900));
            } else {
                const { default: axios } = await import('axios');
                await axios.post(`${apiUrl}/issues`, {
                    ...form, lat: location.lat, lng: location.lng,
                }, { headers: { Authorization: `Bearer ${user?.token}` } });
            }
            setStep(3);
        } catch {
            setFormErrors({ submit: 'Eroare la trimitere. Încearcă din nou.' });
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
            <nav className="navbar">
                {/* Brand */}
                <div className="nav-brand">
                    <Link to="/">
                        <span className="nav-logo-icon">🏙️</span>
                        Galați<span>Civic</span>
                    </Link>
                </div>

                {/* Links desktop */}
                <div className={`nav-links ${mobileOpen ? 'nav-links-open' : ''}`}>
                    <Link to="/" className={`nav-link ${isActive('/') ? 'nav-link-active' : ''}`}>🗺 Hartă</Link>
                    <Link to="/dashboard" className={`nav-link ${isActive('/dashboard') ? 'nav-link-active' : ''}`}>📋 Sesizări</Link>
                    {isAuthenticated && (
                        <Link to="/my-issues" className={`nav-link ${isActive('/my-issues') ? 'nav-link-active' : ''}`}>📂 Ale mele</Link>
                    )}
                    {isAdmin && (
                        <Link to="/admin" className={`nav-link nav-link-admin ${isActive('/admin') ? 'nav-link-active' : ''}`}>⚙️ Admin</Link>
                    )}
                </div>

                {/* Dreapta */}
                <div className="nav-right">
                    {/* Buton Raportează — deschide panoul */}
                    <button className="nav-report-btn" onClick={openReport}>
                        <span className="nav-report-pulse" />
                        <span>✚</span>
                        <span>Raportează</span>
                    </button>

                    {isAuthenticated ? (
                        <div className="nav-user-menu" ref={menuRef}>
                            <button className="nav-avatar-btn" onClick={() => setMenuOpen(!menuOpen)} aria-expanded={menuOpen}>
                                <span className="nav-avatar">{avatarInitial}</span>
                                <span className="nav-username">{displayName}</span>
                                <span className={`nav-chevron ${menuOpen ? 'open' : ''}`}>▾</span>
                            </button>
                            {menuOpen && (
                                <div className="nav-dropdown">
                                    <div className="dropdown-header">
                                        <span className="dropdown-name">{displayName}</span>
                                        <span className="dropdown-email">{user?.email}</span>
                                        {isAdmin && <span className="dropdown-role">⚙️ Administrator</span>}
                                    </div>
                                    <div className="dropdown-divider" />
                                    <Link to="/profile" className="dropdown-item" onClick={() => setMenuOpen(false)}>👤 Profilul meu</Link>
                                    <Link to="/my-issues" className="dropdown-item" onClick={() => setMenuOpen(false)}>📋 Sesizările mele</Link>
                                    {isAdmin && (
                                        <Link to="/admin" className="dropdown-item dropdown-item-admin" onClick={() => setMenuOpen(false)}>⚙️ Panou Admin</Link>
                                    )}
                                    <div className="dropdown-divider" />
                                    <button className="dropdown-item dropdown-logout" onClick={handleLogout}>🚪 Deconectare</button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="nav-auth-btns">
                            <Link to="/login" className="nav-link">Autentificare</Link>
                            <Link to="/login" className="btn-login">Înregistrare</Link>
                        </div>
                    )}

                    {/* Hamburger mobile */}
                    <button className={`nav-hamburger ${mobileOpen ? 'open' : ''}`} onClick={() => setMobileOpen(!mobileOpen)} aria-label="Meniu">
                        <span /><span /><span />
                    </button>
                </div>
            </nav>

            {/* ═══════════════════════ PANOU RAPORTARE ═══════════════════════ */}
            {/* Overlay */}
            <div className={`rp-overlay ${reportOpen ? 'rp-overlay-open' : ''}`} onClick={closeReport} />

            {/* Panel slide-in din dreapta */}
            <div className={`rp-panel ${reportOpen ? 'rp-panel-open' : ''}`} ref={panelRef}>
                {/* Header panel */}
                <div className="rp-header">
                    <div className="rp-header-left">
                        <div className="rp-header-icon">🚨</div>
                        <div>
                            <div className="rp-header-title">Raportează o problemă</div>
                            <div className="rp-header-sub">Galați · Sesizare urbană</div>
                        </div>
                    </div>
                    <button className="rp-close" onClick={closeReport} aria-label="Închide">✕</button>
                </div>

                {/* Stepper */}
                {step < 3 && (
                    <div className="rp-stepper">
                        {['Locație', 'Detalii', 'Trimite'].map((label, i) => (
                            <React.Fragment key={i}>
                                <div className={`rp-step ${step === i + 1 ? 'active' : step > i + 1 ? 'done' : ''}`}>
                                    <div className="rp-step-num">{step > i + 1 ? '✓' : i + 1}</div>
                                    <span>{label}</span>
                                </div>
                                {i < 2 && <div className="rp-step-line" />}
                            </React.Fragment>
                        ))}
                    </div>
                )}

                {/* ── STEP 1: Locație ── */}
                {step === 1 && (
                    <div className="rp-body">
                        <div className="rp-section-label">
                            <span>📍</span> Click pe hartă unde se află problema
                        </div>
                        {formErrors.location && <div className="rp-err">{formErrors.location}</div>}

                        <div className="rp-map-wrap">
                            {reportOpen && (
                                <MapContainer center={GALATI_CENTER} zoom={13} style={{ height: '100%', width: '100%' }}>
                                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                    <MapPicker active={true} onPick={latlng => { setLocation(latlng); setFormErrors(e => ({ ...e, location: '' })); }} />
                                    {location && <Marker position={location} icon={SELECTED_ICON} />}
                                </MapContainer>
                            )}
                        </div>

                        {location ? (
                            <div className="rp-loc-ok">
                                <span>✓ Locație: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}</span>
                                <button className="rp-loc-change" onClick={() => setLocation(null)}>Schimbă</button>
                            </div>
                        ) : (
                            <div className="rp-loc-hint">👆 Dă click pe hartă pentru a marca locația</div>
                        )}

                        <div className="rp-footer">
                            <button className="rp-btn-cancel" onClick={closeReport}>Anulează</button>
                            <button
                                className="rp-btn-primary"
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
                    <div className="rp-body">
                        {formErrors.submit && <div className="rp-err">{formErrors.submit}</div>}

                        {/* Titlu */}
                        <div className="rp-field">
                            <div className="rp-field-label-row">
                                <label>Titlu sesizare <span className="rp-req">*</span></label>
                                {charCount(form.title, 100)}
                            </div>
                            <input
                                type="text"
                                placeholder="Ex: Groapă periculoasă pe strada Brăilei"
                                value={form.title}
                                onChange={e => { setForm(f => ({ ...f, title: e.target.value })); setFormErrors(fe => ({ ...fe, title: '' })); }}
                                maxLength={100}
                                className={formErrors.title ? 'rp-input-err' : ''}
                                autoFocus
                            />
                            {formErrors.title && <span className="rp-field-err">{formErrors.title}</span>}
                        </div>

                        {/* Descriere */}
                        <div className="rp-field">
                            <div className="rp-field-label-row">
                                <label>Descriere <span className="rp-req">*</span></label>
                                {charCount(form.description, 500)}
                            </div>
                            <textarea
                                placeholder="Descrie problema: ce, de când, riscuri..."
                                value={form.description}
                                onChange={e => { setForm(f => ({ ...f, description: e.target.value })); setFormErrors(fe => ({ ...fe, description: '' })); }}
                                rows={4}
                                maxLength={500}
                                className={formErrors.description ? 'rp-input-err' : ''}
                            />
                            {formErrors.description && <span className="rp-field-err">{formErrors.description}</span>}
                        </div>

                        {/* Categorie */}
                        <div className="rp-field">
                            <label>Categorie</label>
                            <div className="rp-cat-grid">
                                {CATEGORIES.map(cat => (
                                    <button
                                        key={cat.value}
                                        type="button"
                                        className={`rp-cat-btn ${form.category === cat.value ? 'active' : ''}`}
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
                        <div className="rp-field">
                            <label>Prioritate</label>
                            <div className="rp-prio-row">
                                {PRIORITIES.map(p => (
                                    <button
                                        key={p.value}
                                        type="button"
                                        className={`rp-prio-btn ${form.priority === p.value ? 'active' : ''}`}
                                        style={{ '--pc': p.color }}
                                        onClick={() => setForm(f => ({ ...f, priority: p.value }))}
                                    >
                                        <span className="rp-prio-dot" style={{ background: p.color }} />
                                        {p.value}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Preview locație */}
                        <div className="rp-loc-bar">
                            📍 {location?.lat.toFixed(4)}, {location?.lng.toFixed(4)}
                            <button className="rp-loc-change" onClick={() => setStep(1)}>Schimbă locația</button>
                        </div>

                        <div className="rp-footer">
                            <button className="rp-btn-cancel" onClick={() => setStep(1)}>← Înapoi</button>
                            <button
                                className="rp-btn-primary"
                                onClick={handleSubmit}
                                disabled={submitting}
                            >
                                {submitting ? <><span className="rp-spin" /> Se trimite...</> : '📤 Trimite sesizarea'}
                            </button>
                        </div>
                    </div>
                )}

                {/* ── STEP 3: Succes ── */}
                {step === 3 && (
                    <div className="rp-body rp-success-body">
                        <div className="rp-success-anim">
                            <div className="rp-success-ring" />
                            <div className="rp-success-icon">✓</div>
                        </div>
                        <h2 className="rp-success-title">Sesizare trimisă!</h2>
                        <p className="rp-success-msg">
                            Sesizarea ta a fost înregistrată și va apărea pe hartă.
                            Departamentul responsabil a fost notificat.
                        </p>
                        <div className="rp-success-details">
                            <div className="rp-sd-row">
                                <span>📋 Titlu</span>
                                <strong>{form.title}</strong>
                            </div>
                            <div className="rp-sd-row">
                                <span>🏷️ Categorie</span>
                                <strong>{form.category}</strong>
                            </div>
                            <div className="rp-sd-row">
                                <span>⚡ Prioritate</span>
                                <strong style={{ color: PRIORITIES.find(p => p.value === form.priority)?.color }}>
                                    {form.priority}
                                </strong>
                            </div>
                            <div className="rp-sd-row">
                                <span>🔵 Status</span>
                                <strong style={{ color: '#fca5a5' }}>Nou</strong>
                            </div>
                        </div>
                        <div className="rp-success-actions">
                            <button className="rp-btn-primary" onClick={closeReport}>
                                ✓ Închide
                            </button>
                            <button
                                className="rp-btn-secondary"
                                onClick={() => {
                                    closeReport();
                                    navigate('/my-issues');
                                }}
                            >
                                📋 Vezi sesizările mele
                            </button>
                        </div>
                        {/* Confetti dots */}
                        <div className="rp-confetti" aria-hidden="true">
                            {[...Array(12)].map((_, i) => (
                                <div key={i} className="rp-dot" style={{
                                    '--delay': `${i * 0.1}s`,
                                    '--x': `${Math.random() * 100}%`,
                                    '--c': ['#3b82f6', '#10b981', '#f59e0b', '#a855f7', '#ef4444'][i % 5],
                                }} />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* ═══════════════════ STILURI ═══════════════════ */}
            <style>{`
                /* ── NAVBAR ── */
                .navbar {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 0 32px;
                    height: 60px;
                    background: rgba(8, 15, 30, 0.96);
                    backdrop-filter: blur(20px);
                    border-bottom: 1px solid rgba(255,255,255,.07);
                    position: sticky;
                    top: 0;
                    z-index: 100;
                }
                .nav-brand a {
                    font-family: 'Playfair Display', Georgia, serif;
                    font-size: 1.3rem; font-weight: 700; color: #e8f0fe;
                    text-decoration: none; display: flex; align-items: center; gap: 7px;
                }
                .nav-brand span { color: #3b82f6; }
                .nav-logo-icon { font-size: 18px; }
                .nav-links { display: flex; gap: 2px; align-items: center; }
                .nav-link {
                    color: #8fa3c0; text-decoration: none; font-size: 13.5px; font-weight: 500;
                    padding: 6px 13px; border-radius: 8px; transition: all .18s; white-space: nowrap;
                }
                .nav-link:hover { color: #e8f0fe; background: rgba(255,255,255,.05); }
                .nav-link-active { color: #3b82f6 !important; background: rgba(59,130,246,.1) !important; }
                .nav-link-admin { color: #c084fc !important; }
                .nav-right { display: flex; align-items: center; gap: 8px; }
                .nav-auth-btns { display: flex; align-items: center; gap: 6px; }
                .btn-login {
                    background: #3b82f6; color: #fff !important; border-radius: 8px;
                    padding: 7px 16px !important; font-weight: 600 !important; font-size: 13px !important;
                    text-decoration: none; transition: background .18s;
                }
                .btn-login:hover { background: #1d4ed8 !important; }

                /* ── Buton Raportează ── */
                .nav-report-btn {
                    display: flex; align-items: center; gap: 6px;
                    background: linear-gradient(135deg, #10b981, #059669);
                    color: #fff; border: none; border-radius: 9px;
                    padding: 7px 16px; font-size: 13px; font-weight: 600;
                    font-family: inherit; cursor: pointer;
                    transition: all .2s; position: relative;
                    box-shadow: 0 3px 12px rgba(16,185,129,.3);
                }
                .nav-report-btn:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 5px 18px rgba(16,185,129,.45);
                    background: linear-gradient(135deg, #059669, #047857);
                }
                .nav-report-pulse {
                    position: absolute; top: 6px; right: 6px;
                    width: 7px; height: 7px; background: #fff; border-radius: 50%;
                    animation: navPulse 2s ease-in-out infinite;
                }
                @keyframes navPulse {
                    0%,100% { opacity: 1; transform: scale(1); }
                    50% { opacity: .5; transform: scale(1.3); }
                }

                /* Avatar */
                .nav-user-menu { position: relative; }
                .nav-avatar-btn {
                    display: flex; align-items: center; gap: 8px;
                    background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.09);
                    border-radius: 10px; padding: 6px 12px 6px 6px; cursor: pointer;
                    transition: all .18s; color: #e8f0fe; font-family: inherit;
                }
                .nav-avatar-btn:hover { background: rgba(255,255,255,.08); border-color: rgba(255,255,255,.16); }
                .nav-avatar {
                    width: 28px; height: 28px;
                    background: linear-gradient(135deg, #3b82f6, #8b5cf6);
                    border-radius: 8px; display: flex; align-items: center; justify-content: center;
                    font-size: 12px; font-weight: 700; color: #fff; flex-shrink: 0;
                }
                .nav-username { font-size: 13px; font-weight: 500; max-width: 100px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
                .nav-chevron { font-size: 11px; color: #4d6380; transition: transform .2s; }
                .nav-chevron.open { transform: rotate(180deg); }

                /* Dropdown */
                .nav-dropdown {
                    position: absolute; top: calc(100% + 8px); right: 0;
                    background: #0f1a2e; border: 1px solid rgba(255,255,255,.1);
                    border-radius: 14px; min-width: 220px;
                    box-shadow: 0 16px 48px rgba(0,0,0,.5);
                    overflow: hidden; animation: dropIn .15s ease; z-index: 200;
                }
                @keyframes dropIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
                .dropdown-header { padding: 14px 16px 12px; }
                .dropdown-name { display: block; font-size: 14px; font-weight: 600; color: #e8f0fe; margin-bottom: 3px; }
                .dropdown-email { display: block; font-size: 12px; color: #4d6380; margin-bottom: 4px; }
                .dropdown-role { display: inline-block; font-size: 11px; background: rgba(168,85,247,.15); color: #c084fc; border: 1px solid rgba(168,85,247,.2); border-radius: 6px; padding: 2px 8px; font-weight: 600; }
                .dropdown-divider { height: 1px; background: rgba(255,255,255,.06); margin: 4px 0; }
                .dropdown-item {
                    display: flex; align-items: center; gap: 8px; padding: 10px 16px;
                    font-size: 13px; color: #8fa3c0; text-decoration: none; transition: all .15s;
                    cursor: pointer; background: none; border: none; width: 100%;
                    text-align: left; font-family: inherit;
                }
                .dropdown-item:hover { background: rgba(255,255,255,.04); color: #e8f0fe; }
                .dropdown-item-admin:hover { color: #c084fc; }
                .dropdown-logout { color: #fca5a5 !important; }
                .dropdown-logout:hover { background: rgba(239,68,68,.08) !important; }

                /* Hamburger */
                .nav-hamburger { display: none; flex-direction: column; gap: 5px; background: none; border: none; cursor: pointer; padding: 6px; }
                .nav-hamburger span { display: block; width: 22px; height: 2px; background: #8fa3c0; border-radius: 2px; transition: all .2s; }
                .nav-hamburger.open span:nth-child(1) { transform: rotate(45deg) translate(5px,5px); }
                .nav-hamburger.open span:nth-child(2) { opacity: 0; }
                .nav-hamburger.open span:nth-child(3) { transform: rotate(-45deg) translate(5px,-5px); }

                /* ══ PANOU RAPORTARE ══ */
                .rp-overlay {
                    position: fixed; inset: 0; background: rgba(0,0,0,0);
                    z-index: 300; pointer-events: none; transition: background .3s;
                }
                .rp-overlay.rp-overlay-open {
                    background: rgba(0,0,0,.6);
                    backdrop-filter: blur(4px);
                    pointer-events: auto;
                }

                .rp-panel {
                    position: fixed; top: 0; right: 0; bottom: 0;
                    width: 480px; max-width: 100vw;
                    background: #0a1628;
                    border-left: 1px solid rgba(255,255,255,.1);
                    box-shadow: -24px 0 80px rgba(0,0,0,.6);
                    z-index: 301;
                    transform: translateX(100%);
                    transition: transform .35s cubic-bezier(.4,0,.2,1);
                    display: flex; flex-direction: column;
                    overflow: hidden;
                }
                .rp-panel.rp-panel-open { transform: translateX(0); }

                /* Header panel */
                .rp-header {
                    display: flex; justify-content: space-between; align-items: center;
                    padding: 18px 20px; border-bottom: 1px solid rgba(255,255,255,.07);
                    flex-shrink: 0;
                    background: rgba(15,26,46,.9);
                }
                .rp-header-left { display: flex; align-items: center; gap: 12px; }
                .rp-header-icon {
                    width: 40px; height: 40px; border-radius: 11px;
                    background: linear-gradient(135deg, rgba(16,185,129,.2), rgba(16,185,129,.05));
                    border: 1px solid rgba(16,185,129,.25);
                    display: flex; align-items: center; justify-content: center; font-size: 18px;
                }
                .rp-header-title { font-size: 15px; font-weight: 700; color: #e8f0fe; }
                .rp-header-sub   { font-size: 11px; color: #4d6380; margin-top: 2px; }
                .rp-close {
                    width: 32px; height: 32px; border-radius: 8px;
                    border: 1px solid rgba(255,255,255,.08); background: transparent;
                    color: #4d6380; cursor: pointer; font-size: 14px;
                    display: flex; align-items: center; justify-content: center; transition: all .15s;
                }
                .rp-close:hover { background: rgba(255,255,255,.07); color: #e8f0fe; }

                /* Stepper */
                .rp-stepper {
                    display: flex; align-items: center; padding: 14px 20px;
                    border-bottom: 1px solid rgba(255,255,255,.05); flex-shrink: 0;
                    background: rgba(8,15,30,.4);
                }
                .rp-step { display: flex; align-items: center; gap: 7px; opacity: .35; transition: opacity .2s; }
                .rp-step.active { opacity: 1; }
                .rp-step.done   { opacity: .7; }
                .rp-step-num {
                    width: 24px; height: 24px; border-radius: 50%;
                    background: rgba(59,130,246,.15); border: 1.5px solid rgba(59,130,246,.3);
                    display: flex; align-items: center; justify-content: center;
                    font-size: 11px; font-weight: 700; color: #3b82f6; flex-shrink: 0;
                }
                .rp-step.active .rp-step-num { background: #3b82f6; color: #fff; border-color: #3b82f6; }
                .rp-step.done .rp-step-num   { background: #10b981; border-color: #10b981; color: #fff; }
                .rp-step span { font-size: 12px; font-weight: 500; color: #8fa3c0; white-space: nowrap; }
                .rp-step-line { flex: 1; height: 1px; background: rgba(255,255,255,.07); margin: 0 10px; }

                /* Body scrollabile */
                .rp-body {
                    flex: 1; overflow-y: auto; padding: 20px;
                    display: flex; flex-direction: column; gap: 14px;
                }

                .rp-section-label {
                    display: flex; align-items: center; gap: 7px;
                    font-size: 13px; font-weight: 600; color: #8fa3c0;
                }

                /* Hartă */
                .rp-map-wrap {
                    height: 300px; border-radius: 12px; overflow: hidden;
                    border: 1px solid rgba(255,255,255,.08);
                    flex-shrink: 0;
                }
                .rp-loc-ok {
                    display: flex; justify-content: space-between; align-items: center;
                    background: rgba(16,185,129,.08); border: 1px solid rgba(16,185,129,.2);
                    border-radius: 8px; padding: 9px 13px; font-size: 12px; color: #6ee7b7;
                }
                .rp-loc-hint {
                    background: rgba(255,255,255,.03); border: 1px dashed rgba(255,255,255,.12);
                    border-radius: 8px; padding: 10px 14px; font-size: 12px;
                    color: #4d6380; text-align: center;
                }
                .rp-loc-change {
                    background: none; border: none; color: #3b82f6;
                    font-size: 12px; cursor: pointer; font-weight: 600;
                    text-decoration: underline; font-family: inherit;
                }
                .rp-loc-bar {
                    display: flex; justify-content: space-between; align-items: center;
                    background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.07);
                    border-radius: 8px; padding: 8px 12px; font-size: 12px; color: #4d6380;
                }
                .rp-err {
                    background: rgba(239,68,68,.1); border: 1px solid rgba(239,68,68,.25);
                    border-radius: 8px; padding: 9px 13px; font-size: 12px; color: #fca5a5;
                }

                /* Fields */
                .rp-field { display: flex; flex-direction: column; gap: 6px; }
                .rp-field-label-row { display: flex; justify-content: space-between; align-items: center; }
                .rp-field label { font-size: 11px; font-weight: 600; color: #8fa3c0; text-transform: uppercase; letter-spacing: .5px; }
                .rp-req { color: #ef4444; }
                .rp-field input, .rp-field textarea {
                    width: 100%; padding: 10px 13px;
                    background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.09);
                    border-radius: 9px; color: #e8f0fe; font-family: inherit;
                    font-size: 13px; transition: border .2s, background .2s; outline: none;
                }
                .rp-field input:focus, .rp-field textarea:focus {
                    border-color: #3b82f6; background: rgba(59,130,246,.04);
                    box-shadow: 0 0 0 3px rgba(59,130,246,.1);
                }
                .rp-field input::placeholder, .rp-field textarea::placeholder { color: #4d6380; }
                .rp-field textarea { resize: vertical; line-height: 1.6; }
                .rp-input-err { border-color: #ef4444 !important; }
                .rp-field-err { font-size: 11px; color: #fca5a5; }

                /* Categorie grid */
                .rp-cat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
                .rp-cat-btn {
                    display: flex; flex-direction: column; align-items: center; gap: 3px;
                    background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.07);
                    border-radius: 9px; padding: 9px 6px; font-size: 11px; font-weight: 500;
                    color: #4d6380; cursor: pointer; font-family: inherit; transition: all .15s;
                }
                .rp-cat-btn span:first-child { font-size: 16px; }
                .rp-cat-btn:hover { border-color: rgba(59,130,246,.4); color: #8fa3c0; transform: translateY(-1px); }
                .rp-cat-btn.active { border-color: #3b82f6; background: rgba(59,130,246,.1); color: #93c5fd; }

                /* Prioritate */
                .rp-prio-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
                .rp-prio-btn {
                    display: flex; align-items: center; justify-content: center; gap: 5px;
                    background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.07);
                    border-radius: 8px; padding: 8px 5px; font-size: 11px; font-weight: 600;
                    color: #4d6380; cursor: pointer; font-family: inherit; transition: all .15s;
                    flex-direction: column;
                }
                .rp-prio-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
                .rp-prio-btn:hover { border-color: var(--pc); color: #8fa3c0; }
                .rp-prio-btn.active { border-color: var(--pc); background: rgba(0,0,0,.2); color: #e8f0fe; box-shadow: 0 0 0 1px var(--pc) inset; }

                /* Footer panel */
                .rp-footer {
                    display: flex; gap: 8px; justify-content: flex-end;
                    padding-top: 6px; margin-top: auto; flex-shrink: 0;
                }
                .rp-btn-primary {
                    background: linear-gradient(135deg, #10b981, #059669);
                    color: #fff; border: none; padding: 11px 22px; border-radius: 9px;
                    font-size: 13px; font-weight: 600; cursor: pointer;
                    font-family: inherit; transition: all .18s; display: flex; align-items: center; gap: 6px;
                    box-shadow: 0 3px 12px rgba(16,185,129,.3);
                }
                .rp-btn-primary:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 5px 18px rgba(16,185,129,.4); }
                .rp-btn-primary:disabled { opacity: .5; cursor: not-allowed; transform: none; }
                .rp-btn-secondary {
                    background: rgba(255,255,255,.05); color: #8fa3c0;
                    border: 1px solid rgba(255,255,255,.1); padding: 11px 20px; border-radius: 9px;
                    font-size: 13px; font-weight: 500; cursor: pointer;
                    font-family: inherit; transition: all .18s;
                }
                .rp-btn-secondary:hover { border-color: #3b82f6; color: #3b82f6; }
                .rp-btn-cancel {
                    background: none; color: #4d6380;
                    border: 1px solid rgba(255,255,255,.08); padding: 11px 18px; border-radius: 9px;
                    font-size: 13px; cursor: pointer; font-family: inherit; transition: all .18s;
                }
                .rp-btn-cancel:hover { color: #8fa3c0; border-color: rgba(255,255,255,.16); }
                .rp-spin {
                    width: 13px; height: 13px; border: 2px solid rgba(255,255,255,.3);
                    border-top-color: #fff; border-radius: 50%;
                    animation: rpSpin .6s linear infinite; display: inline-block;
                }
                @keyframes rpSpin { to { transform: rotate(360deg); } }

                /* ── Succes ── */
                .rp-success-body {
                    align-items: center; text-align: center;
                    justify-content: center; padding: 32px 28px;
                }
                .rp-success-anim {
                    position: relative; width: 80px; height: 80px;
                    margin: 0 auto 20px;
                }
                .rp-success-ring {
                    position: absolute; inset: 0; border-radius: 50%;
                    border: 3px solid #10b981;
                    animation: rpRing .6s ease forwards;
                }
                @keyframes rpRing {
                    from { transform: scale(0); opacity: 0; }
                    to   { transform: scale(1); opacity: 1; }
                }
                .rp-success-icon {
                    position: absolute; inset: 0;
                    display: flex; align-items: center; justify-content: center;
                    font-size: 32px; color: #10b981; font-weight: 700;
                    animation: rpIcon .4s .3s ease both;
                }
                @keyframes rpIcon {
                    from { opacity: 0; transform: scale(.5); }
                    to   { opacity: 1; transform: scale(1); }
                }
                .rp-success-title { font-size: 1.3rem; font-weight: 700; color: #e8f0fe; margin-bottom: 8px; }
                .rp-success-msg   { font-size: 13px; color: #4d6380; line-height: 1.6; margin-bottom: 20px; max-width: 320px; }
                .rp-success-details {
                    width: 100%; background: rgba(255,255,255,.03);
                    border: 1px solid rgba(255,255,255,.07); border-radius: 12px;
                    overflow: hidden; margin-bottom: 20px;
                }
                .rp-sd-row {
                    display: flex; justify-content: space-between;
                    align-items: center; padding: 10px 14px;
                    border-bottom: 1px solid rgba(255,255,255,.04); font-size: 13px;
                }
                .rp-sd-row:last-child { border-bottom: none; }
                .rp-sd-row span { color: #4d6380; }
                .rp-sd-row strong { color: #e8f0fe; text-align: right; max-width: 60%; }
                .rp-success-actions { display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; }

                /* Confetti dots */
                .rp-confetti { position: absolute; inset: 0; pointer-events: none; overflow: hidden; border-radius: inherit; }
                .rp-dot {
                    position: absolute; width: 7px; height: 7px; border-radius: 50%;
                    left: var(--x); top: -10px;
                    background: var(--c);
                    animation: rpFall 1.2s var(--delay) ease both;
                }
                @keyframes rpFall {
                    from { transform: translateY(0) rotate(0); opacity: 1; }
                    to   { transform: translateY(500px) rotate(720deg); opacity: 0; }
                }

                /* Leaflet overrides */
                .leaflet-popup-content-wrapper { border-radius: 10px !important; padding: 0 !important; }
                .leaflet-popup-content { margin: 0 !important; }
                .leaflet-popup-tip-container { display: none !important; }
                .leaflet-control-attribution { display: none !important; }

                /* Responsive */
                @media (max-width: 768px) {
                    .navbar { padding: 0 16px; }
                    .nav-hamburger { display: flex; }
                    .nav-links {
                        display: none; position: absolute; top: 60px; left: 0; right: 0;
                        background: rgba(8,15,30,.98); backdrop-filter: blur(20px);
                        border-bottom: 1px solid rgba(255,255,255,.07);
                        flex-direction: column; padding: 12px 16px 16px; gap: 4px; align-items: stretch;
                    }
                    .nav-links-open { display: flex; }
                    .nav-link { padding: 10px 14px; }
                    .nav-username { display: none; }
                    .nav-report-btn span:last-child { display: none; }
                    .rp-panel { width: 100vw; }
                    .rp-prio-row { grid-template-columns: repeat(2, 1fr); }
                }
            `}</style>
        </>
    );
}