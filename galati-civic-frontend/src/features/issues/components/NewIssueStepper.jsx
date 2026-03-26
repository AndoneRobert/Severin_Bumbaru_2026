import React from 'react';
import BaseMap from '../../map/components/BaseMap';
import LocationPickerLayer from '../../map/components/LocationPickerLayer';

const NewIssueStepper = ({
    step,
    form,
    formErrors,
    setForm,
    setFormErrors,
    onBack,
    onNext,
    onSubmit,
    submitting,
    validate,
    categories,
    priorities,
    mapCenter,
    selectedIcon,
}) => (
    <div className="ci-new-section">
        <div className="ci-stepper">
            <div className={`ci-step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'done' : ''}`}><div className="ci-step-num">{step > 1 ? '✓' : '1'}</div><span>Locație</span></div>
            <div className="ci-step-line" />
            <div className={`ci-step ${step >= 2 ? 'active' : ''} ${step > 2 ? 'done' : ''}`}><div className="ci-step-num">{step > 2 ? '✓' : '2'}</div><span>Detalii</span></div>
            <div className="ci-step-line" />
            <div className={`ci-step ${step >= 3 ? 'active' : ''}`}><div className="ci-step-num">3</div><span>Confirmare</span></div>
        </div>

        {step === 1 && (
            <div className="ci-card">
                <div className="ci-card-header"><span className="ci-card-icon">📍</span><div><h2>Selectează locația problemei</h2><p>Click pe hartă exact unde se află problema</p></div></div>
                {formErrors.location && <div className="ci-err">{formErrors.location}</div>}
                <div className="ci-map-pick">
                    <BaseMap center={mapCenter} zoom={14} style={{ height: '420px', width: '100%' }} attribution="&copy; OpenStreetMap">
                        <LocationPickerLayer location={form.lat && form.lng ? [form.lat, form.lng] : null} icon={selectedIcon} onPickLocation={(latlng) => setForm((f) => ({ ...f, lat: latlng.lat, lng: latlng.lng }))} />
                    </BaseMap>
                </div>
                {form.lat && form.lng ? (
                    <div className="ci-loc-confirm"><span>✓ Locație selectată: {form.lat.toFixed(5)}, {form.lng.toFixed(5)}</span><button className="ci-change-loc" onClick={() => setForm((f) => ({ ...f, lat: null, lng: null }))}>Schimbă</button></div>
                ) : <div className="ci-loc-hint">👆 Click pe hartă pentru a plasa marcatorul</div>}
                <div className="ci-step-btns"><button className="ci-btn-primary" disabled={!form.lat || !form.lng} onClick={onNext}>Continuă →</button></div>
            </div>
        )}

        {step === 2 && (
            <div className="ci-card">
                <div className="ci-card-header"><span className="ci-card-icon">📝</span><div><h2>Detalii sesizare</h2><p>Descrie problema cât mai clar posibil</p></div></div>
                <div className="ci-form">
                    <div className="ci-field"><label>Titlu sesizare <span className="ci-req">*</span></label><input type="text" value={form.title} onChange={(e) => { setForm((f) => ({ ...f, title: e.target.value })); setFormErrors((fe) => ({ ...fe, title: '' })); }} maxLength={100} className={formErrors.title ? 'ci-input-err' : ''} /><div className="ci-field-foot">{formErrors.title && <span className="ci-field-err">{formErrors.title}</span>}<span className="ci-char-count">{form.title.length}/100</span></div></div>
                    <div className="ci-field"><label>Descriere detaliată <span className="ci-req">*</span></label><textarea value={form.description} onChange={(e) => { setForm((f) => ({ ...f, description: e.target.value })); setFormErrors((fe) => ({ ...fe, description: '' })); }} rows={4} maxLength={600} className={formErrors.description ? 'ci-input-err' : ''} /><div className="ci-field-foot">{formErrors.description && <span className="ci-field-err">{formErrors.description}</span>}<span className="ci-char-count">{form.description.length}/600</span></div></div>
                    <div className="ci-field"><label>Categorie</label><div className="ci-cat-grid">{categories.map((cat) => <button key={cat.value} type="button" className={`ci-cat-btn ${form.category === cat.value ? 'active' : ''}`} onClick={() => setForm((f) => ({ ...f, category: cat.value }))}><span className="ci-cat-icon">{cat.label.split(' ')[0]}</span><span className="ci-cat-name">{cat.value}</span><span className="ci-cat-desc">{cat.desc}</span></button>)}</div></div>
                    <div className="ci-field"><label>Prioritate</label><div className="ci-priority-row">{priorities.map((p) => <button key={p.value} type="button" className={`ci-prio-btn ${form.priority === p.value ? 'active' : ''}`} style={{ '--prio-color': p.color }} onClick={() => setForm((f) => ({ ...f, priority: p.value }))}><span className="ci-prio-dot" style={{ background: p.color }} /><div><div className="ci-prio-name">{p.value}</div><div className="ci-prio-desc">{p.desc}</div></div></button>)}</div></div>
                    <div className="ci-loc-preview">📍 Locație: {form.lat?.toFixed(5)}, {form.lng?.toFixed(5)}<button type="button" className="ci-change-loc" onClick={onBack}>Schimbă</button></div>
                    <div className="ci-step-btns"><button className="ci-btn-secondary" onClick={onBack}>← Înapoi</button><button className="ci-btn-primary" onClick={() => { const errs = validate(); if (Object.keys(errs).length) { setFormErrors(errs); return; } setFormErrors({}); onNext(); }}>Continuă →</button></div>
                </div>
            </div>
        )}

        {step === 3 && (
            <div className="ci-card">
                <div className="ci-card-header"><span className="ci-card-icon">✅</span><div><h2>Confirmă sesizarea</h2><p>Verifică detaliile înainte de trimitere</p></div></div>
                <div className="ci-preview-box">
                    <div className="ci-preview-row"><span className="ci-preview-lbl">Titlu</span><span className="ci-preview-val">{form.title}</span></div>
                    <div className="ci-preview-row"><span className="ci-preview-lbl">Descriere</span><span className="ci-preview-val">{form.description}</span></div>
                    <div className="ci-preview-row"><span className="ci-preview-lbl">Categorie</span><span className="ci-preview-val">{categories.find((c) => c.value === form.category)?.label}</span></div>
                    <div className="ci-preview-row"><span className="ci-preview-lbl">Prioritate</span><span className="ci-preview-val" style={{ color: priorities.find((p) => p.value === form.priority)?.color }}>● {form.priority}</span></div>
                    <div className="ci-preview-row"><span className="ci-preview-lbl">Locație</span><span className="ci-preview-val">📍 {form.lat?.toFixed(5)}, {form.lng?.toFixed(5)}</span></div>
                </div>
                <div className="ci-info-box"><span>🏛️</span><p>Sesizarea ta va fi transmisă Primăriei Galați și va apărea pe hartă pentru a putea fi susținută de cetățeni.</p></div>
                <div className="ci-step-btns"><button className="ci-btn-secondary" onClick={onBack}>← Înapoi</button><button className="ci-btn-primary ci-submit-btn" onClick={onSubmit} disabled={submitting}>{submitting ? <><span className="ci-spin" /> Se trimite...</> : '📤 Trimite sesizarea'}</button></div>
            </div>
        )}
    </div>
);

export default NewIssueStepper;
