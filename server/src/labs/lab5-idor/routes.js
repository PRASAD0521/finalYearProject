const express = require('express');
const router = express.Router();
const { platformDB, playgroundDB } = require('../../database/connection');

// ============================================================
// LAB 5: BROKEN ACCESS CONTROL (IDOR)
// ============================================================

// Simulated "Current Login" middleware logic
// For this lab, the user is always considered User ID 1 (john_doe equivalent)
const MOCK_USER_ID = 1;

// GET /api/labs/lab5/documents
// Returns metadata for documents belonging to the "current" user
router.get('/documents', (req, res) => {
    // This is SECURE: It only fetches documents belonging to MOCK_USER_ID
    const query = "SELECT id, title, is_secret FROM lab5_documents WHERE user_id = ?";

    playgroundDB.all(query, [MOCK_USER_ID], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });

        // Remove the is_secret flag from the metadata response so we don't leak it early
        const cleanRows = rows.map(r => ({ id: r.id, title: r.title }));
        res.json(cleanRows);
    });
});

// GET /api/labs/lab5/documents/:id
// The "Front Door" - PROPERLY SECURED
router.get('/documents/:id', (req, res) => {
    const docId = req.params.id;

    // Fetch the document
    const query = "SELECT * FROM lab5_documents WHERE id = ?";

    playgroundDB.get(query, [docId], (err, doc) => {
        if (err) return res.status(500).json({ error: err.message });

        if (!doc) {
            return res.status(404).json({ error: "Document not found." });
        }

        // --- THE SECURE CHECK ---
        // Verify the requested document actually belongs to the logged-in user
        if (doc.user_id !== MOCK_USER_ID) {
            return res.status(403).json({
                error: "403 Forbidden. You are not authorized to view this document."
            });
        }
        // ------------------------

        res.json({
            success: true,
            document: {
                id: doc.id,
                title: doc.title,
                content: doc.content
            }
        });
    });
});

// GET /api/labs/lab5/export
// The "Backdoor" - VULNERABLE TO IDOR (Inconsistent Authorization)
// Developers protected the main route but forgot this secondary export feature.
router.get('/export', (req, res) => {
    const targetUserId = parseInt(req.query.user_id, 10);

    if (!targetUserId) {
        return res.status(400).json({ error: "Missing user_id parameter for export." });
    }

    // --- THE VULNERABLE LOGIC ---
    // The query fetches all documents for the requested user_id, but COMPLETELY FAILS 
    // to check if targetUserId === MOCK_USER_ID.
    const query = "SELECT id, title, content, is_secret FROM lab5_documents WHERE user_id = ?";

    playgroundDB.all(query, [targetUserId], (err, docs) => {
        if (err) return res.status(500).json({ error: err.message });

        // Check if they successfully IDOR'd into User 2 (The CEO)
        if (targetUserId === 2 && docs.some(d => d.is_secret)) {
            console.log(`[Lab 5] IDOR Exploited! Export feature abused to leak User 2's data.`);

            playgroundDB.get("SELECT flag_code FROM pg_flags WHERE challenge_id = 'LAB5_IDOR'", (ferr, flagRow) => {
                res.json({
                    success: true,
                    flagCaptured: true,
                    flagMessage: "CRITICAL BUSINESS DATA EXFILTRATED. You bypassed the main API security by finding a secondary 'Export' endpoint that lacked authorization checks.",
                    flag: flagRow ? flagRow.flag_code : "FLAG{idor_api_bypass_77}",
                    exported_data: docs
                });
            });
            return;
        }

        // Standard response for legitimately exporting their own data
        res.json({
            success: true,
            exported_data: docs
        });
    });
});

// POST /api/labs/lab5-idor/verify
// Secure flag validation endpoint
router.post('/verify', (req, res) => {
    const { flag, user_id } = req.body;

    playgroundDB.get(
        "SELECT * FROM pg_flags WHERE challenge_id = 'LAB5_IDOR' AND flag_code = ?",
        [flag],
        (err, row) => {
            if (err) return res.status(500).json({ error: err.message });

            if (row || flag === 'FLAG{idor_api_bypass_77}') {
                if (user_id) {
                    platformDB.run(
                        "INSERT OR IGNORE INTO completed_labs (user_id, lab_id) VALUES (?, ?)",
                        [user_id, 5]
                    );
                }
                res.json({ success: true, message: 'Flag verified successfully!' });
            } else {
                res.status(400).json({ success: false, error: 'Incorrect flag. Try accessing different documents or API endpoints.' });
            }
        }
    );
});

module.exports = router;
