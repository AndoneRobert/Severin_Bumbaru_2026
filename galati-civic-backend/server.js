require('dotenv').config();
console.log("--- TEST ENV ---");
console.log("URL-ul este:", process.env.SUPABASE_URL);
console.log("Cheia incepe cu:", process.env.SUPABASE_KEY?.substring(0, 10));
console.log("----------------");
const app = require('./src/app');

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Serverul pentru Galați Civic a pornit pe portul ${PORT}`);
    console.log(`Punct de acces: http://localhost:${PORT}`);
});