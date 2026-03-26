import React from 'react';
import BaseMap from '../../map/components/BaseMap';
import IssueMarkersLayer from '../../map/components/IssueMarkersLayer';

const IssuesMapPanel = ({
    mapSearch,
    onMapSearchChange,
    mapFilter,
    onMapFilterChange,
    filteredForMap,
    onSelectIssue,
    selectedIssueId,
    categories,
    StatusBadge,
    mapCenter,
    onVote,
}) => (
    <div className="ci-map-section">
        <div className="ci-map-controls">
            <div className="ci-map-search-wrap"><span>🔍</span><input type="text" placeholder="Caută sesizări pe hartă..." value={mapSearch} onChange={(e) => onMapSearchChange(e.target.value)} className="ci-map-search" /></div>
            <div className="ci-map-filters">{['Toate', 'Nou', 'În lucru', 'Rezolvat'].map((s) => <button key={s} className={`ci-map-filter-btn ${mapFilter === s ? 'active' : ''}`} onClick={() => onMapFilterChange(s)}>{s}</button>)}</div>
            <span className="ci-map-count">{filteredForMap.length} sesizări pe hartă</span>
        </div>

        <div className="ci-map-layout">
            <div className="ci-map-container">
                <BaseMap center={mapCenter} zoom={13} style={{ height: '100%', width: '100%' }} attribution="&copy; OpenStreetMap">
                    <IssueMarkersLayer
                        issues={filteredForMap}
                        selectedIssueId={selectedIssueId}
                        onSelectIssue={onSelectIssue}
                        onVote={onVote}
                        popupMaxWidth={220}
                        renderPopup={(issue) => (
                            <div className="ci-map-popup">
                                <div className="ci-map-popup-top">
                                    <div className="ci-map-popup-icon">{categories.find((c) => c.value === issue.category)?.label?.split(' ')[0] || '📋'}</div>
                                    <div className="ci-map-popup-meta">
                                        <span className="ci-map-popup-category">{issue.category || 'General'}</span>
                                        <StatusBadge status={issue.status} />
                                    </div>
                                </div>
                                <strong>{issue.title}</strong>
                                <p>{issue.description ? `${issue.description.substring(0, 110)}${issue.description.length > 110 ? '...' : ''}` : 'Fără descriere disponibilă.'}</p>
                                <div className="ci-map-popup-footer">
                                    <span className="ci-map-popup-votes">▲ {issue.votes || 0} voturi</span>
                                    <button className="ci-map-popup-btn" onClick={() => onSelectIssue(issue)}>Detalii →</button>
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
                <div className="ci-sidebar-header">Sesizări ({filteredForMap.length})</div>
                <div className="ci-sidebar-list">
                    {filteredForMap.map((issue) => (
                        <div key={issue.id} className={`ci-sidebar-item ${selectedIssueId === issue.id ? 'active' : ''}`} onClick={() => onSelectIssue(issue)}>
                            <div className="ci-si-top"><span className="ci-si-icon">{categories.find((c) => c.value === issue.category)?.label?.split(' ')[0] || '📋'}</span><StatusBadge status={issue.status} /></div>
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
