require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function test() {
    const { data, error } = await supabase.from('rapoarte').select('*');
    if (error) console.error('DB ERROR:', error);
    else console.log('DB OK:', data);
}

test();