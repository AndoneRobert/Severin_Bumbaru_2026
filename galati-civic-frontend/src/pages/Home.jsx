import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

import BaseMap from '../features/map/components/BaseMap';
import IssueMarkersLayer from '../features/map/components/IssueMarkersLayer';
import LocationPickerLayer from '../features/map/components/LocationPickerLayer';

const CATEGORIES = [
    { value: 'Infrastructură', icon: '🛣️' }, { value: 'Iluminat', icon: '💡' },
    { value: 'Apă/Canal', icon: '💧' }, { value: 'Spații verzi', icon: '🌳' },
    { value: 'Salubritate', icon: '🗑️' }, { value: 'Zgomot/Poluare', icon: '🔊' },
    { value: 'Vandalism', icon: '🚧' }, { value: 'Trafic/Parcare', icon: '🚗' },
    { value: 'Altele', icon: '📋' },
];
const PRIORITY_LEVELS = ['Scăzută', 'Medie', 'Ridicată', 'Urgentă'];
const GALATI_CENTER = [45.4353, 28.0080];

const MOCK_ISSUES = [
    { id: 1, title: 'Groapă adâncă pe str. Brăilei', description: 'Groapă periculoasă de aproximativ 40cm, risc de accident pentru pietoni și mașini.', category: 'Infrastructură', priority: 'Urgentă', status: 'În lucru', lat: 45.4420, lng: 28.0250, votes: 34, created_at: '2026-01-15T10:00:00Z', admin_reply: 'Echipa de drumuri a preluat sesizarea. Intervenție planificată.' },
    { id: 2, title: 'Felinar nefuncțional Piața Centrală', description: 'Trei felinare consecutive nu funcționează de 2 săptămâni, zona periculoasă noaptea.', category: 'Iluminat', priority: 'Ridicată', status: 'Nou', lat: 45.4380, lng: 28.0150, votes: 19, created_at: '2026-02-01T14:30:00Z', admin_reply: null },
    { id: 3, title: 'Scurgere canalizare Micro 17', description: 'Apă menajeră iese la suprafață în fața blocului H7.', category: 'Apă/Canal', priority: 'Urgentă', status: 'În verificare', lat: 45.4290, lng: 28.0400, votes: 28, created_at: '2026-02-10T09:15:00Z', admin_reply: 'APPA Galați a trimis o echipă pentru evaluare.' },
    { id: 4, title: 'Copaci uscați Parc Rizer', description: 'Mai mulți copaci uscați, risc de cădere pe aleile frecventate de copii.', category: 'Spații verzi', priority: 'Medie', status: 'Nou', lat: 45.4450, lng: 28.0050, votes: 12, created_at: '2026-02-18T16:00:00Z', admin_reply: null },
    { id: 5, title: 'Deșeuri abandonate Strada Oțelului', description: 'Grămadă mare de moloz și deșeuri pe trotuar.', category: 'Salubritate', priority: 'Medie', status: 'Rezolvat', lat: 45.4320, lng: 28.0320, votes: 8, created_at: '2026-01-28T11:00:00Z', admin_reply: 'Problema a fost rezolvată. Deșeurile au fost ridicate.' },
    { id: 6, title: 'Semafor defect Bld. Dunărea', description: 'Semafor blocat pe roșu permanent la intersecția cu str. Tecuci.', category: 'Trafic/Parcare', priority: 'Ridicată', status: 'În lucru', lat: 45.4360, lng: 28.0180, votes: 41, created_at: '2026-02-20T08:00:00Z', admin_reply: null },
    { id: 7, title: 'Zgomot șantier nocturn str. Gării', description: 'Lucrări de construcție după ora 22:00, deranjând locuitorii.', category: 'Zgomot/Poluare', priority: 'Medie', status: 'Nou', lat: 45.4410, lng: 28.0090, votes: 15, created_at: '2026-03-01T20:00:00Z', admin_reply: null },
    { id: 8, title: 'Graffiti pe zidul școlii nr. 22', description: 'Inscripții vandalizate pe zidul exterior al școlii, vizibile din stradă.', category: 'Vandalism', priority: 'Scăzută', status: 'Nou', lat: 45.4340, lng: 28.0260, votes: 6, created_at: '2026-03-05T09:00:00Z', admin_reply: null },
];

// Sub-componente
const StatCard = ({ value, label, icon, color, delay = 0, trend }) => (
    <div className="stat-card" style={{ animationDelay: `${delay}ms` }}>
        <div className="stat-icon-wrap" style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
            <span style={{ fontSize: '20px' }}>{icon}</span>
        </div>
        <div className="stat-value" style={{ color }}>{value}</div>
        <div className="stat-label">{label}</div>
        {trend && <div className="stat-trend" style={{ color: trend > 0 ? '#10b981' : '#ef4444' }}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}% față de luna trecută
        </div>}
    </div>
);

const StatusBadge = ({ status }) => {
    const map = {
        'Nou': { cls: 'badge-new', text: '🔴 Nou' },
        'În lucru': { cls: 'badge-progress', text: '🟡 În lucru' },
        'Rezolvat': { cls: 'badge-done', text: '🟢 Rezolvat' },
        'În verificare': { cls: 'badge-review', text: '🔵 Verificare' },
    };
    const b = map[status] || { cls: 'badge-new', text: status };
    return <span className={`status-badge ${b.cls}`}>{b.text}</span>;
};

const PriorityDot = ({ priority }) => {
    const colors = { 'Urgentă': '#ef4444', 'Ridicată': '#f97316', 'Medie': '#eab308', 'Scăzută': '#22c55e' };
    return (
        <span className="priority-dot-wrap">
            <span className="priority-dot" style={{ background: colors[priority] || '#94a3b8' }} />
            {priority}
        </span>
    );
};

