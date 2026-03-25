require('dotenv').config();
const app = require('./src/app');

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Serverul pentru Galați Civic a pornit pe portul ${PORT}`);
    console.log(`Punct de acces: http://localhost:${PORT}`);
});