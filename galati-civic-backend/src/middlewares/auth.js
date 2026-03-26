const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Folosim Anon Key pentru a valida token-ul venit de la client

const supabase = require('../config/supabase');
const { createSupabaseClient } = require('../config/supabase');

const requireAuth = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Acces interzis. Token lipsă.' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (error || !user) throw new Error('Token invalid');

        // Preluăm rolul din tabelul profiles (definit în SQL)
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        req.user = { 
            id: user.id, 
            role: profile?.role || 'citizen' 
        };
        req.supabase = createSupabaseClient(token);
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Sesiune expirată sau invalidă.' });
    }
};

const requireRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Nu ai permisiunea necesară (Rol insuficient).' });
        }
        next();
    };
};

module.exports = { requireAuth, requireRole };
