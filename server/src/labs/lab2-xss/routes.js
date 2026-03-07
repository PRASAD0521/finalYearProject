const express = require('express');
const router = express.Router();
const { labsDB, platformDB } = require('../../database/connection');

// Route: /api/labs/lab2-xss/products
router.get('/products', (req, res) => {
    const query = req.query.q || '';

    const user_id = req.query.user_id;

    // Vulnerable Search (Reflected XSS via backend reflection)
    // Note: In a real app, Client-side React usually sanitizes this. 
    // We are simulating the 'backend' part of the flow.

    const sql = `SELECT * FROM products WHERE name LIKE '%${query}%'`;
    labsDB.all(sql, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });

        let success = false;
        const payload = query.toLowerCase();

        // Server-side validation of the XSS payload
        if (payload.includes('<script') || (payload.includes('<img') && payload.includes('onerror'))) {
            success = true;
            if (user_id) {
                platformDB.run(
                    "INSERT OR IGNORE INTO completed_labs (user_id, lab_id) VALUES (?, ?)",
                    [user_id, 2]
                );
            }
        }

        res.json({ products: rows, searchTerm: query, success });
    });
});

module.exports = router;
