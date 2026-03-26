require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('SUPABASE_URL și SUPABASE_SERVICE_ROLE_KEY (sau SUPABASE_KEY) trebuie definite în variabilele de mediu.');
}

const createSupabaseClient = (accessToken = null) => createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false },
  global: accessToken
    ? { headers: { Authorization: `Bearer ${accessToken}` } }
    : undefined,
});

const supabase = createSupabaseClient();

module.exports = supabase;
module.exports.createSupabaseClient = createSupabaseClient;
