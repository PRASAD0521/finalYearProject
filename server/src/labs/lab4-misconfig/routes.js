const express = require('express');
const router = express.Router();
const { labsDB } = require('../../database/connection');

// Route: /api/labs/lab4-misconfig/debug
router.get('/debug', (req, res) => {
    // VULNERABILITY: Sensitive data exposure
    labsDB.all("SELECT * FROM lab_users", (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({
            systemStatus: 'OK',
            debugMode: true,
            environment: 'production',
            activeUsers: rows // Leak
        });
    });
});

module.exports = router;
