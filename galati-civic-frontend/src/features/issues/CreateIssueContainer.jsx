import React, { useState, useCallback, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { pageStyles } from './createIssueStyles';
import IssueTabs from './components/IssueTabs';
import MyIssuesPanel from './components/MyIssuesPanel';
import NewIssueStepper from './components/NewIssueStepper';
import IssuesMapPanel from './components/IssuesMapPanel';
import IssueEditModal from './components/IssueEditModal';
import IssueDeleteConfirm from './components/IssueDeleteConfirm';
import { createIssue, deleteIssue, getAllIssues, getMyIssues, updateIssue, voteIssue } from '../../services/issuesApi';

import { SELECTED_ICON } from '../map/utils/mapIcons';
const GALATI_CENTER = [45.4353, 28.008];

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

const MOCK_MY_ISSUES = [
    { id: 101, title: 'Groapă str. Domnească', description: 'Groapă de 30cm adâncime în față la bloc, risc pentru mașini și pietoni.', category: 'Infrastructură', priority: 'Ridicată', status: 'În lucru', lat: 45.44, lng: 28.02, votes: 12, created_at: '2026-03-01T10:00:00Z', isOwn: true },
    { id: 102, title: 'Iluminat lipsă Parc Mazepa', description: 'Zona din spatele parcului nu are iluminat nocturn, periculoasă seara.', category: 'Iluminat', priority: 'Medie', status: 'Nou', lat: 45.438, lng: 28.01, votes: 5, created_at: '2026-03-10T14:00:00Z', isOwn: true },
];

const Toast = ({ msg, show, type = 'info' }) => <div className={`ci-toast ci-toast-${type}${show ? ' ci-toast-show' : ''}`}><span>{type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</span>{msg}</div>;
const StatusBadge = ({ status }) => {
    const map = { Nou: { cls: 'ci-badge-new', label: '🔴 Nou' }, 'În lucru': { cls: 'ci-badge-progress', label: '🟡 În lucru' }, Rezolvat: { cls: 'ci-badge-done', label: '🟢 Rezolvat' }, 'În verificare': { cls: 'ci-badge-review', label: '🔵 Verificare' } };
    const b = map[status] || map.Nou;
    return <span className={`ci-badge ${b.cls}`}>{b.label}</span>;
};

const CreateIssueContainer = () => {
    const [tab, setTab] = useState('my');
    const [step, setStep] = useState(1);
    const [myIssues, setMyIssues] = useState([]);
    const [allIssues, setAllIssues] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [votedIssues, setVotedIssues] = useState(new Set());
    const [selectedIssue, setSelectedIssue] = useState(null);
    const [editingIssue, setEditingIssue] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [toast, setToast] = useState({ msg: '', show: false, type: 'info' });
    const [mapSearch, setMapSearch] = useState('');
    const [mapFilter, setMapFilter] = useState('Toate');
    const [form, setForm] = useState({ title: '', description: '', category: 'Infrastructură', priority: 'Medie', lat: null, lng: null });
    const [formErrors, setFormErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [editLocation, setEditLocation] = useState(null);

    const { user, getToken } = useAuth();
    const navigate = useNavigate();
    const useMock = import.meta.env.VITE_USE_MOCK === 'true';

    const showToast = useCallback((msg, type = 'info') => {
        setToast({ msg, show: true, type });
        setTimeout(() => setToast((t) => ({ ...t, show: false })), 3200);
    }, []);

    useEffect(() => {
        const load = async () => {
            setIsLoading(true);
            if (useMock) {
                await new Promise((r) => setTimeout(r, 500));
                setMyIssues(MOCK_MY_ISSUES);
                setAllIssues([...MOCK_MY_ISSUES]);
            } else {
                try {
                    const [myData, allData] = await Promise.all([
                        getMyIssues(user?.token),
                        getAllIssues(),
                    ]);
                    setMyIssues(myData);
                    setAllIssues(allData);
                } catch {
                    showToast('Eroare la încărcare date.', 'error');
                }
            }
            setIsLoading(false);
        };
        load();
    }, []);

    const validate = () => {
        const errs = {};
        if (!form.title.trim()) errs.title = 'Titlul este obligatoriu.';
        if (form.title.length > 100) errs.title = 'Max 100 caractere.';
        if (!form.description.trim()) errs.description = 'Descrierea este obligatorie.';
        if (!form.lat || !form.lng) errs.location = 'Selectează locația pe hartă.';
        return errs;
    };

    const handleSubmit = async (e) => {
        e?.preventDefault?.();
        const errs = validate();
        if (Object.keys(errs).length) return setFormErrors(errs);
        setSubmitting(true);
        try {
            const payload = { ...form };
            if (useMock) {
                const newIssue = { id: Date.now(), ...payload, votes: 0, status: 'Nou', created_at: new Date().toISOString(), isOwn: true };
                setMyIssues((prev) => [newIssue, ...prev]);
                setAllIssues((prev) => [newIssue, ...prev]);
                showToast('Sesizare trimisă cu succes! ✓', 'success');
                setForm({ title: '', description: '', category: 'Infrastructură', priority: 'Medie', lat: null, lng: null });
                setStep(1);
                setTab('my');
            } else {
                const token = (await getToken?.()) || user?.token;
                await createIssue({ ...payload, user_id: user?.id ?? null }, token);
                showToast('Sesizare trimisă! ✓', 'success');
                setTab('my');
            }
        } catch {
            showToast('Eroare la trimitere.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const openEdit = (issue) => { setEditingIssue({ ...issue }); setEditLocation({ lat: issue.lat, lng: issue.lng }); };
    const saveEdit = async () => {
        if (!editingIssue.title.trim() || !editingIssue.description.trim()) return showToast('Completează titlul și descrierea.', 'error');
        const updated = { ...editingIssue, lat: editLocation?.lat ?? editingIssue.lat, lng: editLocation?.lng ?? editingIssue.lng };
        if (useMock) {
            setMyIssues((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
            setAllIssues((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
        } else {
            try { await updateIssue(updated.id, updated, user.token); } catch { return showToast('Eroare la actualizare.', 'error'); }
        }
        showToast('Sesizare actualizată! ✓', 'success');
        setEditingIssue(null);
        setEditLocation(null);
    };

    const confirmDelete = async (id) => {
        if (useMock) {
            setMyIssues((prev) => prev.filter((i) => i.id !== id));
            setAllIssues((prev) => prev.filter((i) => i.id !== id));
        } else {
            try { await deleteIssue(id, user.token); } catch { return showToast('Eroare la ștergere.', 'error'); }
        }
        showToast('Sesizare ștearsă.', 'success');
        setDeleteConfirm(null);
    };

    const handleVote = async (id, e) => {
        e?.stopPropagation();
        if (!user) return showToast('Trebuie să fii logat pentru a vota!', 'error');
        if (votedIssues.has(id)) return showToast('Ai votat deja!', 'error');
        if (useMock) {
            setAllIssues((prev) => prev.map((i) => (i.id === id ? { ...i, votes: (i.votes || 0) + 1 } : i)));
            setMyIssues((prev) => prev.map((i) => (i.id === id ? { ...i, votes: (i.votes || 0) + 1 } : i)));
            setVotedIssues((prev) => new Set([...prev, id]));
            return showToast('Vot înregistrat! ▲', 'success');
        }
        try { await voteIssue(id, user.token); setVotedIssues((prev) => new Set([...prev, id])); showToast('Vot înregistrat! ▲', 'success'); } catch { showToast('Ai votat deja!', 'error'); }
    };

    const filteredForMap = allIssues.filter((i) => (mapFilter === 'Toate' || i.status === mapFilter) && (!mapSearch || i.title?.toLowerCase().includes(mapSearch.toLowerCase())) && i.lat && i.lng);

    if (!user) {
        return <div className="ci-page"><div className="ci-auth-wall"><div className="ci-auth-icon">🔒</div><h2>Autentificare necesară</h2><p>Trebuie să fii logat pentru a raporta sau gestiona sesizări.</p><div className="ci-auth-btns"><Link to="/login" className="ci-btn-primary">🔐 Autentifică-te</Link><Link to="/register" className="ci-btn-secondary">Creează cont gratuit →</Link></div></div><style>{pageStyles}</style></div>;
    }

    return (
        <div className="ci-page">
            <Toast msg={toast.msg} show={toast.show} type={toast.type} />
            <style>{pageStyles}</style>
            <div className="ci-header"><div className="ci-header-inner"><Link to="/" className="ci-back">← Înapoi la hartă</Link><div className="ci-header-title"><h1>🚨 Raportare probleme</h1><p>Sesizează problemele din Galați și urmărește rezolvarea lor</p></div><div className="ci-header-stats"><div className="ci-hstat"><span className="ci-hstat-val">{myIssues.length}</span><span className="ci-hstat-lbl">Sesizările mele</span></div><div className="ci-hstat"><span className="ci-hstat-val">{myIssues.filter((i) => i.status === 'Rezolvat').length}</span><span className="ci-hstat-lbl">Rezolvate</span></div><div className="ci-hstat"><span className="ci-hstat-val">{myIssues.reduce((s, i) => s + (i.votes || 0), 0)}</span><span className="ci-hstat-lbl">Voturi primite</span></div></div></div></div>

            <IssueTabs tab={tab} myIssuesCount={myIssues.length} allIssuesCount={allIssues.length} onSelectMy={() => setTab('my')} onSelectNew={() => { setTab('new'); setStep(1); }} onSelectMap={() => setTab('map')} />

            <div className="ci-body">
                {tab === 'my' && <div className="ci-my-section"><MyIssuesPanel isLoading={isLoading} myIssues={myIssues} onSelectIssue={setSelectedIssue} onStartNew={() => { setTab('new'); setStep(1); }} onVote={handleVote} votedIssues={votedIssues} onEdit={openEdit} onDelete={setDeleteConfirm} categories={CATEGORIES} priorities={PRIORITIES} StatusBadge={StatusBadge} /></div>}
                {tab === 'new' && <NewIssueStepper step={step} form={form} formErrors={formErrors} setForm={setForm} setFormErrors={setFormErrors} onBack={() => setStep((s) => Math.max(1, s - 1))} onNext={() => { setFormErrors({}); setStep((s) => Math.min(3, s + 1)); }} onSubmit={handleSubmit} submitting={submitting} validate={validate} categories={CATEGORIES} priorities={PRIORITIES} mapCenter={GALATI_CENTER} selectedIcon={SELECTED_ICON} />}
                {tab === 'map' && <IssuesMapPanel mapSearch={mapSearch} onMapSearchChange={setMapSearch} mapFilter={mapFilter} onMapFilterChange={setMapFilter} filteredForMap={filteredForMap} onSelectIssue={setSelectedIssue} selectedIssueId={selectedIssue?.id} categories={CATEGORIES} StatusBadge={StatusBadge} mapCenter={GALATI_CENTER} onVote={handleVote} />}
            </div>

            {selectedIssue && (
                <div className="ci-overlay" onClick={() => setSelectedIssue(null)}>
                    <div className="ci-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="ci-modal-header"><div className="ci-modal-title-wrap"><span className="ci-modal-cat-icon">{CATEGORIES.find((c) => c.value === selectedIssue.category)?.label?.split(' ')[0] || '📋'}</span><div><div className="ci-modal-title">{selectedIssue.title}</div><div className="ci-modal-sub">#{selectedIssue.id} · {selectedIssue.category}</div></div></div><button className="ci-modal-close" onClick={() => setSelectedIssue(null)}>✕</button></div>
                        <div className="ci-modal-body"><div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}><StatusBadge status={selectedIssue.status} /><span className="ci-modal-priority" style={{ color: PRIORITIES.find((p) => p.value === selectedIssue.priority)?.color }}>● {selectedIssue.priority}</span></div><p className="ci-modal-desc">{selectedIssue.description}</p><div className="ci-modal-actions"><button className={`ci-vote-btn-lg ${votedIssues.has(selectedIssue.id) ? 'voted' : ''}`} onClick={() => handleVote(selectedIssue.id)}>▲ Susțin ({selectedIssue.votes || 0})</button>{selectedIssue.isOwn && <><button className="ci-modal-btn ci-edit-btn" onClick={() => { openEdit(selectedIssue); setSelectedIssue(null); }}>✏️ Editează</button><button className="ci-modal-btn ci-delete-btn" onClick={() => { setDeleteConfirm(selectedIssue.id); setSelectedIssue(null); }}>🗑️ Șterge</button></>}</div></div>
                    </div>
                </div>
            )}
            <IssueEditModal editingIssue={editingIssue} onClose={() => setEditingIssue(null)} onChange={(field, value) => setEditingIssue((prev) => ({ ...prev, [field]: value }))} categories={CATEGORIES} priorities={PRIORITIES} editLocation={editLocation} onLocationPick={setEditLocation} onSave={saveEdit} selectedIcon={SELECTED_ICON} />
            <IssueDeleteConfirm deleteId={deleteConfirm} onCancel={() => setDeleteConfirm(null)} onConfirm={confirmDelete} />
        </div>
    );
};

export default CreateIssueContainer;
