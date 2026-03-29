const express = require('express');
const router = express.Router();

// Middleware to strictly check IP for localhost
const requireLocalhost = (req, res, next) => {
    const ip = req.connection.remoteAddress || req.ip;
    // Basic IP check for localhost representations
    if (ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1') {
        next();
    } else {
        res.status(403).json({ error: "403 Forbidden: Access Restricted to Internal Network Only" });
    }
};

router.use(requireLocalhost);

const internalIndex = (req, res) => {
    res.json({
        status: "National e-Aadhaar Internal API v2",
        documentation: [
            "/api/internal/health",
            "/api/internal/uidai-sync",
            "/api/internal/master-admin-token"
        ]
    });
};

router.get('/', internalIndex);
router.get('', internalIndex);

router.get('/health', (req, res) => res.json({ status: "UIDAI Sync Nominal", uptime: process.uptime() }));
router.get('/uidai-sync', (req, res) => res.json({ connected: true, pendingRequests: 42 }));

router.get('/master-admin-token', (req, res) => {
    res.json({
        success: true,
        adminToken: 'UIDAI_admin_master_key_9921',
        flag: 'FLAG{ssrf_uidai_admin_bypass_01}'
    });
});

module.exports = router;
