import React from 'react';

const MyIssuesPanel = ({
    isLoading,
    myIssues,
    onSelectIssue,
    onStartNew,
    onVote,
    votedIssues,
    onEdit,
    onDelete,
    categories,
    priorities,
    StatusBadge,
}) => {
    if (isLoading) {
        return (
            <div className="ci-loading">
                <div className="ci-spinner" />
                <p>Se încarcă sesizările...</p>
            </div>
        );
    }

    if (myIssues.length === 0) {
        return (
            <div className="ci-empty">
                <div className="ci-empty-icon">📭</div>
                <h3>Nu ai sesizări încă</h3>
                <p>Fii primul care semnalează o problemă în cartierul tău!</p>
                <button className="ci-btn-primary" onClick={onStartNew}>
                    ✚ Adaugă prima sesizare
                </button>
            </div>
        );
    }

    return (
        <>
            <div className="ci-my-header">
                <h2>Sesizările tale ({myIssues.length})</h2>
                <button className="ci-btn-primary ci-btn-sm" onClick={onStartNew}>
                    ✚ Sesizare nouă
                </button>
            </div>
            <div className="ci-my-grid">
                {myIssues.map((issue) => (
                    <div key={issue.id} className="ci-issue-card" onClick={() => onSelectIssue(issue)}>
                        <div className="ci-ic-top">
                            <div className="ci-ic-cat">
                                {categories.find((c) => c.value === issue.category)?.label?.split(' ')[0] || '📋'}
                            </div>
                            <StatusBadge status={issue.status} />
                        </div>
                        <h3 className="ci-ic-title">{issue.title}</h3>
                        <p className="ci-ic-desc">{issue.description?.substring(0, 90)}{issue.description?.length > 90 ? '...' : ''}</p>
                        <div className="ci-ic-meta">
                            <span className="ci-ic-cat-label">{issue.category}</span>
                            <span className="ci-ic-priority" style={{ color: priorities.find((p) => p.value === issue.priority)?.color || '#94a3b8' }}>
                                ● {issue.priority}
                            </span>
                            <span className="ci-ic-date">
                                {issue.created_at ? new Date(issue.created_at).toLocaleDateString('ro-RO') : ''}
                            </span>
                        </div>
                        <div className="ci-ic-footer" onClick={(e) => e.stopPropagation()}>
                            <button
                                className={`ci-vote-btn ${votedIssues.has(issue.id) ? 'voted' : ''}`}
                                onClick={(e) => onVote(issue.id, e)}
                                title="Susțin sesizarea"
                            >
                                ▲ {issue.votes || 0} voturi
                            </button>
                            <div className="ci-ic-actions">
                                <button
                                    className="ci-action-btn ci-edit-btn"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onEdit(issue);
                                    }}
                                    title="Editează sesizarea"
                                >
                                    ✏️ Editează
                                </button>
                                <button
                                    className="ci-action-btn ci-delete-btn"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDelete(issue.id);
                                    }}
                                    title="Șterge sesizarea"
                                >
                                    🗑️ Șterge
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
};

export default MyIssuesPanel;
