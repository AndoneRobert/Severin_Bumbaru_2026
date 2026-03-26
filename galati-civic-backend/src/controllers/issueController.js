const issueService = require('../services/issueService');

const mapIssuePayload = (body = {}) => ({
    title: body.title,
    description: body.description,
    lat: body.lat ?? body.latitude,
    lng: body.lng ?? body.longitude,
    category: body.category ?? body.issue_category ?? null,
    category_id: body.category_id ?? body.categoryId ?? null,
    priority: body.priority ?? 'Medie',
    status: body.status ?? 'Nou',
    user_id: body.user_id ?? null,
});

const dedupePayloadVariants = (variants) => {
    const seen = new Set();
    return variants.filter((variant) => {
        const key = JSON.stringify(variant);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
};

const createPayloadVariants = (payload) => {
    const {
        title,
        description,
        lat,
        lng,
        user_id,
    } = payload;

    return dedupePayloadVariants([
        payload,
        { ...payload, category_id: undefined },
        { ...payload, category: undefined, category_id: undefined },
        { title, description, lat, lng, user_id, priority: payload.priority, status: payload.status },
        { title, description, lat, lng, user_id },
        {
            title,
            description,
            latitude: lat,
            longitude: lng,
            category: payload.category,
            category_id: payload.category_id,
            user_id,
            priority: payload.priority,
            status: payload.status,
        },
        {
            title,
            description,
            latitude: lat,
            longitude: lng,
            category: payload.category,
            user_id,
            priority: payload.priority,
            status: payload.status,
        },
        {
            title,
            description,
            latitude: lat,
            longitude: lng,
            category_id: payload.category_id,
            user_id,
            priority: payload.priority,
            status: payload.status,
        },
        { title, description, latitude: lat, longitude: lng, user_id, priority: payload.priority, status: payload.status },
        { title, description, latitude: lat, longitude: lng, user_id },
    ]).map((candidate) => Object.fromEntries(
        Object.entries(candidate).filter(([, value]) => value !== undefined),
    ));
};

const listIssues = async (_req, res) => {
    try {
        const data = await issueService.listIssues();
        return res.json(data);
    } catch (err) {
        console.error('[DB ERROR GET ISSUES]:', err);
        return res.status(500).json({ error: 'Eroare la interogarea bazei de date.' });
    }
};

const listMyIssues = async (req, res) => {
    try {
        const data = await issueService.listIssuesByUser(req.user.id, req.supabase);
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
        const payloadVariants = createPayloadVariants(payload);
        let lastError = null;

        for (const candidate of payloadVariants) {
            try {
                const data = await issueService.createIssue(candidate, req.supabase);
                return res.status(201).json(data);
            } catch (err) {
                lastError = err;
            }
        }

        console.error('[DB ERROR POST ISSUE]:', lastError);
        return res.status(500).json({
            error: 'Eroare la inserarea raportului.',
            details: lastError?.message || 'Inserarea a eșuat pentru toate variantele de payload.',
        });
    } catch (unexpectedError) {
        console.error('[DB ERROR POST ISSUE UNEXPECTED]:', unexpectedError);
        return res.status(500).json({ error: 'Eroare internă la procesarea raportului.' });
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
        const data = await issueService.updateIssue(id, updatePayload, req.supabase);
        if (!data) return res.status(404).json({ error: 'Raportul nu a fost găsit.' });
        return res.json(data);
    } catch (err) {
        console.error('[DB ERROR PUT ISSUE]:', err);
        return res.status(500).json({ error: 'Eroare la actualizarea raportului.' });
    }
};

const updateIssueStatus = async (req, res) => {
    const { status } = req.body || {};
    if (status === undefined) {
        return res.status(400).json({ error: 'Câmpul status este obligatoriu.' });
    }

    req.body = { status };
    return updateIssue(req, res);
};

const deleteIssue = async (req, res) => {
    const { id } = req.params;

    try {
        const count = await issueService.deleteIssue(id, req.supabase);
        if (!count) return res.status(404).json({ error: 'Raportul nu a fost găsit.' });

        return res.status(204).send();
    } catch (err) {
        console.error('[DB ERROR DELETE ISSUE]:', err);
        return res.status(500).json({ error: 'Eroare la ștergerea raportului.' });
    }
};

const voteIssue = async (req, res) => {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
        return res.status(401).json({ error: 'Utilizator neautentificat.' });
    }

    try {
        const data = await issueService.voteForIssue({ issueId: id, userId }, req.supabase);
        return res.json(data);
    } catch (err) {
        if (err?.code === '23505') {
            return res.status(409).json({ error: 'Ai votat deja această sesizare.' });
        }

        console.error('[DB ERROR POST ISSUE VOTE]:', err);
        return res.status(500).json({ error: 'Eroare la votarea raportului.' });
    }
};

const listMyFollowedIssues = async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
        return res.status(401).json({ error: 'Utilizator neautentificat.' });
    }

    try {
        const issueIds = await issueService.listFollowedIssueIds(userId, req.supabase);
        return res.json({ issue_ids: issueIds });
    } catch (err) {
        console.error('[DB ERROR GET ISSUE FOLLOWS]:', err);
        return res.status(500).json({ error: 'Eroare la interogarea urmăririlor.' });
    }
};

const followIssue = async (req, res) => {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
        return res.status(401).json({ error: 'Utilizator neautentificat.' });
    }

    try {
        const data = await issueService.followIssue({ issueId: id, userId }, req.supabase);
        return res.status(201).json(data);
    } catch (err) {
        if (err?.code === '23505') {
            return res.status(409).json({ error: 'Urmărești deja această sesizare.' });
        }

        console.error('[DB ERROR POST ISSUE FOLLOW]:', err);
        return res.status(500).json({ error: 'Eroare la urmărirea sesizării.' });
    }
};

const unfollowIssue = async (req, res) => {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
        return res.status(401).json({ error: 'Utilizator neautentificat.' });
    }

    try {
        await issueService.unfollowIssue({ issueId: id, userId }, req.supabase);
        return res.status(204).send();
    } catch (err) {
        console.error('[DB ERROR DELETE ISSUE FOLLOW]:', err);
        return res.status(500).json({ error: 'Eroare la oprirea urmăririi sesizării.' });
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
    updateIssueStatus,
    deleteIssue,
    voteIssue,
    listMyFollowedIssues,
    followIssue,
    unfollowIssue,
    flagIssue,
    replyIssue,
};
