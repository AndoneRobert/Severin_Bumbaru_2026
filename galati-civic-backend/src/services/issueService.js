const supabase = require('../config/supabase');

const issuesTable = process.env.SUPABASE_ISSUES_TABLE || 'issues';
const issueVotesTable = process.env.SUPABASE_ISSUE_VOTES_TABLE || 'issues_votes';
const issueCommentsTable = process.env.SUPABASE_ISSUE_COMMENTS_TABLE || 'issues_comments';
const issueFollowsTable = process.env.SUPABASE_ISSUE_FOLLOWS_TABLE || 'issues_follows';
const issueFlagsTable = process.env.SUPABASE_ISSUE_FLAGS_TABLE || 'issues_flags';
const notificationsTable = process.env.SUPABASE_NOTIFICATIONS_TABLE || 'notifications';

const ISSUE_TABLE_CANDIDATES = [issuesTable, 'issues', 'rapoarte'];
const ISSUE_VOTES_TABLE_CANDIDATES = [issueVotesTable, 'issues_votes', 'report_votes'];
const ISSUE_COMMENTS_TABLE_CANDIDATES = [issueCommentsTable, 'issues_comments', 'report_comments'];
const ISSUE_FOLLOWS_TABLE_CANDIDATES = [issueFollowsTable, 'issues_follows', 'issue_follows', 'report_follows'];
const ISSUE_FLAGS_TABLE_CANDIDATES = [issueFlagsTable, 'issues_flags'];
const NOTIFICATIONS_TABLE_CANDIDATES = [notificationsTable, 'notifications'];

let resolvedIssuesTable = process.env.SUPABASE_ISSUES_TABLE || null;
let resolvedIssueVotesTable = process.env.SUPABASE_ISSUE_VOTES_TABLE || null;
let resolvedIssueCommentsTable = process.env.SUPABASE_ISSUE_COMMENTS_TABLE || null;
let resolvedIssueFollowsTable = process.env.SUPABASE_ISSUE_FOLLOWS_TABLE || null;
let resolvedIssueFlagsTable = process.env.SUPABASE_ISSUE_FLAGS_TABLE || null;
let resolvedNotificationsTable = process.env.SUPABASE_NOTIFICATIONS_TABLE || null;

const unique = (items) => [...new Set(items.filter(Boolean))];

const isMissingTableError = (error) => {
    const message = `${error?.message || ''} ${error?.details || ''}`.toLowerCase();
    return error?.code === '42P01'
        || error?.code === 'PGRST205'
        || message.includes('does not exist')
        || message.includes('could not find the table');
};

const runOnTable = async (operation, tableCandidates, resolvedTableRef) => {
    const candidates = unique([resolvedTableRef.value, ...tableCandidates]);
    let lastError = null;

    for (const table of candidates) {
        const result = await operation(table);
        if (!result.error) {
            resolvedTableRef.value = table;
            return result;
        }

        lastError = result.error;
        if (!isMissingTableError(result.error)) break;
    }

    throw lastError;
};

const runOnIssueTable = (operation) => runOnTable(operation, ISSUE_TABLE_CANDIDATES, {
    get value() {
        return resolvedIssuesTable;
    },
    set value(next) {
        resolvedIssuesTable = next;
    },
});

const runOnIssueVotesTable = (operation) => runOnTable(operation, ISSUE_VOTES_TABLE_CANDIDATES, {
    get value() {
        return resolvedIssueVotesTable;
    },
    set value(next) {
        resolvedIssueVotesTable = next;
    },
});

const runOnIssueCommentsTable = (operation) => runOnTable(operation, ISSUE_COMMENTS_TABLE_CANDIDATES, {
    get value() {
        return resolvedIssueCommentsTable;
    },
    set value(next) {
        resolvedIssueCommentsTable = next;
    },
});

const runOnIssueFollowsTable = (operation) => runOnTable(operation, ISSUE_FOLLOWS_TABLE_CANDIDATES, {
    get value() {
        return resolvedIssueFollowsTable;
    },
    set value(next) {
        resolvedIssueFollowsTable = next;
    },
});

const runOnIssueFlagsTable = (operation) => runOnTable(operation, ISSUE_FLAGS_TABLE_CANDIDATES, {
    get value() {
        return resolvedIssueFlagsTable;
    },
    set value(next) {
        resolvedIssueFlagsTable = next;
    },
});

const runOnNotificationsTable = (operation) => runOnTable(operation, NOTIFICATIONS_TABLE_CANDIDATES, {
    get value() {
        return resolvedNotificationsTable;
    },
    set value(next) {
        resolvedNotificationsTable = next;
    },
});

const listIssues = async (dbClient = supabase) => {
    const { data } = await runOnIssueTable(async (table) => dbClient
        .from(table)
        .select('*')
        .order('created_at', { ascending: false }));
    return data || [];
};

const listIssuesByUser = async (userId, dbClient = supabase) => {
    const { data } = await runOnIssueTable(async (table) => dbClient
        .from(table)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }));
    return data || [];
};

const createIssue = async (payload, dbClient = supabase) => {
    const { data } = await runOnIssueTable(async (table) => dbClient
        .from(table)
        .insert([payload])
        .select('*')
        .single());
    return data;
};

const updateIssue = async (id, payload, dbClient = supabase) => {
    const { data } = await runOnIssueTable(async (table) => dbClient
        .from(table)
        .update(payload)
        .eq('id', id)
        .select('*')
        .single());
    return data;
};

