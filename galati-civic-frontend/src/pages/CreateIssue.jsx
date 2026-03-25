import React, { useState, useCallback, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useAuth } from '../context/AuthContext';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
});

// ── Icoane colorate după status ──
const makeIcon = (color) => L.divIcon({
    className: '',
    html: `<div style="width:26px;height:26px;border-radius:50% 50% 50% 0;background:${color};border:2.5px solid #fff;box-shadow:0 3px 10px rgba(0,0,0,0.4);transform:rotate(-45deg);"></div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 26],
    popupAnchor: [0, -30],
});
const NEW_ICON = makeIcon('#ef4444');
const PROGRESS_ICON = makeIcon('#f59e0b');
const DONE_ICON = makeIcon('#10b981');
const REVIEW_ICON = makeIcon('#3b82f6');
const SELECTED_ICON = makeIcon('#a855f7');
const STATUS_ICONS = { 'Nou': NEW_ICON, 'În lucru': PROGRESS_ICON, 'Rezolvat': DONE_ICON, 'În verificare': REVIEW_ICON };

const CATEGORIES = [
    { value: 'Infrastructură', label: '🛣️ Infrastructură', desc: 'Drumuri, trotuare, poduri' },
    { value: 'Iluminat', label: '💡 Iluminat', desc: 'Felinare, prize stradale' },
    { value: 'Apă/Canal', label: '💧 Apă/Canal', desc: 'Scurgeri, inundații' },
    { value: 'Spații verzi', label: '🌳 Spații verzi', desc: 'Parcuri, copaci, zone verzi' },
    { value: 'Salubritate', label: '🗑️ Salubritate', desc: 'Deșeuri, curățenie' },
    { value: 'Zgomot/Poluare', label: '🔊 Zgomot/Poluare', desc: 'Poluare fonică, aer, apă' },
    { value: 'Vandalism', label: '🚧 Vandalism', desc: 'Graffiti, distrugeri proprietăți' },
    { value: 'Trafic/Parcare', label: '🚗 Trafic/Parcare', desc: 'Semafoare, parcări ilegale' },
    { value: 'Altele', label: '📋 Altele', desc: 'Orice altă problemă urbană' },
];
const PRIORITIES = [
    { value: 'Scăzută', color: '#22c55e', desc: 'Problemă minoră, nu urgentă' },
    { value: 'Medie', color: '#eab308', desc: 'Necesită atenție în timp util' },
    { value: 'Ridicată', color: '#f97316', desc: 'Problemă importantă, rezolvare rapidă' },
    { value: 'Urgentă', color: '#ef4444', desc: 'Pericol imediat, intervenție urgentă' },
];
const GALATI_CENTER = [45.4353, 28.0080];

// Date mock pentru demo
const MOCK_MY_ISSUES = [
    { id: 101, title: 'Groapă str. Domnească', description: 'Groapă de 30cm adâncime în față la bloc, risc pentru mașini și pietoni.', category: 'Infrastructură', priority: 'Ridicată', status: 'În lucru', lat: 45.4400, lng: 28.0200, votes: 12, created_at: '2026-03-01T10:00:00Z', isOwn: true },
    { id: 102, title: 'Iluminat lipsă Parc Mazepa', description: 'Zona din spatele parcului nu are iluminat nocturn, periculoasă seara.', category: 'Iluminat', priority: 'Medie', status: 'Nou', lat: 45.4380, lng: 28.0100, votes: 5, created_at: '2026-03-10T14:00:00Z', isOwn: true },
];

const MapPicker = ({ onPick, editMode }) => {
    useMapEvents({ click(e) { if (editMode) onPick(e.latlng); } });
    return null;
};

const Toast = ({ msg, show, type = 'info' }) => (
    <div className={`ci-toast ci-toast-${type}${show ? ' ci-toast-show' : ''}`}>
        <span>{type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</span>
        {msg}
    </div>
);

const StatusBadge = ({ status }) => {
    const map = {
        'Nou': { cls: 'ci-badge-new', label: '🔴 Nou' },
        'În lucru': { cls: 'ci-badge-progress', label: '🟡 În lucru' },
        'Rezolvat': { cls: 'ci-badge-done', label: '🟢 Rezolvat' },
        'În verificare': { cls: 'ci-badge-review', label: '🔵 Verificare' },
    };
    const b = map[status] || map['Nou'];
    return <span className={`ci-badge ${b.cls}`}>{b.label}</span>;
};

// ── Componenta principală ──
const CreateIssue = () => {
    const [tab, setTab] = useState('my');      // 'my' | 'new' | 'map'
    const [step, setStep] = useState(1);
    const [myIssues, setMyIssues] = useState([]);
    const [allIssues, setAllIssues] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [votedIssues, setVotedIssues] = useState(new Set());
    const [selectedIssue, setSelectedIssue] = useState(null);
    const [editingIssue, setEditingIssue] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [pickingLocation, setPickingLocation] = useState(false);
    const [toast, setToast] = useState({ msg: '', show: false, type: 'info' });
    const [mapCenter, setMapCenter] = useState(GALATI_CENTER);
    const [mapSearch, setMapSearch] = useState('');
    const [mapFilter, setMapFilter] = useState('Toate');

    const [form, setForm] = useState({
        title: '', description: '', category: 'Infrastructură',
        priority: 'Medie', lat: null, lng: null,
    });
    const [formErrors, setFormErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [editLocation, setEditLocation] = useState(null);

    const { user } = useAuth();
    const navigate = useNavigate();
    const apiUrl = (import.meta.env.VITE_API_URL || 'https://severin-bumbaru-2026.onrender.com/api').replace(/\/+$/, '');
    const useMock = import.meta.env.VITE_USE_MOCK === 'true';

    const showToast = useCallback((msg, type = 'info') => {
        setToast({ msg, show: true, type });
        setTimeout(() => setToast(t => ({ ...t, show: false })), 3200);
    }, []);

    // ── Fetch date ──
    useEffect(() => {
        const load = async () => {
            setIsLoading(true);
            if (useMock) {
                await new Promise(r => setTimeout(r, 500));
                setMyIssues(MOCK_MY_ISSUES);
                setAllIssues([
                    ...MOCK_MY_ISSUES,
                    { id: 1, title: 'Groapă str. Brăilei', description: 'Groapă adâncă, risc accident', category: 'Infrastructură', priority: 'Urgentă', status: 'În lucru', lat: 45.4420, lng: 28.0250, votes: 34, created_at: '2026-01-15T10:00:00Z' },
                    { id: 2, title: 'Felinar defect Piața Centrală', description: 'Trei felinare nu funcționează', category: 'Iluminat', priority: 'Ridicată', status: 'Nou', lat: 45.4360, lng: 28.0150, votes: 19, created_at: '2026-02-01T14:30:00Z' },
                    { id: 3, title: 'Scurgere canalizare Micro 17', description: 'Apă menajeră la suprafață', category: 'Apă/Canal', priority: 'Urgentă', status: 'În verificare', lat: 45.4290, lng: 28.0400, votes: 28, created_at: '2026-02-10T09:15:00Z' },
                    { id: 4, title: 'Copaci uscați Parc Rizer', description: 'Risc de cădere', category: 'Spații verzi', priority: 'Medie', status: 'Nou', lat: 45.4450, lng: 28.0050, votes: 12, created_at: '2026-02-18T16:00:00Z' },
                    { id: 5, title: 'Deșeuri str. Oțelului', description: 'Moloz și deșeuri pe trotuar', category: 'Salubritate', priority: 'Medie', status: 'Rezolvat', lat: 45.4320, lng: 28.0320, votes: 8, created_at: '2026-01-28T11:00:00Z' },
                ]);
            } else {
                try {
                    const [myRes, allRes] = await Promise.all([
                        axios.get(`${apiUrl}/issues/my`, { headers: { Authorization: `Bearer ${user?.token}` } }),
                        axios.get(`${apiUrl}/issues`),
                    ]);
                    setMyIssues(myRes.data);
                    setAllIssues(allRes.data);
                } catch { showToast('Eroare la încărcare date.', 'error'); }
            }
            setIsLoading(false);
        };
        load();
    }, []);

    // ── Validare formular ──
    const validate = () => {
        const errs = {};
        if (!form.title.trim()) errs.title = 'Titlul este obligatoriu.';
        if (form.title.length > 100) errs.title = 'Max 100 caractere.';
        if (!form.description.trim()) errs.description = 'Descrierea este obligatorie.';
        if (!form.lat || !form.lng) errs.location = 'Selectează locația pe hartă.';
        return errs;
    };

    // ── Submit sesizare nouă ──
    const handleSubmit = async (e) => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length) { setFormErrors(errs); return; }
        setSubmitting(true);
        try {
            const payload = { ...form };
            if (useMock) {
                await new Promise(r => setTimeout(r, 700));
                const newIssue = { id: Date.now(), ...payload, votes: 0, status: 'Nou', created_at: new Date().toISOString(), isOwn: true };
                setMyIssues(prev => [newIssue, ...prev]);
                setAllIssues(prev => [newIssue, ...prev]);
                showToast('Sesizare trimisă cu succes! ✓', 'success');
                setForm({ title: '', description: '', category: 'Infrastructură', priority: 'Medie', lat: null, lng: null });
                setStep(1);
                setTab('my');
            } else {
                await axios.post(`${apiUrl}/issues`, payload, { headers: { Authorization: `Bearer ${user.token}` } });
                showToast('Sesizare trimisă! ✓', 'success');
                setTab('my');
            }
        } catch { showToast('Eroare la trimitere.', 'error'); }
        finally { setSubmitting(false); }
    };

    // ── Editare ──
    const openEdit = (issue) => {
        setEditingIssue({ ...issue });
        setEditLocation({ lat: issue.lat, lng: issue.lng });
    };

    const saveEdit = async () => {
        if (!editingIssue.title.trim() || !editingIssue.description.trim()) {
            showToast('Completează titlul și descrierea.', 'error'); return;
        }
        const updated = { ...editingIssue, lat: editLocation?.lat ?? editingIssue.lat, lng: editLocation?.lng ?? editingIssue.lng };
        if (useMock) {
            setMyIssues(prev => prev.map(i => i.id === updated.id ? updated : i));
            setAllIssues(prev => prev.map(i => i.id === updated.id ? updated : i));
            showToast('Sesizare actualizată! ✓', 'success');
        } else {
            try {
                await axios.put(`${apiUrl}/issues/${updated.id}`, updated, { headers: { Authorization: `Bearer ${user.token}` } });
                showToast('Sesizare actualizată! ✓', 'success');
            } catch { showToast('Eroare la actualizare.', 'error'); return; }
        }
        setEditingIssue(null);
        setEditLocation(null);
    };

    // ── Ștergere ──
    const confirmDelete = async (id) => {
        if (useMock) {
            setMyIssues(prev => prev.filter(i => i.id !== id));
            setAllIssues(prev => prev.filter(i => i.id !== id));
            showToast('Sesizare ștearsă.', 'success');
        } else {
            try {
                await axios.delete(`${apiUrl}/issues/${id}`, { headers: { Authorization: `Bearer ${user.token}` } });
                showToast('Sesizare ștearsă.', 'success');
            } catch { showToast('Eroare la ștergere.', 'error'); return; }
        }
        setDeleteConfirm(null);
    };

    // ── Votare ──
    const handleVote = async (id, e) => {
        e?.stopPropagation();
        if (!user) { showToast('Trebuie să fii logat pentru a vota!', 'error'); return; }
        if (votedIssues.has(id)) { showToast('Ai votat deja!', 'error'); return; }
        if (useMock) {
            setAllIssues(prev => prev.map(i => i.id === id ? { ...i, votes: (i.votes || 0) + 1 } : i));
            setMyIssues(prev => prev.map(i => i.id === id ? { ...i, votes: (i.votes || 0) + 1 } : i));
            setVotedIssues(prev => new Set([...prev, id]));
            showToast('Vot înregistrat! ▲', 'success');
        } else {
            try {
                await axios.post(`${apiUrl}/issues/${id}/vote`, {}, { headers: { Authorization: `Bearer ${user.token}` } });
                setVotedIssues(prev => new Set([...prev, id]));
                showToast('Vot înregistrat! ▲', 'success');
            } catch { showToast('Ai votat deja!', 'error'); }
        }
    };

    // ── Sesizări filtrate pentru hartă ──
    const filteredForMap = allIssues.filter(i => {
        const ms = mapFilter === 'Toate' || i.status === mapFilter;
        const ms2 = !mapSearch || i.title?.toLowerCase().includes(mapSearch.toLowerCase());
        return ms && ms2 && i.lat && i.lng;
    });

    if (!user) {
        return (
            <div className="ci-page">
                <div className="ci-auth-wall">
                    <div className="ci-auth-icon">🔒</div>
                    <h2>Autentificare necesară</h2>
                    <p>Trebuie să fii logat pentru a raporta sau gestiona sesizări.</p>
                    <div className="ci-auth-btns">
                        <Link to="/login" className="ci-btn-primary">🔐 Autentifică-te</Link>
                        <Link to="/register" className="ci-btn-secondary">Creează cont gratuit →</Link>
                    </div>
                </div>
                <style>{pageStyles}</style>
            </div>
        );
    }

    return (
        <div className="ci-page">
            <Toast msg={toast.msg} show={toast.show} type={toast.type} />
            <style>{pageStyles}</style>

            {/* ── HEADER ── */}
            <div className="ci-header">
                <div className="ci-header-inner">
                    <Link to="/" className="ci-back">← Înapoi la hartă</Link>
                    <div className="ci-header-title">
                        <h1>🚨 Raportare probleme</h1>
                        <p>Sesizează problemele din Galați și urmărește rezolvarea lor</p>
                    </div>
                    <div className="ci-header-stats">
                        <div className="ci-hstat">
                            <span className="ci-hstat-val">{myIssues.length}</span>
                            <span className="ci-hstat-lbl">Sesizările mele</span>
                        </div>
                        <div className="ci-hstat">
                            <span className="ci-hstat-val">{myIssues.filter(i => i.status === 'Rezolvat').length}</span>
                            <span className="ci-hstat-lbl">Rezolvate</span>
                        </div>
                        <div className="ci-hstat">
                            <span className="ci-hstat-val">{myIssues.reduce((s, i) => s + (i.votes || 0), 0)}</span>
                            <span className="ci-hstat-lbl">Voturi primite</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── TABS ── */}
            <div className="ci-tabs-wrap">
                <div className="ci-tabs">
                    <button className={`ci-tab ${tab === 'my' ? 'active' : ''}`} onClick={() => setTab('my')}>
                        📋 Sesizările mele
                        {myIssues.length > 0 && <span className="ci-tab-count">{myIssues.length}</span>}
                    </button>
                    <button className={`ci-tab ${tab === 'new' ? 'active' : ''}`} onClick={() => { setTab('new'); setStep(1); }}>
                        ✚ Sesizare nouă
                    </button>
                    <button className={`ci-tab ${tab === 'map' ? 'active' : ''}`} onClick={() => setTab('map')}>
                        🗺 Hartă sesizări
                        <span className="ci-tab-count">{allIssues.length}</span>
                    </button>
                </div>
            </div>

            <div className="ci-body">

                {/* ════════ TAB: SESIZĂRILE MELE ════════ */}
                {tab === 'my' && (
                    <div className="ci-my-section">
                        {isLoading ? (
                            <div className="ci-loading">
                                <div className="ci-spinner" />
                                <p>Se încarcă sesizările...</p>
                            </div>
                        ) : myIssues.length === 0 ? (
                            <div className="ci-empty">
                                <div className="ci-empty-icon">📭</div>
                                <h3>Nu ai sesizări încă</h3>
                                <p>Fii primul care semnalează o problemă în cartierul tău!</p>
                                <button className="ci-btn-primary" onClick={() => { setTab('new'); setStep(1); }}>
                                    ✚ Adaugă prima sesizare
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="ci-my-header">
                                    <h2>Sesizările tale ({myIssues.length})</h2>
                                    <button className="ci-btn-primary ci-btn-sm" onClick={() => { setTab('new'); setStep(1); }}>
                                        ✚ Sesizare nouă
                                    </button>
                                </div>
                                <div className="ci-my-grid">
                                    {myIssues.map(issue => (
                                        <div key={issue.id} className="ci-issue-card" onClick={() => setSelectedIssue(issue)}>
                                            <div className="ci-ic-top">
                                                <div className="ci-ic-cat">
                                                    {CATEGORIES.find(c => c.value === issue.category)?.label?.split(' ')[0] || '📋'}
                                                </div>
                                                <StatusBadge status={issue.status} />
                                            </div>
                                            <h3 className="ci-ic-title">{issue.title}</h3>
                                            <p className="ci-ic-desc">{issue.description?.substring(0, 90)}{issue.description?.length > 90 ? '...' : ''}</p>
                                            <div className="ci-ic-meta">
                                                <span className="ci-ic-cat-label">{issue.category}</span>
                                                <span className="ci-ic-priority" style={{ color: PRIORITIES.find(p => p.value === issue.priority)?.color || '#94a3b8' }}>
                                                    ● {issue.priority}
                                                </span>
                                                <span className="ci-ic-date">
                                                    {issue.created_at ? new Date(issue.created_at).toLocaleDateString('ro-RO') : ''}
                                                </span>
                                            </div>
                                            <div className="ci-ic-footer" onClick={e => e.stopPropagation()}>
                                                <button
                                                    className={`ci-vote-btn ${votedIssues.has(issue.id) ? 'voted' : ''}`}
                                                    onClick={e => handleVote(issue.id, e)}
                                                    title="Susțin sesizarea"
                                                >
                                                    ▲ {issue.votes || 0} voturi
                                                </button>
                                                <div className="ci-ic-actions">
                                                    <button
                                                        className="ci-action-btn ci-edit-btn"
                                                        onClick={e => { e.stopPropagation(); openEdit(issue); }}
                                                        title="Editează sesizarea"
                                                    >
                                                        ✏️ Editează
                                                    </button>
                                                    <button
                                                        className="ci-action-btn ci-delete-btn"
                                                        onClick={e => { e.stopPropagation(); setDeleteConfirm(issue.id); }}
                                                        title="Șterge sesizarea"
                                                    >
                                                        🗑️ Șterge
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* ════════ TAB: SESIZARE NOUĂ ════════ */}
                {tab === 'new' && (
                    <div className="ci-new-section">
                        {/* Stepper */}
                        <div className="ci-stepper">
                            <div className={`ci-step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'done' : ''}`}>
                                <div className="ci-step-num">{step > 1 ? '✓' : '1'}</div>
                                <span>Locație</span>
                            </div>
                            <div className="ci-step-line" />
                            <div className={`ci-step ${step >= 2 ? 'active' : ''} ${step > 2 ? 'done' : ''}`}>
                                <div className="ci-step-num">{step > 2 ? '✓' : '2'}</div>
                                <span>Detalii</span>
                            </div>
                            <div className="ci-step-line" />
                            <div className={`ci-step ${step >= 3 ? 'active' : ''}`}>
                                <div className="ci-step-num">3</div>
                                <span>Confirmare</span>
                            </div>
                        </div>

                        {/* STEP 1 — Locație */}
                        {step === 1 && (
                            <div className="ci-card">
                                <div className="ci-card-header">
                                    <span className="ci-card-icon">📍</span>
                                    <div>
                                        <h2>Selectează locația problemei</h2>
                                        <p>Click pe hartă exact unde se află problema</p>
                                    </div>
                                </div>
                                {formErrors.location && <div className="ci-err">{formErrors.location}</div>}
                                <div className="ci-map-pick">
                                    <MapContainer center={GALATI_CENTER} zoom={14} style={{ height: '420px', width: '100%' }}>
                                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
                                        <MapPicker editMode={true} onPick={latlng => setForm(f => ({ ...f, lat: latlng.lat, lng: latlng.lng }))} />
                                        {form.lat && form.lng && <Marker position={[form.lat, form.lng]} icon={SELECTED_ICON} />}
                                    </MapContainer>
                                </div>
                                {form.lat && form.lng ? (
                                    <div className="ci-loc-confirm">
                                        <span>✓ Locație selectată: {form.lat.toFixed(5)}, {form.lng.toFixed(5)}</span>
                                        <button className="ci-change-loc" onClick={() => setForm(f => ({ ...f, lat: null, lng: null }))}>Schimbă</button>
                                    </div>
                                ) : (
                                    <div className="ci-loc-hint">👆 Click pe hartă pentru a plasa marcatorul</div>
                                )}
                                <div className="ci-step-btns">
                                    <button
                                        className="ci-btn-primary"
                                        disabled={!form.lat || !form.lng}
                                        onClick={() => { setFormErrors({}); setStep(2); }}
                                    >
                                        Continuă →
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* STEP 2 — Detalii */}
                        {step === 2 && (
                            <div className="ci-card">
                                <div className="ci-card-header">
                                    <span className="ci-card-icon">📝</span>
                                    <div>
                                        <h2>Detalii sesizare</h2>
                                        <p>Descrie problema cât mai clar posibil</p>
                                    </div>
                                </div>

                                <div className="ci-form">
                                    {/* Titlu */}
                                    <div className="ci-field">
                                        <label>Titlu sesizare <span className="ci-req">*</span></label>
                                        <input
                                            type="text"
                                            placeholder="Ex: Groapă periculoasă pe strada Brăilei nr. 15"
                                            value={form.title}
                                            onChange={e => { setForm(f => ({ ...f, title: e.target.value })); setFormErrors(fe => ({ ...fe, title: '' })); }}
                                            maxLength={100}
                                            className={formErrors.title ? 'ci-input-err' : ''}
                                        />
                                        <div className="ci-field-foot">
                                            {formErrors.title && <span className="ci-field-err">{formErrors.title}</span>}
                                            <span className="ci-char-count">{form.title.length}/100</span>
                                        </div>
                                    </div>

                                    {/* Descriere */}
                                    <div className="ci-field">
                                        <label>Descriere detaliată <span className="ci-req">*</span></label>
                                        <textarea
                                            placeholder="Descrie: ce problemă există, de cât timp, ce riscuri prezintă, cui adresezi sesizarea..."
                                            value={form.description}
                                            onChange={e => { setForm(f => ({ ...f, description: e.target.value })); setFormErrors(fe => ({ ...fe, description: '' })); }}
                                            rows={4}
                                            maxLength={600}
                                            className={formErrors.description ? 'ci-input-err' : ''}
                                        />
                                        <div className="ci-field-foot">
                                            {formErrors.description && <span className="ci-field-err">{formErrors.description}</span>}
                                            <span className="ci-char-count">{form.description.length}/600</span>
                                        </div>
                                    </div>

                                    {/* Categorie */}
                                    <div className="ci-field">
                                        <label>Categorie</label>
                                        <div className="ci-cat-grid">
                                            {CATEGORIES.map(cat => (
                                                <button
                                                    key={cat.value}
                                                    type="button"
                                                    className={`ci-cat-btn ${form.category === cat.value ? 'active' : ''}`}
                                                    onClick={() => setForm(f => ({ ...f, category: cat.value }))}
                                                >
                                                    <span className="ci-cat-icon">{cat.label.split(' ')[0]}</span>
                                                    <span className="ci-cat-name">{cat.value}</span>
                                                    <span className="ci-cat-desc">{cat.desc}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Prioritate */}
                                    <div className="ci-field">
                                        <label>Prioritate</label>
                                        <div className="ci-priority-row">
                                            {PRIORITIES.map(p => (
                                                <button
                                                    key={p.value}
                                                    type="button"
                                                    className={`ci-prio-btn ${form.priority === p.value ? 'active' : ''}`}
                                                    style={{ '--prio-color': p.color }}
                                                    onClick={() => setForm(f => ({ ...f, priority: p.value }))}
                                                >
                                                    <span className="ci-prio-dot" style={{ background: p.color }} />
                                                    <div>
                                                        <div className="ci-prio-name">{p.value}</div>
                                                        <div className="ci-prio-desc">{p.desc}</div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Preview locație */}
                                    <div className="ci-loc-preview">
                                        📍 Locație: {form.lat?.toFixed(5)}, {form.lng?.toFixed(5)}
                                        <button type="button" className="ci-change-loc" onClick={() => setStep(1)}>Schimbă</button>
                                    </div>

                                    <div className="ci-step-btns">
                                        <button className="ci-btn-secondary" onClick={() => setStep(1)}>← Înapoi</button>
                                        <button
                                            className="ci-btn-primary"
                                            onClick={() => {
                                                const errs = validate();
                                                if (Object.keys(errs).length) { setFormErrors(errs); return; }
                                                setFormErrors({});
                                                setStep(3);
                                            }}
                                        >
                                            Continuă →
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* STEP 3 — Confirmare */}
                        {step === 3 && (
                            <div className="ci-card">
                                <div className="ci-card-header">
                                    <span className="ci-card-icon">✅</span>
                                    <div>
                                        <h2>Confirmă sesizarea</h2>
                                        <p>Verifică detaliile înainte de trimitere</p>
                                    </div>
                                </div>

                                <div className="ci-preview-box">
                                    <div className="ci-preview-row">
                                        <span className="ci-preview-lbl">Titlu</span>
                                        <span className="ci-preview-val">{form.title}</span>
                                    </div>
                                    <div className="ci-preview-row">
                                        <span className="ci-preview-lbl">Descriere</span>
                                        <span className="ci-preview-val">{form.description}</span>
                                    </div>
                                    <div className="ci-preview-row">
                                        <span className="ci-preview-lbl">Categorie</span>
                                        <span className="ci-preview-val">{CATEGORIES.find(c => c.value === form.category)?.label}</span>
                                    </div>
                                    <div className="ci-preview-row">
                                        <span className="ci-preview-lbl">Prioritate</span>
                                        <span className="ci-preview-val" style={{ color: PRIORITIES.find(p => p.value === form.priority)?.color }}>
                                            ● {form.priority}
                                        </span>
                                    </div>
                                    <div className="ci-preview-row">
                                        <span className="ci-preview-lbl">Locație</span>
                                        <span className="ci-preview-val">📍 {form.lat?.toFixed(5)}, {form.lng?.toFixed(5)}</span>
                                    </div>
                                </div>

                                <div className="ci-info-box">
                                    <span>🏛️</span>
                                    <p>Sesizarea ta va fi transmisă Primăriei Galați și va apărea pe hartă pentru a putea fi susținută de cetățeni.</p>
                                </div>

                                <div className="ci-step-btns">
                                    <button className="ci-btn-secondary" onClick={() => setStep(2)}>← Înapoi</button>
                                    <button
                                        className="ci-btn-primary ci-submit-btn"
                                        onClick={handleSubmit}
                                        disabled={submitting}
                                    >
                                        {submitting ? <><span className="ci-spin" /> Se trimite...</> : '📤 Trimite sesizarea'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ════════ TAB: HARTĂ ════════ */}
                {tab === 'map' && (
                    <div className="ci-map-section">
                        <div className="ci-map-controls">
                            <div className="ci-map-search-wrap">
                                <span>🔍</span>
                                <input
                                    type="text"
                                    placeholder="Caută sesizări pe hartă..."
                                    value={mapSearch}
                                    onChange={e => setMapSearch(e.target.value)}
                                    className="ci-map-search"
                                />
                            </div>
                            <div className="ci-map-filters">
                                {['Toate', 'Nou', 'În lucru', 'Rezolvat'].map(s => (
                                    <button
                                        key={s}
                                        className={`ci-map-filter-btn ${mapFilter === s ? 'active' : ''}`}
                                        onClick={() => setMapFilter(s)}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                            <span className="ci-map-count">{filteredForMap.length} sesizări pe hartă</span>
                        </div>

                        <div className="ci-map-layout">
                            <div className="ci-map-container">
                                <MapContainer center={GALATI_CENTER} zoom={13} style={{ height: '100%', width: '100%' }}>
                                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
                                    <MapPicker editMode={false} onPick={() => { }} />
                                    {filteredForMap.map(issue => (
                                        <Marker
                                            key={issue.id}
                                            position={[issue.lat, issue.lng]}
                                            icon={STATUS_ICONS[issue.status] || NEW_ICON}
                                            eventHandlers={{ click: () => setSelectedIssue(issue) }}
                                        >
                                            <Popup maxWidth={220}>
                                                <div className="ci-map-popup">
                                                    <strong>{issue.title}</strong>
                                                    <div style={{ display: 'flex', gap: '6px', margin: '6px 0', flexWrap: 'wrap' }}>
                                                        <StatusBadge status={issue.status} />
                                                    </div>
                                                    <p>{issue.description?.substring(0, 80)}...</p>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '8px', marginTop: '6px' }}>
                                                        <span style={{ fontSize: '12px', color: '#64748b' }}>▲ {issue.votes || 0} voturi</span>
                                                        <button
                                                            style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                                                            onClick={() => setSelectedIssue(issue)}
                                                        >Detalii →</button>
                                                    </div>
                                                </div>
                                            </Popup>
                                        </Marker>
                                    ))}
                                </MapContainer>
                                {/* Legendă */}
                                <div className="ci-map-legend">
                                    <span className="ci-leg-item"><span style={{ background: '#ef4444' }} className="ci-leg-dot" />Nou</span>
                                    <span className="ci-leg-item"><span style={{ background: '#f59e0b' }} className="ci-leg-dot" />În lucru</span>
                                    <span className="ci-leg-item"><span style={{ background: '#3b82f6' }} className="ci-leg-dot" />Verificare</span>
                                    <span className="ci-leg-item"><span style={{ background: '#10b981' }} className="ci-leg-dot" />Rezolvat</span>
                                    <span className="ci-leg-item"><span style={{ background: '#a855f7' }} className="ci-leg-dot" />Selectat</span>
                                </div>
                            </div>

                            {/* Sidebar sesizări */}
                            <div className="ci-map-sidebar">
                                <div className="ci-sidebar-header">Sesizări ({filteredForMap.length})</div>
                                <div className="ci-sidebar-list">
                                    {filteredForMap.map(issue => (
                                        <div
                                            key={issue.id}
                                            className={`ci-sidebar-item ${selectedIssue?.id === issue.id ? 'active' : ''}`}
                                            onClick={() => setSelectedIssue(issue)}
                                        >
                                            <div className="ci-si-top">
                                                <span className="ci-si-icon">{CATEGORIES.find(c => c.value === issue.category)?.label?.split(' ')[0] || '📋'}</span>
                                                <StatusBadge status={issue.status} />
                                            </div>
                                            <div className="ci-si-title">{issue.title}</div>
                                            <div className="ci-si-meta">
                                                <span>{issue.category}</span>
                                                <span>▲ {issue.votes || 0}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ══ MODAL DETALII ══ */}
            {selectedIssue && (
                <div className="ci-overlay" onClick={() => setSelectedIssue(null)}>
                    <div className="ci-modal" onClick={e => e.stopPropagation()}>
                        <div className="ci-modal-header">
                            <div className="ci-modal-title-wrap">
                                <span className="ci-modal-cat-icon">
                                    {CATEGORIES.find(c => c.value === selectedIssue.category)?.label?.split(' ')[0] || '📋'}
                                </span>
                                <div>
                                    <div className="ci-modal-title">{selectedIssue.title}</div>
                                    <div className="ci-modal-sub">#{selectedIssue.id} · {selectedIssue.category}</div>
                                </div>
                            </div>
                            <button className="ci-modal-close" onClick={() => setSelectedIssue(null)}>✕</button>
                        </div>
                        <div className="ci-modal-body">
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
                                <StatusBadge status={selectedIssue.status} />
                                <span className="ci-modal-priority" style={{ color: PRIORITIES.find(p => p.value === selectedIssue.priority)?.color }}>
                                    ● {selectedIssue.priority}
                                </span>
                            </div>
                            <p className="ci-modal-desc">{selectedIssue.description}</p>
                            {selectedIssue.lat && selectedIssue.lng && (
                                <div className="ci-modal-loc">
                                    📍 {parseFloat(selectedIssue.lat).toFixed(5)}, {parseFloat(selectedIssue.lng).toFixed(5)}
                                    <a href={`https://www.google.com/maps?q=${selectedIssue.lat},${selectedIssue.lng}`} target="_blank" rel="noreferrer" className="ci-maps-link">
                                        Deschide în Maps →
                                    </a>
                                </div>
                            )}
                            <div className="ci-modal-date">
                                🕐 Raportată pe {selectedIssue.created_at ? new Date(selectedIssue.created_at).toLocaleDateString('ro-RO', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
                            </div>
                            {selectedIssue.admin_reply && (
                                <div className="ci-admin-reply">
                                    <div className="ci-reply-lbl">🏛️ Răspuns oficial Primăria Galați</div>
                                    <p>{selectedIssue.admin_reply}</p>
                                </div>
                            )}
                            <div className="ci-modal-actions">
                                <button
                                    className={`ci-vote-btn-lg ${votedIssues.has(selectedIssue.id) ? 'voted' : ''}`}
                                    onClick={() => handleVote(selectedIssue.id)}
                                >
                                    ▲ Susțin ({selectedIssue.votes || 0})
                                </button>
                                {selectedIssue.isOwn && (
                                    <>
                                        <button className="ci-modal-btn ci-edit-btn" onClick={() => { openEdit(selectedIssue); setSelectedIssue(null); }}>
                                            ✏️ Editează
                                        </button>
                                        <button className="ci-modal-btn ci-delete-btn" onClick={() => { setDeleteConfirm(selectedIssue.id); setSelectedIssue(null); }}>
                                            🗑️ Șterge
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ══ MODAL EDITARE ══ */}
            {editingIssue && (
                <div className="ci-overlay" onClick={() => setEditingIssue(null)}>
                    <div className="ci-modal ci-modal-lg" onClick={e => e.stopPropagation()}>
                        <div className="ci-modal-header">
                            <div className="ci-modal-title-wrap">
                                <span className="ci-modal-cat-icon">✏️</span>
                                <div>
                                    <div className="ci-modal-title">Editează sesizarea</div>
                                    <div className="ci-modal-sub">#{editingIssue.id}</div>
                                </div>
                            </div>
                            <button className="ci-modal-close" onClick={() => setEditingIssue(null)}>✕</button>
                        </div>
                        <div className="ci-modal-body">
                            <div className="ci-form">
                                <div className="ci-field">
                                    <label>Titlu</label>
                                    <input
                                        type="text"
                                        value={editingIssue.title}
                                        onChange={e => setEditingIssue(i => ({ ...i, title: e.target.value }))}
                                        maxLength={100}
                                    />
                                </div>
                                <div className="ci-field">
                                    <label>Descriere</label>
                                    <textarea
                                        value={editingIssue.description}
                                        onChange={e => setEditingIssue(i => ({ ...i, description: e.target.value }))}
                                        rows={4}
                                        maxLength={600}
                                    />
                                </div>
                                <div className="ci-field-row">
                                    <div className="ci-field">
                                        <label>Categorie</label>
                                        <select value={editingIssue.category} onChange={e => setEditingIssue(i => ({ ...i, category: e.target.value }))}>
                                            {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                                        </select>
                                    </div>
                                    <div className="ci-field">
                                        <label>Prioritate</label>
                                        <select value={editingIssue.priority} onChange={e => setEditingIssue(i => ({ ...i, priority: e.target.value }))}>
                                            {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.value}</option>)}
                                        </select>
                                    </div>
                                </div>
                                {/* Hartă editare locație */}
                                <div className="ci-field">
                                    <label>Locație (click pe hartă pentru a schimba)</label>
                                    <div style={{ borderRadius: '10px', overflow: 'hidden', height: '260px' }}>
                                        <MapContainer
                                            center={[editLocation?.lat ?? editingIssue.lat, editLocation?.lng ?? editingIssue.lng]}
                                            zoom={15}
                                            style={{ height: '100%', width: '100%' }}
                                        >
                                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                            <MapPicker editMode={true} onPick={latlng => setEditLocation(latlng)} />
                                            <Marker position={[editLocation?.lat ?? editingIssue.lat, editLocation?.lng ?? editingIssue.lng]} icon={SELECTED_ICON} />
                                        </MapContainer>
                                    </div>
                                </div>
                            </div>
                            <div className="ci-modal-actions" style={{ marginTop: '16px' }}>
                                <button className="ci-btn-secondary" onClick={() => setEditingIssue(null)}>Anulează</button>
                                <button className="ci-btn-primary" onClick={saveEdit}>💾 Salvează modificările</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ══ CONFIRM ȘTERGERE ══ */}
            {deleteConfirm && (
                <div className="ci-overlay" onClick={() => setDeleteConfirm(null)}>
                    <div className="ci-confirm-modal" onClick={e => e.stopPropagation()}>
                        <div className="ci-confirm-icon">🗑️</div>
                        <h3>Ștergi sesizarea?</h3>
                        <p>Această acțiune este permanentă și nu poate fi anulată.</p>
                        <div className="ci-confirm-btns">
                            <button className="ci-btn-secondary" onClick={() => setDeleteConfirm(null)}>Anulează</button>
                            <button className="ci-btn-danger" onClick={() => confirmDelete(deleteConfirm)}>Da, șterge</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// ── Stiluri inline (pentru portabilitate) ──
const pageStyles = `
    .ci-page {
        min-height: 100vh;
        background: var(--bg, #080f1e);
        font-family: 'Outfit', system-ui, sans-serif;
        color: var(--text, #e8f0fe);
    }

    /* Header */
    .ci-header {
        background: rgba(15,26,46,.95);
        border-bottom: 1px solid rgba(255,255,255,.07);
        padding: 0 24px;
    }
    .ci-header-inner {
        max-width: 1200px;
        margin: 0 auto;
        padding: 20px 0;
        display: flex;
        flex-direction: column;
        gap: 14px;
    }
    .ci-back { color: #4d6380; font-size: 13px; text-decoration: none; transition: color .15s; display: inline-block; }
    .ci-back:hover { color: #3b82f6; }
    .ci-header-title h1 { font-size: 1.6rem; font-weight: 700; margin-bottom: 4px; }
    .ci-header-title p  { font-size: 14px; color: #4d6380; }
    .ci-header-stats { display: flex; gap: 24px; }
    .ci-hstat { text-align: center; }
    .ci-hstat-val { display: block; font-size: 1.5rem; font-weight: 700; color: #3b82f6; }
    .ci-hstat-lbl { font-size: 11px; color: #4d6380; font-weight: 500; }

    /* Auth wall */
    .ci-auth-wall {
        max-width: 460px; margin: 80px auto; text-align: center;
        background: rgba(15,26,46,.8); border: 1px solid rgba(255,255,255,.08);
        border-radius: 20px; padding: 40px 32px;
    }
    .ci-auth-icon { font-size: 3rem; margin-bottom: 16px; }
    .ci-auth-wall h2 { font-size: 1.4rem; margin-bottom: 10px; }
    .ci-auth-wall p  { font-size: 14px; color: #4d6380; margin-bottom: 24px; }
    .ci-auth-btns { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; }

    /* Tabs */
    .ci-tabs-wrap {
        background: rgba(15,26,46,.7);
        border-bottom: 1px solid rgba(255,255,255,.06);
        padding: 0 24px;
        position: sticky; top: 60px; z-index: 50;
        backdrop-filter: blur(12px);
    }
    .ci-tabs { max-width: 1200px; margin: 0 auto; display: flex; gap: 4px; }
    .ci-tab {
        background: none; border: none; color: #4d6380; cursor: pointer;
        font-size: 14px; font-weight: 500; font-family: inherit;
        padding: 14px 20px; border-bottom: 2px solid transparent;
        transition: all .15s; display: flex; align-items: center; gap: 6px;
    }
    .ci-tab:hover { color: #8fa3c0; }
    .ci-tab.active { color: #3b82f6; border-bottom-color: #3b82f6; }
    .ci-tab-count {
        background: #3b82f6; color: #fff;
        border-radius: 10px; padding: 1px 7px; font-size: 10px; font-weight: 700;
    }

    /* Body */
    .ci-body { max-width: 1200px; margin: 0 auto; padding: 24px; }

    /* Sesizările mele */
    .ci-my-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .ci-my-header h2 { font-size: 1.1rem; font-weight: 600; }
    .ci-my-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 14px; }
    .ci-issue-card {
        background: rgba(15,26,46,.8); border: 1px solid rgba(255,255,255,.07);
        border-radius: 14px; padding: 16px; cursor: pointer;
        transition: all .18s; display: flex; flex-direction: column; gap: 8px;
    }
    .ci-issue-card:hover { border-color: rgba(59,130,246,.4); transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,.3); }
    .ci-ic-top { display: flex; justify-content: space-between; align-items: center; }
    .ci-ic-cat { font-size: 22px; }
    .ci-ic-title { font-size: 14px; font-weight: 600; line-height: 1.35; }
    .ci-ic-desc  { font-size: 12px; color: #4d6380; line-height: 1.55; flex: 1; }
    .ci-ic-meta  { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .ci-ic-cat-label {
        font-size: 10px; color: #4d6380; background: rgba(255,255,255,.05);
        border: 1px solid rgba(255,255,255,.07); border-radius: 8px; padding: 2px 7px; font-weight: 500;
    }
    .ci-ic-priority { font-size: 11px; font-weight: 500; }
    .ci-ic-date { font-size: 10px; color: #4d6380; margin-left: auto; }
    .ci-ic-footer { display: flex; justify-content: space-between; align-items: center; padding-top: 10px; border-top: 1px solid rgba(255,255,255,.05); }
    .ci-ic-actions { display: flex; gap: 6px; }

    /* Vote btn */
    .ci-vote-btn {
        background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.08);
        color: #8fa3c0; padding: 5px 12px; border-radius: 7px;
        font-size: 12px; font-weight: 500; cursor: pointer; font-family: inherit;
        transition: all .15s;
    }
    .ci-vote-btn:hover { background: rgba(59,130,246,.12); color: #3b82f6; border-color: rgba(59,130,246,.35); }
    .ci-vote-btn.voted { background: rgba(59,130,246,.15); color: #3b82f6; border-color: rgba(59,130,246,.4); }

    .ci-vote-btn-lg {
        background: rgba(59,130,246,.1); border: 1px solid rgba(59,130,246,.25);
        color: #3b82f6; padding: 9px 20px; border-radius: 8px;
        font-size: 14px; font-weight: 600; cursor: pointer; font-family: inherit;
        transition: all .15s;
    }
    .ci-vote-btn-lg:hover { background: rgba(59,130,246,.2); }
    .ci-vote-btn-lg.voted { opacity: 0.7; cursor: default; }

    /* Action btns */
    .ci-action-btn {
        padding: 5px 10px; border-radius: 7px; font-size: 11px; font-weight: 500;
        cursor: pointer; border: 1px solid; transition: all .15s; font-family: inherit;
    }
    .ci-edit-btn   { background: rgba(59,130,246,.08); border-color: rgba(59,130,246,.25); color: #93c5fd; }
    .ci-edit-btn:hover { background: rgba(59,130,246,.16); }
    .ci-delete-btn { background: rgba(239,68,68,.08); border-color: rgba(239,68,68,.25); color: #fca5a5; }
    .ci-delete-btn:hover { background: rgba(239,68,68,.16); }

    /* Formular nou */
    .ci-new-section { max-width: 720px; margin: 0 auto; }
    .ci-stepper {
        display: flex; align-items: center; margin-bottom: 24px;
        background: rgba(15,26,46,.6); border: 1px solid rgba(255,255,255,.06);
        border-radius: 12px; padding: 14px 20px;
    }
    .ci-step { display: flex; align-items: center; gap: 8px; opacity: .4; transition: opacity .2s; }
    .ci-step.active { opacity: 1; }
    .ci-step.done .ci-step-num { background: #10b981; border-color: #10b981; }
    .ci-step-num {
        width: 28px; height: 28px; border-radius: 50%;
        background: rgba(59,130,246,.15); border: 1.5px solid rgba(59,130,246,.3);
        display: flex; align-items: center; justify-content: center;
        font-size: 12px; font-weight: 700; color: #3b82f6; flex-shrink: 0;
    }
    .ci-step.active .ci-step-num { background: #3b82f6; color: #fff; border-color: #3b82f6; }
    .ci-step span { font-size: 13px; font-weight: 500; color: #8fa3c0; white-space: nowrap; }
    .ci-step-line { flex: 1; height: 1px; background: rgba(255,255,255,.08); margin: 0 12px; }

    .ci-card {
        background: rgba(15,26,46,.8); border: 1px solid rgba(255,255,255,.07);
        border-radius: 16px; padding: 24px;
    }
    .ci-card-header { display: flex; gap: 14px; align-items: flex-start; margin-bottom: 20px; }
    .ci-card-icon { font-size: 28px; flex-shrink: 0; }
    .ci-card-header h2 { font-size: 1.1rem; font-weight: 700; margin-bottom: 4px; }
    .ci-card-header p  { font-size: 13px; color: #4d6380; }

    .ci-map-pick { border-radius: 12px; overflow: hidden; border: 1px solid rgba(255,255,255,.08); margin-bottom: 12px; }
    .ci-loc-confirm {
        background: rgba(16,185,129,.08); border: 1px solid rgba(16,185,129,.2);
        border-radius: 8px; padding: 10px 14px; font-size: 13px; color: #6ee7b7;
        display: flex; justify-content: space-between; align-items: center;
        margin-bottom: 16px;
    }
    .ci-loc-hint {
        background: rgba(255,255,255,.04); border: 1px dashed rgba(255,255,255,.12);
        border-radius: 8px; padding: 10px 14px; font-size: 13px; color: #4d6380;
        text-align: center; margin-bottom: 16px;
    }
    .ci-change-loc { background: none; border: none; color: #3b82f6; font-size: 12px; cursor: pointer; font-weight: 600; text-decoration: underline; font-family: inherit; }

    /* Form fields */
    .ci-form { display: flex; flex-direction: column; gap: 18px; }
    .ci-field { display: flex; flex-direction: column; gap: 6px; }
    .ci-field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    .ci-field label { font-size: 12px; font-weight: 600; color: #8fa3c0; text-transform: uppercase; letter-spacing: .5px; }
    .ci-req { color: #ef4444; }
    .ci-field input, .ci-field textarea, .ci-field select {
        width: 100%; padding: 11px 14px;
        background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.08);
        border-radius: 9px; color: #e8f0fe; font-family: inherit; font-size: 14px;
        transition: border .2s; outline: none;
    }
    .ci-field input:focus, .ci-field textarea:focus, .ci-field select:focus { border-color: #3b82f6; background: rgba(59,130,246,.04); }
    .ci-field input::placeholder, .ci-field textarea::placeholder { color: #4d6380; }
    .ci-field textarea { resize: vertical; line-height: 1.6; }
    .ci-input-err { border-color: #ef4444 !important; }
    .ci-field-foot { display: flex; justify-content: space-between; align-items: center; min-height: 16px; }
    .ci-field-err { font-size: 11px; color: #fca5a5; }
    .ci-char-count { font-size: 11px; color: #4d6380; margin-left: auto; }
    .ci-err { background: rgba(239,68,68,.1); border: 1px solid rgba(239,68,68,.25); border-radius: 8px; padding: 10px 14px; font-size: 13px; color: #fca5a5; margin-bottom: 14px; }

    /* Categorie grid */
    .ci-cat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
    .ci-cat-btn {
        background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.07);
        border-radius: 10px; padding: 10px 8px; text-align: center; cursor: pointer;
        transition: all .15s; font-family: inherit; display: flex; flex-direction: column;
        align-items: center; gap: 3px;
    }
    .ci-cat-btn:hover { border-color: rgba(59,130,246,.4); background: rgba(59,130,246,.06); transform: translateY(-1px); }
    .ci-cat-btn.active { border-color: #3b82f6; background: rgba(59,130,246,.12); }
    .ci-cat-icon { font-size: 18px; }
    .ci-cat-name { font-size: 11px; font-weight: 600; color: #8fa3c0; }
    .ci-cat-desc { font-size: 10px; color: #4d6380; line-height: 1.3; }

    /* Prioritate */
    .ci-priority-row { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
    .ci-prio-btn {
        background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.07);
        border-radius: 10px; padding: 12px; cursor: pointer; text-align: left;
        font-family: inherit; transition: all .15s; display: flex; align-items: center; gap: 10px;
    }
    .ci-prio-btn:hover { border-color: rgba(var(--prio-color), .4); transform: translateY(-1px); }
    .ci-prio-btn.active { border-color: var(--prio-color); background: rgba(0,0,0,.15); box-shadow: 0 0 0 1px var(--prio-color) inset; }
    .ci-prio-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
    .ci-prio-name { font-size: 13px; font-weight: 600; color: #e8f0fe; }
    .ci-prio-desc { font-size: 10px; color: #4d6380; margin-top: 1px; }

    .ci-loc-preview {
        background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.07);
        border-radius: 8px; padding: 10px 14px; font-size: 13px; color: #4d6380;
        display: flex; justify-content: space-between; align-items: center;
    }

    /* Preview box */
    .ci-preview-box {
        background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.07);
        border-radius: 10px; overflow: hidden; margin-bottom: 14px;
    }
    .ci-preview-row {
        display: flex; gap: 14px; padding: 12px 16px;
        border-bottom: 1px solid rgba(255,255,255,.04);
    }
    .ci-preview-row:last-child { border-bottom: none; }
    .ci-preview-lbl { font-size: 12px; font-weight: 600; color: #4d6380; min-width: 80px; }
    .ci-preview-val { font-size: 13px; color: #e8f0fe; line-height: 1.5; }
    .ci-info-box {
        background: rgba(59,130,246,.07); border: 1px solid rgba(59,130,246,.18);
        border-radius: 8px; padding: 12px 14px; font-size: 13px; color: #93c5fd;
        display: flex; gap: 10px; align-items: flex-start; line-height: 1.55;
        margin-bottom: 14px;
    }

    /* Butoane */
    .ci-step-btns { display: flex; gap: 10px; justify-content: flex-end; padding-top: 6px; }
    .ci-btn-primary {
        background: #3b82f6; color: #fff; border: none; padding: 12px 24px;
        border-radius: 9px; font-size: 14px; font-weight: 600; cursor: pointer;
        transition: all .18s; font-family: inherit; display: inline-flex; align-items: center; gap: 7px;
        text-decoration: none;
    }
    .ci-btn-primary:hover:not(:disabled) { background: #1d4ed8; transform: translateY(-1px); box-shadow: 0 4px 14px rgba(59,130,246,.4); }
    .ci-btn-primary:disabled { opacity: .55; cursor: not-allowed; }
    .ci-btn-sm { padding: 8px 16px; font-size: 13px; }
    .ci-btn-secondary {
        background: transparent; color: #8fa3c0; border: 1px solid rgba(255,255,255,.12);
        padding: 12px 24px; border-radius: 9px; font-size: 14px; font-weight: 500;
        cursor: pointer; transition: all .18s; font-family: inherit; display: inline-flex; align-items: center; gap: 7px;
        text-decoration: none;
    }
    .ci-btn-secondary:hover { border-color: #3b82f6; color: #3b82f6; background: rgba(59,130,246,.06); }
    .ci-btn-danger {
        background: rgba(239,68,68,.15); color: #fca5a5; border: 1px solid rgba(239,68,68,.35);
        padding: 12px 24px; border-radius: 9px; font-size: 14px; font-weight: 600;
        cursor: pointer; transition: all .18s; font-family: inherit;
    }
    .ci-btn-danger:hover { background: rgba(239,68,68,.25); }
    .ci-submit-btn { min-width: 180px; justify-content: center; }
    .ci-spin {
        width: 14px; height: 14px; border: 2px solid rgba(255,255,255,.3);
        border-top-color: #fff; border-radius: 50%; animation: spin .6s linear infinite; display: inline-block;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* Badge */
    .ci-badge { display: inline-flex; align-items: center; padding: 2px 9px; border-radius: 14px; font-size: 10px; font-weight: 600; white-space: nowrap; }
    .ci-badge-new      { background: rgba(239,68,68,.12);  color: #fca5a5; border: 1px solid rgba(239,68,68,.2); }
    .ci-badge-progress { background: rgba(245,158,11,.12); color: #fcd34d; border: 1px solid rgba(245,158,11,.2); }
    .ci-badge-done     { background: rgba(16,185,129,.12); color: #6ee7b7; border: 1px solid rgba(16,185,129,.2); }
    .ci-badge-review   { background: rgba(59,130,246,.12); color: #93c5fd; border: 1px solid rgba(59,130,246,.2); }

    /* Hartă tab */
    .ci-map-section { display: flex; flex-direction: column; gap: 14px; }
    .ci-map-controls { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
    .ci-map-search-wrap { display: flex; align-items: center; gap: 8px; background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.08); border-radius: 9px; padding: 0 12px; flex: 1; min-width: 200px; }
    .ci-map-search { background: none; border: none; color: #e8f0fe; font-size: 14px; font-family: inherit; padding: 10px 0; outline: none; width: 100%; }
    .ci-map-search::placeholder { color: #4d6380; }
    .ci-map-filters { display: flex; gap: 5px; flex-wrap: wrap; }
    .ci-map-filter-btn {
        background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.07);
        color: #4d6380; padding: 7px 14px; border-radius: 20px;
        font-size: 12px; font-weight: 500; cursor: pointer; font-family: inherit; transition: all .15s;
    }
    .ci-map-filter-btn:hover { color: #8fa3c0; border-color: rgba(255,255,255,.15); }
    .ci-map-filter-btn.active { background: #3b82f6; border-color: #3b82f6; color: #fff; }
    .ci-map-count { font-size: 12px; color: #4d6380; white-space: nowrap; margin-left: auto; }

    .ci-map-layout { display: grid; grid-template-columns: 1fr 300px; gap: 14px; height: 580px; }
    .ci-map-container { position: relative; border-radius: 14px; overflow: hidden; border: 1px solid rgba(255,255,255,.07); }
    .ci-map-legend {
        position: absolute; bottom: 14px; left: 14px; z-index: 500;
        background: rgba(8,15,30,.9); border: 1px solid rgba(255,255,255,.08);
        border-radius: 10px; padding: 8px 12px; display: flex; gap: 12px; flex-wrap: wrap; backdrop-filter: blur(8px);
    }
    .ci-leg-item { display: flex; align-items: center; gap: 5px; font-size: 11px; color: #4d6380; font-weight: 500; }
    .ci-leg-dot { width: 7px; height: 7px; border-radius: 50%; display: inline-block; }

    /* Sidebar hartă */
    .ci-map-sidebar { background: rgba(15,26,46,.8); border: 1px solid rgba(255,255,255,.07); border-radius: 14px; overflow: hidden; display: flex; flex-direction: column; }
    .ci-sidebar-header { padding: 12px 14px; border-bottom: 1px solid rgba(255,255,255,.06); font-size: 13px; font-weight: 600; flex-shrink: 0; }
    .ci-sidebar-list { overflow-y: auto; flex: 1; }
    .ci-sidebar-item { padding: 10px 12px; border-bottom: 1px solid rgba(255,255,255,.04); cursor: pointer; transition: background .15s; }
    .ci-sidebar-item:hover { background: rgba(255,255,255,.03); }
    .ci-sidebar-item.active { background: rgba(59,130,246,.08); border-left: 2px solid #3b82f6; }
    .ci-si-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px; }
    .ci-si-icon { font-size: 16px; }
    .ci-si-title { font-size: 12px; font-weight: 600; line-height: 1.35; margin-bottom: 5px; }
    .ci-si-meta { display: flex; justify-content: space-between; font-size: 10px; color: #4d6380; }

    /* Popup hartă (leaflet e în DOM alb) */
    .ci-map-popup { padding: 12px; font-family: 'Outfit', sans-serif; background: #fff; min-width: 180px; }
    .ci-map-popup strong { display: block; font-size: 13px; color: #1e293b; margin-bottom: 6px; font-weight: 700; }
    .ci-map-popup p { font-size: 12px; color: #64748b; line-height: 1.5; margin-bottom: 8px; }

    /* Modal */
    .ci-overlay {
        position: fixed; inset: 0; background: rgba(0,0,0,.72);
        backdrop-filter: blur(6px); z-index: 200; display: flex;
        align-items: center; justify-content: center; padding: 20px;
        animation: ciOverlayIn .18s ease;
    }
    @keyframes ciOverlayIn { from { opacity: 0; } to { opacity: 1; } }
    .ci-modal {
        background: #0f1a2e; border: 1px solid rgba(255,255,255,.1);
        border-radius: 20px; width: 100%; max-width: 540px;
        max-height: 90vh; overflow-y: auto; box-shadow: 0 32px 80px rgba(0,0,0,.6);
        animation: ciModalIn .2s ease;
    }
    .ci-modal-lg { max-width: 680px; }
    @keyframes ciModalIn { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    .ci-modal-header { display: flex; justify-content: space-between; align-items: flex-start; padding: 18px 20px; border-bottom: 1px solid rgba(255,255,255,.07); gap: 12px; }
    .ci-modal-title-wrap { display: flex; gap: 12px; align-items: flex-start; flex: 1; min-width: 0; }
    .ci-modal-cat-icon { font-size: 22px; width: 40px; height: 40px; background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.08); border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .ci-modal-title { font-size: 15px; font-weight: 700; line-height: 1.3; }
    .ci-modal-sub   { font-size: 12px; color: #4d6380; margin-top: 3px; }
    .ci-modal-close { width: 30px; height: 30px; border-radius: 7px; border: 1px solid rgba(255,255,255,.08); background: transparent; color: #4d6380; cursor: pointer; font-size: 13px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: all .15s; }
    .ci-modal-close:hover { background: rgba(255,255,255,.07); color: #e8f0fe; }
    .ci-modal-body { padding: 18px 20px; }
    .ci-modal-desc { font-size: 13px; color: #8fa3c0; line-height: 1.7; margin-bottom: 12px; }
    .ci-modal-priority { font-size: 12px; font-weight: 500; }
    .ci-modal-loc { background: rgba(255,255,255,.04); border-radius: 8px; padding: 9px 12px; font-size: 12px; color: #4d6380; display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; gap: 10px; }
    .ci-maps-link { color: #3b82f6; text-decoration: none; font-size: 12px; font-weight: 500; white-space: nowrap; }
    .ci-modal-date { font-size: 12px; color: #4d6380; margin-bottom: 12px; }
    .ci-admin-reply { background: rgba(59,130,246,.07); border-left: 3px solid #3b82f6; border-radius: 0 8px 8px 0; padding: 12px 14px; margin-bottom: 12px; }
    .ci-reply-lbl { font-size: 10px; font-weight: 700; color: #3b82f6; text-transform: uppercase; letter-spacing: .5px; margin-bottom: 6px; }
    .ci-admin-reply p { font-size: 13px; color: #8fa3c0; line-height: 1.6; }
    .ci-modal-actions { display: flex; gap: 8px; flex-wrap: wrap; padding-top: 14px; border-top: 1px solid rgba(255,255,255,.05); margin-top: 14px; }
    .ci-modal-btn { padding: 8px 16px; border-radius: 8px; font-size: 13px; font-weight: 500; cursor: pointer; border: 1px solid; transition: all .15s; font-family: inherit; }

    /* Confirm delete */
    .ci-confirm-modal { background: #0f1a2e; border: 1px solid rgba(255,255,255,.1); border-radius: 16px; padding: 32px; max-width: 380px; width: 100%; text-align: center; box-shadow: 0 24px 64px rgba(0,0,0,.5); animation: ciModalIn .2s ease; }
    .ci-confirm-icon { font-size: 2.5rem; margin-bottom: 14px; }
    .ci-confirm-modal h3 { font-size: 1.1rem; font-weight: 700; margin-bottom: 8px; }
    .ci-confirm-modal p { font-size: 13px; color: #4d6380; margin-bottom: 24px; line-height: 1.5; }
    .ci-confirm-btns { display: flex; gap: 10px; justify-content: center; }

    /* Toast */
    .ci-toast {
        position: fixed; bottom: 24px; right: 24px; padding: 12px 18px;
        border-radius: 10px; font-size: 13px; font-weight: 500; z-index: 9999;
        transform: translateY(16px); opacity: 0; pointer-events: none;
        transition: all .28s cubic-bezier(.175,.885,.32,1.275);
        display: flex; align-items: center; gap: 8px;
        min-width: 200px; max-width: 340px; backdrop-filter: blur(12px);
    }
    .ci-toast-info    { background: #0f1a2e; border: 1px solid rgba(255,255,255,.1); color: #e8f0fe; }
    .ci-toast-success { background: rgba(16,185,129,.12); border: 1px solid rgba(16,185,129,.3); color: #6ee7b7; }
    .ci-toast-error   { background: rgba(239,68,68,.12); border: 1px solid rgba(239,68,68,.3); color: #fca5a5; }
    .ci-toast-show { transform: translateY(0); opacity: 1; }

    /* Loading & Empty */
    .ci-loading { display: flex; flex-direction: column; align-items: center; gap: 14px; padding: 60px; color: #4d6380; }
    .ci-spinner { width: 36px; height: 36px; border: 3px solid rgba(59,130,246,.2); border-top-color: #3b82f6; border-radius: 50%; animation: spin .8s linear infinite; }
    .ci-empty { text-align: center; padding: 60px 24px; }
    .ci-empty-icon { font-size: 3rem; margin-bottom: 14px; }
    .ci-empty h3 { font-size: 1.1rem; font-weight: 700; margin-bottom: 8px; }
    .ci-empty p { font-size: 13px; color: #4d6380; margin-bottom: 20px; }

    /* Leaflet popup reset */
    .leaflet-popup-content-wrapper { padding: 0 !important; border-radius: 10px !important; box-shadow: 0 8px 24px rgba(0,0,0,.3) !important; }
    .leaflet-popup-content { margin: 0 !important; }
    .leaflet-popup-tip-container { display: none !important; }
    .leaflet-control-attribution { display: none !important; }

    @media (max-width: 900px) {
        .ci-map-layout { grid-template-columns: 1fr; height: auto; }
        .ci-map-container { height: 400px; }
        .ci-map-sidebar { max-height: 250px; }
    }
    @media (max-width: 640px) {
        .ci-body { padding: 16px; }
        .ci-my-grid { grid-template-columns: 1fr; }
        .ci-cat-grid { grid-template-columns: repeat(2, 1fr); }
        .ci-priority-row { grid-template-columns: 1fr; }
        .ci-field-row { grid-template-columns: 1fr; }
        .ci-stepper { padding: 10px 12px; }
        .ci-step span { display: none; }
    }
`;

export default CreateIssue;