const Toast = ({ msg, show, type = 'info' }) => (
    <div className={`toast toast-${type}${show ? ' toast-show' : ''}`}>
        <span className="toast-icon">{type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</span>
        {msg}
    </div>
);

// ── Componenta principală ──
const Home = () => {
    const [issues, setIssues] = useState([]);
    const [filter, setFilter] = useState('Toate');
    const [catFilter, setCatFilter] = useState('Toate');
    const [search, setSearch] = useState('');
    const [newLocation, setNewLocation] = useState(null);
    const [selectedIssue, setSelectedIssue] = useState(null);
    const [toast, setToast] = useState({ msg: '', show: false, type: 'info' });
    const [sortBy, setSortBy] = useState('date');
    const [formData, setFormData] = useState({ title: '', description: '', category: 'Infrastructură', priority: 'Medie' });
    const [submitting, setSubmitting] = useState(false);
    const [adminReply, setAdminReply] = useState('');
    const [showReplyBox, setShowReplyBox] = useState(null);
    const [votedIssues, setVotedIssues] = useState(new Set());
    const [followedIssues, setFollowedIssues] = useState(new Set());
    const [flaggedIssues, setFlaggedIssues] = useState(new Set());
    const [activeView, setActiveView] = useState('map');
    const [isLoading, setIsLoading] = useState(true);
    const [urgentBannerClosed, setUrgentBannerClosed] = useState(false);

    const { user, getToken } = useAuth();
    const apiUrl = (import.meta.env.VITE_API_URL || 'https://severin-bumbaru-2026.onrender.com/api').replace(/\/+$/, '');
    const isAdmin = user?.role === 'admin' || user?.email === 'admin@galati.ro';
    const useMock = import.meta.env.VITE_USE_MOCK === 'true';

    const showToast = useCallback((msg, type = 'info') => {
        setToast({ msg, show: true, type });
        setTimeout(() => setToast({ msg: '', show: false, type: 'info' }), 3000);
    }, []);

    const fetchIssues = useCallback(async () => {
        setIsLoading(true);
        try {
            if (useMock) {
                await new Promise(r => setTimeout(r, 600));
                setIssues(MOCK_ISSUES);
            } else {
                const res = await axios.get(`${apiUrl}/issues`);
                setIssues(res.data);
            }
        } catch { setIssues(MOCK_ISSUES); }
        finally { setIsLoading(false); }
    }, [apiUrl, useMock]);

    useEffect(() => { fetchIssues(); }, [fetchIssues]);

    const handleVote = async (id, e) => {
        e?.stopPropagation();
        if (!user) { showToast('Trebuie să fii logat pentru a vota!', 'error'); return; }
        if (votedIssues.has(id)) { showToast('Ai votat deja această sesizare.', 'error'); return; }
        if (useMock) {
            setIssues(prev => prev.map(i => i.id === id ? { ...i, votes: (i.votes || 0) + 1 } : i));
            setVotedIssues(prev => new Set([...prev, id]));
            showToast('Vot înregistrat! ✓', 'success');
            return;
        }
        try {
            await axios.post(`${apiUrl}/issues/${id}/vote`, {}, { headers: { Authorization: `Bearer ${user.token}` } });
            setVotedIssues(prev => new Set([...prev, id]));
            fetchIssues();
            showToast('Vot înregistrat! ✓', 'success');
        } catch { showToast('Ai votat deja.', 'error'); }
    };

    const handleFollow = (id, e) => {
        e?.stopPropagation();
        if (!user) { showToast('Trebuie să fii logat pentru a urmări!', 'error'); return; }
        if (followedIssues.has(id)) {
            setFollowedIssues(prev => { const s = new Set(prev); s.delete(id); return s; });
            showToast('Ai încetat să urmărești sesizarea.', 'info');
        } else {
            setFollowedIssues(prev => new Set([...prev, id]));
            showToast('Urmărești sesizarea! Vei fi notificat. 🔔', 'success');
        }
    };

    const handleFlag = async (id, e) => {
        e?.stopPropagation();
        if (!user) { showToast('Trebuie să fii logat!', 'error'); return; }
        if (flaggedIssues.has(id)) { showToast('Ai raportat deja.', 'error'); return; }
        if (useMock) {
            setFlaggedIssues(prev => new Set([...prev, id]));
            showToast('Sesizare raportată. Mulțumim!', 'success');
            return;
        }
        try {
            await axios.post(`${apiUrl}/issues/${id}/flag`, {}, { headers: { Authorization: `Bearer ${user.token}` } });
            setFlaggedIssues(prev => new Set([...prev, id]));
            showToast('Sesizare raportată. Mulțumim!', 'success');
        } catch { showToast('Ai raportat deja.', 'error'); }
    };

    const updateStatus = async (id, newStatus, e) => {
        e?.stopPropagation();
        if (useMock) {
            setIssues(prev => prev.map(i => i.id === id ? { ...i, status: newStatus } : i));
            if (selectedIssue?.id === id) setSelectedIssue(prev => ({ ...prev, status: newStatus }));
            showToast(`Status → ${newStatus}`, 'success');
            return;
        }
        try {
            await axios.put(`${apiUrl}/issues/${id}`, { status: newStatus }, { headers: { Authorization: `Bearer ${user.token}` } });
            showToast(`Status → ${newStatus}`, 'success');
            fetchIssues();
        } catch { showToast('Eroare la actualizare.', 'error'); }
    };

    const sendAdminReply = async (id) => {
        if (!adminReply.trim()) { showToast('Scrie un răspuns.', 'error'); return; }
        if (useMock) {
            setIssues(prev => prev.map(i => i.id === id ? { ...i, admin_reply: adminReply } : i));
            if (selectedIssue?.id === id) setSelectedIssue(prev => ({ ...prev, admin_reply: adminReply }));
            showToast('Răspuns trimis!', 'success');
            setShowReplyBox(null); setAdminReply(''); return;
        }
        try {
            await axios.post(`${apiUrl}/issues/${id}/reply`, { message: adminReply }, { headers: { Authorization: `Bearer ${user.token}` } });
            showToast('Răspuns trimis!', 'success');
            setShowReplyBox(null); setAdminReply(''); fetchIssues();
        } catch { showToast('Eroare la trimitere.', 'error'); }
    };

    const handleAddIssue = async (e) => {
        e.preventDefault();
        if (!newLocation) return;
        if (!formData.title.trim() || !formData.description.trim()) {
            showToast('Completează titlul și descrierea.', 'error'); return;
        }
        setSubmitting(true);
        try {
            const newIssue = { id: Date.now(), ...formData, lat: newLocation.lat, lng: newLocation.lng, votes: 0, status: 'Nou', created_at: new Date().toISOString(), admin_reply: null };
            if (useMock) {
                await new Promise(r => setTimeout(r, 700));
                setIssues(prev => [newIssue, ...prev]);
            } else {
                const token = (await getToken?.()) || user?.token;
                await axios.post(
                    `${apiUrl}/issues`,
                    { ...newIssue, user_id: user?.id ?? null },
                    token ? { headers: { Authorization: `Bearer ${token}` } } : undefined,
                );
                fetchIssues();
            }
            setNewLocation(null);
            setFormData({ title: '', description: '', category: 'Infrastructură', priority: 'Medie' });
            showToast('Sesizare trimisă! ✓', 'success');
        } catch { showToast('Eroare la trimitere.', 'error'); }
        finally { setSubmitting(false); }
    };

    const filteredIssues = issues
        .filter(i => {
            const ms = filter === 'Toate' || i.status === filter;
            const mc = catFilter === 'Toate' || i.category === catFilter;
            const mq = !search || i.title?.toLowerCase().includes(search.toLowerCase()) || i.description?.toLowerCase().includes(search.toLowerCase());
            return ms && mc && mq;
        })
        .sort((a, b) => {
            if (sortBy === 'votes') return (b.votes || 0) - (a.votes || 0);
            if (sortBy === 'priority') { const idx = ['Urgentă', 'Ridicată', 'Medie', 'Scăzută']; return idx.indexOf(a.priority) - idx.indexOf(b.priority); }
            return new Date(b.created_at || 0) - new Date(a.created_at || 0);
        });

    const urgentIssues = issues.filter(i => i.priority === 'Urgentă' && i.status !== 'Rezolvat');
    const topVoted = [...issues].sort((a, b) => (b.votes || 0) - (a.votes || 0)).slice(0, 3);
    const recentActivity = [...issues].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5);
    const resolvedCount = issues.filter(i => i.status === 'Rezolvat').length;
    const resolveRate = issues.length ? Math.round((resolvedCount / issues.length) * 100) : 0;

    const DetailModal = ({ issue }) => {
        if (!issue) return null;
        const lat = issue.lat || issue.latitude;
        const lng = issue.lng || issue.longitude;
        const isVoted = votedIssues.has(issue.id);
        const isFollowed = followedIssues.has(issue.id);
        const isFlagged = flaggedIssues.has(issue.id);
        return (
            <div className="modal-overlay" onClick={() => setSelectedIssue(null)}>
                <div className="modal-box" onClick={e => e.stopPropagation()}>
                    <div className="modal-header">
                        <div className="modal-header-left">
                            <div className="modal-category-icon">{CATEGORIES.find(c => c.value === issue.category)?.icon || '📋'}</div>
                            <div>
                                <div className="modal-title">{issue.title}</div>
                                <div className="modal-sub">{issue.category} · #{issue.id}</div>
                            </div>
                        </div>
                        <button className="modal-close" onClick={() => setSelectedIssue(null)}>✕</button>
                    </div>
                    <div className="modal-body">
                        <div className="modal-badges">
                            <StatusBadge status={issue.status} />
                            {issue.priority && <PriorityDot priority={issue.priority} />}
                        </div>
                        <p className="modal-desc">{issue.description}</p>
                        {lat && lng && (
                            <div className="modal-location">
                                📍 {parseFloat(lat).toFixed(5)}, {parseFloat(lng).toFixed(5)}
                                <a href={`https://www.google.com/maps?q=${lat},${lng}`} target="_blank" rel="noreferrer" className="maps-link">Deschide în Maps →</a>
                            </div>
                        )}
                        {issue.admin_reply && (
                            <div className="admin-reply-box">
                                <div className="reply-label">🏛️ Răspuns oficial Primăria Galați</div>
                                <p>{issue.admin_reply}</p>
                            </div>
                        )}
                        <div className="timeline">
                            <div className="tl-item"><div className="tl-dot dot-blue" /><div><div className="tl-text">Sesizare înregistrată</div><div className="tl-time">{issue.created_at ? new Date(issue.created_at).toLocaleDateString('ro-RO', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}</div></div></div>
                            {(issue.status === 'În lucru' || issue.status === 'În verificare' || issue.status === 'Rezolvat') && (<div className="tl-item"><div className="tl-dot dot-amber" /><div><div className="tl-text">Preluată de departament</div><div className="tl-time">În curs de procesare</div></div></div>)}
                            {issue.status === 'În verificare' && (<div className="tl-item"><div className="tl-dot dot-blue" /><div><div className="tl-text">În verificare finală</div><div className="tl-time">Verificare calitate</div></div></div>)}
                            {issue.status === 'Rezolvat' && (<div className="tl-item"><div className="tl-dot dot-green" /><div><div className="tl-text">Problemă rezolvată ✓</div><div className="tl-time">Lucrare finalizată</div></div></div>)}
                        </div>
                        <div className="modal-actions">
                            <button className={`btn-action ${isVoted ? 'btn-action-active-blue' : ''}`} onClick={() => handleVote(issue.id)}>▲ Susțin <span className="action-count">({issue.votes || 0})</span></button>
                            <button className={`btn-action ${isFollowed ? 'btn-action-active-green' : ''}`} onClick={() => handleFollow(issue.id)}>👁 {isFollowed ? 'Urmăresc' : 'Urmăresc'}</button>
                            <button className={`btn-action ${isFlagged ? 'btn-action-active-red' : 'btn-action-danger'}`} onClick={() => handleFlag(issue.id)} disabled={isFlagged}>🚩 {isFlagged ? 'Raportat' : 'Raportez'}</button>
                        </div>
                        {isAdmin && (
                            <div className="admin-actions-modal">
                                <div className="admin-label">⚙️ Panou Administrator</div>
                                <div className="admin-row">
                                    <div className="admin-field">
                                        <label className="admin-field-label">Status</label>
                                        <select value={issue.status} onChange={e => updateStatus(issue.id, e.target.value)} className="admin-select">
                                            <option>Nou</option><option>În lucru</option><option>În verificare</option><option>Rezolvat</option>
                                        </select>
                                    </div>
                                    <div className="admin-field">
                                        <label className="admin-field-label">Redirecționează</label>
                                        <select className="admin-select"><option>Selectează departament...</option><option>Serviciu Infrastructură</option><option>Serviciu Rețele Electrice</option><option>APPA Galați</option><option>Domeniu Public</option><option>Serviciu Salubritate</option></select>
                                    </div>
                                </div>
                                <button className="btn-reply-toggle" onClick={() => setShowReplyBox(showReplyBox === issue.id ? null : issue.id)}>
                                    {showReplyBox === issue.id ? '✕ Anulează' : '💬 Trimite răspuns oficial'}
                                </button>
                                {showReplyBox === issue.id && (
                                    <div className="reply-form">
                                        <textarea className="reply-textarea" placeholder="Scrie răspunsul oficial..." value={adminReply} onChange={e => setAdminReply(e.target.value)} rows={4} />
                                        <div className="reply-form-btns">
                                            <button className="btn-primary-sm" onClick={() => sendAdminReply(issue.id)}>📤 Publică</button>
                                            <button className="btn-cancel-sm" onClick={() => { setShowReplyBox(null); setAdminReply(''); }}>Anulează</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const SkeletonRow = () => (
        <div className="skeleton-row">
            <div className="skeleton skeleton-title" />
            <div className="skeleton skeleton-text" />
            <div className="skeleton skeleton-text short" />
        </div>
    );

    return (
        <div className="home-page">
            <Toast msg={toast.msg} show={toast.show} type={toast.type} />
            {selectedIssue && <DetailModal issue={selectedIssue} />}

            {/* ── BANNER URGENTE ── */}
            {urgentIssues.length > 0 && !urgentBannerClosed && (
                <div className="urgent-banner">
                    <div className="urgent-banner-inner">
                        <div className="urgent-banner-left">
                            <span className="urgent-pulse-dot" />
                            <span className="urgent-label">URGENT</span>
                            <span className="urgent-text">
                                {urgentIssues.length} sesizare{urgentIssues.length > 1 ? 'i' : ''} urgentă{urgentIssues.length > 1 ? '' : ''} în așteptare:
                            </span>
                            <span className="urgent-title" onClick={() => setSelectedIssue(urgentIssues[0])} style={{ cursor: 'pointer' }}>
                                {urgentIssues[0]?.title}
                            </span>
                        </div>
                        <button className="urgent-close" onClick={() => setUrgentBannerClosed(true)}>✕</button>
                    </div>
                </div>
            )}

            {/* ── HERO ── */}
            <section className="hero-section">
                <div className="hero-bg-grid" />
                <div className="hero-bg-glow" />
                <div className="hero-inner">
                    <div className="hero-eyebrow">
                        <span className="eyebrow-dot" />
                        Municipiul Galați · Platformă Civică Digitală
                    </div>
                    <h1 className="gradient-text">Galațiul tău,<br />vocea ta.</h1>
                    <p className="hero-sub">
                        Raportează probleme urbane direct pe hartă, susține sesizările
                        vecinilor și urmărește rezolvarea lor în timp real.
                    </p>
                    <div className="hero-cta">
                        <a href="#map-section" className="btn-primary" style={{ textDecoration: 'none' }}>📍 Deschide Harta</a>
                        {!user ? (
                            <a href="/login" className="btn-secondary" style={{ textDecoration: 'none' }}>Creează cont gratuit →</a>
                        ) : (
                            <a href="#map-section" className="btn-secondary" style={{ textDecoration: 'none' }}>✏️ Raportează o problemă</a>
                        )}
                    </div>
                    <div className="hero-badges">
                        <span className="hero-badge">🔒 Date securizate</span>
                        <span className="hero-badge">🏛️ Integrat cu Primăria</span>
                        <span className="hero-badge">📱 Responsive</span>
                        <span className="hero-badge">⚡ Timp real</span>
                    </div>
                </div>
                {/* Mini stats animate în hero */}
                <div className="hero-mini-stats">
                    <div className="hero-mini-stat">
                        <span>{isLoading ? '—' : issues.length}</span>
                        <span>Sesizări</span>
                    </div>
                    <div className="hero-mini-divider" />
                    <div className="hero-mini-stat">
                        <span>{isLoading ? '—' : resolveRate}%</span>
                        <span>Rată rezolvare</span>
                    </div>
                    <div className="hero-mini-divider" />
                    <div className="hero-mini-stat">
                        <span>{isLoading ? '—' : issues.reduce((s, i) => s + (i.votes || 0), 0)}</span>
                        <span>Voturi cetățeni</span>
                    </div>
                </div>
            </section>

            {/* ── STATS ── */}
            <section className="stats-section">
                <StatCard value={isLoading ? '...' : issues.length} label="Sesizări totale" icon="📋" color="#3b82f6" delay={0} trend={12} />
                <StatCard value={isLoading ? '...' : resolvedCount} label="Rezolvate" icon="✅" color="#10b981" delay={80} trend={8} />
                <StatCard value={isLoading ? '...' : issues.filter(i => i.status === 'În lucru').length} label="În lucru" icon="⚙️" color="#f59e0b" delay={160} />
                <StatCard value={isLoading ? '...' : issues.filter(i => i.status === 'Nou').length} label="Noi" icon="🆕" color="#ef4444" delay={240} />
                <StatCard value={isLoading ? '...' : issues.reduce((s, i) => s + (i.votes || 0), 0)} label="Voturi totale" icon="▲" color="#a855f7" delay={320} trend={25} />
            </section>

            {/* ── CATEGORII RAPIDE ── */}
            <section className="quick-cats-section">
                <h3 className="quick-cats-title">Filtrează după categorie</h3>
                <div className="quick-cats-grid">
                    {CATEGORIES.map(cat => {
                        const count = issues.filter(i => i.category === cat.value).length;
                        return (
                            <button
                                key={cat.value}
                                className={`quick-cat-card ${catFilter === cat.value ? 'active' : ''}`}
                                onClick={() => { setCatFilter(catFilter === cat.value ? 'Toate' : cat.value); document.getElementById('map-section')?.scrollIntoView({ behavior: 'smooth' }); }}
                            >
                                <span className="qcat-icon">{cat.icon}</span>
                                <span className="qcat-label">{cat.value}</span>
                                <span className="qcat-count">{count}</span>
                            </button>
                        );
                    })}
                </div>
            </section>

            {/* ── PROGRES REZOLVARE ── */}
            <section className="progress-section">
                <div className="progress-card">
                    <div className="progress-header">
                        <div>
                            <h3>Progres lunar de rezolvare</h3>
                            <p>Rata de rezolvare a sesizărilor în Galați</p>
                        </div>
                        <div className="progress-pct" style={{ color: resolveRate > 50 ? '#10b981' : '#f59e0b' }}>
                            {resolveRate}%
                        </div>
                    </div>
                    <div className="progress-bar-wrap">
                        <div className="progress-bar-track">
                            <div
                                className="progress-bar-fill"
                                style={{ width: `${resolveRate}%`, background: resolveRate > 50 ? 'linear-gradient(90deg, #059669, #10b981)' : 'linear-gradient(90deg, #b45309, #f59e0b)' }}
                            />
                        </div>
                    </div>
                    <div className="progress-labels">
                        <span>{resolvedCount} rezolvate</span>
                        <span>{issues.length - resolvedCount} în progres</span>
                    </div>
                    {/* Breakdown pe statusuri */}
                    <div className="progress-breakdown">
                        {[
                            { label: 'Nou', color: '#ef4444', count: issues.filter(i => i.status === 'Nou').length },
                            { label: 'În lucru', color: '#f59e0b', count: issues.filter(i => i.status === 'În lucru').length },
                            { label: 'Verificare', color: '#3b82f6', count: issues.filter(i => i.status === 'În verificare').length },
                            { label: 'Rezolvat', color: '#10b981', count: resolvedCount },
                        ].map(s => (
                            <div key={s.label} className="pb-item">
                                <div className="pb-bar" style={{ background: s.color, height: issues.length ? `${(s.count / issues.length) * 60}px` : '4px', minHeight: '4px' }} />
                                <span className="pb-count" style={{ color: s.color }}>{s.count}</span>
                                <span className="pb-label">{s.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Top votate */}
                <div className="top-voted-card">
                    <div className="tv-header">
                        <h3>🏆 Top sesizări votate</h3>
                        <span>Cele mai susținute de comunitate</span>
                    </div>
                    <div className="tv-list">
                        {topVoted.map((issue, i) => (
                            <div key={issue.id} className="tv-item" onClick={() => setSelectedIssue(issue)}>
                                <div className="tv-rank" style={{ color: i === 0 ? '#f59e0b' : i === 1 ? '#94a3b8' : '#cd7c2f' }}>
                                    #{i + 1}
                                </div>
                                <div className="tv-content">
                                    <div className="tv-title">{issue.title}</div>
                                    <div className="tv-meta">
                                        <span>{issue.category}</span>
                                        <StatusBadge status={issue.status} />
                                    </div>
                                </div>
                                <div className="tv-votes">
                                    <span className="tv-vote-num">▲ {issue.votes || 0}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── FILTRE & CĂUTARE ── */}
            <div className="filter-area" id="map-section">
                <div className="filter-bar">
                    <div className="search-wrap">
                        <span className="search-icon">🔍</span>
                        <input className="search-input" type="text" placeholder="Caută sesizări după titlu sau descriere..." value={search} onChange={e => setSearch(e.target.value)} />
                        {search && <button className="search-clear" onClick={() => setSearch('')}>✕</button>}
                    </div>
                    <div className="filter-controls">
                        <div className="filter-group">
                            <span className="filter-label">Status:</span>
                            {['Toate', 'Nou', 'În lucru', 'Rezolvat'].map(s => (
                                <button key={s} className={`filter-btn ${filter === s ? 'active' : ''}`} onClick={() => setFilter(s)}>{s}</button>
                            ))}
                        </div>
                        <div className="filter-group filter-right">
                            <span className="filter-label">Sortare:</span>
                            <select className="sort-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
                                <option value="date">🕐 Cele mai recente</option>
                                <option value="votes">▲ Cele mai votate</option>
                                <option value="priority">🔥 Prioritate</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div className="filter-results-bar">
                    <span className="results-count">{filteredIssues.length} sesizări găsite</span>
                    {(filter !== 'Toate' || catFilter !== 'Toate' || search) && (
                        <button className="clear-filters" onClick={() => { setFilter('Toate'); setCatFilter('Toate'); setSearch(''); }}>✕ Resetează filtrele</button>
                    )}
                    <div className="view-toggle">
                        <button className={`view-btn ${activeView === 'map' ? 'active' : ''}`} onClick={() => setActiveView('map')}>🗺 Hartă</button>
                        <button className={`view-btn ${activeView === 'list' ? 'active' : ''}`} onClick={() => setActiveView('list')}>📋 Listă</button>
                    </div>
                </div>
            </div>

            {/* ── HARTĂ + LISTĂ ── */}
            <section className="map-list-section">
                <div className={`map-card ${activeView === 'list' ? 'map-card-hidden' : ''}`}>
                    {user ? (
                        <div className="map-hint map-hint-user">📍 Click pe hartă pentru a adăuga o sesizare</div>
                    ) : (
                        <div className="map-hint map-hint-guest">🔒 <a href="/login">Loghează-te</a> pentru a adăuga sesizări</div>
                    )}
                    <BaseMap center={GALATI_CENTER} zoom={13} style={{ height: '600px', width: '100%' }}>
                        <LocationPickerLayer
                            enabled={Boolean(user)}
                            location={newLocation}
                            onPickLocation={(latlng) => {
                                if (!user) { showToast('Trebuie să fii logat!', 'error'); return; }
                                setNewLocation(latlng);
                            }}
                            renderPopup={() => (
                                <form onSubmit={handleAddIssue} className="map-form">
                                    <h4 className="map-form-title">🚨 Raportează problema</h4>
                                    <input type="text" placeholder="Titlu sesizare *" required className="map-input" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} maxLength={100} />
                                    <textarea placeholder="Descriere *" required className="map-input" rows={3} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} maxLength={500} />
                                    <select className="map-input" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                                        {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.icon} {c.value}</option>)}
                                    </select>
                                    <select className="map-input" value={formData.priority} onChange={e => setFormData({ ...formData, priority: e.target.value })}>
                                        {PRIORITY_LEVELS.map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                    <div className="map-form-btns">
                                        <button type="submit" className="btn-map-submit" disabled={submitting}>{submitting ? '⏳ Se trimite...' : '📤 Trimite'}</button>
                                        <button type="button" className="btn-map-cancel" onClick={() => setNewLocation(null)}>Anulează</button>
                                    </div>
                                </form>
                            )}
                        />
                        <IssueMarkersLayer
                            issues={filteredIssues}
                            selectedIssueId={selectedIssue?.id}
                            onSelectIssue={setSelectedIssue}
                            onVote={handleVote}
                            renderPopup={(issue) => (
                                <div className="map-popup">
                                    <strong>{issue.title}</strong>
                                    <div className="popup-meta"><StatusBadge status={issue.status} /><PriorityDot priority={issue.priority} /></div>
                                    <p>{issue.description?.substring(0, 100)}{issue.description?.length > 100 ? '...' : ''}</p>
                                    <div className="popup-footer">
                                        <span className="popup-votes">▲ {issue.votes || 0} voturi</span>
                                        <button onClick={() => setSelectedIssue(issue)} className="popup-detail-btn">Detalii →</button>
                                    </div>
                                </div>
                            )}
                        />
                    </BaseMap>
                    <div className="map-legend">
                        <span className="legend-item"><span className="legend-dot" style={{ background: '#ef4444' }} />Nou</span>
                        <span className="legend-item"><span className="legend-dot" style={{ background: '#f59e0b' }} />În lucru</span>
                        <span className="legend-item"><span className="legend-dot" style={{ background: '#3b82f6' }} />Verificare</span>
                        <span className="legend-item"><span className="legend-dot" style={{ background: '#10b981' }} />Rezolvat</span>
                    </div>
                </div>

                {/* Lista sesizări */}
                <div className="issues-list-card">
                    <div className="list-header">
                        <h2 className="list-title">Sesizări <span className="count-pill">{filteredIssues.length}</span></h2>
                        {isAdmin && <span className="admin-chip">Admin</span>}
                    </div>
                    <div className="issues-scroll">
                        {isLoading ? Array(4).fill(0).map((_, i) => <SkeletonRow key={i} />) :
                            filteredIssues.length === 0 ? (
                                <div className="empty-state">
                                    <div className="empty-icon">📭</div>
                                    <p>Nicio sesizare găsită</p>
                                    <span>Încearcă să schimbi filtrele</span>
                                </div>
                            ) : filteredIssues.map(issue => (
                                <div key={issue.id} className="issue-row" onClick={() => setSelectedIssue(issue)}>
                                    <div className="issue-row-top">
                                        <span className="issue-cat-icon">{CATEGORIES.find(c => c.value === issue.category)?.icon || '📋'}</span>
                                        <div className="issue-row-content">
                                            <div className="issue-row-title-line">
                                                <span className="issue-row-title">{issue.title}</span>
                                                <StatusBadge status={issue.status} />
                                            </div>
                                            <div className="issue-row-sub">
                                                {issue.category && <span className="issue-cat">{issue.category}</span>}
                                                {issue.priority && <PriorityDot priority={issue.priority} />}
                                                <span className="issue-date">{issue.created_at ? new Date(issue.created_at).toLocaleDateString('ro-RO') : ''}</span>
                                            </div>
                                            <p className="issue-row-desc">{issue.description?.substring(0, 85)}{issue.description?.length > 85 ? '...' : ''}</p>
                                            <div className="issue-row-actions" onClick={e => e.stopPropagation()}>
                                                <button className={`vote-btn ${votedIssues.has(issue.id) ? 'voted' : ''}`} onClick={e => handleVote(issue.id, e)}>▲ {issue.votes || 0}</button>
                                                <button className={`follow-btn ${followedIssues.has(issue.id) ? 'followed' : ''}`} onClick={e => handleFollow(issue.id, e)}>👁 Urmăresc</button>
                                                <button className={`flag-btn ${flaggedIssues.has(issue.id) ? 'flagged' : ''}`} onClick={e => handleFlag(issue.id, e)} disabled={flaggedIssues.has(issue.id)}>🚩</button>
                                                {isAdmin && (
                                                    <select value={issue.status} onChange={e => updateStatus(issue.id, e.target.value, e)} className="admin-select-inline" onClick={e => e.stopPropagation()}>
                                                        <option>Nou</option><option>În lucru</option><option>În verificare</option><option>Rezolvat</option>
                                                    </select>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>
            </section>

            {/* ── ACTIVITATE RECENTĂ ── */}
            <section className="activity-section">
                <div className="activity-card">
                    <div className="activity-header">
                        <div>
                            <h2>🕐 Activitate recentă</h2>
                            <p>Ultimele sesizări adăugate în Galați</p>
                        </div>
                    </div>
                    <div className="activity-feed">
                        {recentActivity.map((issue, i) => (
                            <div key={issue.id} className="activity-item" onClick={() => setSelectedIssue(issue)} style={{ animationDelay: `${i * 80}ms` }}>
                                <div className="activity-timeline-dot" style={{ background: issue.priority === 'Urgentă' ? '#ef4444' : issue.priority === 'Ridicată' ? '#f97316' : '#3b82f6' }} />
                                <div className="activity-content">
                                    <div className="activity-title">{CATEGORIES.find(c => c.value === issue.category)?.icon} {issue.title}</div>
                                    <div className="activity-meta">
                                        <StatusBadge status={issue.status} />
                                        <span className="activity-time">
                                            {issue.created_at ? new Date(issue.created_at).toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' }) : ''}
                                        </span>
                                        <span className="activity-votes">▲ {issue.votes || 0}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Hartă mini categorii */}
                <div className="cat-stats-card">
                    <div className="cs-header"><h3>📊 Sesizări pe categorie</h3></div>
                    <div className="cs-list">
                        {CATEGORIES.map(cat => {
                            const count = issues.filter(i => i.category === cat.value).length;
                            const pct = issues.length ? (count / issues.length) * 100 : 0;
                            return (
                                <div key={cat.value} className="cs-item" onClick={() => setCatFilter(cat.value)}>
                                    <span className="cs-icon">{cat.icon}</span>
                                    <span className="cs-name">{cat.value}</span>
                                    <div className="cs-bar-wrap">
                                        <div className="cs-bar" style={{ width: `${pct}%` }} />
                                    </div>
                                    <span className="cs-count">{count}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ── CUM FUNCȚIONEAZĂ ── */}
            <section className="how-section">
                <h2 className="section-title">Cum funcționează?</h2>
                <div className="how-grid">
                    {[
                        { num: '01', icon: '📍', title: 'Identifici problema', desc: 'Dai click pe hartă exact unde se află problema — groapă, felinar stricat, deșeuri ilegale.' },
                        { num: '02', icon: '📝', title: 'Completezi sesizarea', desc: 'Adaugi titlu, descriere și selectezi categoria și prioritatea problemei.' },
                        { num: '03', icon: '🏛️', title: 'Primăria preia sesizarea', desc: 'Sesizarea ajunge direct la departamentul responsabil care o analizează și alocă resurse.' },
                        { num: '04', icon: '✅', title: 'Urmărești rezolvarea', desc: 'Primești notificări la fiecare actualizare de status până la rezolvarea completă.' },
                    ].map(step => (
                        <div key={step.num} className="how-step">
                            <div className="how-num">{step.num}</div>
                            <div className="how-icon">{step.icon}</div>
                            <h3>{step.title}</h3>
                            <p>{step.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── CTA BANNER ── */}
            <section className="cta-section">
                <div className="cta-inner">
                    <div className="cta-bg-glow" />
                    <div className="cta-content">
                        <h2>Fii parte din schimbare</h2>
                        <p>Alătură-te celor care contribuie activ la îmbunătățirea Galațiului.</p>
                        {!user ? (
                            <div className="cta-btns">
                                <a href="/login" className="btn-primary" style={{ textDecoration: 'none' }}>🚀 Creează cont gratuit</a>
                                <a href="#map-section" className="btn-secondary" style={{ textDecoration: 'none' }}>📍 Explorează harta</a>
                            </div>
                        ) : (
                            <div className="cta-btns">
                                <a href="#map-section" className="btn-primary" style={{ textDecoration: 'none' }}>✚ Raportează o problemă</a>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* ── FAQ ── */}
            <section className="faq-section">
                <h2 className="section-title">Întrebări frecvente</h2>
                <div className="faq-grid">
                    {[
                        { q: 'Cum funcționează votul?', a: 'Sesizările cu cele mai multe voturi sunt prioritizate. Fiecare utilizator autentificat poate susține o sesizare o singură dată.' },
                        { q: 'Pot urmări stadiul rezolvării?', a: 'Da! Apasă „Urmăresc" pe orice sesizare și vei primi notificări la fiecare schimbare de status.' },
                        { q: 'Ce se întâmplă cu sesizările duplicate?', a: 'Poți raporta o sesizare ca incorectă sau duplicat. Administratorii o vor analiza și redirecționa.' },
                        { q: 'Cât durează rezolvarea?', a: 'Variază în funcție de tip și prioritate. Sesizările urgente sunt tratate prioritar. Termenul mediu este 5-7 zile.' },
                        { q: 'Datele mele sunt în siguranță?', a: 'Da. Folosim criptare și nu partajăm datele personale cu terți. Identitatea poate fi anonimizată.' },
                        { q: 'Cine poate vedea sesizările?', a: 'Toate sesizările sunt publice pe hartă. Datele de contact sunt vizibile doar pentru administratori.' },
                    ].map((item, i) => (
                        <details key={i} className="faq-item">
                            <summary>{item.q}</summary>
                            <p>{item.a}</p>
                        </details>
                    ))}
                </div>
            </section>

            {/* ── FOOTER ── */}
            <footer className="main-footer">
                <div className="footer-inner">
                    <div className="footer-brand">
                        <span className="footer-logo">Galați<span>Civic</span></span>
                        <p>Platforma civică oficială a Municipiului Galați</p>
                    </div>
                    <div className="footer-links">
                        <a href="/about">Despre platformă</a>
                        <a href="/privacy">Confidențialitate</a>
                        <a href="/contact">Contact</a>
                        <a href="https://www.primaria-galati.ro" target="_blank" rel="noreferrer">Primăria Galați ↗</a>
                    </div>
                </div>
                <div className="footer-bottom">
                    <p>© 2026 Galați Civic · Vocea ta contează în orașul nostru.</p>
                </div>
            </footer>

            {/* Stiluri suplimentare pentru elementele noi */}
            <style>{`
                /* ── Banner urgente ── */
                .urgent-banner {
                    background: linear-gradient(90deg, rgba(239,68,68,.15), rgba(239,68,68,.08));
                    border-bottom: 1px solid rgba(239,68,68,.25);
                    padding: 0 24px;
                    animation: urgentSlideIn .4s ease both;
                }
                @keyframes urgentSlideIn { from { height: 0; opacity: 0; } to { height: auto; opacity: 1; } }
                .urgent-banner-inner {
                    max-width: 1200px; margin: 0 auto;
                    display: flex; justify-content: space-between; align-items: center;
                    padding: 10px 0; gap: 12px;
                }
                .urgent-banner-left { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
                .urgent-pulse-dot {
                    width: 8px; height: 8px; border-radius: 50%; background: #ef4444; flex-shrink: 0;
                    animation: urgentPulse 1s ease-in-out infinite;
                }
                @keyframes urgentPulse { 0%,100% { box-shadow: 0 0 0 0 rgba(239,68,68,.4); } 50% { box-shadow: 0 0 0 6px rgba(239,68,68,0); } }
                .urgent-label { font-size: 10px; font-weight: 800; color: #ef4444; letter-spacing: 1.5px; background: rgba(239,68,68,.15); border: 1px solid rgba(239,68,68,.3); border-radius: 4px; padding: 2px 7px; }
                .urgent-text  { font-size: 13px; color: #fca5a5; }
                .urgent-title { font-size: 13px; font-weight: 600; color: #fca5a5; text-decoration: underline; }
                .urgent-close { background: none; border: none; color: #fca5a5; cursor: pointer; font-size: 14px; padding: 4px 8px; border-radius: 4px; transition: background .15s; flex-shrink: 0; }
                .urgent-close:hover { background: rgba(239,68,68,.15); }

                /* ── Hero mini stats ── */
                .hero-mini-stats {
                    display: flex; justify-content: center; align-items: center; gap: 0;
                    margin-top: 36px; background: rgba(255,255,255,.04);
                    border: 1px solid rgba(255,255,255,.08); border-radius: 16px;
                    padding: 16px 32px; gap: 32px; flex-wrap: wrap;
                    animation: heroFadeIn .8s .4s ease both;
                }
                .hero-mini-stat { text-align: center; }
                .hero-mini-stat span:first-child { display: block; font-size: 1.6rem; font-weight: 700; color: #e8f0fe; }
                .hero-mini-stat span:last-child { display: block; font-size: 11px; color: #4d6380; margin-top: 3px; font-weight: 500; text-transform: uppercase; letter-spacing: .6px; }
                .hero-mini-divider { width: 1px; height: 40px; background: rgba(255,255,255,.08); }

                /* ── Stat trend ── */
                .stat-trend { font-size: 10px; margin-top: 4px; font-weight: 500; }

                /* ── Progres ── */
                .progress-section {
                    display: grid; grid-template-columns: 1.4fr 1fr; gap: 16px;
                    max-width: 1200px; margin: 0 auto; padding: 0 24px 40px; width: 100%;
                }
                .progress-card {
                    background: var(--card-bg); border: 1px solid var(--card-border);
                    border-radius: var(--radius-lg); padding: 24px; backdrop-filter: blur(16px);
                }
                .progress-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
                .progress-header h3 { font-size: 15px; font-weight: 700; margin-bottom: 4px; }
                .progress-header p  { font-size: 12px; color: var(--text-muted); }
                .progress-pct { font-size: 2rem; font-weight: 800; font-family: 'Playfair Display', serif; }
                .progress-bar-wrap { margin-bottom: 8px; }
                .progress-bar-track { background: rgba(255,255,255,.06); border-radius: 6px; height: 8px; overflow: hidden; }
                .progress-bar-fill { height: 100%; border-radius: 6px; transition: width 1s ease; }
                .progress-labels { display: flex; justify-content: space-between; font-size: 11px; color: var(--text-muted); margin-bottom: 20px; }
                .progress-breakdown { display: flex; justify-content: space-around; align-items: flex-end; height: 80px; gap: 10px; }
                .pb-item { display: flex; flex-direction: column; align-items: center; gap: 4px; flex: 1; }
                .pb-bar { width: 100%; border-radius: 4px 4px 0 0; transition: height .8s ease; min-height: 4px; }
                .pb-count { font-size: 13px; font-weight: 700; }
                .pb-label { font-size: 9px; color: var(--text-muted); text-align: center; font-weight: 500; }

                /* Top votate */
                .top-voted-card {
                    background: var(--card-bg); border: 1px solid var(--card-border);
                    border-radius: var(--radius-lg); padding: 20px; backdrop-filter: blur(16px);
                }
                .tv-header { margin-bottom: 14px; }
                .tv-header h3 { font-size: 14px; font-weight: 700; margin-bottom: 3px; }
                .tv-header span { font-size: 12px; color: var(--text-muted); }
                .tv-list { display: flex; flex-direction: column; gap: 8px; }
                .tv-item { display: flex; align-items: center; gap: 10px; padding: 10px 12px; background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.05); border-radius: 10px; cursor: pointer; transition: all .15s; }
                .tv-item:hover { background: rgba(255,255,255,.06); border-color: rgba(255,255,255,.12); transform: translateX(3px); }
                .tv-rank { font-size: 16px; font-weight: 800; font-family: 'Playfair Display', serif; min-width: 28px; }
                .tv-content { flex: 1; min-width: 0; }
                .tv-title { font-size: 12px; font-weight: 600; margin-bottom: 5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                .tv-meta { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
                .tv-meta span { font-size: 10px; color: var(--text-muted); }
                .tv-votes { flex-shrink: 0; }
                .tv-vote-num { font-size: 13px; font-weight: 700; color: var(--primary); }

                /* ── Activitate recentă ── */
                .activity-section {
                    display: grid; grid-template-columns: 1fr 1fr; gap: 16px;
                    max-width: 1200px; margin: 0 auto; padding: 0 24px 40px; width: 100%;
                }
                .activity-card, .cat-stats-card {
                    background: var(--card-bg); border: 1px solid var(--card-border);
                    border-radius: var(--radius-lg); padding: 20px; backdrop-filter: blur(16px);
                }
                .activity-header { margin-bottom: 16px; }
                .activity-header h2 { font-size: 15px; font-weight: 700; margin-bottom: 4px; }
                .activity-header p  { font-size: 12px; color: var(--text-muted); }
                .activity-feed { display: flex; flex-direction: column; gap: 0; position: relative; }
                .activity-feed::before { content: ''; position: absolute; left: 7px; top: 8px; bottom: 8px; width: 1px; background: rgba(255,255,255,.06); }
                .activity-item {
                    display: flex; gap: 12px; align-items: flex-start; padding: 10px 0 10px 0;
                    cursor: pointer; transition: all .15s; position: relative;
                    animation: fadeInUp .4s ease both;
                }
                .activity-item:hover .activity-content { color: var(--primary); }
                .activity-timeline-dot { width: 15px; height: 15px; border-radius: 50%; flex-shrink: 0; margin-top: 3px; border: 2px solid #080f1e; z-index: 1; }
                .activity-content { flex: 1; min-width: 0; }
                .activity-title { font-size: 13px; font-weight: 500; margin-bottom: 5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                .activity-meta { display: flex; align-items: center; gap: 7px; flex-wrap: wrap; }
                .activity-time  { font-size: 10px; color: var(--text-muted); }
                .activity-votes { font-size: 10px; color: var(--primary); font-weight: 600; margin-left: auto; }

                /* Statistici categorii */
                .cs-header { margin-bottom: 14px; }
                .cs-header h3 { font-size: 14px; font-weight: 700; }
                .cs-list { display: flex; flex-direction: column; gap: 8px; }
                .cs-item { display: flex; align-items: center; gap: 8px; cursor: pointer; transition: all .15s; padding: 4px 6px; border-radius: 6px; }
                .cs-item:hover { background: rgba(255,255,255,.04); }
                .cs-icon { font-size: 14px; width: 22px; text-align: center; }
                .cs-name { font-size: 12px; color: var(--text-dim); min-width: 110px; font-weight: 500; }
                .cs-bar-wrap { flex: 1; height: 6px; background: rgba(255,255,255,.06); border-radius: 3px; overflow: hidden; }
                .cs-bar { height: 100%; background: linear-gradient(90deg, #3b82f6, #60a5fa); border-radius: 3px; transition: width .8s ease; min-width: 3px; }
                .cs-count { font-size: 12px; color: var(--text-muted); font-weight: 600; min-width: 20px; text-align: right; }

                /* ── CTA Section ── */
                .cta-section {
                    max-width: 1200px; margin: 0 auto; padding: 0 24px 60px; width: 100%;
                }
                .cta-inner {
                    position: relative; overflow: hidden;
                    background: linear-gradient(135deg, rgba(59,130,246,.12), rgba(16,185,129,.08));
                    border: 1px solid rgba(59,130,246,.2); border-radius: 20px; padding: 48px 40px;
                    text-align: center;
                }
                .cta-bg-glow {
                    position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%);
                    width: 600px; height: 300px;
                    background: radial-gradient(ellipse, rgba(59,130,246,.1) 0%, transparent 70%);
                    pointer-events: none;
                }
                .cta-content { position: relative; z-index: 1; }
                .cta-content h2 { font-family: 'Playfair Display', serif; font-size: 2rem; font-weight: 700; margin-bottom: 10px; background: linear-gradient(135deg, #e8f0fe, #93c5fd); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
                .cta-content p  { font-size: 15px; color: var(--text-dim); margin-bottom: 28px; }
                .cta-btns { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }

                @media (max-width: 1100px) {
                    .progress-section { grid-template-columns: 1fr; }
                    .activity-section { grid-template-columns: 1fr; }
                }
                @media (max-width: 640px) {
                    .hero-mini-stats { gap: 16px; padding: 14px 20px; }
                    .hero-mini-divider { display: none; }
                    .cta-inner { padding: 32px 20px; }
                    .cta-content h2 { font-size: 1.5rem; }
                    .urgent-banner-inner { flex-direction: column; gap: 8px; align-items: flex-start; }
                }
            `}</style>
        </div>
    );
};

export default Home;