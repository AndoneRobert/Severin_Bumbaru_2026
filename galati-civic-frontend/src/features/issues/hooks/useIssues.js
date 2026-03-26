import { useCallback, useState } from 'react';

const OWNED_ISSUES_KEY_PREFIX = 'galati_civic_owned_issue_ids';

const getOwnedIssuesStorageKey = (user) => {
    const owner = user?.id || user?.email;
    return owner ? `${OWNED_ISSUES_KEY_PREFIX}:${owner}` : null;
};

const loadOwnedIssueIds = (user) => {
    if (typeof window === 'undefined') return new Set();
    const key = getOwnedIssuesStorageKey(user);
    if (!key) return new Set();
    try {
        const value = window.localStorage.getItem(key);
        const parsed = value ? JSON.parse(value) : [];
        return new Set(Array.isArray(parsed) ? parsed : []);
    } catch {
        return new Set();
    }
};

const persistOwnedIssueId = (user, issueId) => {
    if (typeof window === 'undefined' || issueId == null) return;
    const key = getOwnedIssuesStorageKey(user);
    if (!key) return;
    const next = loadOwnedIssueIds(user);
    next.add(issueId);
    window.localStorage.setItem(key, JSON.stringify([...next]));
};

const isIssueOwnedByUser = (issue, user, storedOwnedIssueIds = new Set()) => {
    if (!issue || !user) return false;
    if (issue.isOwn === true) return true;
    if (storedOwnedIssueIds.has(issue.id)) return true;

    const userId = user.id;
    const userEmail = user.email?.toLowerCase?.();

    const issueOwnerId = issue.user_id
        ?? issue.userId
        ?? issue.owner_id
        ?? issue.ownerId
        ?? issue.profile_id
        ?? issue.profileId
        ?? issue.author_id
        ?? issue.authorId
        ?? issue.created_by
        ?? issue.created_by_id;

    if (userId && issueOwnerId && String(issueOwnerId) === String(userId)) return true;

    const issueOwnerEmail = issue.user_email
        ?? issue.userEmail
        ?? issue.email
        ?? issue.owner_email
        ?? issue.ownerEmail
        ?? issue.reporter_email
        ?? issue.reporterEmail
        ?? issue.created_by_email
        ?? issue.createdByEmail;

    return !!(userEmail && issueOwnerEmail && String(issueOwnerEmail).toLowerCase() === userEmail);
};

export const useIssues = ({
    apiClient,
    user,
    getToken,
    apiUrl,
    useMock = false,
    mockIssues = [],
    loadMyIssues = false,
    onError,
}) => {
    const [issues, setIssues] = useState([]);
    const [myIssues, setMyIssues] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [votedIssues, setVotedIssues] = useState(new Set());

    const authHeaders = useCallback(async () => {
        const token = (await getToken?.()) || user?.token;
        return token ? { headers: { Authorization: `Bearer ${token}` } } : undefined;
    }, [getToken, user?.token]);

    const loadIssues = useCallback(async () => {
        setIsLoading(true);
        try {
            if (useMock) {
                setIssues([...mockIssues]);
                if (loadMyIssues) setMyIssues([...mockIssues]);
                return { issues: mockIssues, myIssues: loadMyIssues ? mockIssues : [] };
            }

            const allReq = apiClient.get(`${apiUrl}/issues`);
            if (!loadMyIssues) {
                const allRes = await allReq;
                setIssues(allRes.data);
                return { issues: allRes.data, myIssues: [] };
            }

            const [allRes, mineRes] = await Promise.all([
                allReq,
                apiClient.get(`${apiUrl}/issues/my`, await authHeaders()),
            ]);
            const ownedIssueIds = loadOwnedIssueIds(user);
            const myIssuesFromMineEndpoint = (mineRes.data || []).filter((issue) => isIssueOwnedByUser(issue, user, ownedIssueIds));
            const myIssuesFromAllIssues = (allRes.data || []).filter((issue) => isIssueOwnedByUser(issue, user, ownedIssueIds));

            setIssues(allRes.data);
            setMyIssues(myIssuesFromMineEndpoint.length > 0 ? myIssuesFromMineEndpoint : myIssuesFromAllIssues);
            return { issues: allRes.data, myIssues: myIssuesFromMineEndpoint.length > 0 ? myIssuesFromMineEndpoint : myIssuesFromAllIssues };
        } catch (error) {
            onError?.(error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, [apiClient, apiUrl, authHeaders, loadMyIssues, mockIssues, onError, useMock, user]);

    const createIssue = useCallback(async (payload) => {
        if (useMock) {
            const newIssue = {
                id: Date.now(),
                ...payload,
                votes: 0,
                status: 'Nou',
                created_at: new Date().toISOString(),
                isOwn: true,
            };
            setIssues((prev) => [newIssue, ...prev]);
            if (loadMyIssues) setMyIssues((prev) => [newIssue, ...prev]);
            return newIssue;
        }

        const response = await apiClient.post(
            `${apiUrl}/issues`,
            { ...payload, user_id: user?.id ?? null },
            await authHeaders(),
        );

        persistOwnedIssueId(user, response.data?.id);
        return response.data;
    }, [apiClient, apiUrl, authHeaders, loadMyIssues, useMock, user]);

    const updateIssue = useCallback(async (issueId, payload) => {
        if (useMock) {
            setIssues((prev) => prev.map((issue) => (issue.id === issueId ? { ...issue, ...payload } : issue)));
            if (loadMyIssues) setMyIssues((prev) => prev.map((issue) => (issue.id === issueId ? { ...issue, ...payload } : issue)));
            return;
        }

        await apiClient.put(`${apiUrl}/issues/${issueId}`, payload, await authHeaders());
    }, [apiClient, apiUrl, authHeaders, loadMyIssues, useMock]);

    const deleteIssue = useCallback(async (issueId) => {
        if (useMock) {
            setIssues((prev) => prev.filter((issue) => issue.id !== issueId));
            if (loadMyIssues) setMyIssues((prev) => prev.filter((issue) => issue.id !== issueId));
            return;
        }

        await apiClient.delete(`${apiUrl}/issues/${issueId}`, await authHeaders());
    }, [apiClient, apiUrl, authHeaders, loadMyIssues, useMock]);

    const voteIssue = useCallback(async (issueId) => {
        if (votedIssues.has(issueId)) {
            const duplicateError = new Error('ALREADY_VOTED');
            duplicateError.code = 'ALREADY_VOTED';
            throw duplicateError;
        }

        if (useMock) {
            setIssues((prev) => prev.map((issue) => (issue.id === issueId ? { ...issue, votes: (issue.votes || 0) + 1 } : issue)));
            if (loadMyIssues) setMyIssues((prev) => prev.map((issue) => (issue.id === issueId ? { ...issue, votes: (issue.votes || 0) + 1 } : issue)));
            setVotedIssues((prev) => new Set([...prev, issueId]));
            return;
        }

        await apiClient.post(`${apiUrl}/issues/${issueId}/vote`, {}, await authHeaders());
        setVotedIssues((prev) => new Set([...prev, issueId]));
    }, [apiClient, apiUrl, authHeaders, loadMyIssues, useMock, votedIssues]);

    return {
        issues,
        setIssues,
        myIssues,
        setMyIssues,
        isLoading,
        votedIssues,
        setVotedIssues,
        loadIssues,
        createIssue,
        updateIssue,
        deleteIssue,
        voteIssue,
    };
};

export default useIssues;
