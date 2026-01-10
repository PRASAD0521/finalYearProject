const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../../database/training.db');
const db = new sqlite3.Database(dbPath);

function initializeDatabase() {
    db.serialize(() => {
        // Users Table
        db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT,
      password TEXT,
      isAdmin INTEGER DEFAULT 0
    )`);

        // Products Table (for XSS/SQLi in search)
        db.run(`CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      description TEXT
    )`);

        // Seed Data
        db.get("SELECT count(*) as count FROM users", (err, row) => {
            if (row.count === 0) {
                console.log("Seeding Database...");
                // Vulnerable: Storing plain text passwords for demonstration (or weak hash)
                db.run(`INSERT INTO users (username, password, isAdmin) VALUES 
                ('admin', 'admin123', 1),
                ('user', 'password', 0),
                ('alice', 'wonderland', 0)
            `);

                db.run(`INSERT INTO products (name, description) VALUES 
                ('Firewall License', 'Enterprise grade firewall license key'),
                ('Antivirus 1-Year', 'Standard malware protection'),
                ('VPN Subscription', 'Secure tunnel for remote access')
            `);
            }
        });
    });
}

module.exports = {
    db,
    initializeDatabase
};
