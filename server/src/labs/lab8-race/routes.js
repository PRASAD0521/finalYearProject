const express = require('express');
const router = express.Router();

// In-Memory Database for the lab session to avoid polluting main DB
// Structure: { [sessionId]: { balance: 0, hasClaimed: false } }
const sessions = {};

// Helper to get or create session
const getSession = (req) => {
    // In a real app this is a JWT or Session Cookie, 
    // here we use IP + UserAgent as a simple mock session identifier
    const sessionId = (req.ip + req.get('User-Agent')).replace(/\s+/g, '');

    if (!sessions[sessionId]) {
        sessions[sessionId] = {
            balance: 0,
            hasClaimed: false
        };
    }
    return { id: sessionId, data: sessions[sessionId] };
};

// 1. Get current status
router.get('/status', (req, res) => {
    const { data } = getSession(req);
    res.json({ success: true, ...data });
});

// 2. The Vulnerable TOCTOU Endpoint
router.post('/claim', async (req, res) => {
    const { data } = getSession(req);

    // TIME OF CHECK (TOC)
    if (data.hasClaimed === false) {

        // ARTIFICIAL VULNERABILITY WIDENER: 
        // 50ms delay simulates a slow database/API call giving the Race Condition a huge window to act.
        await new Promise(resolve => setTimeout(resolve, 50));

        // TIME OF USE (TOU)
        data.balance += 5000;
        data.hasClaimed = true;

        return res.json({
            success: true,
            message: "₹5,000 Subsidy Transferred!",
            balance: data.balance
        });
    }

    // If already claimed, reject
    res.status(400).json({
        error: "Subsidy Already Claimed. You cannot apply twice."
    });
});

// 3. Purchase the Super Admin Asset / Flag
router.post('/buy-flag', (req, res) => {
    const { data } = getSession(req);
    const ASSET_PRICE = 30000;

    if (data.balance >= ASSET_PRICE) {
        // Successful purchase
        data.balance -= ASSET_PRICE;
        return res.json({
            success: true,
            message: "Purchase Successful! Classified Gov Asset Unlocked.",
            flag: "FLAG{race_condition_toctou_pwned_9x9}",
            balance: data.balance
        });
    }

    res.status(400).json({
        error: `Insufficient Funds. Asset requires ₹${ASSET_PRICE}. You have ₹${data.balance}.`
    });
});

// 4. Reset the lab state
router.post('/reset', (req, res) => {
    const { id } = getSession(req);
    sessions[id] = { balance: 0, hasClaimed: false };
    res.json({ success: true, message: "Session Reset. You can try again." });
});

module.exports = router;
