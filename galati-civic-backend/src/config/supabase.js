const { createClient } = require('@supabase/supabase-js');

// PUNEM VALORILE DIRECT (FĂRĂ process.env) PENTRU TEST
const supabase = createClient(
  'https://vgsvxwzbzfotszovlejt.supabase.co', 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZnc3Z4d3piemZvdHN6b3ZsZWp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0MjEyOTgsImV4cCI6MjA4OTk5NzI5OH0.cawtkw4FqEluzsxDXO3IDd-Z5hUZ7VK0g98NnSDNNPs'
);

module.exports = supabase;