import React from 'react';

const IssueTabs = ({ tab, myIssuesCount, allIssuesCount, onSelectMy, onSelectNew, onSelectMap }) => (
    <div className="ci-tabs-wrap">
        <div className="ci-tabs">
            <button className={`ci-tab ${tab === 'my' ? 'active' : ''}`} onClick={onSelectMy}>
                📋 Sesizările mele
                {myIssuesCount > 0 && <span className="ci-tab-count">{myIssuesCount}</span>}
            </button>
            <button className={`ci-tab ${tab === 'new' ? 'active' : ''}`} onClick={onSelectNew}>
                ✚ Sesizare nouă
            </button>
            <button className={`ci-tab ${tab === 'map' ? 'active' : ''}`} onClick={onSelectMap}>
                🗺 Hartă sesizări
                <span className="ci-tab-count">{allIssuesCount}</span>
            </button>
        </div>
    </div>
);

export default IssueTabs;
