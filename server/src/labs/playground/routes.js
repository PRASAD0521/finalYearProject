const express = require('express');
const router = express.Router();
const { playgroundDB } = require('../../database/connection');

// ============================================================
// PLAYGROUND AUTH ROUTES (Vulnerable on purpose)
// ============================================================

// Login - SQL INJECTION VULNERABLE
router.post('/login', (req, res) => {
    const { username, password } = req.body;

    // VULNERABILITY: String concatenation instead of parameterized query
    const query = `SELECT * FROM pg_users WHERE username = '${username}' AND password = '${password}'`;

    playgroundDB.get(query, (err, user) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });

        // Check for SQLi patterns for flag
        if (username.includes("'") || password.includes("'")) {
            console.log(`[Playground] SQL Injection attempt detected: ${username}`);
        }

        const { password: pw, ...safeUser } = user;
        res.json({ success: true, user: safeUser });
    });
});

// Register - Safe
router.post('/register', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
    }

    const query = "INSERT INTO pg_users (username, password, isAdmin, balance) VALUES (?, ?, 0, 100.00)";
    playgroundDB.run(query, [username, password], function (err) {
        if (err) {
            if (err.message.includes('UNIQUE')) {
                return res.status(409).json({ error: 'Username already taken' });
            }
            return res.status(500).json({ error: err.message });
        }
        res.json({
            success: true,
            user: { id: this.lastID, username, isAdmin: 0, balance: 100.00 }
        });
    });
});

// ============================================================
// PRODUCT ROUTES
// ============================================================

// Get All Products (with category filter)
router.get('/products', (req, res) => {
    const { category, search } = req.query;
    let query = "SELECT * FROM pg_products WHERE 1=1";
    let params = [];

    if (category && category !== 'All') {
        query += " AND category = ?";
        params.push(category);
    }

    if (search) {
        query += " AND (name LIKE ? OR description LIKE ?)";
        params.push(`%${search}%`, `%${search}%`);
    }

    playgroundDB.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Search Products - SQL INJECTION VULNERABLE
router.get('/search', (req, res) => {
    const { q } = req.query;
    if (!q) return res.json({ products: [], searchTerm: '' });

    // VULNERABILITY: Direct string interpolation
    const query = `SELECT * FROM pg_products WHERE name LIKE '%${q}%' OR description LIKE '%${q}%'`;

    playgroundDB.all(query, (err, rows) => {
        if (err) {
            console.log(`[Playground] SQLi in search: ${q}`);
            return res.json({ products: [], searchTerm: q, error: err.message });
        }
        res.json({ products: rows || [], searchTerm: q });
    });
});

// Get Product Details + Reviews
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
// REVIEW ROUTES (Stored XSS Vulnerability)
// ============================================================

router.post('/reviews', (req, res) => {
    const { product_id, user_id, username, rating, comment } = req.body;

    // VULNERABILITY: No sanitization on 'comment' field
    const date = new Date().toISOString().split('T')[0];
    const query = "INSERT INTO pg_reviews (product_id, user_id, username, rating, comment, date) VALUES (?, ?, ?, ?, ?, ?)";

    playgroundDB.run(query, [product_id, user_id || 1, username || 'Anonymous', rating, comment, date], function (err) {
        if (err) return res.status(500).json({ error: err.message });

        if (comment.includes('<script') || comment.includes('onerror=') || comment.includes('onload=')) {
            console.log(`[Playground] Stored XSS attempt detected from ${username}`);
        }

        res.json({ success: true, message: "Review posted!" });
    });
});

// ============================================================
// CART & CHECKOUT (Price Manipulation Vulnerability)
// ============================================================

router.post('/checkout', (req, res) => {
    const { user_id, items, total_amount } = req.body;

    // VULNERABILITY: Trusting client-sent total_amount!
    // Server should recalculate from DB prices but doesn't
    const date = new Date().toISOString();
    const query = "INSERT INTO pg_orders (user_id, total_amount, items, status, date) VALUES (?, ?, ?, 'Confirmed', ?)";
    const itemsJson = JSON.stringify(items);

    playgroundDB.run(query, [user_id || 1, total_amount, itemsJson, date], function (err) {
        if (err) return res.status(500).json({ error: err.message });

        const response = {
            success: true,
            orderId: this.lastID,
            message: "Order confirmed!",
            total: total_amount
        };

        // Flag if price was manipulated
        if (total_amount < 1 && items.length > 0) {
            response.flag = "FLAG{price_logic_bypass_00}";
            response.flagMessage = "🚩 You manipulated the price! The server trusted your total without verification.";
            console.log(`[Playground] Price manipulation exploit! Total: $${total_amount}`);
        }

        res.json(response);
    });
});

// ============================================================
// ORDER ROUTES (IDOR Vulnerability)
// ============================================================

// Get user's orders
router.get('/orders', (req, res) => {
    const { user_id } = req.query;
    playgroundDB.all("SELECT * FROM pg_orders WHERE user_id = ? ORDER BY id DESC", [user_id || 1], (err, orders) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(orders || []);
    });
});

// Get single order - IDOR VULNERABLE
router.get('/orders/:id', (req, res) => {
    const { id } = req.params;

    // VULNERABILITY: No authorization check — any user can view any order
    playgroundDB.get("SELECT * FROM pg_orders WHERE id = ?", [id], (err, order) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!order) return res.status(404).json({ error: "Order not found" });

        // Detect IDOR: if requested order belongs to admin (user_id = 2)
        const response = { ...order };
        if (order.user_id === 2) {
            response.flag = "FLAG{idor_order_inspector_99}";
            response.flagMessage = "🚩 You accessed another user's order without authorization!";
            console.log(`[Playground] IDOR exploit detected on order ${id}`);
        }

        res.json(response);
    });
});

