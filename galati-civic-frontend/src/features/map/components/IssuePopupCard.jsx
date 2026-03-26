import React from 'react';

const IssuePopupCard = ({ issue, onOpenDetails, onVote }) => (
    <div className="map-popup">
        <strong>{issue.title}</strong>
        <p>{issue.description?.substring(0, 100)}{issue.description?.length > 100 ? '...' : ''}</p>
        <div className="popup-footer">
            <span className="popup-votes">▲ {issue.votes || 0} voturi</span>
            <div style={{ display: 'flex', gap: '8px' }}>
                {onVote && <button onClick={() => onVote(issue.id)} className="popup-detail-btn">Votează</button>}
                {onOpenDetails && <button onClick={() => onOpenDetails(issue)} className="popup-detail-btn">Detalii →</button>}
            </div>
        </div>
    </div>
);

export default IssuePopupCard;
