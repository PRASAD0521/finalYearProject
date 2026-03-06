const express = require('express');
const router = express.Router();
const { labsDB } = require('../../database/connection');

// Route: /api/labs/lab1-sqli/login
router.post('/login', (req, res) => {
    const { username, password } = req.body;

    // VULNERABILITY: SQL Injection
    // Using labsDB to ensure only dummy data is exposed
    const query = `SELECT * FROM lab_users WHERE username = '${username}' AND password = '${password}'`;

    console.log(`[Lab1] Executing SQL: ${query}`);

    labsDB.get(query, (err, row) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err.message });

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

module.exports = router;
