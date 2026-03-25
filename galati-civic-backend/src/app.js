// src/app.js
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();

// Middleware globale
app.use(cors()); // Permite frontend-ului să acceseze API-ul
app.use(express.json()); // Permite citirea JSON din request body

// Supabase client cu cheia service_role (backend securizat)
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
);

// RUTA DE TEST / HEALTH CHECK
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'API-ul Galați Civic este online!',
        timestamp: new Date().toISOString()
    });
});

// GET toate raportările (issues)
app.get('/api/raport', async (req, res) => {
    try {
        const { data, error } = await supabase.from('issues').select('*');
        if (error) throw error;
        res.json(data);
    } catch (err) {
        console.error('[DB ERROR GET]:', err);
        res.status(500).json({ error: 'Eroare la interogarea bazei de date.' });
    }
});

// POST creare raport nou
app.post('/api/raport', async (req, res) => {
    const { category, description, location_lat, location_lng } = req.body;
    try {
        const { data, error } = await supabase.from('issues').insert([{
            category,
            description,
            location_lat,
            location_lng,
            status: 'pending'
        }]);
        if (error) throw error;
        res.status(201).json(data);
    } catch (err) {
        console.error('[DB ERROR POST]:', err);
        res.status(500).json({ error: 'Eroare la inserarea raportului.' });
    }
});

// PUT update status (doar admin)
app.put('/api/raport/:id', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    try {
        const { data, error } = await supabase.from('issues').update({ status }).eq('id', id);
        if (error) throw error;
        res.json(data);
    } catch (err) {
        console.error('[DB ERROR PUT]:', err);
        res.status(500).json({ error: 'Eroare la actualizarea statusului.' });
    }
});

// Middleware pentru rute inexistente (404)
app.use((req, res) => {
    res.status(404).json({ error: 'Ruta nu a fost găsită.' });
});

// Middleware global de erori
app.use((err, req, res, next) => {
    console.error('[GLOBAL ERROR]:', err.stack);
    res.status(500).json({ error: 'Eroare internă pe server.' });
});

module.exports = app;