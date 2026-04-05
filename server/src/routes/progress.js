const express = require('express');
const router = express.Router();
const { platformDB } = require('../database/connection');

// ============================================================
// PROGRESS TRACKING ROUTES
// ============================================================

// GET /api/progress/:userId
// Returns an array of completed lab IDs for the given user
router.get('/progress/:userId', (req, res) => {
    const { userId } = req.params;

    if (!userId) {
        return res.status(400).json({ error: "Missing userId" });
    }

    platformDB.all("SELECT * FROM completed_labs WHERE user_id = ?", [userId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });

        const progressMap = {};
        rows.forEach(r => {
            progressMap[r.lab_id] = {
                completed: true,
                timeTaken: r.time_taken_seconds,
                hintsUsed: r.hints_used,
                revelationScore: r.revelation_score,
                tokensConsumed: r.tokens_consumed,
                finalScore: r.final_score
            };
        });
        
        res.json({ success: true, progressMap });
    });
});

// POST /api/progress/complete
// Internal-only route (in real app, use auth middleware, here we simulate)
// Called by the backend logic when a lab is successfully completed
router.post('/progress/complete', (req, res) => {
    const { user_id, lab_id, timeTaken = 0, hintsUsed = 0, revelationScore = 0, tokensConsumed = 0 } = req.body;

    if (!user_id || !lab_id) {
        return res.status(400).json({ error: "Missing user_id or lab_id" });
    }

    // Dynamic Scoring Algorithmic Engine
    const BASE_SCORE = 1000;
    const timePenalty = Math.min(150, Math.floor(Math.max(0, timeTaken - 300) / 10));
    const hintsPenalty = hintsUsed * 50;
    const AIRevPenalty = revelationScore * 2;
    const AITokenPenalty = Math.floor(tokensConsumed / 50);

    const totalPenalty = timePenalty + hintsPenalty + AIRevPenalty + AITokenPenalty;
    const finalScore = Math.max(0, BASE_SCORE - totalPenalty);

    platformDB.run(
        `INSERT INTO completed_labs (user_id, lab_id, time_taken_seconds, hints_used, revelation_score, tokens_consumed, final_score) 
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(user_id, lab_id) DO UPDATE SET 
         time_taken_seconds=excluded.time_taken_seconds, 
         hints_used=excluded.hints_used, 
         revelation_score=excluded.revelation_score, 
         tokens_consumed=excluded.tokens_consumed, 
         final_score=excluded.final_score
         WHERE excluded.final_score > completed_labs.final_score`,
        [user_id, lab_id, timeTaken, hintsUsed, revelationScore, tokensConsumed, finalScore],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ 
                success: true, 
                message: "Progress and telemetry recorded",
                finalScore,
                breakdown: { timePenalty, hintsPenalty, AIRevPenalty, AITokenPenalty }
            });
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
        owasp: "OWASP A03:2021 - Injection",
        whatHappened: "You tricked the database into believing you were the admin by altering the fundamental backend query structure using unescaped syntax.",
        explanation: "Imagine a guard asks for a password. Instead of just giving a password, you gave them an entirely new mathematical instruction: 'Let me in OR if 1 equals 1'. Since 1 always equals 1, the guard's logic bypassed the password requirement entirely.",
        technical: [
            { type: "vulnerable", code: "const query = \"SELECT * FROM users WHERE username = '\" + user_input + \"'\";\ndb.execute(query);\n// Direct string concatenation allows attackers to inject logic." },
            { type: "secure", code: "const query = \"SELECT * FROM users WHERE username = ?\";\n// Parameterized Queries treat user input strictly as text, never as executable code.\ndb.execute(query, [user_input]);" }
        ]
    },
    2: {
        title: "Reflected Cross-Site Scripting (XSS)",
        severity: "High",
        owasp: "OWASP A03:2021 - Injection",
        whatHappened: "You successfully injected a malicious JavaScript payload that was reflected directly back into the DOM without sanitization.",
        explanation: "The web application blindly trusted your URL input and rendered it as HTML. By wrapping your code in <script> tags, you forced the victim's browser to execute the payload within the trusted context of the site.",
        technical: [
            { type: "vulnerable", code: "// React.js Vulnerability Example (Dangerously Set innerHTML)\n<div dangerouslySetInnerHTML={{ __html: `You searched for: ${user_input}` }} />\n// OR Express.js: res.send(`<h1>${user_input}</h1>`);" },
            { type: "secure", code: "// React.js automatically escapes text nodes by default:\n<div>You searched for: {user_input}</div>\n\n// If HTML rendering is required, use a strict sanitizer:\nimport DOMPurify from 'dompurify';\n<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(user_input) }} />" }
        ]
    },
    3: {
        title: "Broken Authentication (OTP Bypass)",
        severity: "Critical",
        owasp: "OWASP A07:2021 - Identification and Authentication Failures",
        whatHappened: "You completely bypassed the 2-Factor Authentication mechanism by manipulating the client-side authorization state.",
        explanation: "The application checked the OTP but mistakenly allowed the web browser to decide what happened next. By intercepting the server's 'Failure' response and manually rewriting it to 'Success', the frontend erroneously granted you access.",
        technical: [
            { type: "vulnerable", code: "// Client-Side Vulnerability\nif (apiResponse.status === 'success') {\n  unlockAccount(); // Never trust the client!\n}" },
            { type: "secure", code: "// Server-Side Remediation\n// The server must establish a secure session token internally upon verification\nif (req.session.isOTPVerified === true) {\n  allowPasswordReset(req.user);\n}" }
        ]
    },
    4: {
        title: "Security Misconfiguration (Chained Exploitation)",
        severity: "Critical",
        owasp: "OWASP A05:2021 - Security Misconfiguration",
        whatHappened: "You exploited a verbose Express.js error handler to perfectly map the backend database schema, which you then used to craft a precision UNION-based SQL Injection attack.",
        explanation: "By deliberately sending an invalid payload, you caused the backend database parser to crash. Because the developers left 'Debug Mode' enabled in production, the application dumped its raw stack trace directly to your browser. This stack trace contained the exact, vulnerable SQL query being executed. You chained this misconfiguration (A05) into an Injection attack (A03) by using the leaked table and column names to meticulously extract the hidden Admin secret key.",
        technical: [
            { type: "vulnerable", code: "// 1. Leaking the Stack Trace (Misconfiguration)\napp.use((err, req, res, next) => {\n  // NEVER return err.stack in production!\n  res.status(500).json({ error: err.message, stack: err.stack });\n});\n\n// 2. The Leaked Vulnerability (SQL Injection)\nconst sql = `SELECT id, name, email FROM beta_users WHERE id = '${req.body.id}'`;" },
            { type: "secure", code: "// Secure Remediation\n// 1. Sanitize Errors: Ensure NODE_ENV=production so Express hides stack traces.\napp.use((err, req, res, next) => {\n  res.status(500).json({ error: 'Internal Server Error' }); \n});\n\n// 2. Fix SQLi with Parameterized Queries\nconst sql = `SELECT id, name, email FROM beta_users WHERE id = ?`;\ndb.all(sql, [req.body.id], ...);" }
        ]
    },
    5: {
        title: "Broken Access Control (IDOR)",
        severity: "Critical",
        owasp: "OWASP A01:2021 - Broken Access Control",
        whatHappened: "You exploited an Insecure Direct Object Reference (IDOR) to sequentially access sensitive network topology files belonging to another administrative user.",
        explanation: "The web application relied solely on the fact that you had an active session. It requested the Document ID directly from the database without verifying if the currently authenticated user actually owned or had privileges to view that specific record. By simply incrementing the ID parameter in the UI, you hijacked the target file.",
        technical: [
            { type: "vulnerable", code: "// Route handles request but lacks ownership validation\napp.get('/api/docs/:id', (req, res) => {\n  const doc = db.find({ id: req.params.id });\n  res.send(doc); // Blindly returns the document\n});" },
            { type: "secure", code: "// Secure Remediation: Map Objects to Identity Context\napp.get('/api/docs/:id', (req, res) => {\n  const userId = req.session.user.id;  // Trust only backend session!\n  const doc = db.find({ id: req.params.id, owner_id: userId });\n  if(!doc) return res.sendStatus(403);\n  res.send(doc);\n});" }
        ]
    },
    6: {
        title: "Cryptographic Failures (Weak Hashing)",
        severity: "High",
        owasp: "OWASP A02:2021 - Cryptographic Failures",
        whatHappened: "You successfully cracked a leaked administrative password hash by exploiting a weak algorithm and a static, hardcoded salt.",
        explanation: "The application used MD5, a deprecated and vulnerable hashing algorithm, combined with a single static salt ('CyberRange2024!') for all users. Because MD5 is designed to be fast, you were able to run a dictionary attack computing thousands of hashes per second until you found a matching plaintext password.",
        technical: [
            { type: "vulnerable", code: "// Weak Crypto: Fast hashing algorithm + Global static salt\nconst WEAK_ALGO = 'md5';\nconst WEAK_SALT = 'CyberRange2024!';\nfunction hashPassword(password) {\n  return crypto.createHash(WEAK_ALGO).update(password + WEAK_SALT).digest('hex');\n}" },
            { type: "secure", code: "// Secure Crypto: Slow hashing function + Unique per-user salt\nconst bcrypt = require('bcrypt');\n\nasync function hashPassword(password) {\n  const saltRounds = 12;\n  return await bcrypt.hash(password, saltRounds); // Salt is auto-generated per user\n}" }
        ]
    },
    7: {
        title: "Server-Side Request Forgery (SSRF)",
        severity: "Critical",
        owasp: "OWASP A10:2021 - Server-Side Request Forgery",
        whatHappened: "You tricked the backend server into making an HTTP request to its own restricted internal API network.",
        explanation: "The application had a feature that fetched external URLs (like pulling an image or document from another server). However, it failed to validate whether the requested URL was an external public address or an internal private address. By instructing the server to fetch 'http://localhost' or 'http://127.0.0.1', you bypassed external firewalls and accessed the internal-only admin network.",
        technical: [
            { type: "vulnerable", code: "app.post('/api/fetch-url', async (req, res) => {\n  const userUrl = req.body.url;\n  // Blindly fetching whatever the user asks for\n  const response = await fetch(userUrl);\n  res.send(await response.text());\n});" },
            { type: "secure", code: "app.post('/api/fetch-url', async (req, res) => {\n  const parsedUrl = new URL(req.body.url);\n  // Reject internal loopback and private IPs\n  if (parsedUrl.hostname === 'localhost' || parsedUrl.hostname.startsWith('127.')) {\n    return res.status(403).send('Private network access forbidden');\n  }\n  // Note: True SSRF protection requires deep DNS resolution checks!\n});" }
        ]
    },
    8: {
        title: "Race Condition (TOCTOU)",
        severity: "High",
        owasp: "OWASP A04:2021 - Insecure Design",
        whatHappened: "You exploited a Time-Of-Check to Time-Of-Use (TOCTOU) race condition to claim a single-use subsidy multiple times.",
        explanation: "The application checked if you had claimed a subsidy, paused to verify external data, and then updated your status. By spamming the server with concurrent requests, multiple threads checked your status *before* the first thread could write the 'claimed' update to the database. They all saw 'No' and simultaneously granted you the money.",
        technical: [
            { type: "vulnerable", code: "// Vulnerable Asynchronous Logic (No Locking)\nif (user.claimed === false) {\n  await verifyBankDetails(); // Yields event loop\n  user.balance += 5000;\n  user.claimed = true;\n  await save(user);\n}" },
            { type: "secure", code: "// Secure Remediation: Atomic Database Operations\n// Use the database Engine's row-level locking or atomic updates\nconst result = await db.query(\n  'UPDATE subsidies SET claimed = true WHERE user_id = ? AND claimed = false',\n  [userId]\n);\nif (result.changes === 0) throw Error('Already claimed');" }
        ]
    },
    9: {
        title: "Rate Limit Evasion (WAF Bypass)",
        severity: "High",
        owasp: "OWASP A05:2021 - Security Misconfiguration",
        whatHappened: "You tricked the Web Application Firewall (WAF) Rate Limiter into thinking every failed PIN guess came from a completely different computer.",
        explanation: "When you connect to a server, your IP address is logged. However, large companies use Load Balancers (like AWS or Cloudflare) which route all traffic, meaning the server only sees the proxy's IP. To pass along the original user's IP, these proxies append a special HTTP header called 'X-Forwarded-For'. The developer built a Rate Limiter that trusted this text header blindly instead of validating if the request actually *came* from an authorized internal proxy. You simply forged a random IP in that header on every guess, bypassing the 3-attempt lock entirely.",
        technical: [
            { type: "vulnerable", code: "// Vulnerable: Blindly trusting easily forged headers\nconst clientIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress;\nif (failedAttempts[clientIP] > 3) blockIP(clientIP);" },
            { type: "secure", code: "// Secure: Tell the framework to ONLY trust X-Forwarded-For if it comes from the internal Load Balancer.\napp.set('trust proxy', '10.0.0.0/8');\nconst authoritativeIP = req.ip;" }
        ]
    },
    10: {
        title: "Whisper Wire: XOR Known-Plaintext Attack",
        severity: "Critical",
        whatHappened: "You successfully performed a Known-Plaintext Attack (KPA) to recover a session-specific XOR key. After decrypting the internal signals between Agent Alpha and Beta, you identified the specific command required for authorization and injected a forged packet to trigger the final flag drop.",
        explanation: "This simulation demonstrates a fundamental weakness in stream ciphers like XOR when reused without unique initialization vectors. If an attacker knows or can guess even a small part of the original message (the 'known plaintext'), they can apply simple bitwise math to extract the secret key. In this case, the predictable '[SYS] ' protocol header was the 'leaking' point that compromised the entire encrypted session.",
        technical: [
            { type: "vulnerable", code: "// VULNERABLE: Static XOR Stream Cipher\n// Property: Ciphertext XOR Plaintext = Key\nfunction encrypt(plaintext, key) {\n  return plaintext.split('').map((char, i) => {\n    return String.fromCharCode(char.charCodeAt(0) ^ key.charCodeAt(i % key.length));\n  }).join('');\n}" },
            { type: "secure", code: "// SECURE: Authenticated Encryption (AES-GCM)\n// Uses a unique Nonce/IV and provides data integrity (MAC).\nconst crypto = require('crypto');\nconst cipher = crypto.createCipheriv('aes-256-gcm', secureKey, uniqueIV);\nlet encrypted = cipher.update(plaintext, 'utf8', 'hex');\nencrypted += cipher.final('hex');\nconst tag = cipher.getAuthTag();" }
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

module.exports = { router, reportData };
