const express = require('express');
const router = express.Router();
const { platformDB, labsDB, playgroundDB } = require('../database/connection');
const { initLabsDB, initPlaygroundDB } = require('../database/init');

// --- SECURE AUTHENTICATION MIDDLEWARE ---
// All routes in this file MUST require the user_id of an admin
const requireAdmin = (req, res, next) => {
    // Determine where the user_id is coming from (query or body)
    const userId = req.query.user_id || req.body.user_id;

    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized: Missing user_id' });
    }

    const query = `SELECT isAdmin FROM users WHERE id = ?`;
    platformDB.get(query, [userId], (err, row) => {
        if (err) return res.status(500).json({ error: 'Database error' });

        if (!row || row.isAdmin !== 1) {
            return res.status(403).json({ error: 'Forbidden: Admin access required' });
        }

        next(); // User is verified as an admin, proceed to the route
    });
};

router.use(requireAdmin);

// ==========================================
// ADMIN ROUTES
// ==========================================

// GET /api/admin/stats
// Returns macro telemetry for the dashboard overview
router.get('/stats', (req, res) => {
    // Run multiple queries in parallel
    const getActiveStudents = new Promise((resolve) => {
        platformDB.get('SELECT COUNT(*) AS count FROM users WHERE isAdmin = 0', (err, row) => {
            resolve(row ? row.count : 0);
        });
    });

    const getGlobalCompletions = new Promise((resolve) => {
        platformDB.get('SELECT COUNT(*) AS count FROM completed_labs', (err, row) => {
            resolve(row ? row.count : 0);
        });
    });

    Promise.all([getActiveStudents, getGlobalCompletions])
        .then(([activeStudents, globalCompletions]) => {
            res.json({
                success: true,
                active_students: activeStudents,
                global_completions: globalCompletions,
                status: 'Healthy'
            });
        })
        .catch(() => res.status(500).json({ error: 'Error fetching stats' }));
});

// GET /api/admin/users
// Returns a list of all non-admin users and their completion statistics
router.get('/users', (req, res) => {
    const query = `
        SELECT 
            u.id, 
            u.username, 
            u.created_at,
            COUNT(cl.lab_id) as completed_count
        FROM users u
        LEFT JOIN completed_labs cl ON u.id = cl.user_id
        WHERE u.isAdmin = 0
        GROUP BY u.id
        ORDER BY completed_count DESC, u.created_at ASC
    `;

    platformDB.all(query, [], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error fetching users' });
        res.json({ success: true, users: rows });
    });
});

// POST /api/admin/reset-dbs
// "The Big Red Button" - Drops and resets only the vulnerable databases
router.post('/reset-dbs', (req, res) => {
    try {
        console.warn(`[ADMIN ACTION] User ID ${req.body.user_id} triggers environment reset.`);

        const resetLabsDB = new Promise((resolve, reject) => {
            labsDB.serialize(() => {
                labsDB.run("DROP TABLE IF EXISTS lab_users");
                labsDB.run("DROP TABLE IF EXISTS products", (err) => {
                    if (err) reject(err); else resolve();
                });
            });
        });

        const resetPlaygroundDB = new Promise((resolve, reject) => {
            playgroundDB.serialize(() => {
                const tables = ['pg_users', 'pg_products', 'pg_reviews', 'pg_orders', 'pg_flags', 'pg_user_solves', 'lab5_documents', 'lab6_users'];
                let completed = 0;
                tables.forEach(table => {
                    playgroundDB.run(`DROP TABLE IF EXISTS ${table}`, (err) => {
                        if (err) reject(err);
                        completed++;
                        if (completed === tables.length) resolve();
                    });
                });
            });
        });

        Promise.all([resetLabsDB, resetPlaygroundDB])
            .then(() => {
                // Now that tables are dropped, re-initialize them entirely
                initLabsDB();
                initPlaygroundDB();
                res.json({ success: true, message: 'Vulnerable Environments Reset Successfully' });
            })
            .catch(err => {
                console.error("Reset Error:", err);
                res.status(500).json({ error: 'Failed to reset databases' });
            });

    } catch (e) {
        res.status(500).json({ error: 'System Exception during reset' });
    }
});

module.exports = router;
