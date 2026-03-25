// src/app.js
const express = require('express');
const cors = require('cors');

const app = express();

// Middleware-uri globale
app.use(cors()); // Permite frontend-ului (ex: React pe portul 5173) să apeleze acest API
app.use(express.json()); // Ne permite să citim req.body sub formă de obiect JSON

// O rută simplă de test pentru a verifica dacă API-ul funcționează
app.get('/api/health', (req, res) => {
    res.status(200).json({ 
        status: 'ok', 
        message: 'API-ul Galați Civic este online!',
        timestamp: new Date().toISOString()
    });
});

// Aici vom adăuga rutele viitoare (le las comentate până le creăm)
const issuesRoutes = require('./routes/issues');
app.use('/api/issues', issuesRoutes);

// Middleware pentru rute inexistente (404)
app.use((req, res, next) => {
    res.status(404).json({ error: 'Ruta nu a fost găsită.' });
});

// Middleware global pentru gestionarea erorilor
app.use((err, req, res, next) => {
    console.error('[Eroare Globală]:', err.stack);
    res.status(500).json({ error: 'A apărut o eroare internă pe server.' });
});

module.exports = app;