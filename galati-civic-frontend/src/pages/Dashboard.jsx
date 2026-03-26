import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getAllIssues, updateIssue, deleteIssue as deleteIssueApi } from '../services/issuesApi';

const CATEGORIES = ['Infrastructură', 'Iluminat', 'Apă/Canal', 'Spații verzi', 'Salubritate', 'Altele'];
const STATUSES = ['Nou', 'În lucru', 'În verificare', 'Rezolvat'];

const StatusBadge = ({ status }) => {
    const map = {
        'Nou': { cls: 'badge-new', text: '🔴 Nou' },
        'În lucru': { cls: 'badge-progress', text: '🟡 În lucru' },
        'Rezolvat': { cls: 'badge-done', text: '🟢 Rezolvat' },
        'În verificare': { cls: 'badge-review', text: '🔵 Verificare' },
    };
    const { cls, text } = map[status] || { cls: 'badge-new', text: status };
    return <span className={`status-badge ${cls}`}>{text}</span>;
};

const StatMini = ({ value, label, color, icon }) => (
    <div className="dash-stat">
        <div className="dash-stat-icon" style={{ background: `${color}15`, border: `1px solid ${color}25` }}>{icon}</div>
        <div>
            <div className="dash-stat-value" style={{ color }}>{value}</div>
            <div className="dash-stat-label">{label}</div>
        </div>
    </div>
);

