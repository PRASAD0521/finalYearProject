const express = require('express');
const router = express.Router();
const { labsDB } = require('../../database/connection');

// Route: /api/labs/lab2-xss/products
router.get('/products', (req, res) => {
    const query = req.query.q || '';

    // Vulnerable Search (Reflected XSS via backend reflection)
    // Note: In a real app, Client-side React usually sanitizes this. 
    // We are simulating the 'backend' part of the flow.

    const sql = `SELECT * FROM products WHERE name LIKE '%${query}%'`;
    labsDB.all(sql, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ products: rows, searchTerm: query });
    });
});

module.exports = router;