const deleteIssue = async (id, dbClient = supabase) => {
    const { count } = await runOnIssueTable(async (table) => dbClient
        .from(table)
        .delete({ count: 'exact' })
        .eq('id', id));
    return count;
};

const getIssueVotes = async (id, dbClient = supabase) => {
    const { data } = await runOnIssueTable(async (table) => dbClient
        .from(table)
        .select('id, votes')
        .eq('id', id)
        .single());
    return data;
};

const updateIssueVotes = async (id, votes, dbClient = supabase) => {
    const { data } = await runOnIssueTable(async (table) => dbClient
        .from(table)
        .update({ votes })
        .eq('id', id)
        .select('*')
        .single());
    return data;
};

const voteForIssue = async ({ issueId, userId }, dbClient = supabase) => {
    const { error } = await runOnIssueVotesTable(async (table) => dbClient
        .from(table)
        .insert([{ issue_id: issueId, user_id: userId }]));

    if (error) throw error;

    const issue = await getIssueVotes(issueId, dbClient);
    const nextVotes = (issue?.votes || 0) + 1;
    return updateIssueVotes(issueId, nextVotes, dbClient);
};

const listFollowedIssueIds = async (userId, dbClient = supabase) => {
    const { data } = await runOnIssueFollowsTable(async (table) => dbClient
        .from(table)
        .select('issue_id')
        .eq('user_id', userId));
    return (data || []).map((row) => row.issue_id).filter(Boolean);
};

const followIssue = async ({ issueId, userId }, dbClient = supabase) => {
    const { data, error } = await runOnIssueFollowsTable(async (table) => dbClient
        .from(table)
        .insert([{ issue_id: issueId, user_id: userId }])
        .select('issue_id, user_id')
        .single());

    if (error) throw error;
    return data;
};

const unfollowIssue = async ({ issueId, userId }, dbClient = supabase) => {
    const { count } = await runOnIssueFollowsTable(async (table) => dbClient
        .from(table)
        .delete({ count: 'exact' })
        .eq('issue_id', issueId)
        .eq('user_id', userId));
    return count || 0;
};

const flagIssue = async ({ issueId, userId, reason = null }, dbClient = supabase) => {
    const payload = [{ issue_id: issueId, user_id: userId, reason }];
    const { data, error } = await runOnIssueFlagsTable(async (table) => dbClient
        .from(table)
        .insert(payload)
        .select('id, issue_id, user_id, created_at')
        .single());

    if (error) throw error;
    return data;
};

const countFlagsForIssue = async (issueId, dbClient = supabase) => {
    const { count } = await runOnIssueFlagsTable(async (table) => dbClient
        .from(table)
        .select('id', { count: 'exact', head: true })
        .eq('issue_id', issueId));
    return count || 0;
};

const countFlagsByUser = async (userId, dbClient = supabase) => {
    const { count } = await runOnIssueFlagsTable(async (table) => dbClient
        .from(table)
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId));
    return count || 0;
};

const createNotification = async ({
    userId,
    issueId,
    type = 'status_update',
    message,
}, dbClient = supabase) => {
    const payload = [{ user_id: userId, report_id: issueId, type, message, read: false }];
    const { data, error } = await runOnNotificationsTable(async (table) => dbClient
        .from(table)
        .insert(payload)
        .select('*')
        .single());

    if (error) throw error;
    return data;
};

const listNotificationsByUser = async (userId, dbClient = supabase) => {
    const { data } = await runOnNotificationsTable(async (table) => dbClient
        .from(table)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50));

    return data || [];
};

const markNotificationRead = async ({ notificationId, userId }, dbClient = supabase) => {
    const { data, error } = await runOnNotificationsTable(async (table) => dbClient
        .from(table)
        .update({ read: true })
        .eq('id', notificationId)
        .eq('user_id', userId)
        .select('*')
        .single());

    if (error) throw error;
    return data;
};

const createInternalIssueComment = async ({
    issueId,
    userId,
    department,
    message,
}, dbClient = supabase) => {
    const baseBody = [`Departament: ${department}`, message ? `Mesaj: ${message}` : null]
        .filter(Boolean)
        .join('\n');

    const payloadCandidates = unique([
        JSON.stringify({ issue_id: issueId, user_id: userId, body: baseBody, is_internal: true }),
        JSON.stringify({ issue_id: issueId, user_id: userId, comment: baseBody, is_internal: true }),
        JSON.stringify({ issue_id: issueId, user_id: userId, body: baseBody }),
        JSON.stringify({ issue_id: issueId, user_id: userId, comment: baseBody }),
    ]).map((entry) => JSON.parse(entry));

    let lastError = null;
    for (const payload of payloadCandidates) {
        const result = await runOnIssueCommentsTable(async (table) => dbClient
            .from(table)
            .insert([payload])
            .select('*')
            .single());

        if (!result.error) return result.data;
        lastError = result.error;
    }

    throw lastError;
};

module.exports = {
    issuesTable,
    issueVotesTable,
    issueCommentsTable,
    issueFollowsTable,
    issueFlagsTable,
    notificationsTable,
    listIssues,
    listIssuesByUser,
    createIssue,
    updateIssue,
    deleteIssue,
    getIssueVotes,
    updateIssueVotes,
    voteForIssue,
    listFollowedIssueIds,
    followIssue,
    unfollowIssue,
    flagIssue,
    countFlagsForIssue,
    countFlagsByUser,
    createNotification,
    listNotificationsByUser,
    markNotificationRead,
    createInternalIssueComment,
    runOnIssueCommentsTable,
    runOnIssueFollowsTable,
    runOnIssueFlagsTable,
    runOnNotificationsTable,
};
