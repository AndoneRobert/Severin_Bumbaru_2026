const issuesService = require('../services/issueService');

const mapIssuePayload = (body = {}) => ({
    title: body.title,
    description: body.description,
    lat: body.lat ?? body.latitude,
    lng: body.lng ?? body.longitude,
    category: body.category ?? null,
    category_id: body.category_id ?? null,
    priority: body.priority ?? 'Medie',
    status: body.status ?? 'Nou',
    user_id: body.user_id ?? null,
});

const listIssues = async (_req, res) => {
    try {
        const data = await issuesService.listIssues();
        return res.json(data);
    } catch (err) {
        console.error('[DB ERROR GET ISSUES]:', err);
        return res.status(500).json({ error: 'Eroare la interogarea bazei de date.' });
    }
};

const listMyIssues = async (req, res) => {
    try {
        const data = await issuesService.listIssuesByUser(req.user.id);
        return res.json(data);
    } catch (err) {
        console.error('[DB ERROR GET MY ISSUES]:', err);
        return res.status(500).json({ error: 'Eroare la interogarea sesizărilor utilizatorului.' });
    }
};

const createIssue = async (req, res) => {
    const payload = {
        ...mapIssuePayload(req.body),
        user_id: req.user?.id ?? req.body?.user_id ?? null,
    };

    if (!payload.title || !payload.description || payload.lat == null || payload.lng == null) {
        return res.status(400).json({ error: 'title, description, lat și lng sunt obligatorii.' });
    }

    try {
        const data = await issuesService.createIssue(payload);
        return res.status(201).json(data);
    } catch (err) {
        console.error('[DB ERROR POST ISSUE]:', err);
        return res.status(500).json({ error: 'Eroare la inserarea raportului.' });
    }
};

const updateIssue = async (req, res) => {
    const { id } = req.params;
    const allowedFields = ['title', 'description', 'status', 'priority', 'category', 'category_id', 'lat', 'lng', 'admin_reply'];

    const updatePayload = Object.fromEntries(
        Object.entries(req.body || {}).filter(([key, value]) => allowedFields.includes(key) && value !== undefined),
    );

    if (req.body?.latitude !== undefined) updatePayload.lat = req.body.latitude;
    if (req.body?.longitude !== undefined) updatePayload.lng = req.body.longitude;
    if (Object.keys(updatePayload).length === 0) {
        return res.status(400).json({ error: 'Nu există câmpuri valide pentru actualizare.' });
    }

    try {
        const data = await issuesService.updateIssue(id, updatePayload);
        if (!data) return res.status(404).json({ error: 'Raportul nu a fost găsit.' });
        return res.json(data);
    } catch (err) {
        console.error('[DB ERROR PUT ISSUE]:', err);
        return res.status(500).json({ error: 'Eroare la actualizarea raportului.' });
    }
};

const deleteIssue = async (req, res) => {
    const { id } = req.params;

    try {
        const count = await issuesService.deleteIssue(id);
        if (!count) return res.status(404).json({ error: 'Raportul nu a fost găsit.' });

        return res.status(204).send();
    } catch (err) {
        console.error('[DB ERROR DELETE ISSUE]:', err);
        return res.status(500).json({ error: 'Eroare la ștergerea raportului.' });
    }
};

const voteIssue = async (req, res) => {
    const { id } = req.params;
    try {
        const issue = await issuesService.getIssueVotes(id);
        const nextVotes = (issue.votes || 0) + 1;
        const data = await issuesService.updateIssueVotes(id, nextVotes);

        return res.json(data);
    } catch (err) {
        console.error('[DB ERROR POST ISSUE VOTE]:', err);
        return res.status(500).json({ error: 'Eroare la votarea raportului.' });
    }
};

const flagIssue = async (_req, res) => res.status(202).json({ message: 'Raportarea a fost înregistrată.' });

const replyIssue = async (req, res) => {
    const message = req.body?.message;
    if (!message) {
        return res.status(400).json({ error: 'Mesajul este obligatoriu.' });
    }

    req.body.admin_reply = message;
    return updateIssue(req, res);
};

module.exports = {
    listIssues,
    listMyIssues,
    createIssue,
    updateIssue,
    deleteIssue,
    voteIssue,
    flagIssue,
    replyIssue,
};
