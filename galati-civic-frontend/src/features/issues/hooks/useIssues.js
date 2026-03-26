import { useCallback, useState } from 'react';

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
            setIssues(allRes.data);
            setMyIssues(mineRes.data);
            return { issues: allRes.data, myIssues: mineRes.data };
        } catch (error) {
            onError?.(error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, [apiClient, apiUrl, authHeaders, loadMyIssues, mockIssues, onError, useMock]);

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

        return response.data;
    }, [apiClient, apiUrl, authHeaders, loadMyIssues, useMock, user?.id]);

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
