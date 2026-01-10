const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { initializeDatabase, db } = require('./database');

const app = express();
const PORT = 4000;

// Middleware
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176'], // Vite dev ports
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Initialize DB
initializeDatabase();

app.post('/api/register', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
    }

    const query = `INSERT INTO users (username, password, isAdmin) VALUES (?, ?, 0)`;
    db.run(query, [username, password], function (err) {
        if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
                return res.status(409).json({ message: 'Username already exists' });
            }
            return res.status(500).json({ message: 'Database error' });
        }
        res.json({ success: true, message: 'User registered successfully' });
    });
});

// --- VULNERABLE ROUTES ---

// Lab 1: SQL Injection (Login)
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    // VULNERABILITY: Direct string concatenation allows SQL Injection
    // Payload: ' OR 1=1 --
    const query = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;

    console.log(`Executing SQL: ${query}`); // Log for learning

    db.get(query, (err, row) => {
        if (err) {
            return res.status(500).json({ message: 'Database error', error: err.message });
        }
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

// Lab 2: Reflected XSS (Search)
app.get('/api/products', (req, res) => {
    const query = req.query.q || '';

    // Note: React escapes by default, so implementing XSS directly in React needs "dangerouslySetInnerHTML"
    // The backend just returns the data. For a "real" XSS lab, the frontend must be vulnerable too.
    // Here we return data matching the text.

    const sql = `SELECT * FROM products WHERE name LIKE '%${query}%'`;
    db.all(sql, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ products: rows, searchTerm: query });
    });
});


// Lab 3: Broken Authentication (OTP Bypass)
// Vulnerability: Client-side validation of response status.
app.post('/api/auth/otp-generate', (req, res) => {
    const { username } = req.body;
    if (!username) return res.status(400).json({ message: 'Username required' });

    // Simulate sending email (Log to console)
    const query = `SELECT * FROM users WHERE username = '${username}'`;
    db.get(query, (err, row) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        if (!row) return res.status(404).json({ message: 'User not found' });

        console.log(`[OTP-SYSTEM] Generated OTP for ${username}: 999999`);
        res.json({ success: true, message: `OTP sent to ${username}@example.com` });
    });
});

app.post('/api/auth/otp-verify', (req, res) => {
    const { username, otp } = req.body;

    // Hardcoded "Correct" OTP for simulation
    if (otp === '999999') {
        res.json({ success: true, message: 'OTP Verified' });
    } else {
        // This is the response the user needs to intercept and change to success: true
        res.status(200).json({ success: false, message: 'Invalid OTP' });
        // Note: Sending 200 with success:false makes it easier for frontend interceptors in this specific lab demo
        // than handling 403 exceptions in axios.
    }
});

app.post('/api/reset-password', (req, res) => {
    const { username, newPassword } = req.body;

    // In a real attack, the attacker calls this AFTER the frontend "thinks" OTP is verified
    // The vulnerability is that THIS endpoint doesn't check for a session token or OTP token again.
    const query = `UPDATE users SET password = '${newPassword}' WHERE username = '${username}'`;

    db.run(query, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes > 0) {
            res.json({ success: true, message: `Password for ${username} reset successfully.` });
        } else {
            res.status(404).json({ success: false, message: 'User not found' });
        }
    });
});

// Lab 4: Security Misconfiguration (Exposed Debug Endpoint)
// Vulnerability: Sensitive debug info exposed without auth.
app.get('/api/admin/debug', (req, res) => {
    // VULNERABILITY: This route should be protected or not exist in production.
    // It returns all users including admins.
    db.all("SELECT * FROM users", (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({
            systemStatus: 'OK',
            debugMode: true,
            environment: 'production',
            activeUsers: rows // LEAKING DATA
        });
    });
});

app.listen(PORT, () => {
    console.log(`Vulnerable Server running on http://localhost:${PORT}`);
});
