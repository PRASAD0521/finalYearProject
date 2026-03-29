const express = require('express');
const router = express.Router();

// Simulated In-Memory Database for rate limiting
// Structure: { [ipAddress]: { attempts: 0, locked: false } }
let rateLimiterDB = {};

const MAX_ATTEMPTS = 3;
const TARGET_PIN = "483"; // The secret 3-digit PIN

// Helper to extract IP (VULNERABLE ALGORITHM)
// A secure app would check if the request is actually coming from a trusted proxy before trusting X-Forwarded-For
const getClientIP = (req) => {
    // VULNERABILITY: Trusting X-Forwarded-For blindly allows IP spoofing
    const forwardedIpsStr = req.headers['x-forwarded-for'];
    if (forwardedIpsStr) {
        // 'x-forwarded-for' can contain a comma-separated list of IPs. 
        // We take the first one (the original client)
        const IP = forwardedIpsStr.split(',')[0].trim();
        return IP;
    }
    // Fallback if no header is provided
    return req.ip;
};

// 1. Get current status for the UI (Uses REAL ip to accurately show the student their actual attempts)
router.get('/status', (req, res) => {
    const realIp = req.ip;

    // We optionally use the header if they are trying to view the status as a spoofed user
    const ipToDisplay = getClientIP(req) || realIp;

    const record = rateLimiterDB[ipToDisplay] || { attempts: 0, locked: false };

    res.json({
        success: true,
        ip: ipToDisplay,
        attemptsRemaining: Math.max(0, MAX_ATTEMPTS - record.attempts),
        locked: record.locked
    });
});

// 2. The Vulnerable Verification Endpoint (The Target)
router.post('/verify', (req, res) => {
    const { pin } = req.body;

    // The attacker spoofs this by sending a custom header
    const clientIP = getClientIP(req);

    // Initialize tracking for this IP if not exists
    if (!rateLimiterDB[clientIP]) {
        rateLimiterDB[clientIP] = { attempts: 0, locked: false };
    }

    const record = rateLimiterDB[clientIP];

    // Check WAF Rate Limit Lock
    if (record.locked || record.attempts >= MAX_ATTEMPTS) {
        record.locked = true; // ensure it's locked
        return res.status(429).json({
            error: `Too Many Requests. The IP Address ${clientIP} has been temporarily banned for suspicious activity.`
        });
    }

    // Check PIN
    if (pin === TARGET_PIN) {
        return res.json({
            success: true,
            message: "Emergency Override Accepted. System Unlocked.",
            flag: "FLAG{waf_bypass_x_forwarded_pwn}"
        });
    }

    // Wrong PIN
    record.attempts += 1;

    if (record.attempts >= MAX_ATTEMPTS) {
        record.locked = true;
        return res.status(429).json({
            error: `Security Alert: 3 Failed Attempts Reached. IP ${clientIP} has been banned.`
        });
    }

    res.status(401).json({
        error: `Invalid PIN. ${MAX_ATTEMPTS - record.attempts} attempts remaining for IP ${clientIP}.`
    });
});

// 3. Reset the lab state
router.post('/reset', (req, res) => {
    // Clear out the rate limiter DB completely
    rateLimiterDB = {};
    res.json({ success: true, message: "WAF Rate Limiter flushed. You can try again." });
});

module.exports = router;
