import React, { useEffect, useState } from 'react';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';
import { useAuth } from '../context/AuthContext';
import { useIssues } from '../features/issues/hooks/useIssues';
import { useIssueForm } from '../features/issues/hooks/useIssueForm';
import { useToast } from '../features/issues/hooks/useToast';
import L from 'leaflet';
import styles from './Home.module.css';
import { flagIssue, updateIssue, replyIssue } from '../services/issuesApi';
import BaseMap from '../features/map/components/BaseMap';
import IssueMarkersLayer from '../features/map/components/IssueMarkersLayer';
import LocationPickerLayer from '../features/map/components/LocationPickerLayer';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl: markerIcon2x, iconUrl: markerIcon, shadowUrl: markerShadow });

const m = (classNames) => classNames
    .split(' ')
    .filter(Boolean)
    .map((name) => styles[name] || name)
    .join(' ');

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
    <div className={m('stat-card')} style={{ animationDelay: `${delay}ms` }}>
        <div className={m('stat-icon-wrap')} style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
            <span style={{ fontSize: '20px' }}>{icon}</span>
        </div>
        <div className={m('stat-value')} style={{ color }}>{value}</div>
        <div className={m('stat-label')}>{label}</div>
        {trend && <div className={m('stat-trend')} style={{ color: trend > 0 ? '#10b981' : '#ef4444' }}>
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
    return <span className={m(`status-badge ${b.cls}`)}>{b.text}</span>;
};

const PriorityDot = ({ priority }) => {
    const colors = { 'Urgentă': '#ef4444', 'Ridicată': '#f97316', 'Medie': '#eab308', 'Scăzută': '#22c55e' };
    return (
        <span className={m('priority-dot-wrap')}>
            <span className={m('priority-dot')} style={{ background: colors[priority] || '#94a3b8' }} />
            {priority}
        </span>
    );
};