// ============================================================
// USER PROFILE (IDOR Vulnerability)
// ============================================================

router.get('/profile/:id', (req, res) => {
    const { id } = req.params;

    // VULNERABILITY: No auth check - can view any user's profile
    playgroundDB.get("SELECT * FROM pg_users WHERE id = ?", [id], (err, user) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!user) return res.status(404).json({ error: "User not found" });

        const { password, ...safeUser } = user;
        res.json(safeUser);
    });
});

// ============================================================
// ADMIN ROUTES (Access Control Vulnerability)
// ============================================================

// Get all users - NO AUTH CHECK
router.get('/admin/users', (req, res) => {
    // VULNERABILITY: No authentication or authorization check
    // Anyone can access admin endpoints
    playgroundDB.all("SELECT id, username, isAdmin, balance FROM pg_users", (err, users) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ users, flag: "FLAG{admin_access_control_bypass}", flagMessage: "🚩 You accessed admin panel without authorization!" });
    });
});

// Get all orders - NO AUTH CHECK
router.get('/admin/orders', (req, res) => {
    playgroundDB.all("SELECT * FROM pg_orders ORDER BY id DESC", (err, orders) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(orders || []);
    });
});

// ============================================================
// CTF SCOREBOARD & FLAG SUBMISSION
// ============================================================

router.get('/challenges', (req, res) => {
    playgroundDB.all("SELECT id, challenge_id, name, description, points FROM pg_flags", (err, challenges) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(challenges || []);
    });
});

router.post('/submit-flag', (req, res) => {
    const { user_id, flag_code } = req.body;

    playgroundDB.get("SELECT * FROM pg_flags WHERE flag_code = ?", [flag_code], (err, flag) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!flag) return res.status(400).json({ success: false, message: "Invalid flag!" });

        // Check if already solved
        playgroundDB.get("SELECT * FROM pg_user_solves WHERE user_id = ? AND flag_id = ?", [user_id || 1, flag.id], (err, existing) => {
            if (err) return res.status(500).json({ error: err.message });
            if (existing) return res.json({ success: true, message: "Already solved!", alreadySolved: true });

            playgroundDB.run("INSERT INTO pg_user_solves (user_id, flag_id) VALUES (?, ?)", [user_id || 1, flag.id], function (err) {
                if (err) return res.status(500).json({ error: err.message });
                res.json({
                    success: true,
                    message: `🎉 Correct! You solved "${flag.name}" for ${flag.points} points!`,
                    challenge: flag.name,
                    points: flag.points
                });
            });
        });
    });
});

router.get('/scoreboard', (req, res) => {
    const { user_id } = req.query;

    playgroundDB.all("SELECT id, challenge_id, name, description, points FROM pg_flags", (err, challenges) => {
        if (err) return res.status(500).json({ error: err.message });

        playgroundDB.all("SELECT flag_id FROM pg_user_solves WHERE user_id = ?", [user_id || 1], (err, solves) => {
            if (err) return res.status(500).json({ error: err.message });

            const solvedIds = (solves || []).map(s => s.flag_id);
            const result = (challenges || []).map(c => ({
                ...c,
                solved: solvedIds.includes(c.id)
            }));

            const totalPoints = result.filter(c => c.solved).reduce((sum, c) => sum + c.points, 0);
            res.json({ challenges: result, totalPoints, solvedCount: solvedIds.length });
        });
    });
});

module.exports = router;
