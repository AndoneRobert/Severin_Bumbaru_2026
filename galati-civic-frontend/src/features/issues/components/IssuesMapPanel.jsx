import React from 'react';
import BaseMap from '../../map/components/BaseMap';
import IssueMarkersLayer from '../../map/components/IssueMarkersLayer';

const IssuesMapPanel = (props) => (
    <div className="ci-map-section">
        <div className="ci-map-controls">
            <div className="ci-map-search-wrap"><span>🔍</span><input type="text" placeholder="Caută sesizări pe hartă..." value={props.mapSearch} onChange={(e) => props.onMapSearchChange(e.target.value)} className="ci-map-search" /></div>
            <div className="ci-map-filters">{['Toate', 'Nou', 'În lucru', 'Rezolvat'].map((s) => <button key={s} className={`ci-map-filter-btn ${props.mapFilter === s ? 'active' : ''}`} onClick={() => props.onMapFilterChange(s)}>{s}</button>)}</div>
            <span className="ci-map-count">{props.filteredForMap.length} sesizări pe hartă</span>
        </div>

        <div className="ci-map-layout">
            <div className="ci-map-container">
                <BaseMap center={props.mapCenter} zoom={13} style={{ height: '100%', width: '100%' }} attribution="&copy; OpenStreetMap">
                    <IssueMarkersLayer
                        issues={props.filteredForMap}
                        selectedIssueId={props.selectedIssueId}
                        onSelectIssue={props.onSelectIssue}
                        onVote={props.onVote}
                        popupMaxWidth={220}
                        renderPopup={(issue) => (
                            <div className="ci-map-popup">
                                <div className="ci-map-popup-top">
                                    <div className="ci-map-popup-icon">{props.categories.find((c) => c.value === issue.category)?.label?.split(' ')[0] || '📋'}</div>
                                    <div className="ci-map-popup-meta">
                                        <span className="ci-map-popup-category">{issue.category || 'General'}</span>
                                        <props.StatusBadge status={issue.status} />
                                    </div>
                                </div>
                                <strong>{issue.title}</strong>
                                <p>{issue.description ? `${issue.description.substring(0, 110)}${issue.description.length > 110 ? '...' : ''}` : 'Fără descriere disponibilă.'}</p>
                                <div className="ci-map-popup-footer">
                                    <span className="ci-map-popup-votes">▲ {issue.votes || 0} voturi</span>
                                    <button className="ci-map-popup-btn" onClick={() => props.onSelectIssue(issue)}>Detalii →</button>
                                </div>
                            </div>
                        )}
                    />
                </BaseMap>
                <div className="ci-map-legend">
                    <span className="ci-leg-item"><span style={{ background: '#ef4444' }} className="ci-leg-dot" />Nou</span>
                    <span className="ci-leg-item"><span style={{ background: '#f59e0b' }} className="ci-leg-dot" />În lucru</span>
                    <span className="ci-leg-item"><span style={{ background: '#3b82f6' }} className="ci-leg-dot" />Verificare</span>
                    <span className="ci-leg-item"><span style={{ background: '#10b981' }} className="ci-leg-dot" />Rezolvat</span>
                    <span className="ci-leg-item"><span style={{ background: '#a855f7' }} className="ci-leg-dot" />Selectat</span>
                </div>
            </div>

            <div className="ci-map-sidebar">
                <div className="ci-sidebar-header">Sesizări ({props.filteredForMap.length})</div>
                <div className="ci-sidebar-list">
                    {props.filteredForMap.map((issue) => (
                        <div key={issue.id} className={`ci-sidebar-item ${props.selectedIssueId === issue.id ? 'active' : ''}`} onClick={() => props.onSelectIssue(issue)}>
                            <div className="ci-si-top"><span className="ci-si-icon">{props.categories.find((c) => c.value === issue.category)?.label?.split(' ')[0] || '📋'}</span><props.StatusBadge status={issue.status} /></div>
                            <div className="ci-si-title">{issue.title}</div>
                            <div className="ci-si-meta"><span>{issue.category}</span><span>▲ {issue.votes || 0}</span></div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </div>
);

export default IssuesMapPanel;
