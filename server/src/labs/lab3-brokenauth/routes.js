const express = require('express');
const router = express.Router();
const { labsDB } = require('../../database/connection');

// Route: /api/labs/lab3-brokenauth/...

// 1. Generate OTP
router.post('/otp-generate', (req, res) => {
    const { username } = req.body;
    if (!username) return res.status(400).json({ message: 'Username required' });

    const query = `SELECT * FROM lab_users WHERE username = '${username}'`;
    labsDB.get(query, (err, row) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        if (!row) return res.status(404).json({ message: 'User not found' });

        console.log(`[Lab3] Generated OTP for ${username}: 999999`);
        res.json({ success: true, message: `OTP sent to ${username}@example.com` });
    });
});

// 2. Verify OTP (Vulnerable to Response Manipulation)
router.post('/otp-verify', (req, res) => {
    const { otp } = req.body;
    if (otp === '999999') {
        res.json({ success: true, message: 'OTP Verified' });
    } else {
        // Vulnerable: Returns 200 OK with success:false
        res.status(200).json({ success: false, message: 'Invalid OTP' });
    }
});

// 3. Reset Password (Broken Access Control)
router.post('/reset-password', (req, res) => {
    const { username, newPassword } = req.body;

    // Vulnerability: No session check!
    const query = `UPDATE lab_users SET password = '${newPassword}' WHERE username = '${username}'`;

    labsDB.run(query, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes > 0) {
            res.json({ success: true, message: `Password for ${username} reset successfully.` });
        } else {
            res.status(404).json({ success: false, message: 'User not found' });
        }
    });
});

module.exports = router;
