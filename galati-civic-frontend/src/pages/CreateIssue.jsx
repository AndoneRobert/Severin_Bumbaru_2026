import React from 'react';
import CreateIssueContainer from '../features/issues/CreateIssueContainer';
import styles from './CreateIssue.module.css';

const CreateIssue = ({ initialTab = 'my' }) => (
    <div className={styles.page}>
        <CreateIssueContainer initialTab={initialTab} />
    </div>
);

export default CreateIssue;
