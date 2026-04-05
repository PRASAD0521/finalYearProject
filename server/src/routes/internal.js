const express = require('express');
const router = express.Router();

// ─── IP Guard ───────────────────────────────────────────────────────────────
// This middleware simulates a private network firewall.
// In production, these routes would only be reachable from inside the company.
// Students exploit SSRF to make the server fetch these on their behalf.
const requireInternalNetwork = (req, res, next) => {
    const ip = req.connection?.remoteAddress || req.socket?.remoteAddress || req.ip || '';
    const isLocal = ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1';
    if (isLocal) return next();
    res.status(403).json({
        error: '403 Forbidden',
        message: 'This API is restricted to the HirePort internal network. Not accessible from the internet.'
    });
};

router.use(requireInternalNetwork);

// ─── GET /api/internal/ — Internal API Index ────────────────────────────────
const internalIndex = (req, res) => {
    res.json({
        service: 'HirePort Internal Services API',
        version: '2.3.1',
        environment: 'production',
        note: 'This API is restricted to the internal HirePort network. If you can read this, something is wrong.',
        available_routes: [
            'GET /api/internal/employees',
            'GET /api/internal/server-config'
        ]
    });
};

router.get('/', internalIndex);
router.get('', internalIndex);

// ─── GET /api/internal/employees — Internal Staff Directory ─────────────────
router.get('/employees', (req, res) => {
    res.json({
        department: 'HirePort Engineering',
        note: 'Production database and app configuration is managed by the DevOps team. See /server-config.',
        staff: [
            { name: 'Rohan Verma',  role: 'Backend Engineer',  email: 'rohan@hireport.internal',  joined: '2022-03-15' },
            { name: 'Sneha Das',    role: 'DevOps Lead',        email: 'sneha@hireport.internal',  joined: '2021-08-01' },
            { name: 'Arvind Kumar', role: 'Security Engineer',  email: 'arvind@hireport.internal', joined: '2023-01-10' },
            { name: 'Priya Menon',  role: 'Frontend Engineer',  email: 'priya@hireport.internal',  joined: '2022-11-22' }
        ]
    });
});

// ─── GET /api/internal/server-config — Production Secrets (jackpot) ─────────
router.get('/server-config', (req, res) => {
    res.json({
        environment: 'production',
        database_url: 'postgres://hireport_app:Str0ng_DB_P@ss!@db.hireport.internal:5432/hireport_prod',
        jwt_secret: 'hireport_jwt_master_secret_2026_do_not_share',
        resume_storage: 's3://hireport-resumes-prod/uploads',
        email_api_key: 'SG.xK9mP2nQrT5vW8yZ-EXAMPLE',
        flag: 'FLAG{ssrf_internal_config_exposed_07}'
    });
});

// ─── GET /api/internal/health ────────────────────────────────────────────────
router.get('/health', (req, res) => {
    res.json({ status: 'ok', uptime: process.uptime(), service: 'HirePort Internal API' });
});

module.exports = router;
