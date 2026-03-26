const supabase = require('../config/supabase');

const issuesTable = process.env.SUPABASE_ISSUES_TABLE || 'issues';

const listIssues = async (dbClient = supabase) => {
    const { data, error } = await dbClient
        .from(issuesTable)
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
};

const listIssuesByUser = async (userId, dbClient = supabase) => {
    const { data, error } = await dbClient
        .from(issuesTable)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
};

const createIssue = async (payload, dbClient = supabase) => {
    const { data, error } = await dbClient
        .from(issuesTable)
        .insert([payload])
        .select('*')
        .single();

    if (error) throw error;
    return data;
};

const updateIssue = async (id, payload, dbClient = supabase) => {
    const { data, error } = await dbClient
        .from(issuesTable)
        .update(payload)
        .eq('id', id)
        .select('*')
        .single();

    if (error) throw error;
    return data;
};

const deleteIssue = async (id, dbClient = supabase) => {
    const { error, count } = await dbClient
        .from(issuesTable)
        .delete({ count: 'exact' })
        .eq('id', id);

    if (error) throw error;
    return count;
};

const getIssueVotes = async (id, dbClient = supabase) => {
    const { data, error } = await dbClient
        .from(issuesTable)
        .select('id, votes')
        .eq('id', id)
        .single();

    if (error) throw error;
    return data;
};

const updateIssueVotes = async (id, votes, dbClient = supabase) => {
    const { data, error } = await dbClient
        .from(issuesTable)
        .update({ votes })
        .eq('id', id)
        .select('*')
        .single();

    if (error) throw error;
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
