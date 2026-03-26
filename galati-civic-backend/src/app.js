const express = require('express');
const cors = require('cors');

const issuesRoutes = require('./routes/issuesRoutes');
const tablesRoutes = require('./routes/tablesRoutes');
const { issuesTable } = require('./services/issuesService');
const { readEnabledTables, writeEnabledTables } = require('./services/tablesService');

const app = express();

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

app.get('/api/health', (_req, res) => {
    res.json({
        status: 'ok',
        message: 'API-ul Galați Civic este online!',
        timestamp: new Date().toISOString(),
        table: issuesTable,
        readEnabledTables: [...readEnabledTables],
        writeEnabledTables: [...writeEnabledTables],
    });
});

app.use('/api', issuesRoutes);
app.use('/api', tablesRoutes);

app.use((_req, res) => {
    res.status(404).json({ error: 'Ruta nu a fost găsită.' });
});

app.use((err, _req, res, _next) => {
    console.error('[GLOBAL ERROR]:', err.stack);

    if (err.message?.startsWith('Origin nepermis de CORS')) {
        return res.status(403).json({ error: err.message });
    }

    return res.status(500).json({ error: 'Eroare internă pe server.' });
});

module.exports = app;