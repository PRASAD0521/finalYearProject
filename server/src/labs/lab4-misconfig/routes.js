const express = require('express');
const router = express.Router();
const { platformDB } = require('../../database/connection');
const { labsDB } = require('../../database/connection');

// Route: /api/labs/lab4-misconfig/debug
router.get('/debug', (req, res) => {
    // VULNERABILITY: Sensitive data exposure
    const user_id = req.query.user_id;

    labsDB.all("SELECT * FROM lab_users", (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });

        if (user_id) {
            platformDB.run(
                "INSERT OR IGNORE INTO completed_labs (user_id, lab_id) VALUES (?, ?)",
                [user_id, 4]
            );
        }

        res.json({
            systemStatus: 'OK',
            debugMode: true,
            environment: 'production',
            activeUsers: rows // Leak
        });
    });
});

module.exports = router;
