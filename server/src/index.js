const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

// New Architecture Imports
const { initDatabases } = require('./database/init');
const { platformDB } = require('./database/connection'); // For main Platform Auth
const { registerLabs } = require('./labs/index'); // Lab Registry

const app = express();
const PORT = 4000;

// Middleware
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176'],
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// 1. Initialize Databases (Platform, Labs, Playground)
initDatabases();

// 2. Platform Authentication (Secure - Uses platformDB)
app.post('/api/register', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
    }

    const query = `INSERT INTO users (username, password, isAdmin) VALUES (?, ?, 0)`;
    platformDB.run(query, [username, password], function (err) {
        if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
                return res.status(409).json({ message: 'Username already exists' });
            }
            return res.status(500).json({ message: 'Database error' });
        }
        res.json({ success: true, message: 'User registered successfully' });
    });
});

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    // Secure Login for Platform (No SQLi here!)
    const query = `SELECT * FROM users WHERE username = ? AND password = ?`;
    platformDB.get(query, [username, password], (err, row) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        if (row) {
            return res.json({
                success: true,
                user: {
                    id: row.id,
                    username: row.username,
                    isAdmin: row.isAdmin === 1
                },
                message: 'Login Successful'
            });
        } else {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
    });
});

// 3. Register Labs (Modular Routes)
// Auto-loads /api/labs/lab1-sqli, etc.
registerLabs(app);

app.listen(PORT, () => {
    console.log(`Scalable CyberRange Server running on http://localhost:${PORT}`);
    console.log(`- Platform DB: Secure`);
    console.log(`- Labs DB: Vulnerable`);
});
