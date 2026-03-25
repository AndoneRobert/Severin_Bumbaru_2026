const supabaseAdmin = require('../config/supabase');
const crypto = require('crypto');

// Generăm codul unic: ex GAL-2026-A1B2
const generateTrackingCode = () => {
    const year = new Date().getFullYear();
    const randomStr = crypto.randomBytes(2).toString('hex').toUpperCase();
    return `GAL-${year}-${randomStr}`;
};

const createIssue = async (issueData, userId) => {
    const trackingCode = generateTrackingCode();

    const { data: issue, error } = await supabaseAdmin
        .from('issues')
        .insert({
            tracking_code: trackingCode,
            author_id: userId,
            title: issueData.title,
            description: issueData.description,
            category_id: issueData.category_id,
            lat: issueData.lat,
            lng: issueData.lng,
            status: 'Nou'
        })
        .select()
        .single();

    if (error) throw new Error(error.message);
    return issue;
};

const getAllIssues = async (filters = {}) => {
    // MODIFICARE: Am scos "categories(name)" pentru că tabelele nu sunt legate prin Foreign Key în Supabase
    let query = supabaseAdmin.from('issues').select('*'); 
    
    if (filters.status) query = query.eq('status', filters.status);
    if (filters.category_id) query = query.eq('category_id', filters.category_id);
    
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data;
};

module.exports = { createIssue, getAllIssues };