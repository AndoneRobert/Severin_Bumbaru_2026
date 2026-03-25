// src/app.js
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

// Import rute (poți adăuga mai multe rute ulterior)
const issuesRoutes = require('./routes/issues');

const app = express();

// Middleware-uri globale
app.use(cors()); // Permite frontend-ului să apeleze API-ul
app.use(express.json()); // Citire req.body ca JSON

// --- Health check simplu ---
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        message: 'API-ul Galați Civic este online!',
        timestamp: new Date().toISOString()
    });
});

// Supabase client
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
);

// Ruta API /api/raport
app.get('/api/raport', async (req, res) => {
    try {
        const { data, error } = await supabase.from('rapoarte').select('*');
        if (error) throw error;
        res.status(200).json(data);
    } catch (err) {
        console.error('[DB ERROR]:', err);
        res.status(500).json({ error: 'Eroare la interogarea bazei de date.' });
    }
});

// --- Alte rute (ex: issues) ---
app.use('/api/issues', issuesRoutes);

// --- Middleware pentru rute inexistente (404) ---
app.use((req, res, next) => {
    res.status(404).json({ error: 'Ruta nu a fost găsită.' });
});

// --- Middleware global pentru erori ---
app.use((err, req, res, next) => {
    console.error('[Eroare Globală]:', err.stack);
    res.status(500).json({ error: 'A apărut o eroare internă pe server.' });
});

module.exports = app;