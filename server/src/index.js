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
const allowedOrigins = [
    'http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176'
];
if (process.env.FRONTEND_URL) {
    allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(cors({
    origin: allowedOrigins,
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

// 3.5 Internal Network API (For Lab 7 SSRF)
const internalRoutes = require('./routes/internal');
app.use('/api/internal', internalRoutes);

// 4. Progress Tracking & Reports
const { router: progressRoutes } = require('./routes/progress');
app.use('/api', progressRoutes);

// 4.5 AI Chatbot (Gemini)
const chatRoutes = require('./routes/chat');
app.use('/api/chat', chatRoutes);

// 5. Secure Time-Gated Hints
const hintsRoutes = require('./routes/hints');
app.use('/api/hints', hintsRoutes);

// 6. Secure Admin Utilities
const adminRoutes = require('./routes/admin');
app.use('/api/admin', adminRoutes);

app.listen(PORT, () => {
    console.log(`Scalable CyberRange Server running on http://localhost:${PORT}`);
    console.log(`- Platform DB: Secure`);
    console.log(`- Labs DB: Vulnerable`);
});