const Toast = ({ msg, show, type = 'info' }) => (
    <div className={m(`toast toast-${type}${show ? ' toast-show' : ''}`)}>
        <span className={m('toast-icon')}>{type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</span>
        {msg}
    </div>
);

// ── Componenta principală ──
const Home = () => {
    const [filter, setFilter] = useState('Toate');
    const [catFilter, setCatFilter] = useState('Toate');
    const [search, setSearch] = useState('');
    const [newLocation, setNewLocation] = useState(null);
    const [selectedIssue, setSelectedIssue] = useState(null);
    const [sortBy, setSortBy] = useState('date');
    const [submitting, setSubmitting] = useState(false);
    const [adminReply, setAdminReply] = useState('');
    const [showReplyBox, setShowReplyBox] = useState(null);
    const [followedIssues, setFollowedIssues] = useState(new Set());
    const [flaggedIssues, setFlaggedIssues] = useState(new Set());
    const [activeView, setActiveView] = useState('map');
    const [urgentBannerClosed, setUrgentBannerClosed] = useState(false);

    const { user, getToken, isAdmin } = useAuth();
    const useMock = import.meta.env.VITE_USE_MOCK === 'true';
    const apiUrl = (import.meta.env.VITE_API_URL || 'https://severin-bumbaru-2026.onrender.com/api').replace(/\/+$/, '');

    const { toast, showToast } = useToast({ duration: 3000 });
    const { form: formData, setForm: setFormData, resetForm } = useIssueForm({
        initialForm: { title: '', description: '', category: 'Infrastructură', priority: 'Medie', lat: null, lng: null },
    });
    const {
        issues,
        setIssues,
        isLoading,
        votedIssues,
        loadIssues,
        createIssue,
        voteIssue,
    } = useIssues({
        apiClient: axios,
        user,
        getToken,
        apiUrl,
        useMock,
        mockIssues: MOCK_ISSUES,
    });

    useEffect(() => {
        loadIssues().catch(() => setIssues(MOCK_ISSUES));
    }, [loadIssues, setIssues]);

    const handleVote = async (id, e) => {
        e?.stopPropagation();
        if (!user) { showToast('Trebuie să fii logat pentru a vota!', 'error'); return; }
        if (votedIssues.has(id)) { showToast('Ai votat deja această sesizare.', 'error'); return; }
        try {
            await voteIssue(id);
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
            await flagIssue(id, user.token);
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
            await updateIssue(id, { status: newStatus }, user.token);
            showToast(`Status → ${newStatus}`, 'success');
            await loadIssues();
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
            await replyIssue(id, adminReply, user.token);
            showToast('Răspuns trimis!', 'success');
            setShowReplyBox(null); setAdminReply(''); await loadIssues();
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
            await createIssue({ ...formData, lat: newLocation.lat, lng: newLocation.lng, admin_reply: null });
            if (!useMock) {
                await loadIssues();
            }
            setNewLocation(null);
            resetForm({ title: '', description: '', category: 'Infrastructură', priority: 'Medie', lat: null, lng: null });
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
            <div className={m('modal-overlay')} onClick={() => setSelectedIssue(null)}>
                <div className={m('modal-box')} onClick={e => e.stopPropagation()}>
                    <div className={m('modal-header')}>
                        <div className={m('modal-header-left')}>
                            <div className={m('modal-category-icon')}>{CATEGORIES.find(c => c.value === issue.category)?.icon || '📋'}</div>
                            <div>
                                <div className={m('modal-title')}>{issue.title}</div>
                                <div className={m('modal-sub')}>{issue.category} · #{issue.id}</div>
                            </div>
                        </div>
                        <button className={m('modal-close')} onClick={() => setSelectedIssue(null)}>✕</button>
                    </div>
                    <div className={m('modal-body')}>
                        <div className={m('modal-badges')}>
                            <StatusBadge status={issue.status} />
                            {issue.priority && <PriorityDot priority={issue.priority} />}
                        </div>
                        <p className={m('modal-desc')}>{issue.description}</p>
                        {lat && lng && (
                            <div className={m('modal-location')}>
                                📍 {parseFloat(lat).toFixed(5)}, {parseFloat(lng).toFixed(5)}
                                <a href={`https://www.google.com/maps?q=${lat},${lng}`} target="_blank" rel="noreferrer" className={m('maps-link')}>Deschide în Maps →</a>
                            </div>
                        )}
                        {issue.admin_reply && (
                            <div className={m('admin-reply-box')}>
                                <div className={m('reply-label')}>🏛️ Răspuns oficial Primăria Galați</div>
                                <p>{issue.admin_reply}</p>
                            </div>
                        )}
                        <div className={m('timeline')}>
                            <div className={m('tl-item')}><div className={m('tl-dot dot-blue')} /><div><div className={m('tl-text')}>Sesizare înregistrată</div><div className={m('tl-time')}>{issue.created_at ? new Date(issue.created_at).toLocaleDateString('ro-RO', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}</div></div></div>
                            {(issue.status === 'În lucru' || issue.status === 'În verificare' || issue.status === 'Rezolvat') && (<div className={m('tl-item')}><div className={m('tl-dot dot-amber')} /><div><div className={m('tl-text')}>Preluată de departament</div><div className={m('tl-time')}>În curs de procesare</div></div></div>)}
                            {issue.status === 'În verificare' && (<div className={m('tl-item')}><div className={m('tl-dot dot-blue')} /><div><div className={m('tl-text')}>În verificare finală</div><div className={m('tl-time')}>Verificare calitate</div></div></div>)}
                            {issue.status === 'Rezolvat' && (<div className={m('tl-item')}><div className={m('tl-dot dot-green')} /><div><div className={m('tl-text')}>Problemă rezolvată ✓</div><div className={m('tl-time')}>Lucrare finalizată</div></div></div>)}
                        </div>
                        <div className={m('modal-actions')}>
                            <button className={m(`btn-action ${isVoted ? 'btn-action-active-blue' : ''}`)} onClick={() => handleVote(issue.id)}>▲ Susțin <span className={m('action-count')}>({issue.votes || 0})</span></button>
                            <button className={m(`btn-action ${isFollowed ? 'btn-action-active-green' : ''}`)} onClick={() => handleFollow(issue.id)}>👁 {isFollowed ? 'Urmăresc' : 'Urmăresc'}</button>
                            <button className={m(`btn-action ${isFlagged ? 'btn-action-active-red' : 'btn-action-danger'}`)} onClick={() => handleFlag(issue.id)} disabled={isFlagged}>🚩 {isFlagged ? 'Raportat' : 'Raportez'}</button>
                        </div>
                        {isAdmin && (
                            <div className={m('admin-actions-modal')}>
                                <div className={m('admin-label')}>⚙️ Panou Administrator</div>
                                <div className={m('admin-row')}>
                                    <div className={m('admin-field')}>
                                        <label className={m('admin-field-label')}>Status</label>
                                        <select value={issue.status} onChange={e => updateStatus(issue.id, e.target.value)} className={m('admin-select')}>
                                            <option>Nou</option><option>În lucru</option><option>În verificare</option><option>Rezolvat</option>
                                        </select>
                                    </div>
                                    <div className={m('admin-field')}>
                                        <label className={m('admin-field-label')}>Redirecționează</label>
                                        <select className={m('admin-select')}><option>Selectează departament...</option><option>Serviciu Infrastructură</option><option>Serviciu Rețele Electrice</option><option>APPA Galați</option><option>Domeniu Public</option><option>Serviciu Salubritate</option></select>
                                    </div>
                                </div>
                                <button className={m('btn-reply-toggle')} onClick={() => setShowReplyBox(showReplyBox === issue.id ? null : issue.id)}>
                                    {showReplyBox === issue.id ? '✕ Anulează' : '💬 Trimite răspuns oficial'}
                                </button>
                                {showReplyBox === issue.id && (
                                    <div className={m('reply-form')}>
                                        <textarea className={m('reply-textarea')} placeholder="Scrie răspunsul oficial..." value={adminReply} onChange={e => setAdminReply(e.target.value)} rows={4} />
                                        <div className={m('reply-form-btns')}>
                                            <button className={m('btn-primary-sm')} onClick={() => sendAdminReply(issue.id)}>📤 Publică</button>
                                            <button className={m('btn-cancel-sm')} onClick={() => { setShowReplyBox(null); setAdminReply(''); }}>Anulează</button>
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
        <div className={m('skeleton-row')}>
            <div className={m('skeleton skeleton-title')} />
            <div className={m('skeleton skeleton-text')} />
            <div className={m('skeleton skeleton-text short')} />
        </div>
    );

    return (
        <div className={m('home-page')}>
            <Toast msg={toast.msg} show={toast.show} type={toast.type} />
            {selectedIssue && <DetailModal issue={selectedIssue} />}

            {/* ── BANNER URGENTE ── */}
            {urgentIssues.length > 0 && !urgentBannerClosed && (
                <div className={m('urgent-banner')}>
                    <div className={m('urgent-banner-inner')}>
                        <div className={m('urgent-banner-left')}>
                            <span className={m('urgent-pulse-dot')} />
                            <span className={m('urgent-label')}>URGENT</span>
                            <span className={m('urgent-text')}>
                                {urgentIssues.length} sesizare{urgentIssues.length > 1 ? 'i' : ''} urgentă{urgentIssues.length > 1 ? '' : ''} în așteptare:
                            </span>
                            <span className={m('urgent-title')} onClick={() => setSelectedIssue(urgentIssues[0])} style={{ cursor: 'pointer' }}>
                                {urgentIssues[0]?.title}
                            </span>
                        </div>
                        <button className={m('urgent-close')} onClick={() => setUrgentBannerClosed(true)}>✕</button>
                    </div>
                </div>
            )}

            {/* ── HERO ── */}
            <section className={m('hero-section')}>
                <div className={m('hero-bg-grid')} />
                <div className={m('hero-bg-glow')} />
                <div className={m('hero-inner')}>
                    <div className={m('hero-eyebrow')}>
                        <span className={m('eyebrow-dot')} />
                        Municipiul Galați · Platformă Civică Digitală
                    </div>
                    <h1 className={m('gradient-text')}>Galațiul tău,<br />vocea ta.</h1>
                    <p className={m('hero-sub')}>
                        Raportează probleme urbane direct pe hartă, susține sesizările
                        vecinilor și urmărește rezolvarea lor în timp real.
                    </p>
                    <div className={m('hero-cta')}>
                        <a href="#map-section" className={m('btn-primary')} style={{ textDecoration: 'none' }}>📍 Deschide Harta</a>
                        {!user ? (
                            <a href="/login" className={m('btn-secondary')} style={{ textDecoration: 'none' }}>Creează cont gratuit →</a>
                        ) : (
                            <a href="#map-section" className={m('btn-secondary')} style={{ textDecoration: 'none' }}>✏️ Raportează o problemă</a>
                        )}
                    </div>
                    <div className={m('hero-badges')}>
                        <span className={m('hero-badge')}>🔒 Date securizate</span>
                        <span className={m('hero-badge')}>🏛️ Integrat cu Primăria</span>
                        <span className={m('hero-badge')}>📱 Responsive</span>
                        <span className={m('hero-badge')}>⚡ Timp real</span>
                    </div>
                </div>
                {/* Mini stats animate în hero */}
                <div className={m('hero-mini-stats')}>
                    <div className={m('hero-mini-stat')}>
                        <span>{isLoading ? '—' : issues.length}</span>
                        <span>Sesizări</span>
                    </div>
                    <div className={m('hero-mini-divider')} />
                    <div className={m('hero-mini-stat')}>
                        <span>{isLoading ? '—' : resolveRate}%</span>
                        <span>Rată rezolvare</span>
                    </div>
                    <div className={m('hero-mini-divider')} />
                    <div className={m('hero-mini-stat')}>
                        <span>{isLoading ? '—' : issues.reduce((s, i) => s + (i.votes || 0), 0)}</span>
                        <span>Voturi cetățeni</span>
                    </div>
                </div>
            </section>

            {/* ── STATS ── */}
            <section className={m('stats-section')}>
                <StatCard value={isLoading ? '...' : issues.length} label="Sesizări totale" icon="📋" color="#3b82f6" delay={0} trend={12} />
                <StatCard value={isLoading ? '...' : resolvedCount} label="Rezolvate" icon="✅" color="#10b981" delay={80} trend={8} />
                <StatCard value={isLoading ? '...' : issues.filter(i => i.status === 'În lucru').length} label="În lucru" icon="⚙️" color="#f59e0b" delay={160} />
                <StatCard value={isLoading ? '...' : issues.filter(i => i.status === 'Nou').length} label="Noi" icon="🆕" color="#ef4444" delay={240} />
                <StatCard value={isLoading ? '...' : issues.reduce((s, i) => s + (i.votes || 0), 0)} label="Voturi totale" icon="▲" color="#a855f7" delay={320} trend={25} />
            </section>

            {/* ── CATEGORII RAPIDE ── */}
            <section className={m('quick-cats-section')}>
                <h3 className={m('quick-cats-title')}>Filtrează după categorie</h3>
                <div className={m('quick-cats-grid')}>
                    {CATEGORIES.map(cat => {
                        const count = issues.filter(i => i.category === cat.value).length;
                        return (
                            <button
                                key={cat.value}
                                className={m(`quick-cat-card ${catFilter === cat.value ? 'active' : ''}`)}
                                onClick={() => { setCatFilter(catFilter === cat.value ? 'Toate' : cat.value); document.getElementById('map-section')?.scrollIntoView({ behavior: 'smooth' }); }}
                            >
                                <span className={m('qcat-icon')}>{cat.icon}</span>
                                <span className={m('qcat-label')}>{cat.value}</span>
                                <span className={m('qcat-count')}>{count}</span>
                            </button>
                        );
                    })}
                </div>
            </section>

            {/* ── PROGRES REZOLVARE ── */}
            <section className={m('progress-section')}>
                <div className={m('progress-card')}>
                    <div className={m('progress-header')}>
                        <div>
                            <h3>Progres lunar de rezolvare</h3>
                            <p>Rata de rezolvare a sesizărilor în Galați</p>
                        </div>
                        <div className={m('progress-pct')} style={{ color: resolveRate > 50 ? '#10b981' : '#f59e0b' }}>
                            {resolveRate}%
                        </div>
                    </div>
                    <div className={m('progress-bar-wrap')}>
                        <div className={m('progress-bar-track')}>
                            <div
                                className={m('progress-bar-fill')}
                                style={{ width: `${resolveRate}%`, background: resolveRate > 50 ? 'linear-gradient(90deg, #059669, #10b981)' : 'linear-gradient(90deg, #b45309, #f59e0b)' }}
                            />
                        </div>
                    </div>
                    <div className={m('progress-labels')}>
                        <span>{resolvedCount} rezolvate</span>
                        <span>{issues.length - resolvedCount} în progres</span>
                    </div>
                    {/* Breakdown pe statusuri */}
                    <div className={m('progress-breakdown')}>
                        {[
                            { label: 'Nou', color: '#ef4444', count: issues.filter(i => i.status === 'Nou').length },
                            { label: 'În lucru', color: '#f59e0b', count: issues.filter(i => i.status === 'În lucru').length },
                            { label: 'Verificare', color: '#3b82f6', count: issues.filter(i => i.status === 'În verificare').length },
                            { label: 'Rezolvat', color: '#10b981', count: resolvedCount },
                        ].map(s => (
                            <div key={s.label} className={m('pb-item')}>
                                <div className={m('pb-bar')} style={{ background: s.color, height: issues.length ? `${(s.count / issues.length) * 60}px` : '4px', minHeight: '4px' }} />
                                <span className={m('pb-count')} style={{ color: s.color }}>{s.count}</span>
                                <span className={m('pb-label')}>{s.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Top votate */}
                <div className={m('top-voted-card')}>
                    <div className={m('tv-header')}>
                        <h3>🏆 Top sesizări votate</h3>
                        <span>Cele mai susținute de comunitate</span>
                    </div>
                    <div className={m('tv-list')}>
                        {topVoted.map((issue, i) => (
                            <div key={issue.id} className={m('tv-item')} onClick={() => setSelectedIssue(issue)}>
                                <div className={m('tv-rank')} style={{ color: i === 0 ? '#f59e0b' : i === 1 ? '#94a3b8' : '#cd7c2f' }}>
                                    #{i + 1}
                                </div>
                                <div className={m('tv-content')}>
                                    <div className={m('tv-title')}>{issue.title}</div>
                                    <div className={m('tv-meta')}>
                                        <span>{issue.category}</span>
                                        <StatusBadge status={issue.status} />
                                    </div>
                                </div>
                                <div className={m('tv-votes')}>
                                    <span className={m('tv-vote-num')}>▲ {issue.votes || 0}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── FILTRE & CĂUTARE ── */}
            <div className={m('filter-area')} id="map-section">
                <div className={m('filter-bar')}>
                    <div className={m('search-wrap')}>
                        <span className={m('search-icon')}>🔍</span>
                        <input className={m('search-input')} type="text" placeholder="Caută sesizări după titlu sau descriere..." value={search} onChange={e => setSearch(e.target.value)} />
                        {search && <button className={m('search-clear')} onClick={() => setSearch('')}>✕</button>}
                    </div>
                    <div className={m('filter-controls')}>
                        <div className={m('filter-group')}>
                            <span className={m('filter-label')}>Status:</span>
                            {['Toate', 'Nou', 'În lucru', 'Rezolvat'].map(s => (
                                <button key={s} className={m(`filter-btn ${filter === s ? 'active' : ''}`)} onClick={() => setFilter(s)}>{s}</button>
                            ))}
                        </div>
                        <div className={m('filter-group filter-right')}>
                            <span className={m('filter-label')}>Sortare:</span>
                            <select className={m('sort-select')} value={sortBy} onChange={e => setSortBy(e.target.value)}>
                                <option value="date">🕐 Cele mai recente</option>
                                <option value="votes">▲ Cele mai votate</option>
                                <option value="priority">🔥 Prioritate</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div className={m('filter-results-bar')}>
                    <span className={m('results-count')}>{filteredIssues.length} sesizări găsite</span>
                    {(filter !== 'Toate' || catFilter !== 'Toate' || search) && (
                        <button className={m('clear-filters')} onClick={() => { setFilter('Toate'); setCatFilter('Toate'); setSearch(''); }}>✕ Resetează filtrele</button>
                    )}
                    <div className={m('view-toggle')}>
                        <button className={m(`view-btn ${activeView === 'map' ? 'active' : ''}`)} onClick={() => setActiveView('map')}>🗺 Hartă</button>
                        <button className={m(`view-btn ${activeView === 'list' ? 'active' : ''}`)} onClick={() => setActiveView('list')}>📋 Listă</button>
                    </div>
                </div>
            </div>

            {/* ── HARTĂ + LISTĂ ── */}
            <section className={m('map-list-section')}>
                <div className={m(`map-card ${activeView === 'list' ? 'map-card-hidden' : ''}`)}>
                    {user ? (
                        <div className={m('map-hint map-hint-user')}>📍 Click pe hartă pentru a adăuga o sesizare</div>
                    ) : (
                        <div className={m('map-hint map-hint-guest')}>🔒 <a href="/login">Loghează-te</a> pentru a adăuga sesizări</div>
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
                                <form onSubmit={handleAddIssue} className={m('map-form')}>
                                    <h4 className={m('map-form-title')}>🚨 Raportează problema</h4>
                                    <input type="text" placeholder="Titlu sesizare *" required className={m('map-input')} value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} maxLength={100} />
                                    <textarea placeholder="Descriere *" required className={m('map-input')} rows={3} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} maxLength={500} />
                                    <select className={m('map-input')} value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                                        {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.icon} {c.value}</option>)}
                                    </select>
                                    <select className={m('map-input')} value={formData.priority} onChange={e => setFormData({ ...formData, priority: e.target.value })}>
                                        {PRIORITY_LEVELS.map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                    <div className={m('map-form-btns')}>
                                        <button type="submit" className={m('btn-map-submit')} disabled={submitting}>{submitting ? '⏳ Se trimite...' : '📤 Trimite'}</button>
                                        <button type="button" className={m('btn-map-cancel')} onClick={() => setNewLocation(null)}>Anulează</button>
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
                                <div className={m('map-popup')}>
                                    <strong>{issue.title}</strong>
                                    <div className={m('popup-meta')}><StatusBadge status={issue.status} /><PriorityDot priority={issue.priority} /></div>
                                    <p>{issue.description?.substring(0, 100)}{issue.description?.length > 100 ? '...' : ''}</p>
                                    <div className={m('popup-footer')}>
                                        <span className={m('popup-votes')}>▲ {issue.votes || 0} voturi</span>
                                        <button onClick={() => setSelectedIssue(issue)} className={m('popup-detail-btn')}>Detalii →</button>
                                    </div>
                                </div>
                            )}
                        />
                    </BaseMap>
                    <div className={m('map-legend')}>
                        <span className={m('legend-item')}><span className={m('legend-dot')} style={{ background: '#ef4444' }} />Nou</span>
                        <span className={m('legend-item')}><span className={m('legend-dot')} style={{ background: '#f59e0b' }} />În lucru</span>
                        <span className={m('legend-item')}><span className={m('legend-dot')} style={{ background: '#3b82f6' }} />Verificare</span>
                        <span className={m('legend-item')}><span className={m('legend-dot')} style={{ background: '#10b981' }} />Rezolvat</span>
                    </div>
                </div>

                {/* Lista sesizări */}
                <div className={m('issues-list-card')}>
                    <div className={m('list-header')}>
                        <h2 className={m('list-title')}>Sesizări <span className={m('count-pill')}>{filteredIssues.length}</span></h2>
                        {isAdmin && <span className={m('admin-chip')}>Admin</span>}
                    </div>
                    <div className={m('issues-scroll')}>
                        {isLoading ? Array(4).fill(0).map((_, i) => <SkeletonRow key={i} />) :
                            filteredIssues.length === 0 ? (
                                <div className={m('empty-state')}>
                                    <div className={m('empty-icon')}>📭</div>
                                    <p>Nicio sesizare găsită</p>
                                    <span>Încearcă să schimbi filtrele</span>
                                </div>
                            ) : filteredIssues.map(issue => (
                                <div key={issue.id} className={m('issue-row')} onClick={() => setSelectedIssue(issue)}>
                                    <div className={m('issue-row-top')}>
                                        <span className={m('issue-cat-icon')}>{CATEGORIES.find(c => c.value === issue.category)?.icon || '📋'}</span>
                                        <div className={m('issue-row-content')}>
                                            <div className={m('issue-row-title-line')}>
                                                <span className={m('issue-row-title')}>{issue.title}</span>
                                                <StatusBadge status={issue.status} />
                                            </div>
                                            <div className={m('issue-row-sub')}>
                                                {issue.category && <span className={m('issue-cat')}>{issue.category}</span>}
                                                {issue.priority && <PriorityDot priority={issue.priority} />}
                                                <span className={m('issue-date')}>{issue.created_at ? new Date(issue.created_at).toLocaleDateString('ro-RO') : ''}</span>
                                            </div>
                                            <p className={m('issue-row-desc')}>{issue.description?.substring(0, 85)}{issue.description?.length > 85 ? '...' : ''}</p>
                                            <div className={m('issue-row-actions')} onClick={e => e.stopPropagation()}>
                                                <button className={m(`vote-btn ${votedIssues.has(issue.id) ? 'voted' : ''}`)} onClick={e => handleVote(issue.id, e)}>▲ {issue.votes || 0}</button>
                                                <button className={m(`follow-btn ${followedIssues.has(issue.id) ? 'followed' : ''}`)} onClick={e => handleFollow(issue.id, e)}>👁 Urmăresc</button>
                                                <button className={m(`flag-btn ${flaggedIssues.has(issue.id) ? 'flagged' : ''}`)} onClick={e => handleFlag(issue.id, e)} disabled={flaggedIssues.has(issue.id)}>🚩</button>
                                                {isAdmin && (
                                                    <select value={issue.status} onChange={e => updateStatus(issue.id, e.target.value, e)} className={m('admin-select-inline')} onClick={e => e.stopPropagation()}>
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
            <section className={m('activity-section')}>
                <div className={m('activity-card')}>
                    <div className={m('activity-header')}>
                        <div>
                            <h2>🕐 Activitate recentă</h2>
                            <p>Ultimele sesizări adăugate în Galați</p>
                        </div>
                    </div>
                    <div className={m('activity-feed')}>
                        {recentActivity.map((issue, i) => (
                            <div key={issue.id} className={m('activity-item')} onClick={() => setSelectedIssue(issue)} style={{ animationDelay: `${i * 80}ms` }}>
                                <div className={m('activity-timeline-dot')} style={{ background: issue.priority === 'Urgentă' ? '#ef4444' : issue.priority === 'Ridicată' ? '#f97316' : '#3b82f6' }} />
                                <div className={m('activity-content')}>
                                    <div className={m('activity-title')}>{CATEGORIES.find(c => c.value === issue.category)?.icon} {issue.title}</div>
                                    <div className={m('activity-meta')}>
                                        <StatusBadge status={issue.status} />
                                        <span className={m('activity-time')}>
                                            {issue.created_at ? new Date(issue.created_at).toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' }) : ''}
                                        </span>
                                        <span className={m('activity-votes')}>▲ {issue.votes || 0}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Hartă mini categorii */}
                <div className={m('cat-stats-card')}>
                    <div className={m('cs-header')}><h3>📊 Sesizări pe categorie</h3></div>
                    <div className={m('cs-list')}>
                        {CATEGORIES.map(cat => {
                            const count = issues.filter(i => i.category === cat.value).length;
                            const pct = issues.length ? (count / issues.length) * 100 : 0;
                            return (
                                <div key={cat.value} className={m('cs-item')} onClick={() => setCatFilter(cat.value)}>
                                    <span className={m('cs-icon')}>{cat.icon}</span>
                                    <span className={m('cs-name')}>{cat.value}</span>
                                    <div className={m('cs-bar-wrap')}>
                                        <div className={m('cs-bar')} style={{ width: `${pct}%` }} />
                                    </div>
                                    <span className={m('cs-count')}>{count}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ── CUM FUNCȚIONEAZĂ ── */}
            <section className={m('how-section')}>
                <h2 className={m('section-title')}>Cum funcționează?</h2>
                <div className={m('how-grid')}>
                    {[
                        { num: '01', icon: '📍', title: 'Identifici problema', desc: 'Dai click pe hartă exact unde se află problema — groapă, felinar stricat, deșeuri ilegale.' },
                        { num: '02', icon: '📝', title: 'Completezi sesizarea', desc: 'Adaugi titlu, descriere și selectezi categoria și prioritatea problemei.' },
                        { num: '03', icon: '🏛️', title: 'Primăria preia sesizarea', desc: 'Sesizarea ajunge direct la departamentul responsabil care o analizează și alocă resurse.' },
                        { num: '04', icon: '✅', title: 'Urmărești rezolvarea', desc: 'Primești notificări la fiecare actualizare de status până la rezolvarea completă.' },
                    ].map(step => (
                        <div key={step.num} className={m('how-step')}>
                            <div className={m('how-num')}>{step.num}</div>
                            <div className={m('how-icon')}>{step.icon}</div>
                            <h3>{step.title}</h3>
                            <p>{step.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── CTA BANNER ── */}
            <section className={m('cta-section')}>
                <div className={m('cta-inner')}>
                    <div className={m('cta-bg-glow')} />
                    <div className={m('cta-content')}>
                        <h2>Fii parte din schimbare</h2>
                        <p>Alătură-te celor care contribuie activ la îmbunătățirea Galațiului.</p>
                        {!user ? (
                            <div className={m('cta-btns')}>
                                <a href="/login" className={m('btn-primary')} style={{ textDecoration: 'none' }}>🚀 Creează cont gratuit</a>
                                <a href="#map-section" className={m('btn-secondary')} style={{ textDecoration: 'none' }}>📍 Explorează harta</a>
                            </div>
                        ) : (
                            <div className={m('cta-btns')}>
                                <a href="#map-section" className={m('btn-primary')} style={{ textDecoration: 'none' }}>✚ Raportează o problemă</a>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* ── FAQ ── */}
            <section className={m('faq-section')}>
                <h2 className={m('section-title')}>Întrebări frecvente</h2>
                <div className={m('faq-grid')}>
                    {[
                        { q: 'Cum funcționează votul?', a: 'Sesizările cu cele mai multe voturi sunt prioritizate. Fiecare utilizator autentificat poate susține o sesizare o singură dată.' },
                        { q: 'Pot urmări stadiul rezolvării?', a: 'Da! Apasă „Urmăresc" pe orice sesizare și vei primi notificări la fiecare schimbare de status.' },
                        { q: 'Ce se întâmplă cu sesizările duplicate?', a: 'Poți raporta o sesizare ca incorectă sau duplicat. Administratorii o vor analiza și redirecționa.' },
                        { q: 'Cât durează rezolvarea?', a: 'Variază în funcție de tip și prioritate. Sesizările urgente sunt tratate prioritar. Termenul mediu este 5-7 zile.' },
                        { q: 'Datele mele sunt în siguranță?', a: 'Da. Folosim criptare și nu partajăm datele personale cu terți. Identitatea poate fi anonimizată.' },
                        { q: 'Cine poate vedea sesizările?', a: 'Toate sesizările sunt publice pe hartă. Datele de contact sunt vizibile doar pentru administratori.' },
                    ].map((item, i) => (
                        <details key={i} className={m('faq-item')}>
                            <summary>{item.q}</summary>
                            <p>{item.a}</p>
                        </details>
                    ))}
                </div>
            </section>

            {/* ── FOOTER ── */}
            <footer className={m('main-footer')}>
                <div className={m('footer-inner')}>
                    <div className={m('footer-brand')}>
                        <span className={m('footer-logo')}>Galați<span>Civic</span></span>
                        <p>Platforma civică oficială a Municipiului Galați</p>
                    </div>
                    <div className={m('footer-links')}>
                        <a href="/about">Despre platformă</a>
                        <a href="/privacy">Confidențialitate</a>
                        <a href="/contact">Contact</a>
                        <a href="https://www.primaria-galati.ro" target="_blank" rel="noreferrer">Primăria Galați ↗</a>
                    </div>
                </div>
                <div className={m('footer-bottom')}>
                    <p>© 2026 Galați Civic · Vocea ta contează în orașul nostru.</p>
                </div>
            </footer>

        </div>
    );
};

export default Home;
