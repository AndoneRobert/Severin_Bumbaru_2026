const issueService = require('../../src/services/issueService');
const supabaseAdmin = require('../config/supabase');

exports.createIssue = async (req, res) => {
    try {
        const userId = req.user.id; // Extras de middleware-ul auth
        const newIssue = await issueService.createIssue(req.body, userId);
        res.status(201).json({ message: 'Sesizare creată cu succes', data: newIssue });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.getIssues = async (req, res) => {
    try {
        // Preluăm filtrele din query params (ex: ?status=Nou)
        const filters = {
            status: req.query.status,
            category_id: req.query.category_id
        };
        const issues = await issueService.getAllIssues(filters);
        res.status(200).json(issues);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateIssueStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { new_status } = req.body;

        const { data, error } = await supabaseAdmin
            .from('issues')
            .update({ status: new_status, updated_at: new Date() })
            .eq('id', id)
            .select()
            .single();

        if (error) throw new Error(error.message);
        res.status(200).json({ message: 'Status actualizat', data });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};