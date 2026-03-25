import React from 'react';

const IssueDeleteConfirm = ({ deleteId, onCancel, onConfirm }) => {
    if (!deleteId) return null;

    return (
        <div className="ci-overlay" onClick={onCancel}>
            <div className="ci-confirm-modal" onClick={(e) => e.stopPropagation()}>
                <div className="ci-confirm-icon">🗑️</div>
                <h3>Ștergi sesizarea?</h3>
                <p>Această acțiune este permanentă și nu poate fi anulată.</p>
                <div className="ci-confirm-btns">
                    <button className="ci-btn-secondary" onClick={onCancel}>Anulează</button>
                    <button className="ci-btn-danger" onClick={() => onConfirm(deleteId)}>Da, șterge</button>
                </div>
            </div>
        </div>
    );
};

export default IssueDeleteConfirm;
