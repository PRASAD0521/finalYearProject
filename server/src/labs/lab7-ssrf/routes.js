const express = require('express');
const router = express.Router();

// Vulnerable SSRF endpoint
router.post('/verify-document', async (req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ error: "URL is required" });
    }

    try {
        // Wait up to 3000ms
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        // Native fetch available in Node.js 18+
        const response = await fetch(url, {
            method: 'GET',
            headers: { 'User-Agent': 'UIDAI-eKYC-Verifier/2.0' },
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        // We return the raw text to the user
        const bodyText = await response.text();

        let contentType = response.headers.get('content-type') || 'text/plain';
        res.json({
            success: true,
            status: response.status,
            contentType: contentType,
            data: bodyText
        });

    } catch (err) {
        // We leak connection errors simulating a verbose fetch block
        res.status(500).json({
            success: false,
            error: "Failed to fetch resource",
            details: err.message
        });
    }
});

// The Mock Admin Database Dump (Only accessible if they provide the token)
router.post('/admin/db', (req, res) => {
    const { token } = req.body;

    if (token !== 'UIDAI_admin_master_key_9921') {
        return res.status(401).json({ error: "Unauthorized. Invalid UIDAI Master Key." });
    }

    // Return fake Aadhaar database dump
    const fakeDb = {
        citizens: [
            { aadhaar: "xxxx-xxxx-1092", name: "Anil Kumar", dob: "1985-04-12", phone: "+91-9876543210" },
            { aadhaar: "xxxx-xxxx-4431", name: "Priya Sharma", dob: "1992-11-05", phone: "+91-8765432109" },
            { aadhaar: "xxxx-xxxx-9811", name: "Rahul Singh", dob: "1978-08-22", phone: "+91-7654321098" }
        ],
        system_secrets: {
            auth_gateway: "https://auth.uidai.internal.gov.in",
            encryption_key: "AES256-GCM-K1: a7b2c9d4e1f5...",
            flag: "FLAG{ssrf_national_database_breach_level_9}"
        }
    };

    res.json({ success: true, database: fakeDb });
});

module.exports = router;
