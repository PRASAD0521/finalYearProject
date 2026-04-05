const express = require('express');
const router = express.Router();
const { playgroundDB } = require('../../database/connection');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Weak JWT secret (intentional — for JWT forgery challenge)
const WEAK_JWT_SECRET = "cyber123";
const FLAG_SECRET = process.env.FLAG_SECRET || 'cyberrange_flag_salt_2026';

// ─── Per-user flag generation ────────────────────────────────────────────────
// Every flag is unique: FLAG{challengeId_HMAC(secret, "challengeId:userId")}
function generateFlag(challengeId, userId) {
    const hash = crypto.createHmac('sha256', FLAG_SECRET)
        .update(`${challengeId}:${userId}`)
        .digest('hex')
        .slice(0, 8);
    return `FLAG{${challengeId}_${hash}}`;
}

// Soft auth — extract logged-in user from Bearer token (non-blocking)
function getUserFromToken(req) {
    try {
        const auth = req.headers.authorization;
        if (!auth) return null;
        return jwt.verify(auth.split(' ')[1], WEAK_JWT_SECRET);
    } catch { return null; }
}

// Seed per-user flags into pg_user_flags for a given userId
function seedUserFlags(userId) {
    playgroundDB.all("SELECT challenge_id FROM pg_flags", (err, challenges) => {
        if (err || !challenges || challenges.length === 0) return;
        const stmt = playgroundDB.prepare(
            "INSERT OR IGNORE INTO pg_user_flags (user_id, challenge_id, flag_code) VALUES (?, ?, ?)"
        );
        challenges.forEach(c => stmt.run(userId, c.challenge_id, generateFlag(c.challenge_id, userId)));
        stmt.finalize();
    });
}

// ============================================================
// PLAYGROUND AUTH ROUTES
// ============================================================

// Login — Safe parameterized query (SQLi lives in /search, not here)
router.post('/login', (req, res) => {
    const { username, password } = req.body;
    playgroundDB.get(
        "SELECT * FROM pg_users WHERE username = ? AND password = ?",
        [username, password],
        (err, user) => {
            if (err) return res.status(500).json({ error: err.message });
            if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });

            const { password: pw, ...safeUser } = user;
            const token = jwt.sign(
                { id: user.id, username: user.username, role: user.isAdmin ? 'admin' : 'user' },
                WEAK_JWT_SECRET,
                { expiresIn: '24h' }
            );
            res.json({ success: true, user: safeUser, token });
        }
    );
});

// Register — generates per-user flags for all challenges on account creation
router.post('/register', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

    playgroundDB.run(
        "INSERT INTO pg_users (username, password, isAdmin, balance, cashback) VALUES (?, ?, 0, 100.00, 0.00)",
        [username, password],
        function(err) {
            if (err) {
                if (err.message.includes('UNIQUE')) return res.status(409).json({ error: 'Username already taken' });
                return res.status(500).json({ error: err.message });
            }
            const newUserId = this.lastID;
            // Generate all flags for the new user
            seedUserFlags(newUserId);
            res.json({ success: true, user: { id: newUserId, username, isAdmin: 0, balance: 100.00, cashback: 0.00 } });
        }
    );
});

// ============================================================
// BROKEN AUTH — JWT Forgery (VIP Deals)
// ============================================================

router.get('/vip-deals', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "Authorization required" });

    try {
        const decoded = jwt.verify(authHeader.split(' ')[1], WEAK_JWT_SECRET);
        if (decoded.role !== 'admin') {
            return res.status(403).json({ error: "Forbidden. Insufficient privileges." });
        }
        res.json({
            success: true,
            message: "Welcome to the VIP store.",
            products: [
                { name: "Zero-Day Exploit Kit", price: 0.01 },
                { name: "Custom Firmware Bundle", price: 0.01 }
            ],
            flag: generateFlag('BROKEN_AUTH_JWT', decoded.id)
        });
    } catch (e) {
        res.status(401).json({ error: "Invalid or expired token." });
    }
});

// ============================================================
// SECURITY MISCONFIGURATION — Debug Endpoint (Hidden Route)
// ============================================================

router.get('/debug-config-env', (req, res) => {
    const caller = getUserFromToken(req);
    const userId = caller?.id || 1;
    res.json({
        NODE_ENV: "development",
        DB_PATH: "./data/playground.db",
        JWT_SECRET: WEAK_JWT_SECRET,
        AWS_ACCESS_KEY_ID: "AKIAIOSFODNN7EXAMPLE",
        AWS_SECRET_ACCESS_KEY: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
        flag: generateFlag('MISCONFIG_DEBUG', userId)
    });
});

// ============================================================
// PRODUCT ROUTES
// ============================================================

