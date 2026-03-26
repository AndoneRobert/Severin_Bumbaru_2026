import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../services/apiClient';
import { pageStyles } from './createIssueStyles';
import IssueTabs from './components/IssueTabs';
import MyIssuesPanel from './components/MyIssuesPanel';
import NewIssueStepper from './components/NewIssueStepper';
import IssuesMapPanel from './components/IssuesMapPanel';
import IssueEditModal from './components/IssueEditModal';
import IssueDeleteConfirm from './components/IssueDeleteConfirm';
import { useIssues } from './hooks/useIssues';
import { useIssueForm } from './hooks/useIssueForm';
import { useToast } from './hooks/useToast';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl: markerIcon2x, iconUrl: markerIcon, shadowUrl: markerShadow });

const makeIcon = (color) => L.divIcon({ className: '', html: `<div style="width:26px;height:26px;border-radius:50% 50% 50% 0;background:${color};border:2.5px solid #fff;box-shadow:0 3px 10px rgba(0,0,0,0.4);transform:rotate(-45deg);"></div>`, iconSize: [26, 26], iconAnchor: [13, 26], popupAnchor: [0, -30] });
const SELECTED_ICON = makeIcon('#a855f7');
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
    const [selectedIssue, setSelectedIssue] = useState(null);
    const [editingIssue, setEditingIssue] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [mapSearch, setMapSearch] = useState('');
    const [mapFilter, setMapFilter] = useState('Toate');
    const [submitting, setSubmitting] = useState(false);
    const [editLocation, setEditLocation] = useState(null);

    const { user, getToken } = useAuth();
    const useMock = import.meta.env.VITE_USE_MOCK === 'true';

    const { toast, showToast } = useToast({ duration: 3200 });
    const { form, setForm, step, setStep, formErrors, setFormErrors, validate, nextStep, prevStep, resetForm } = useIssueForm();
    const {
        issues: allIssues,
        myIssues,
        isLoading,
        votedIssues,
        loadIssues,
        createIssue,
        updateIssue,
        deleteIssue,
        voteIssue,
        setIssues,
        setMyIssues,
    } = useIssues({
        apiClient,
        user,
        getToken,
        useMock,
        mockIssues: MOCK_MY_ISSUES,
        loadMyIssues: true,
    });

    useEffect(() => {
        const load = async () => {
            try {
                await loadIssues();
            } catch {
                showToast('Eroare la încărcare date.', 'error');
            }
        };
        load();
    }, [loadIssues, showToast]);

    const resolveSubmitErrorMessage = (error) => {
        const status = error?.response?.status;
        const apiMessage = error?.response?.data?.error;

        if (status === 401) {
            return 'Sesiunea a expirat. Te rugăm să te autentifici din nou.';
        }

        if (status === 400 && apiMessage) {
            return `Date invalide: ${apiMessage}`;
        }

        if (apiMessage) return apiMessage;
        return 'Eroare la trimitere. Încearcă din nou.';
    };

    const handleSubmit = async (e) => {
        e?.preventDefault?.();
        const errs = validate();
        if (Object.keys(errs).length) return setFormErrors(errs);
        setSubmitting(true);
        try {
            await createIssue(form);
            showToast('Sesizare trimisă cu succes! ✓', 'success');
            resetForm();
            setTab('my');
        } catch (error) {
            showToast(resolveSubmitErrorMessage(error), 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const openEdit = (issue) => { setEditingIssue({ ...issue }); setEditLocation({ lat: issue.lat, lng: issue.lng }); };
    const saveEdit = async () => {
        if (!editingIssue.title.trim() || !editingIssue.description.trim()) return showToast('Completează titlul și descrierea.', 'error');
        const updated = { ...editingIssue, lat: editLocation?.lat ?? editingIssue.lat, lng: editLocation?.lng ?? editingIssue.lng };
        try {
            await updateIssue(updated.id, updated);
            if (!useMock) {
                setIssues((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
                setMyIssues((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
            }
        } catch {
            return showToast('Eroare la actualizare.', 'error');
        }
        showToast('Sesizare actualizată! ✓', 'success');
        setEditingIssue(null);
        setEditLocation(null);
    };

    const confirmDelete = async (id) => {
        try {
            await deleteIssue(id);
            if (!useMock) {
                setIssues((prev) => prev.filter((i) => i.id !== id));
                setMyIssues((prev) => prev.filter((i) => i.id !== id));
            }
        } catch {
            return showToast('Eroare la ștergere.', 'error');
        }
        showToast('Sesizare ștearsă.', 'success');
        setDeleteConfirm(null);
    };

    const handleVote = async (id, e) => {
        e?.stopPropagation();
        if (!user) return showToast('Trebuie să fii logat pentru a vota!', 'error');
        try {
            await voteIssue(id);
            showToast('Vot înregistrat! ▲', 'success');
        } catch {
            showToast('Ai votat deja!', 'error');
        }
    };

    const filteredForMap = useMemo(() => allIssues.filter((i) => (mapFilter === 'Toate' || i.status === mapFilter) && (!mapSearch || i.title?.toLowerCase().includes(mapSearch.toLowerCase())) && i.lat && i.lng), [allIssues, mapFilter, mapSearch]);

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
                {tab === 'my' && <div className="ci-my-section"><MyIssuesPanel isLoading={isLoading} myIssues={myIssues} onSelectIssue={setSelectedIssue} onStartNew={() => { setTab('new'); setStep(1); }} onVote={handleVote} votedIssues={votedIssues} onEdit={openEdit} onDelete={setDeleteConfirm} categories={CATEGORIES} priorities={PRIORITIES} renderStatusBadge={(status) => <StatusBadge status={status} />} /></div>}
                {tab === 'new' && <NewIssueStepper step={step} form={form} formErrors={formErrors} setForm={setForm} setFormErrors={setFormErrors} onBack={prevStep} onNext={nextStep} onSubmit={handleSubmit} submitting={submitting} validate={validate} categories={CATEGORIES} priorities={PRIORITIES} mapCenter={GALATI_CENTER} selectedIcon={SELECTED_ICON} />}
                {tab === 'map' && <IssuesMapPanel mapSearch={mapSearch} onMapSearchChange={setMapSearch} mapFilter={mapFilter} onMapFilterChange={setMapFilter} filteredForMap={filteredForMap} onSelectIssue={setSelectedIssue} selectedIssueId={selectedIssue?.id} categories={CATEGORIES} renderStatusBadge={(status) => <StatusBadge status={status} />} mapCenter={GALATI_CENTER} />}
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
