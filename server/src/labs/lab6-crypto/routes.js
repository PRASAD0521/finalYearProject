const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { playgroundDB } = require('../../database/connection');

// ============================================================
// LAB 6: CRYPTOGRAPHIC FAILURES
// ============================================================

// The weak hashing algorithm and salt used by this "company"
const WEAK_SALT = 'CyberRange2024!';
const WEAK_ALGO = 'md5';

function weakHash(password) {
    return crypto.createHash(WEAK_ALGO).update(password + WEAK_SALT).digest('hex');
}

// GET /api/labs/lab6-crypto/dashboard
// Returns the IT Operations "dashboard" data
router.get('/dashboard', (req, res) => {
    res.json({
        system: 'IT Operations Portal v2.3.1',
        status: 'Online',
        services: [
            { name: 'Email Server', status: 'Running', uptime: '99.7%' },
            { name: 'File Storage', status: 'Running', uptime: '99.9%' },
            { name: 'Database Cluster', status: 'Running', uptime: '98.2%' },
            { name: 'VPN Gateway', status: 'Degraded', uptime: '95.1%' },
            { name: 'Admin Panel', status: 'Locked', uptime: '100%' }
        ],
        lastBackup: '2025-12-15T03:00:00Z',
        alerts: 2
    });
});

// GET /api/labs/lab6-crypto/backup
// The leaked database backup containing admin password hashes
// This is the first piece of the puzzle the student must find
router.get('/backup', (req, res) => {
    playgroundDB.all("SELECT * FROM lab6_users", (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });

        res.json({
            backup_version: '2.3.1',
            backup_date: '2025-12-15T03:00:00Z',
            note: 'Automated nightly backup - DO NOT DISTRIBUTE',
            users: rows.map(u => ({
                id: u.id,
                username: u.username,
                role: u.role,
                password_hash: u.password_hash,
                hash_algorithm: 'proprietary',
                last_login: u.last_login
            }))
        });
    });
});

// GET /api/labs/lab6-crypto/dictionary
// The employee password policy dictionary
// A small list of ~50 common passwords, one of which is the admin password
router.get('/dictionary', (req, res) => {
    const dictionary = [
        'password', 'admin', '123456', 'password123', 'letmein',
        'welcome', 'monkey', 'dragon', 'master', 'qwerty',
        'login', 'abc123', 'starwars', 'trustno1', 'shadow',
        'iloveyou', 'sunshine', 'princess', 'football', 'charlie',
        'access', 'hello', 'batman', 'superman', 'michael',
        'ninja', 'mustang', 'passw0rd', 'P@ssw0rd', 'hunter2',
        'buster', 'soccer', 'harley', 'daniel', 'robert',
        'thomas', 'jordan', 'andrew', 'joshua', 'amanda',
        'summer', 'winter', 'spring', 'autumn', 'cyberrange',
        'secret', 'secure', 'letmein!', 'changeme', 'default'
    ];

    res.setHeader('Content-Type', 'text/plain');
    res.send(dictionary.join('\n'));
});

// GET /api/labs/lab6-crypto/config.js
// The "leaked" client-side config that exposes the salt and algorithm
// Students must find this by inspecting network traffic or page source
router.get('/config.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.send(`
// ================================================
// IT Operations Portal - Client Configuration
// Build: 2.3.1 | Environment: Production
// ================================================
// WARNING: Do not modify these values without approval
// from the IT Security team.
// ================================================

(function() {
    'use strict';
    
    var _0x4f2a = ['CyberRange2024!'];
    var _0x3b1c = function(_0x2d1e) { return _0x4f2a[_0x2d1e]; };
    
    window.ITOpsConfig = {
        apiBase: '/api/labs/lab6-crypto',
        version: '2.3.1',
        hashAlgorithm: 'md5',
        // Salt for password verification (client-side pre-hash)  
        passwordSalt: _0x3b1c(0),
        sessionTimeout: 30,
        maxRetries: 3
    };
})();
`);
});

// POST /api/labs/lab6-crypto/admin/login
// The admin login endpoint - needs the cracked plaintext password
router.post('/admin/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required.' });
    }

    const submittedHash = weakHash(password);

    playgroundDB.get(
        "SELECT * FROM lab6_users WHERE username = ? AND role = 'admin'",
        [username],
        (err, admin) => {
            if (err) return res.status(500).json({ error: err.message });

            if (!admin) {
                return res.status(401).json({ error: 'Invalid credentials. Access denied.' });
            }

            if (admin.password_hash !== submittedHash) {
                return res.status(401).json({ error: 'Invalid credentials. Access denied.' });
            }

            // SUCCESS - They cracked the hash!
            playgroundDB.get(
                "SELECT flag_code FROM pg_flags WHERE challenge_id = 'LAB6_CRYPTO'",
                (ferr, flagRow) => {
                    res.json({
                        success: true,
                        message: 'Administrator access granted.',
                        flag: flagRow ? flagRow.flag_code : 'FLAG{cr4ck3d_w34k_h4sh_88}',
                        classified_data: {
                            title: 'Project Nightfall - Board Meeting Notes',
                            content: 'CLASSIFIED: The board has approved the restructuring plan. 150 employees in the Mumbai and Bangalore offices will be affected. This information is embargoed until the Q1 earnings call on March 15th. Any premature leak could result in SEC violations and insider trading charges.',
                            author: 'CTO - Vikram Patel',
                            date: '2025-12-10'
                        }
                    });
                }
            );
        }
    );
});

module.exports = router;
