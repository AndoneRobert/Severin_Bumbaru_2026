import { apiClient, authConfig, resolveData } from './apiClient';

const normalizeIssue = (issue) => {
    if (!issue || typeof issue !== 'object') return issue;
    return {
        ...issue,
        id: issue.id ?? issue._id,
        votes: Number.isFinite(issue.votes) ? issue.votes : Number(issue.votes || 0),
        admin_reply: issue.admin_reply ?? issue.adminReply ?? null,
    };
};

const normalizeIssueCollection = (payload) => {
    const items = resolveData(payload);
    if (!Array.isArray(items)) return [];
    return items.map(normalizeIssue);
};

const normalizeIssueResponse = (payload) => normalizeIssue(resolveData(payload));

export const getAllIssues = async () => {
    const response = await apiClient.get('/issues');
    return normalizeIssueCollection(response.data);
};

export const getMyIssues = async (token) => {
    const response = await apiClient.get('/issues/my', authConfig(token));
    return normalizeIssueCollection(response.data);
};

export const createIssue = async (payload, token) => {
    const response = await apiClient.post('/issues', payload, authConfig(token));
    return normalizeIssueResponse(response.data);
};

export const updateIssue = async (id, payload, token) => {
    const response = await apiClient.put(`/issues/${id}`, payload, authConfig(token));
    return normalizeIssueResponse(response.data);
};

export const deleteIssue = async (id, token) => {
    const response = await apiClient.delete(`/issues/${id}`, authConfig(token));
    return resolveData(response.data);
};

export const voteIssue = async (id, token) => {
    const response = await apiClient.post(`/issues/${id}/vote`, {}, authConfig(token));
    return normalizeIssueResponse(response.data);
};

export const getMyFollowedIssues = async (token) => {
    const response = await apiClient.get('/issues/follows/my', authConfig(token));
    const payload = resolveData(response.data);
    if (Array.isArray(payload)) return payload;
    return Array.isArray(payload?.issue_ids) ? payload.issue_ids : [];
};

export const followIssue = async (id, token) => {
    const response = await apiClient.post(`/issues/${id}/follow`, {}, authConfig(token));
    return resolveData(response.data);
};

export const unfollowIssue = async (id, token) => {
    const response = await apiClient.delete(`/issues/${id}/follow`, authConfig(token));
    return resolveData(response.data);
};

export const flagIssue = async (id, token) => {
    const response = await apiClient.post(`/issues/${id}/flag`, {}, authConfig(token));
    return resolveData(response.data);
};

export const replyIssue = async (id, message, token) => {
    const response = await apiClient.post(`/issues/${id}/reply`, { message }, authConfig(token));
    return normalizeIssueResponse(response.data);
};
