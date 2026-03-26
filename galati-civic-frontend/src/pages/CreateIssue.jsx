import React from 'react';
import CreateIssueContainer from '../features/issues/CreateIssueContainer';
import styles from './CreateIssue.module.css';

const CreateIssue = () => (
    <div className={styles.page}>
        <CreateIssueContainer />
    </div>
);

export default CreateIssue;