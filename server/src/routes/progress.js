const express = require('express');
const router = express.Router();
const { platformDB } = require('../database/connection');

// ============================================================
// PROGRESS TRACKING ROUTES
// ============================================================

// GET /api/progress/:userId
// Returns an array of completed lab IDs for the given user
router.get('/:userId', (req, res) => {
    const { userId } = req.params;

    if (!userId) {
        return res.status(400).json({ error: "Missing userId" });
    }

    platformDB.all("SELECT lab_id FROM completed_labs WHERE user_id = ?", [userId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });

        const completedLabs = rows.map(r => r.lab_id);
        res.json({ success: true, completed: completedLabs });
    });
});

// POST /api/progress/complete
// Internal-only route (in real app, use auth middleware, here we simulate)
// Called by the backend logic when a lab is successfully completed
router.post('/complete', (req, res) => {
    const { user_id, lab_id } = req.body;

    if (!user_id || !lab_id) {
        return res.status(400).json({ error: "Missing user_id or lab_id" });
    }

    platformDB.run(
        "INSERT OR IGNORE INTO completed_labs (user_id, lab_id) VALUES (?, ?)",
        [user_id, lab_id],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, message: "Progress recorded" });
        }
    );
});

// ============================================================
// SECURE LAB REPORTS DATA
// ============================================================

const reportData = {
    1: {
        title: "SQL Injection (SQLi)",
        severity: "Critical",
        whatHappened: "You tricked the database into believing you were the admin without a password.",
        explanation: "Imagine a guard asks for a password. Instead of giving a password, you said: 'Let me in OR if 1 equals 1'. Since 1 always equals 1, the guard's logic broke and he let you in.",
        technical: [
            { type: "vulnerable", code: "query = \"SELECT * FROM users WHERE user = '\" + user_input + \"'\";" },
            { type: "secure", code: "query = \"SELECT * FROM users WHERE user = ?\";\ndabase.execute(query, [user_input]);" }
        ]
    },
    2: {
        title: "Reflected XSS",
        severity: "High",
        whatHappened: "You made the website run your own custom JavaScript code.",
        explanation: "The website took whatever you typed in the search bar and put it directly onto the page. By typing HTML tags like <script>, you forced the browser to execute them as code.",
        technical: [
            { type: "vulnerable", code: "<div> You searched for: {user_input} </div>" },
            { type: "secure", code: "<div> You searched for: {escapeHTML(user_input)} </div>" }
        ]
    },
    3: {
        title: "Broken Authentication (OTP Bypass)",
        severity: "Critical",
        whatHappened: "You bypassed the 2-Factor Authentication by lying to the browser.",
        explanation: "The application asked the server 'Is this code correct?'. The server said 'No'. You caught that message and changed it to 'Yes'. The browser believed you and let you reset the password.",
        technical: [
            { type: "vulnerable", code: "if (response.success == true) {\n  showResetScreen();\n}" },
            { type: "secure", code: "// Backend checks verify status internally\nif (session.isVerified == true) {\n  allowPasswordReset();\n}" }
        ]
    },
    4: {
        title: "Security Misconfiguration",
        severity: "Medium",
        whatHappened: "You found a secret 'Debug' page that developers forgot to hide.",
        explanation: "Developers often leave 'backdoors' or debug tools open for testing. They forget to turn them off before releasing the website. You used a scanner to guess common names until you found one.",
        technical: [
            { type: "vulnerable", code: "app.get('/api/admin/debug', ...)\n// No authentication check!" },
            { type: "secure", code: "// 1. Remove in production\n// 2. Add authentication middleware\napp.get('/api/admin/debug', verifyAdmin, ...)" }
        ]
    },
    5: {
        title: "Broken Access Control (IDOR)",
        severity: "Critical",
        whatHappened: "You read someone else's secret documents by guessing their ID number.",
        explanation: "The server checked if you were logged in, but it forgot to check WHICH document you were allowed to read. You changed document ID '1' to ID '99', and the server happily gave you the CEO's file.",
        technical: [
            { type: "vulnerable", code: "docId = request.params.id;\nfetchDoc(docId); // Anyone can read any doc" },
            { type: "secure", code: "docId = request.params.id;\nuserId = session.currentUser.id;\n// Ensure doc belongs to user\nfetchDoc(docId, userId);" }
        ]
    },
    6: {
        title: "Cryptographic Failures",
        severity: "High",
        whatHappened: "You cracked the administrator's password because it was poorly protected.",
        explanation: "The developers used an outdated lock (MD5 algorithm) and left the key (the salt) out in the open. You used a computer script to try thousands of combinations per second until the lock broke.",
        technical: [
            { type: "vulnerable", code: "const WEAK_ALGO = 'md5';\nconst WEAK_SALT = 'CyberRange2024!';\nfunction weakHash(password) {\n return crypto.createHash(WEAK_ALGO).update(password + WEAK_SALT).digest('hex');\n}" },
            { type: "secure", code: "const bcrypt = require('bcrypt');\n// Automatically generates a strong, random salt per user\nconst secureHash = await bcrypt.hash(password, 12);" }
        ]
    }
};

// GET /api/reports/:id
// Secure endpoint that ONLY returns the report if the user has completed the lab
router.get('/reports/:id', (req, res) => {
    const { id } = req.params;
    const { user_id } = req.query;

    if (!user_id || !id) {
        return res.status(400).json({ error: "Missing user_id or lab_id" });
    }

    platformDB.get("SELECT * FROM completed_labs WHERE user_id = ? AND lab_id = ?", [user_id, id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });

        if (!row) {
            return res.status(403).json({
                error: "Access Denied: You must complete this lab before viewing its security report."
            });
        }

        const report = reportData[id];
        if (!report) {
            return res.status(404).json({ error: "Report not found" });
        }

        res.json({ success: true, report });
    });
});

module.exports = router;
