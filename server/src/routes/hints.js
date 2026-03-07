const express = require('express');
const router = express.Router();
const { platformDB } = require('../database/connection');

// Securely stored hints on the backend
const LAB_HINTS = {
    5: {
        delays: { 1: 10 * 60 * 1000, 2: 30 * 60 * 1000, 3: 60 * 60 * 1000 },
        text: {
            1: "Open DevTools (F12), go to the Network tab, and click the Export button. Look at the API URL. Notice the 'user_id' parameter?",
            2: "You cannot change the parameter in the UI. You must right-click the request in the Network tab, select 'Copy as Fetch', paste it into your console, and manually change the ID.",
            3: "The CEO is User ID 2. Replay the export request with 'user_id=2'. View the raw JSON response payload to find the flag."
        }
    },
    6: {
        delays: { 1: 10 * 60 * 1000, 2: 30 * 60 * 1000, 3: 60 * 60 * 1000, 4: 90 * 60 * 1000 },
        text: {
            1: "The 'Run System Backup' button triggers an API call. Open DevTools (F12 -> Network Tab) and inspect what data comes back from the server.",
            2: "You found hashes, but they're salted. The application loads a JavaScript configuration file from the server. Try inspecting the Network tab for a `.js` file that might contain the salt and algorithm.",
            3: "The algorithm is MD5 and the salt is appended after the password: MD5(password + salt). Search online for 'rockyou.txt' or a common passwords wordlist, then write a script to hash each word with the salt until you find a match.",
            4: "Use the Admin Panel tab to log in with the cracked password. The username is 'admin'."
        }
    }
};

// POST /api/hints/start
// Records the exact time a user starts a lab
router.post('/start', (req, res) => {
    const { labId, userId } = req.body;

    if (!labId || !userId) {
        return res.status(400).json({ error: 'Missing labId or userId.' });
    }

    // Insert or Ignore ensures we only capture their FIRST start time for this lab
    const query = `
        INSERT OR IGNORE INTO lab_starts (user_id, lab_id, started_at) 
        VALUES (?, ?, CURRENT_TIMESTAMP)
    `;

    platformDB.run(query, [userId, labId], function (err) {
        if (err) {
            console.error('Error recording lab start:', err.message);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json({ success: true, message: 'Lab start time recorded.' });
    });
});

// GET /api/hints/:labId/status?user_id=...
// Returns how much time has elapsed since the user started the lab
router.get('/:labId/status', (req, res) => {
    const labId = parseInt(req.params.labId, 10);
    const userId = req.query.user_id;

    if (!userId) {
        return res.status(400).json({ error: 'user_id is required' });
    }

    if (!LAB_HINTS[labId]) {
        return res.status(404).json({ error: 'No hints configured for this lab.' });
    }

    const query = `SELECT strftime('%s', CURRENT_TIMESTAMP) - strftime('%s', started_at) AS elapsed_seconds FROM lab_starts WHERE user_id = ? AND lab_id = ?`;

    platformDB.get(query, [userId, labId], (err, row) => {
        if (err) return res.status(500).json({ error: 'Database error' });

        if (!row) {
            // User hasn't "started" the lab explicitly via the API yet
            return res.json({ elapsed_ms: 0, delays: LAB_HINTS[labId].delays });
        }

        const elapsedMs = row.elapsed_seconds * 1000;
        res.json({ elapsed_ms: elapsedMs, delays: LAB_HINTS[labId].delays });
    });
});

// GET /api/hints/:labId/:hintId?user_id=...
// Securely fetch a hint, but only if enough time has passed
router.get('/:labId/:hintId', (req, res) => {
    const labId = parseInt(req.params.labId, 10);
    const hintId = parseInt(req.params.hintId, 10);
    const userId = req.query.user_id;

    if (!userId) {
        return res.status(400).json({ error: 'user_id query parameter required' });
    }

    const labConfig = LAB_HINTS[labId];
    if (!labConfig || !labConfig.text[hintId]) {
        return res.status(404).json({ error: 'Hint not found' });
    }

    // Check time
    const query = `SELECT strftime('%s', CURRENT_TIMESTAMP) - strftime('%s', started_at) AS elapsed_seconds FROM lab_starts WHERE user_id = ? AND lab_id = ?`;

    platformDB.get(query, [userId, labId], (err, row) => {
        if (err) return res.status(500).json({ error: 'Database error' });

        const requiredDelayMs = labConfig.delays[hintId];

        if (!row) {
            return res.status(425).json({ error: 'Too Early. Lab start time not found or timer has not elapsed.', required_delay_ms: requiredDelayMs });
        }

        const elapsedMs = row.elapsed_seconds * 1000;

        if (elapsedMs < requiredDelayMs) {
            return res.status(425).json({
                error: 'Too Early. Hint is time-gated.',
                elapsed_ms: elapsedMs,
                required_delay_ms: requiredDelayMs
            });
        }

        // Passed security check
        res.json({ success: true, hint: labConfig.text[hintId] });
    });
});

module.exports = router;