// Products list (safe, parameterized)
router.get('/products', (req, res) => {
    const { category } = req.query;
    let query = "SELECT * FROM pg_products WHERE 1=1";
    let params = [];
    if (category && category !== 'All') {
        query += " AND category = ?";
        params.push(category);
    }
    playgroundDB.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Search — SQL INJECTION VULNERABLE (string concatenation, intentional)
// Students discover this by inspecting the /search API response in DevTools
router.get('/search', (req, res) => {
    const { q } = req.query;
    if (!q) return res.json({ products: [], searchTerm: '' });

    // VULNERABILITY: Direct string interpolation — no parameterized query
    const query = `SELECT * FROM pg_products WHERE name LIKE '%${q}%' OR description LIKE '%${q}%'`;

    playgroundDB.all(query, (err, rows) => {
        if (err) {
            // Error-based SQLi: expose the SQL error to aid discovery
            return res.json({ products: [], searchTerm: q, error: err.message });
        }

        const response = { products: rows || [], searchTerm: q };

        // Detect UNION-based injection: reward the logged-in user with their unique flag
        const isUnion = q.toLowerCase().includes('union') && q.toLowerCase().includes('select');
        if (isUnion) {
            const caller = getUserFromToken(req);
            const userId = caller?.id || 1;
            response.flag = generateFlag('SQLI_LOGIN', userId);
        }

        res.json(response);
    });
});

// Product details + reviews
router.get('/products/:id', (req, res) => {
    const { id } = req.params;
    playgroundDB.get("SELECT * FROM pg_products WHERE id = ?", [id], (err, product) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!product) return res.status(404).json({ error: "Product not found" });
        playgroundDB.all("SELECT * FROM pg_reviews WHERE product_id = ? ORDER BY id DESC", [id], (err, reviews) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ ...product, reviews: reviews || [] });
        });
    });
});

// ============================================================
// REVIEWS — Stored XSS Vulnerability
// ============================================================

router.post('/reviews', (req, res) => {
    const { product_id, user_id, username, rating, comment } = req.body;
    // VULNERABILITY: comment is stored and rendered with dangerouslySetInnerHTML — no sanitization
    const date = new Date().toISOString().split('T')[0];

    playgroundDB.run(
        "INSERT INTO pg_reviews (product_id, user_id, username, rating, comment, date) VALUES (?, ?, ?, ?, ?, ?)",
        [product_id, user_id || 1, username || 'Anonymous', rating, comment, date],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });

            const response = { success: true, message: "Review submitted." };

            // If XSS payload detected, embed user's flag in the API response only
            const hasXSS = comment && (
                comment.includes('<script') ||
                comment.includes('onerror=') ||
                comment.includes('onload=') ||
                comment.includes('javascript:')
            );
            if (hasXSS) {
                const caller = getUserFromToken(req);
                const userId = caller?.id || user_id || 1;
                response.flag = generateFlag('STORED_XSS', userId);
            }

            res.json(response);
        }
    );
});

// ============================================================
// CHECKOUT — Price Manipulation Vulnerability
// ============================================================

// Ensure cashback column exists
playgroundDB.run("ALTER TABLE pg_users ADD COLUMN cashback REAL DEFAULT 0.00", () => {});

router.post('/checkout', (req, res) => {
    const { user_id, items, total_amount } = req.body;
    const date = new Date().toISOString();
    const uid = user_id || 1;

    playgroundDB.get("SELECT balance FROM pg_users WHERE id = ?", [uid], (err, user) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!user) return res.status(404).json({ error: "User not found" });

        if (user.balance < total_amount) {
            return res.status(400).json({ success: false, message: "Insufficient balance." });
        }

        // VULNERABILITY: Server trusts client-sent total_amount without recalculating from DB prices
        playgroundDB.run("UPDATE pg_users SET balance = balance - ?, cashback = cashback + 10 WHERE id = ?",
            [total_amount, uid], (err) => {
                if (err) return res.status(500).json({ error: err.message });

                const itemsJson = JSON.stringify(items);
                playgroundDB.run(
                    "INSERT INTO pg_orders (user_id, total_amount, items, status, date) VALUES (?, ?, ?, 'Confirmed', ?)",
                    [uid, total_amount, itemsJson, date],
                    function(err) {
                        if (err) return res.status(500).json({ error: err.message });

                        const response = {
                            success: true,
                            orderId: this.lastID,
                            message: "Order placed successfully!",
                            total: total_amount
                        };

                        // Price manipulation: flag only in API response
                        if (total_amount < 1 && items && items.length > 0) {
                            response.flag = generateFlag('LOGIC_PRICE', uid);
                        }

                        res.json(response);
                    }
                );
            }
        );
    });
});

