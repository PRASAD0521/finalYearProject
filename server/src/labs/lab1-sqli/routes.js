const express = require('express');
const router = express.Router();
const { labsDB, platformDB } = require('../../database/connection');

// Route: /api/labs/lab1-sqli/login
router.post('/login', (req, res) => {
    const { username, password, user_id } = req.body;

    // VULNERABILITY: SQL Injection
    // Using labsDB to ensure only dummy data is exposed
    const query = `SELECT * FROM lab_users WHERE username = '${username}' AND password = '${password}'`;

    console.log(`[Lab1] Executing SQL: ${query}`);

    labsDB.get(query, (err, row) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err.message });

        if (row) {
            if (user_id) {
                platformDB.run(
                    "INSERT OR IGNORE INTO completed_labs (user_id, lab_id) VALUES (?, ?)",
                    [user_id, 1]
                );
            }
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