export default function Dashboard() {
    const [issues, setIssues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilter] = useState('Toate');
    const [filterCat, setFilterCat] = useState('Toate');
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('date');
    const [toast, setToast] = useState({ msg: '', show: false, type: 'info' });

    const { user, isAdmin, getToken } = useAuth();
    const [authToken, setAuthToken] = useState(null);

    const showToast = useCallback((msg, type = 'info') => {
        setToast({ msg, show: true, type });
        setTimeout(() => setToast({ msg: '', show: false, type }), 3000);
    }, []);

    const fetchIssues = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getAllIssues();
            setIssues(Array.isArray(data) ? data : []);
        } catch {
            showToast('Eroare la încărcarea sesizărilor.', 'error');
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        fetchIssues();
    }, [fetchIssues]);

    useEffect(() => {
        let isMounted = true;

        const loadToken = async () => {
            if (!user) {
                setAuthToken(null);
                return;
            }

            try {
                const token = await getToken();
                if (isMounted) setAuthToken(token);
            } catch {
                if (isMounted) setAuthToken(null);
            }
        };

        loadToken();

        return () => {
            isMounted = false;
        };
    }, [user, getToken]);

    const updateStatus = async (id, newStatus) => {
        if (!authToken) {
            showToast('Autentificare necesară pentru actualizare.', 'error');
            return;
        }

        try {
            await updateIssue(id, { status: newStatus }, authToken);
            setIssues(prev => prev.map(i => i.id === id ? { ...i, status: newStatus } : i));
            showToast(`Status actualizat → ${newStatus}`, 'success');
        } catch {
            showToast('Eroare la actualizare.', 'error');
        }
    };

    const handleDeleteIssue = async (id) => {
        if (!window.confirm('Ești sigur că vrei să ștergi această sesizare?')) return;
        if (!authToken) {
            showToast('Autentificare necesară pentru ștergere.', 'error');
            return;
        }

        try {
            await deleteIssueApi(id, authToken);
            setIssues(prev => prev.filter(i => i.id !== id));
            showToast('Sesizare ștearsă.', 'success');
        } catch {
            showToast('Eroare la ștergere.', 'error');
        }
    };

    // Filtrare + sortare
    const filtered = issues
        .filter(i => {
            if (filterStatus !== 'Toate' && i.status !== filterStatus) return false;
            if (filterCat !== 'Toate' && i.category !== filterCat) return false;
            if (search && !i.title?.toLowerCase().includes(search.toLowerCase()) &&
                !i.description?.toLowerCase().includes(search.toLowerCase())) return false;
            return true;
        })
        .sort((a, b) => {
            if (sortBy === 'votes') return (b.votes || 0) - (a.votes || 0);
            if (sortBy === 'priority') {
                const idx = ['Urgentă', 'Ridicată', 'Medie', 'Scăzută'];
                return idx.indexOf(a.priority) - idx.indexOf(b.priority);
            }
            return new Date(b.created_at || 0) - new Date(a.created_at || 0);
        });

    const stats = {
        total: issues.length,
        nou: issues.filter(i => i.status === 'Nou').length,
        inLucru: issues.filter(i => i.status === 'În lucru').length,
        rezolvat: issues.filter(i => i.status === 'Rezolvat').length,
    };

    return (
        <div className="dash-page">
            {/* Toast */}
            {toast.show && (
                <div className={`toast toast-${toast.type} toast-show`}>
                    {toast.type === 'success' ? '✓' : toast.type === 'error' ? '✕' : 'ℹ'} {toast.msg}
                </div>
            )}

            {/* Header */}
            <div className="dash-header">
                <div className="dash-header-left">
                    <h1 className="dash-title">
                        {isAdmin ? '⚙️ Panou Administrator' : '📋 Sesizările mele'}
                    </h1>
                    <p className="dash-subtitle">
                        {isAdmin
                            ? `Gestionezi toate sesizările din municipiu · ${stats.total} total`
                            : 'Urmărește și gestionează sesizările tale'}
                    </p>
                </div>
            </div>

            {/* Stats mini */}
            <div className="dash-stats-row">
                <StatMini value={stats.total} label="Total" color="#3b82f6" icon="📋" />
                <StatMini value={stats.nou} label="Noi" color="#ef4444" icon="🆕" />
                <StatMini value={stats.inLucru} label="În lucru" color="#f59e0b" icon="⚙️" />
                <StatMini value={stats.rezolvat} label="Rezolvate" color="#10b981" icon="✅" />
            </div>

            {/* Toolbar filtre */}
            <div className="dash-toolbar">
                <div className="dash-search-wrap">
                    <span>🔍</span>
                    <input
                        className="dash-search"
                        type="text"
                        placeholder="Caută sesizare..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                    {search && <button className="dash-clear" onClick={() => setSearch('')}>✕</button>}
                </div>
                <div className="dash-filters">
                    <select className="dash-select" value={filterStatus} onChange={e => setFilter(e.target.value)}>
                        <option value="Toate">Toate statusurile</option>
                        {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <select className="dash-select" value={filterCat} onChange={e => setFilterCat(e.target.value)}>
                        <option value="Toate">Toate categoriile</option>
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <select className="dash-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
                        <option value="date">🕐 Recente</option>
                        <option value="votes">▲ Votate</option>
                        <option value="priority">🔥 Prioritate</option>
                    </select>
                </div>
            </div>

            {/* Tabel / Lista */}
            <div className="dash-table-wrap glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                {loading ? (
                    <div className="dash-loading">
                        <div className="dash-spinner" />
                        <span>Se încarcă sesizările...</span>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="dash-empty">
                        <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>📭</div>
                        <p>Nicio sesizare găsită.</p>
                        {(filterStatus !== 'Toate' || filterCat !== 'Toate' || search) && (
                            <button className="dash-reset-btn" onClick={() => { setFilter('Toate'); setFilterCat('Toate'); setSearch(''); }}>
                                Resetează filtrele
                            </button>
                        )}
                    </div>
                ) : (
                    <table className="dash-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Sesizare</th>
                                <th>Categorie</th>
                                <th>Prioritate</th>
                                <th>Status</th>
                                <th>Voturi</th>
                                <th>Data</th>
                                {isAdmin && <th>Acțiuni</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(issue => (
                                <tr key={issue.id} className="dash-row">
                                    <td className="dash-cell-id">#{issue.id}</td>
                                    <td className="dash-cell-title">
                                        <div className="dash-title-text">{issue.title}</div>
                                        <div className="dash-desc-text">
                                            {issue.description?.substring(0, 60)}{issue.description?.length > 60 ? '...' : ''}
                                        </div>
                                    </td>
                                    <td>
                                        <span className="dash-cat-badge">{issue.category || '—'}</span>
                                    </td>
                                    <td>
                                        <span className={`priority-chip priority-${(issue.priority || '').toLowerCase().replace('ă', 'a').replace('î', 'i').replace('â', 'a')}`}>
                                            {issue.priority || '—'}
                                        </span>
                                    </td>
                                    <td>
                                        {isAdmin ? (
                                            <select
                                                className="status-select"
                                                value={issue.status}
                                                onChange={e => updateStatus(issue.id, e.target.value)}
                                                onClick={e => e.stopPropagation()}
                                            >
                                                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                        ) : (
                                            <StatusBadge status={issue.status} />
                                        )}
                                    </td>
                                    <td className="dash-cell-votes">
                                        <span className="votes-chip">▲ {issue.votes || 0}</span>
                                    </td>
                                    <td className="dash-cell-date">
                                        {issue.created_at
                                            ? new Date(issue.created_at).toLocaleDateString('ro-RO', { day: '2-digit', month: 'short' })
                                            : '—'}
                                    </td>
                                    {isAdmin && (
                                        <td className="dash-cell-actions">
                                            <button
                                                className="action-btn action-delete"
                                                onClick={() => handleDeleteIssue(issue.id)}
                                                title="Șterge sesizarea"
                                            >
                                                🗑
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <div className="dash-count-bar">
                Afișând <strong>{filtered.length}</strong> din <strong>{issues.length}</strong> sesizări
            </div>

            <style>{`
                .dash-page {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 32px 24px 60px;
                }
                .dash-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 24px;
                    gap: 16px;
                    flex-wrap: wrap;
                }
                .dash-title { font-size: 1.4rem; font-weight: 700; color: var(--text, #e8f0fe); margin-bottom: 4px; }
                .dash-subtitle { font-size: 13px; color: var(--text-muted, #4d6380); }

                .dash-stats-row {
                    display: flex;
                    gap: 12px;
                    margin-bottom: 20px;
                    flex-wrap: wrap;
                }
                .dash-stat {
                    background: var(--card-bg, rgba(15,26,46,.8));
                    border: 1px solid var(--card-border, rgba(255,255,255,.07));
                    border-radius: 12px;
                    padding: 14px 18px;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    flex: 1;
                    min-width: 120px;
                    backdrop-filter: blur(12px);
                }
                .dash-stat-icon {
                    width: 36px; height: 36px;
                    border-radius: 9px;
                    display: flex; align-items: center; justify-content: center;
                    font-size: 16px;
                    flex-shrink: 0;
                }
                .dash-stat-value { font-size: 1.5rem; font-weight: 700; line-height: 1; }
                .dash-stat-label { font-size: 11px; color: var(--text-muted, #4d6380); font-weight: 500; margin-top: 3px; }

                .dash-toolbar {
                    display: flex;
                    gap: 10px;
                    margin-bottom: 14px;
                    flex-wrap: wrap;
                    align-items: center;
                }
                .dash-search-wrap {
                    position: relative;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    background: var(--card-bg, rgba(15,26,46,.8));
                    border: 1px solid var(--card-border, rgba(255,255,255,.07));
                    border-radius: 9px;
                    padding: 8px 14px;
                    flex: 1;
                    min-width: 200px;
                    backdrop-filter: blur(12px);
                }
                .dash-search-wrap span { font-size: 14px; flex-shrink: 0; }
                .dash-search {
                    background: none !important;
                    border: none !important;
                    padding: 0 !important;
                    border-radius: 0 !important;
                    color: var(--text, #e8f0fe) !important;
                    font-size: 13px !important;
                    flex: 1;
                    outline: none !important;
                    font-family: inherit !important;
                }
                .dash-search::placeholder { color: var(--text-muted, #4d6380); }
                .dash-clear {
                    background: none; border: none; color: var(--text-muted, #4d6380);
                    cursor: pointer; font-size: 13px; padding: 2px 4px; border-radius: 4px;
                    transition: .15s;
                }
                .dash-clear:hover { color: var(--text, #e8f0fe); }

                .dash-filters { display: flex; gap: 8px; flex-wrap: wrap; }
                .dash-select {
                    background: var(--card-bg, rgba(15,26,46,.8));
                    border: 1px solid var(--card-border, rgba(255,255,255,.07));
                    color: var(--text, #e8f0fe);
                    padding: 8px 12px;
                    border-radius: 9px;
                    font-size: 13px;
                    font-family: inherit;
                    cursor: pointer;
                    outline: none;
                    backdrop-filter: blur(12px);
                }
                .dash-select:focus { border-color: #3b82f6; }

                /* Tabel */
                .dash-table-wrap { border-radius: 14px; }
                .dash-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 13px;
                }
                .dash-table thead tr {
                    border-bottom: 1px solid rgba(255,255,255,.07);
                }
                .dash-table th {
                    padding: 12px 14px;
                    text-align: left;
                    font-size: 11px;
                    font-weight: 600;
                    color: var(--text-muted, #4d6380);
                    text-transform: uppercase;
                    letter-spacing: .6px;
                    white-space: nowrap;
                }
                .dash-row {
                    border-bottom: 1px solid rgba(255,255,255,.04);
                    transition: background .15s;
                    cursor: default;
                }
                .dash-row:last-child { border-bottom: none; }
                .dash-row:hover { background: rgba(255,255,255,.025); }
                .dash-table td { padding: 12px 14px; vertical-align: middle; }

                .dash-cell-id { color: var(--text-muted, #4d6380); font-size: 12px; width: 50px; }
                .dash-title-text { font-weight: 600; color: var(--text, #e8f0fe); margin-bottom: 3px; }
                .dash-desc-text { font-size: 12px; color: var(--text-muted, #4d6380); }

                .dash-cat-badge {
                    background: rgba(255,255,255,.05);
                    border: 1px solid rgba(255,255,255,.07);
                    border-radius: 8px;
                    padding: 3px 9px;
                    font-size: 11px;
                    color: var(--text-dim, #8fa3c0);
                    white-space: nowrap;
                }

                .priority-chip {
                    padding: 3px 9px;
                    border-radius: 8px;
                    font-size: 11px;
                    font-weight: 600;
                    white-space: nowrap;
                }
                .priority-urgenta { background: rgba(239,68,68,.15); color: #fca5a5; }
                .priority-ridicata { background: rgba(249,115,22,.15); color: #fdba74; }
                .priority-medie { background: rgba(234,179,8,.15); color: #fde68a; }
                .priority-scazuta { background: rgba(34,197,94,.15); color: #86efac; }

                .status-select {
                    background: rgba(255,255,255,.04);
                    border: 1px solid rgba(255,255,255,.08);
                    color: var(--text, #e8f0fe);
                    padding: 5px 9px;
                    border-radius: 7px;
                    font-size: 12px;
                    font-family: inherit;
                    cursor: pointer;
                    outline: none;
                }
                .status-select:focus { border-color: #3b82f6; }

                .votes-chip {
                    background: rgba(59,130,246,.1);
                    color: #93c5fd;
                    border-radius: 8px;
                    padding: 3px 9px;
                    font-size: 11px;
                    font-weight: 600;
                }
                .dash-cell-date { color: var(--text-muted, #4d6380); font-size: 12px; white-space: nowrap; }

                .action-btn {
                    background: none; border: none; cursor: pointer;
                    padding: 5px 8px; border-radius: 7px;
                    font-size: 14px; transition: background .15s;
                }
                .action-delete:hover { background: rgba(239,68,68,.15); }

                .dash-loading {
                    display: flex; flex-direction: column; align-items: center;
                    justify-content: center; padding: 60px 24px; gap: 12px;
                    color: var(--text-muted, #4d6380); font-size: 13px;
                }
                .dash-spinner {
                    width: 28px; height: 28px;
                    border: 2px solid rgba(59,130,246,.2);
                    border-top-color: #3b82f6;
                    border-radius: 50%;
                    animation: spin .7s linear infinite;
                }
                @keyframes spin { to { transform: rotate(360deg); } }

                .dash-empty {
                    padding: 60px 24px;
                    text-align: center;
                    color: var(--text-muted, #4d6380);
                }
                .dash-empty p { font-size: 14px; margin-bottom: 12px; }
                .dash-reset-btn {
                    background: rgba(59,130,246,.1); border: 1px solid rgba(59,130,246,.2);
                    color: #93c5fd; padding: 8px 16px; border-radius: 8px;
                    font-size: 13px; cursor: pointer; font-family: inherit; transition: .15s;
                }
                .dash-reset-btn:hover { background: rgba(59,130,246,.18); }

                .dash-count-bar {
                    margin-top: 12px;
                    font-size: 12px;
                    color: var(--text-muted, #4d6380);
                    text-align: right;
                }
                .dash-count-bar strong { color: var(--text-dim, #8fa3c0); }

                /* Badges status (reutilizate) */
                .status-badge { display: inline-flex; align-items: center; padding: 3px 9px; border-radius: 12px; font-size: 11px; font-weight: 600; white-space: nowrap; }
                .badge-new      { background: rgba(239,68,68,.12);  color: #fca5a5; border: 1px solid rgba(239,68,68,.2); }
                .badge-progress { background: rgba(245,158,11,.12); color: #fcd34d; border: 1px solid rgba(245,158,11,.2); }
                .badge-done     { background: rgba(16,185,129,.12); color: #6ee7b7; border: 1px solid rgba(16,185,129,.2); }
                .badge-review   { background: rgba(59,130,246,.12); color: #93c5fd; border: 1px solid rgba(59,130,246,.2); }

                @media (max-width: 768px) {
                    .dash-page { padding: 20px 16px 40px; }
                    .dash-table { display: block; overflow-x: auto; }
                    .dash-stats-row { gap: 8px; }
                    .dash-stat { min-width: 100px; padding: 12px 14px; }
                }
            `}</style>
        </div>
    );
}