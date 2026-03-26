import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getAllIssues, updateIssue, deleteIssue as deleteIssueApi, forwardIssue as forwardIssueApi } from '../services/issuesApi';

const CATEGORIES = ['Infrastructură', 'Iluminat', 'Apă/Canal', 'Spații verzi', 'Salubritate', 'Altele'];
const STATUSES = ['Nou', 'În lucru', 'În verificare', 'Rezolvat'];
const DEPARTMENTS = [
    'Direcția Infrastructură Rutieră',
    'Serviciul Iluminat Public',
    'Serviciul Apă și Canalizare',
    'Serviciul Spații Verzi',
    'Serviciul Salubritate',
    'Direcția Tehnică Generală',
];

const getSuggestedDepartment = (category) => {
    const map = {
        'Infrastructură': 'Direcția Infrastructură Rutieră',
        'Iluminat': 'Serviciul Iluminat Public',
        'Apă/Canal': 'Serviciul Apă și Canalizare',
        'Spații verzi': 'Serviciul Spații Verzi',
        'Salubritate': 'Serviciul Salubritate',
        'Altele': 'Direcția Tehnică Generală',
    };
    return map[category] || 'Direcția Tehnică Generală';
};

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
    const [editingIssue, setEditingIssue] = useState(null);
    const [editForm, setEditForm] = useState({
        title: '',
        description: '',
        status: 'Nou',
        priority: 'Medie',
        category: '',
        department: 'Direcția Tehnică Generală',
        adminMessage: '',
    });

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
        if (!isAdmin) {
            showToast('Doar administratorii pot actualiza statusul.', 'error');
            return;
        }
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

    const openEditModal = (issue) => {
        setEditingIssue(issue);
        setEditForm({
            title: issue.title || '',
            description: issue.description || '',
            status: issue.status || 'Nou',
            priority: issue.priority || 'Medie',
            category: issue.category || CATEGORIES[0],
            department: getSuggestedDepartment(issue.category),
            adminMessage: issue.admin_reply || '',
        });
    };

    const closeEditModal = () => {
        setEditingIssue(null);
        setEditForm({
            title: '',
            description: '',
            status: 'Nou',
            priority: 'Medie',
            category: '',
            department: 'Direcția Tehnică Generală',
            adminMessage: '',
        });
    };

    const saveIssueChanges = async (sendToDepartment = false) => {
        if (!editingIssue) return;
        if (!isAdmin) {
            showToast('Doar administratorii pot edita sesizări.', 'error');
            return;
        }
        if (!authToken) {
            showToast('Autentificare necesară pentru editare.', 'error');
            return;
        }

        const adminReply = [
            `Departament responsabil: ${editForm.department}`,
            editForm.adminMessage ? `Mesaj admin: ${editForm.adminMessage}` : null,
        ].filter(Boolean).join('\n');

        const payload = {
            title: editForm.title,
            description: editForm.description,
            status: sendToDepartment ? 'În lucru' : editForm.status,
            priority: editForm.priority,
            category: editForm.category,
            admin_reply: adminReply,
        };

        try {
            if (sendToDepartment) {
                await forwardIssueApi(editingIssue.id, {
                    department: editForm.department,
                    message: editForm.adminMessage,
                }, authToken);
            }

            const updatedIssue = await updateIssue(editingIssue.id, payload, authToken);
            setIssues((prev) => prev.map((issue) => (issue.id === editingIssue.id ? { ...issue, ...updatedIssue } : issue)));
            showToast(sendToDepartment ? 'Sesizare trimisă către departament.' : 'Sesizare actualizată.', 'success');
            closeEditModal();
        } catch {
            showToast('Eroare la salvarea modificărilor.', 'error');
        }
    };

    const handleDeleteIssue = async (id) => {
        if (!isAdmin) {
            showToast('Doar administratorii pot șterge sesizări.', 'error');
            return;
        }
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
                        {isAdmin ? '⚙️ Panou Administrator' : '📋 Toate sesizările'}
                    </h1>
                    <p className="dash-subtitle">
                        {isAdmin
                            ? `Gestionezi toate sesizările din municipiu · ${stats.total} total`
                            : ''}
                    </p>
                </div>
            </div>

            {/* Stats mini */}
            <div className="dash-stats-row">
                <StatMini value={stats.total} label="Total" color="#3b82f6" icon="" />
                <StatMini value={stats.nou} label="Noi" color="#ef4444" icon="🆕" />
                <StatMini value={stats.inLucru} label="În lucru" color="#f59e0b" icon="L" />
                <StatMini value={stats.rezolvat} label="Rezolvate" color="#10b981" icon="R" />
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
                                    <td className="dash-cell-id" data-label="ID">#{issue.id}</td>
                                    <td className="dash-cell-title" data-label="Sesizare">
                                        <div className="dash-title-text">{issue.title}</div>
                                        <div className="dash-desc-text">
                                            {issue.description?.substring(0, 60)}{issue.description?.length > 60 ? '...' : ''}
                                        </div>
                                    </td>
                                    <td data-label="Categorie">
                                        <span className="dash-cat-badge">{issue.category || '—'}</span>
                                    </td>
                                    <td data-label="Prioritate">
                                        <span className={`priority-chip priority-${(issue.priority || '').toLowerCase().replace('ă', 'a').replace('î', 'i').replace('â', 'a')}`}>
                                            {issue.priority || '—'}
                                        </span>
                                    </td>
                                    <td data-label="Status">
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
                                    <td className="dash-cell-votes" data-label="Voturi">
                                        <span className="votes-chip">▲ {issue.votes || 0}</span>
                                    </td>
                                    <td className="dash-cell-date" data-label="Data">
                                        {issue.created_at
                                            ? new Date(issue.created_at).toLocaleDateString('ro-RO', { day: '2-digit', month: 'short' })
                                            : '—'}
                                    </td>
                                    {isAdmin && (
                                        <td className="dash-cell-actions" data-label="Acțiuni">
                                            <button
                                                className="action-btn action-edit"
                                                onClick={() => openEditModal(issue)}
                                                title="Editează și trimite către departament"
                                            >
                                                ✏️
                                            </button>
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

            {editingIssue && (
                <div className="admin-modal-overlay" onClick={closeEditModal}>
                    <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
                        <h3>Administrare sesizare #{editingIssue.id}</h3>
                        <div className="admin-form-grid">
                            <label>
                                Titlu
                                <input
                                    type="text"
                                    value={editForm.title}
                                    onChange={(e) => setEditForm((prev) => ({ ...prev, title: e.target.value }))}
                                />
                            </label>
                            <label>
                                Categorie
                                <select
                                    value={editForm.category}
                                    onChange={(e) => setEditForm((prev) => ({
                                        ...prev,
                                        category: e.target.value,
                                        department: getSuggestedDepartment(e.target.value),
                                    }))}
                                >
                                    {CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
                                </select>
                            </label>
                            <label>
                                Prioritate
                                <select
                                    value={editForm.priority}
                                    onChange={(e) => setEditForm((prev) => ({ ...prev, priority: e.target.value }))}
                                >
                                    {['Urgentă', 'Ridicată', 'Medie', 'Scăzută'].map((priority) => (
                                        <option key={priority} value={priority}>{priority}</option>
                                    ))}
                                </select>
                            </label>
                            <label>
                                Status
                                <select
                                    value={editForm.status}
                                    onChange={(e) => setEditForm((prev) => ({ ...prev, status: e.target.value }))}
                                >
                                    {STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
                                </select>
                            </label>
                            <label className="full-width">
                                Departament responsabil
                                <select
                                    value={editForm.department}
                                    onChange={(e) => setEditForm((prev) => ({ ...prev, department: e.target.value }))}
                                >
                                    {DEPARTMENTS.map((department) => <option key={department} value={department}>{department}</option>)}
                                </select>
                            </label>
                            <label className="full-width">
                                Descriere
                                <textarea
                                    rows={4}
                                    value={editForm.description}
                                    onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
                                />
                            </label>
                            <label className="full-width">
                                Mesaj către departament
                                <textarea
                                    rows={3}
                                    value={editForm.adminMessage}
                                    onChange={(e) => setEditForm((prev) => ({ ...prev, adminMessage: e.target.value }))}
                                    placeholder="Ex: Vă rugăm intervenție în 24h, afectează trafic pietonal."
                                />
                            </label>
                        </div>
                        <div className="admin-modal-actions">
                            <button type="button" className="modal-btn ghost" onClick={closeEditModal}>Anulează</button>
                            <button type="button" className="modal-btn secondary" onClick={() => saveIssueChanges(false)}>
                                Salvează modificări
                            </button>
                            <button type="button" className="modal-btn primary" onClick={() => saveIssueChanges(true)}>
                                Trimite către departament
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
                .action-edit:hover { background: rgba(59,130,246,.15); }
                .action-delete:hover { background: rgba(239,68,68,.15); }

                .admin-modal-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(2, 6, 23, .72);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 16px;
                    z-index: 999;
                }
                .admin-modal {
                    width: min(760px, 100%);
                    background: #0f1a2e;
                    border: 1px solid rgba(255,255,255,.1);
                    border-radius: 14px;
                    padding: 18px;
                }
                .admin-modal h3 {
                    margin: 0 0 12px;
                    color: #e8f0fe;
                    font-size: 1.1rem;
                }
                .admin-form-grid {
                    display: grid;
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                    gap: 10px;
                }
                .admin-form-grid label {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                    font-size: 12px;
                    color: #8fa3c0;
                }
                .admin-form-grid input,
                .admin-form-grid select,
                .admin-form-grid textarea {
                    background: rgba(255,255,255,.05);
                    border: 1px solid rgba(255,255,255,.12);
                    color: #e8f0fe;
                    padding: 8px 10px;
                    border-radius: 8px;
                    font-family: inherit;
                    font-size: 13px;
                    outline: none;
                }
                .admin-form-grid textarea { resize: vertical; }
                .admin-form-grid .full-width { grid-column: 1 / -1; }

                .admin-modal-actions {
                    margin-top: 14px;
                    display: flex;
                    justify-content: flex-end;
                    gap: 8px;
                    flex-wrap: wrap;
                }
                .modal-btn {
                    border: none;
                    border-radius: 8px;
                    padding: 8px 12px;
                    font-size: 12px;
                    cursor: pointer;
                    font-family: inherit;
                }
                .modal-btn.ghost {
                    background: transparent;
                    color: #93c5fd;
                    border: 1px solid rgba(147,197,253,.4);
                }
                .modal-btn.secondary {
                    background: rgba(59,130,246,.15);
                    color: #93c5fd;
                }
                .modal-btn.primary {
                    background: #2563eb;
                    color: #fff;
                }

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

                @media (max-width: 900px) {
                    .dash-page { padding: 20px 16px 40px; }
                    .dash-toolbar { flex-direction: column; align-items: stretch; }
                    .dash-search-wrap { width: 100%; min-height: 44px; }
                    .dash-filters { width: 100%; }
                    .dash-select {
                        min-height: 44px;
                        flex: 1 1 calc(50% - 6px);
                    }
                    .dash-table-wrap { background: transparent; border: none; }
                    .dash-table { border-collapse: separate; border-spacing: 0 10px; }
                    .dash-table thead { display: none; }
                    .dash-table tbody { display: grid; gap: 10px; }
                    .dash-row {
                        display: grid;
                        gap: 8px;
                        background: var(--card-bg, rgba(15,26,46,.8));
                        border: 1px solid var(--card-border, rgba(255,255,255,.09));
                        border-radius: 12px;
                        padding: 10px 12px;
                    }
                    .dash-table td {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        gap: 12px;
                        padding: 0;
                        border: none;
                    }
                    .dash-table td::before {
                        content: attr(data-label);
                        font-size: 11px;
                        color: var(--text-muted, #4d6380);
                        text-transform: uppercase;
                        letter-spacing: .05em;
                        flex-shrink: 0;
                    }
                    .dash-cell-title {
                        align-items: flex-start !important;
                        flex-direction: column;
                    }
                    .dash-cell-title::before { margin-bottom: 2px; }
                    .dash-cell-actions { justify-content: flex-end !important; }
                    .dash-cell-actions::before { margin-right: auto; }
                    .dash-stats-row { gap: 8px; }
                    .dash-stat { min-width: 100px; padding: 12px 14px; }
                    .dash-count-bar { text-align: left; }
                }
                @media (max-width: 520px) {
                    .dash-select { flex-basis: 100%; }
                    .admin-form-grid { grid-template-columns: 1fr; }
                }
            `}</style>
        </div>
    );
}
