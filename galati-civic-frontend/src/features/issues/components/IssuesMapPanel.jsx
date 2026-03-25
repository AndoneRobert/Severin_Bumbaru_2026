import React from 'react';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';

const IssuesMapPanel = ({
    mapSearch,
    onMapSearchChange,
    mapFilter,
    onMapFilterChange,
    filteredForMap,
    onSelectIssue,
    selectedIssue,
    categories,
    StatusBadge,
    statusIcons,
    defaultIcon,
    mapCenter,
    MapPicker,
}) => (
    <div className="ci-map-section">
        <div className="ci-map-controls">
            <div className="ci-map-search-wrap"><span>🔍</span><input type="text" placeholder="Caută sesizări pe hartă..." value={mapSearch} onChange={(e) => onMapSearchChange(e.target.value)} className="ci-map-search" /></div>
            <div className="ci-map-filters">{['Toate', 'Nou', 'În lucru', 'Rezolvat'].map((s) => <button key={s} className={`ci-map-filter-btn ${mapFilter === s ? 'active' : ''}`} onClick={() => onMapFilterChange(s)}>{s}</button>)}</div>
            <span className="ci-map-count">{filteredForMap.length} sesizări pe hartă</span>
        </div>

        <div className="ci-map-layout">
            <div className="ci-map-container">
                <MapContainer center={mapCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
                    <MapPicker editMode={false} onPick={() => { }} />
                    {filteredForMap.map((issue) => (
                        <Marker key={issue.id} position={[issue.lat, issue.lng]} icon={statusIcons[issue.status] || defaultIcon} eventHandlers={{ click: () => onSelectIssue(issue) }}>
                            <Popup maxWidth={220}>
                                <div className="ci-map-popup">
                                    <strong>{issue.title}</strong>
                                    <div style={{ display: 'flex', gap: '6px', margin: '6px 0', flexWrap: 'wrap' }}><StatusBadge status={issue.status} /></div>
                                    <p>{issue.description?.substring(0, 80)}...</p>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '8px', marginTop: '6px' }}>
                                        <span style={{ fontSize: '12px', color: '#64748b' }}>▲ {issue.votes || 0} voturi</span>
                                        <button style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }} onClick={() => onSelectIssue(issue)}>Detalii →</button>
                                    </div>
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>
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
                        <div key={issue.id} className={`ci-sidebar-item ${selectedIssue?.id === issue.id ? 'active' : ''}`} onClick={() => onSelectIssue(issue)}>
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
