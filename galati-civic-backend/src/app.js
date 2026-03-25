const express = require('express');
const cors = require('cors');
const supabase = require('./config/supabase');

const app = express();
const issuesTable = process.env.SUPABASE_ISSUES_TABLE || 'issues';

const allowedOrigins = (process.env.CORS_ORIGIN || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

const isVercelOrigin = (origin = '') => {
    try {
        const { hostname } = new URL(origin);
        return hostname === 'vercel.app' || hostname.endsWith('.vercel.app');
    } catch {
        return false;
    }
};

app.use(
    cors({
        origin(origin, callback) {
            if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin) || isVercelOrigin(origin)) {
                return callback(null, true);
            }
            return callback(new Error(`Origin nepermis de CORS: ${origin}`));
        },
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    }),
);
app.use(express.json());

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
        const { data, error } = await supabase
            .from(issuesTable)
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        return res.json(data || []);
    } catch (err) {
        console.error('[DB ERROR GET ISSUES]:', err);
        return res.status(500).json({ error: 'Eroare la interogarea bazei de date.' });
    }
};

const createIssue = async (req, res) => {
    const payload = mapIssuePayload(req.body);

    if (!payload.title || !payload.description || payload.lat == null || payload.lng == null) {
        return res.status(400).json({ error: 'title, description, lat și lng sunt obligatorii.' });
    }

    try {
        const { data, error } = await supabase
            .from(issuesTable)
            .insert([payload])
            .select('*')
            .single();

        if (error) throw error;
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
        const { data, error } = await supabase
            .from(issuesTable)
            .update(updatePayload)
            .eq('id', id)
            .select('*')
            .single();

        if (error) throw error;
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
        const { error, count } = await supabase
            .from(issuesTable)
            .delete({ count: 'exact' })
            .eq('id', id);

        if (error) throw error;
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
        const { data: issue, error: getError } = await supabase
            .from(issuesTable)
            .select('id, votes')
            .eq('id', id)
            .single();
        if (getError) throw getError;

        const nextVotes = (issue.votes || 0) + 1;
        const { data, error } = await supabase
            .from(issuesTable)
            .update({ votes: nextVotes })
            .eq('id', id)
            .select('*')
            .single();
        if (error) throw error;

        return res.json(data);
    } catch (err) {
        console.error('[DB ERROR POST ISSUE VOTE]:', err);
        return res.status(500).json({ error: 'Eroare la votarea raportului.' });
    }
};

const flagIssue = async (req, res) => {
    return res.status(202).json({ message: 'Raportarea a fost înregistrată.' });
};

const replyIssue = async (req, res) => {
    const { id } = req.params;
    const message = req.body?.message;
    if (!message) {
        return res.status(400).json({ error: 'Mesajul este obligatoriu.' });
    }

    req.body.admin_reply = message;
    return updateIssue(req, res);
};

app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'API-ul Galați Civic este online!',
        timestamp: new Date().toISOString(),
        table: issuesTable,
    });
});

app.get('/api/raport', listIssues);
app.post('/api/raport', createIssue);
app.put('/api/raport/:id', updateIssue);

app.get('/api/issues', listIssues);
app.get('/api/issues/my', listIssues);
app.post('/api/issues', createIssue);
app.put('/api/issues/:id', updateIssue);
app.delete('/api/issues/:id', deleteIssue);
app.post('/api/issues/:id/vote', voteIssue);
app.post('/api/issues/:id/flag', flagIssue);
app.post('/api/issues/:id/reply', replyIssue);

app.use((req, res) => {
    res.status(404).json({ error: 'Ruta nu a fost găsită.' });
});

app.use((err, req, res, next) => {

    console.error('[GLOBAL ERROR]:', err.stack);

    if (err.message?.startsWith('Origin nepermis de CORS')) {
        return res.status(403).json({ error: err.message });
    }

    return res.status(500).json({ error: 'Eroare internă pe server.' });
});

module.exports = app;