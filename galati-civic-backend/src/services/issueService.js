const supabase = require('../config/supabase');

const issuesTable = process.env.SUPABASE_ISSUES_TABLE || 'issues';
const ISSUE_TABLE_CANDIDATES = [issuesTable, 'issues', 'rapoarte'];
let resolvedIssuesTable = process.env.SUPABASE_ISSUES_TABLE || null;

const unique = (items) => [...new Set(items.filter(Boolean))];

const isMissingTableError = (error) => {
    const message = `${error?.message || ''} ${error?.details || ''}`.toLowerCase();
    return error?.code === '42P01'
        || error?.code === 'PGRST205'
        || message.includes('does not exist')
        || message.includes('could not find the table');
};

const runOnIssueTable = async (dbClient, operation) => {
    const tableCandidates = unique([
        resolvedIssuesTable,
        ...ISSUE_TABLE_CANDIDATES,
    ]);

    let lastError = null;
    for (const table of tableCandidates) {
        const result = await operation(table);
        if (!result.error) {
            resolvedIssuesTable = table;
            return result;
        }
        lastError = result.error;
        if (!isMissingTableError(result.error)) break;
    }

    throw lastError;
};

const listIssues = async (dbClient = supabase) => {
    const { data } = await runOnIssueTable(dbClient, async (table) => dbClient
        .from(table)
        .select('*')
        .order('created_at', { ascending: false }));
    return data || [];
};

const listIssuesByUser = async (userId, dbClient = supabase) => {
    const { data } = await runOnIssueTable(dbClient, async (table) => dbClient
        .from(table)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }));
    return data || [];
};

const createIssue = async (payload, dbClient = supabase) => {
    const { data } = await runOnIssueTable(dbClient, async (table) => dbClient
        .from(table)
        .insert([payload])
        .select('*')
        .single());
    return data;
};

const updateIssue = async (id, payload, dbClient = supabase) => {
    const { data } = await runOnIssueTable(dbClient, async (table) => dbClient
        .from(table)
        .update(payload)
        .eq('id', id)
        .select('*')
        .single());
    return data;
};

const deleteIssue = async (id, dbClient = supabase) => {
    const { count } = await runOnIssueTable(dbClient, async (table) => dbClient
        .from(table)
        .delete({ count: 'exact' })
        .eq('id', id));
    return count;
};

const getIssueVotes = async (id, dbClient = supabase) => {
    const { data } = await runOnIssueTable(dbClient, async (table) => dbClient
        .from(table)
        .select('id, votes')
        .eq('id', id)
        .single());
    return data;
};

const updateIssueVotes = async (id, votes, dbClient = supabase) => {
    const { data } = await runOnIssueTable(dbClient, async (table) => dbClient
        .from(table)
        .update({ votes })
        .eq('id', id)
        .select('*')
        .single());
    return data;
};

module.exports = {
    issuesTable,
    listIssues,
    listIssuesByUser,
    createIssue,
    updateIssue,
    deleteIssue,
    getIssueVotes,
    updateIssueVotes,
};