// ============================================================
// ORDERS — IDOR Vulnerability
// ============================================================

// User's own orders
router.get('/orders', (req, res) => {
    const { user_id } = req.query;
    playgroundDB.all(
        "SELECT * FROM pg_orders WHERE user_id = ? ORDER BY id DESC",
        [user_id || 1],
        (err, orders) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(orders || []);
        }
    );
});

// Single order by ID — IDOR VULNERABLE (no authorization check)
router.get('/orders/:id', (req, res) => {
    const { id } = req.params;
    // VULNERABILITY: No auth check — any user can view any order
    playgroundDB.get("SELECT * FROM pg_orders WHERE id = ?", [id], (err, order) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!order) return res.status(404).json({ error: "Order not found" });

        const response = { ...order };
        // Flag is returned when accessing an order that belongs to a different user (admin = user_id 2)
        const caller = getUserFromToken(req);
        const requestingUserId = caller?.id || null;
        if (order.user_id === 2 && requestingUserId && requestingUserId !== 2) {
            response.flag = generateFlag('IDOR_ORDER', requestingUserId);
        }

        res.json(response);
    });
});

// ============================================================
// USER PROFILE
// ============================================================

router.get('/profile/:id', (req, res) => {
    const { id } = req.params;
    playgroundDB.get("SELECT * FROM pg_users WHERE id = ?", [id], (err, user) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!user) return res.status(404).json({ error: "User not found" });
        const { password, ...safeUser } = user;
        res.json(safeUser);
    });
});

// ============================================================
// ADMIN — Access Control Vulnerability (No Auth Check)
// ============================================================

router.get('/admin/users', (req, res) => {
    // VULNERABILITY: No authentication or authorization check
    const caller = getUserFromToken(req);
    const userId = caller?.id || 1;
    playgroundDB.all("SELECT id, username, isAdmin, balance FROM pg_users", (err, users) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ users, flag: generateFlag('ADMIN_ACCESS', userId) });
    });
});

router.get('/admin/orders', (req, res) => {
    playgroundDB.all("SELECT * FROM pg_orders ORDER BY id DESC", (err, orders) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(orders || []);
    });
});

// ============================================================
// CRYPTOGRAPHIC FAILURES — Coupon Forgery
// ============================================================

router.post('/apply-coupon', (req, res) => {
    const { user_id, coupon_code } = req.body;
    if (!coupon_code) return res.status(400).json({ error: "Coupon code required" });

    try {
        const decoded = Buffer.from(coupon_code, 'base64').toString('utf-8');
        const match = decoded.match(/USER(\d+)-DISCOUNT-(\d+)/);
        if (!match) return res.status(400).json({ error: "Invalid coupon" });

        const couponUserId = parseInt(match[1]);
        const discountPercent = parseInt(match[2]);

        if (couponUserId !== parseInt(user_id || 1)) {
            return res.status(403).json({ error: "Coupon not valid for this account." });
        }
        if (discountPercent > 100) return res.status(400).json({ error: "Invalid discount value." });

        const response = { success: true, discount: discountPercent, message: `${discountPercent}% discount applied!` };
        if (discountPercent === 100) {
            response.flag = generateFlag('CRYPTO_COUPONS', user_id || 1);
        }
        res.json(response);
    } catch (e) {
        res.status(400).json({ error: "Malformed coupon." });
    }
});

// ============================================================
// SSRF — Avatar URL Fetch
// ============================================================

router.post('/avatar/fetch', (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "URL required" });

    const caller = getUserFromToken(req);
    const userId = caller?.id || 1;

    // VULNERABILITY: Server fetches user-supplied URL without validation
    const isInternal = url.includes('localhost') || url.includes('127.0.0.1') || url.includes('0.0.0.0');
    if (isInternal) {
        return res.json({
            success: true,
            data: "Connection refused — internal service not accessible from public network",
            flag: generateFlag('SSRF_AVATAR', userId)
        });
    }
    res.json({ success: true, message: "Avatar URL saved: " + url });
});

// ============================================================
// RACE CONDITION — Cashback Redemption (TOCTOU)
// ============================================================

