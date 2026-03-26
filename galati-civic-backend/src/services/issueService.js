const supabase = require('../config/supabase');

const issuesTable = process.env.SUPABASE_ISSUES_TABLE || 'issues';
const issueVotesTable = process.env.SUPABASE_ISSUE_VOTES_TABLE || 'issues_votes';
const issueCommentsTable = process.env.SUPABASE_ISSUE_COMMENTS_TABLE || 'issues_comments';
const issueFollowsTable = process.env.SUPABASE_ISSUE_FOLLOWS_TABLE || 'issues_follows';

const ISSUE_TABLE_CANDIDATES = [issuesTable, 'issues', 'rapoarte'];
const ISSUE_VOTES_TABLE_CANDIDATES = [issueVotesTable, 'issues_votes', 'report_votes'];
const ISSUE_COMMENTS_TABLE_CANDIDATES = [issueCommentsTable, 'issues_comments', 'report_comments'];
const ISSUE_FOLLOWS_TABLE_CANDIDATES = [issueFollowsTable, 'issues_follows', 'issue_follows', 'report_follows'];

let resolvedIssuesTable = process.env.SUPABASE_ISSUES_TABLE || null;
let resolvedIssueVotesTable = process.env.SUPABASE_ISSUE_VOTES_TABLE || null;
let resolvedIssueCommentsTable = process.env.SUPABASE_ISSUE_COMMENTS_TABLE || null;
let resolvedIssueFollowsTable = process.env.SUPABASE_ISSUE_FOLLOWS_TABLE || null;

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

module.exports = {
    issuesTable,
    issueVotesTable,
    issueCommentsTable,
    issueFollowsTable,
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
    runOnIssueCommentsTable,
    runOnIssueFollowsTable,
};
