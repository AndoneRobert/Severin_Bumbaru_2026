import React from 'react';
import BaseMap from '../../map/components/BaseMap';
import LocationPickerLayer from '../../map/components/LocationPickerLayer';

const IssueEditModal = ({
    editingIssue,
    onClose,
    onChange,
    categories,
    priorities,
    editLocation,
    onLocationPick,
    onSave,
    selectedIcon,
}) => {
    if (!editingIssue) return null;

    return (
        <div className="ci-overlay" onClick={onClose}>
            <div className="ci-modal ci-modal-lg" onClick={(e) => e.stopPropagation()}>
                <div className="ci-modal-header">
                    <div className="ci-modal-title-wrap"><span className="ci-modal-cat-icon">✏️</span><div><div className="ci-modal-title">Editează sesizarea</div><div className="ci-modal-sub">#{editingIssue.id}</div></div></div>
                    <button className="ci-modal-close" onClick={onClose}>✕</button>
                </div>
                <div className="ci-modal-body">
                    <div className="ci-form">
                        <div className="ci-field"><label>Titlu</label><input type="text" value={editingIssue.title} onChange={(e) => onChange('title', e.target.value)} maxLength={100} /></div>
                        <div className="ci-field"><label>Descriere</label><textarea value={editingIssue.description} onChange={(e) => onChange('description', e.target.value)} rows={4} maxLength={600} /></div>
                        <div className="ci-field-row">
                            <div className="ci-field"><label>Categorie</label><select value={editingIssue.category} onChange={(e) => onChange('category', e.target.value)}>{categories.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}</select></div>
                            <div className="ci-field"><label>Prioritate</label><select value={editingIssue.priority} onChange={(e) => onChange('priority', e.target.value)}>{priorities.map((p) => <option key={p.value} value={p.value}>{p.value}</option>)}</select></div>
                        </div>
                        <div className="ci-field">
                            <label>Locație (click pe hartă pentru a schimba)</label>
                            <div style={{ borderRadius: '10px', overflow: 'hidden', height: '260px' }}>
                                <BaseMap center={[editLocation?.lat ?? editingIssue.lat, editLocation?.lng ?? editingIssue.lng]} zoom={15} style={{ height: '100%', width: '100%' }}>
                                    <LocationPickerLayer location={[editLocation?.lat ?? editingIssue.lat, editLocation?.lng ?? editingIssue.lng]} onPickLocation={onLocationPick} icon={selectedIcon} />
                                </BaseMap>
                            </div>
                        </div>
                    </div>
                    <div className="ci-modal-actions" style={{ marginTop: '16px' }}><button className="ci-btn-secondary" onClick={onClose}>Anulează</button><button className="ci-btn-primary" onClick={onSave}>💾 Salvează modificările</button></div>
                </div>
            </div>
        </div>
    );
};

export default IssueEditModal;
