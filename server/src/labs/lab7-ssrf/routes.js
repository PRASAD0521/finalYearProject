const express = require('express');
const router = express.Router();

// ─── Helpers ────────────────────────────────────────────────────────────────

function slugToName(slug) {
    return slug
        .replace(/[_-]+/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase())
        .trim();
}

function isInternalUrl(url) {
    try {
        const { hostname } = new URL(url);
        return (
            hostname === 'localhost' ||
            hostname === '127.0.0.1' ||
            hostname === '::1' ||
            hostname.startsWith('192.168.') ||
            hostname.startsWith('10.') ||
            hostname.startsWith('172.16.') ||
            hostname.startsWith('172.17.') ||
            hostname.startsWith('172.18.') ||
            hostname.startsWith('172.19.') ||
            hostname.startsWith('172.2') ||
            hostname.startsWith('172.3') ||
            hostname === '0.0.0.0' ||
            hostname === '169.254.169.254'
        );
    } catch { return false; }
}

function isLinkedInProfile(url) {
    try {
        const { hostname, pathname } = new URL(url);
        return (
            (hostname === 'www.linkedin.com' || hostname === 'linkedin.com') &&
            pathname.startsWith('/in/')
        );
    } catch { return false; }
}

// ─── POST /import-profile ────────────────────────────────────────────────────
router.post('/import-profile', async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    // ── Case 1: LinkedIn profile URL → simulated profile response
    if (isLinkedInProfile(url)) {
        const match = url.match(/linkedin\.com\/in\/([^\/\?#]+)/);
        const slug = match ? match[1] : 'user';
        const name = slugToName(slug);
        const emailSlug = slug.replace(/[^a-z0-9]/gi, '.').toLowerCase();

        const simulatedProfile = {
            name,
            email: `${emailSlug}@gmail.com`,
            phone: '+91 98765 43210',
            location: 'Hyderabad, Telangana, India',
            current_role: 'Software Engineer',
            current_company: 'TechSolutions Pvt Ltd',
            years_experience: '3',
            skills: 'JavaScript, React, Node.js, Python, SQL, Docker',
            education_degree: 'B.Tech Computer Science',
            education_institution: 'VIIT University',
            education_year: '2022',
            headline: 'Software Engineer | Full Stack Developer | Open to Opportunities',
        };

        return res.json({
            success: true,
            status: 200,
            contentType: 'application/json',
            simulated: true,
            data: JSON.stringify(simulatedProfile)
        });
    }

    // ── Case 2: Internal / private IP → fetch directly (SSRF vector)
    if (isInternalUrl(url)) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 4000);

            const response = await fetch(url, {
                method: 'GET',
                headers: { 'User-Agent': 'HirePort-ProfileImporter/1.0' },
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            const bodyText = await response.text();
            const contentType = response.headers.get('content-type') || 'text/plain';

            return res.json({
                success: true,
                status: response.status,
                contentType,
                simulated: false,
                data: bodyText
            });
        } catch (err) {
            return res.status(500).json({
                success: false,
                error: 'Failed to fetch URL',
                details: err.message
            });
        }
    }

    // ── Case 3: All other external URLs → unsupported
    return res.status(422).json({
        success: false,
        error: 'Unsupported URL. Only LinkedIn profiles and direct API endpoints are supported.'
    });
});

// ─── POST /verify-flag ───────────────────────────────────────────────────────
router.post('/verify-flag', (req, res) => {
    const { flag } = req.body;
    if (flag && flag.trim() === 'FLAG{ssrf_internal_config_exposed_07}') {
        return res.json({ success: true, message: 'Correct! You successfully exploited SSRF.' });
    }
    res.status(400).json({ success: false, message: 'Incorrect flag. Keep exploring the internal API.' });
});

module.exports = router;
