const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Ensure the 'database' directory exists in the root (where training.db was)
const DB_DIR = path.resolve(__dirname, '../../../database');

// 1. Platform DB (Secure, Persistent)
const platformDB = new sqlite3.Database(path.join(DB_DIR, 'platform.db'), (err) => {
    if (err) console.error('Error opening platform.db:', err.message);
    else console.log('Connected to Platform Database (Secure)');
});

// 2. Labs DB (Vulnerable, Reset often)
const labsDB = new sqlite3.Database(path.join(DB_DIR, 'labs.db'), (err) => {
    if (err) console.error('Error opening labs.db:', err.message);
    else console.log('Connected to Labs Database (Vulnerable)');
});

// 3. Playground DB (Future / Juice Shop style)
const playgroundDB = new sqlite3.Database(path.join(DB_DIR, 'playground.db'), (err) => {
    if (err) console.error('Error opening playground.db:', err.message);
    else console.log('Connected to Playground Database (Experimental)');
});

module.exports = {
    platformDB,
    labsDB,
    playgroundDB
};