router.post('/redeem-cashback', (req, res) => {
    const { user_id } = req.body;
    const uid = user_id || 1;
    const REDEEM_AMOUNT = 10;

    playgroundDB.get("SELECT cashback FROM pg_users WHERE id = ?", [uid], (err, user) => {
        if (err || !user) return res.status(500).json({ error: "User not found" });

        // TOC: Check cashback balance
        if (user.cashback < REDEEM_AMOUNT) {
            return res.status(400).json({ error: `Insufficient cashback balance ($${user.cashback?.toFixed(2)}).` });
        }

        // Artificial delay widens the race condition window (100–300ms)
        setTimeout(() => {
            // TOU: Deduct and add to balance
            playgroundDB.run(
                "UPDATE pg_users SET balance = balance + ?, cashback = cashback - ? WHERE id = ?",
                [REDEEM_AMOUNT, REDEEM_AMOUNT, uid],
                (err) => {
                    playgroundDB.get("SELECT cashback FROM pg_users WHERE id = ?", [uid], (err, updated) => {
                        const response = { success: true, message: `$${REDEEM_AMOUNT} cashback redeemed!` };
                        if (updated && updated.cashback < 0) {
                            response.flag = generateFlag('RACE_CASHBACK', uid);
                        }
                        res.json(response);
                    });
                }
            );
        }, Math.random() * 200 + 100);
    });
});

// ============================================================
// WAF BYPASS — Gift Card Rate Limiting
// ============================================================

const pinRateLimits = {};

router.post('/redeem-giftcard', (req, res) => {
    // VULNERABILITY: IP extracted from X-Forwarded-For header — easily spoofed
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const { pin, user_id } = req.body;

    if (!pinRateLimits[ip]) pinRateLimits[ip] = 0;
    if (pinRateLimits[ip] >= 10) {
        return res.status(429).json({ error: `Too many attempts from ${ip}. Try again later.` });
    }
    pinRateLimits[ip] += 1;

    if (pin === "4829") {
        const uid = user_id || 1;
        res.json({ success: true, message: "Gift card redeemed. $50 credit added.", flag: generateFlag('WAF_RATE', uid) });
    } else {
        res.status(400).json({ error: "Invalid PIN." });
    }
});

// ============================================================
// CTF SCOREBOARD & FLAG SUBMISSION
// ============================================================

router.get('/challenges', (req, res) => {
    playgroundDB.all(
        "SELECT id, challenge_id, name, description, points, category FROM pg_flags",
        (err, challenges) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(challenges || []);
        }
    );
});

// Submit flag — verified against pg_user_flags (per-user unique flags)
router.post('/submit-flag', (req, res) => {
    const { user_id, flag_code } = req.body;
    const uid = user_id || 1;

    playgroundDB.get(
        "SELECT challenge_id FROM pg_user_flags WHERE user_id = ? AND flag_code = ?",
        [uid, flag_code],
        (err, userFlag) => {
            if (err) return res.status(500).json({ error: err.message });
            if (!userFlag) return res.status(400).json({ success: false, message: "Invalid flag. This flag may belong to a different user." });

            playgroundDB.get("SELECT * FROM pg_flags WHERE challenge_id = ?", [userFlag.challenge_id], (err, challenge) => {
                if (err || !challenge) return res.status(500).json({ error: "Challenge not found" });

                playgroundDB.get(
                    "SELECT * FROM pg_user_solves WHERE user_id = ? AND flag_id = ?",
                    [uid, challenge.id],
                    (err, existing) => {
                        if (existing) return res.json({ success: true, message: "Already solved!", alreadySolved: true });

                        playgroundDB.run(
                            "INSERT INTO pg_user_solves (user_id, flag_id) VALUES (?, ?)",
                            [uid, challenge.id],
                            function(err) {
                                if (err) return res.status(500).json({ error: err.message });
                                res.json({
                                    success: true,
                                    message: `🎉 Correct! "${challenge.name}" — ${challenge.points} pts`,
                                    challenge: challenge.name,
                                    points: challenge.points
                                });
                            }
                        );
                    }
                );
            });
        }
    );
});

router.get('/scoreboard', (req, res) => {
    const { user_id } = req.query;
    const uid = user_id || 1;

    playgroundDB.all(
        "SELECT id, challenge_id, name, description, points, category FROM pg_flags",
        (err, challenges) => {
            if (err) return res.status(500).json({ error: err.message });

            playgroundDB.all(
                "SELECT flag_id FROM pg_user_solves WHERE user_id = ?",
                [uid],
                (err, solves) => {
                    if (err) return res.status(500).json({ error: err.message });

                    const solvedIds = (solves || []).map(s => s.flag_id);
                    const result = (challenges || []).map(c => ({
                        ...c,
                        solved: solvedIds.includes(c.id)
                    }));

                    const totalPoints = result.filter(c => c.solved).reduce((sum, c) => sum + c.points, 0);
                    res.json({ challenges: result, totalPoints, solvedCount: solvedIds.length });
                }
            );
        }
    );
});

module.exports = router;
module.exports.seedUserFlags = seedUserFlags;
module.exports.generateFlag = generateFlag;
