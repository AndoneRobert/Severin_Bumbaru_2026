import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import { getIssueIcon } from '../utils/mapIcons';
import IssuePopupCard from './IssuePopupCard';

const getPosition = (issue) => {
    const lat = issue.lat ?? issue.latitude;
    const lng = issue.lng ?? issue.longitude;
    if (!lat || !lng) return null;
    return [lat, lng];
};

const IssueMarkersLayer = ({
    issues = [],
    selectedIssueId,
    onSelectIssue,
    onVote,
    popupMaxWidth = 240,
    renderPopup,
    showPopup = true,
}) => (
    <>
        {issues.map((issue) => {
            const position = getPosition(issue);
            if (!position) return null;

            return (
                <Marker
                    key={issue.id}
                    position={position}
                    icon={getIssueIcon(issue.status, issue.id === selectedIssueId)}
                    eventHandlers={onSelectIssue ? { click: () => onSelectIssue(issue) } : undefined}
                >
                    {showPopup && (
                        <Popup maxWidth={popupMaxWidth}>
                            {renderPopup ? (
                                renderPopup(issue)
                            ) : (
                                <IssuePopupCard issue={issue} onOpenDetails={onSelectIssue} onVote={onVote} />
                            )}
                        </Popup>
                    )}
                </Marker>
            );
        })}
    </>
);

export default IssueMarkersLayer;
