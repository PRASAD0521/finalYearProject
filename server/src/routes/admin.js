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
    const queries = {
        activeStudents: new Promise((resolve) => {
            platformDB.get('SELECT COUNT(*) AS count FROM users WHERE isAdmin = 0', (err, row) => resolve(row ? row.count : 0));
        }),
        globalCompletions: new Promise((resolve) => {
            platformDB.get('SELECT COUNT(*) AS count FROM completed_labs', (err, row) => resolve(row ? row.count : 0));
        }),
        avgScore: new Promise((resolve) => {
            platformDB.get('SELECT ROUND(AVG(final_score), 0) AS avg FROM completed_labs WHERE final_score > 0', (err, row) => resolve(row ? row.avg : 0));
        }),
        totalInlabTokens: new Promise((resolve) => {
            platformDB.get('SELECT SUM(inlab_tokens_used) AS total FROM users WHERE isAdmin = 0', (err, row) => resolve(row ? row.total || 0 : 0));
        }),
        totalPostlabTokens: new Promise((resolve) => {
            platformDB.get('SELECT SUM(postlab_tokens_used) AS total FROM users WHERE isAdmin = 0', (err, row) => resolve(row ? row.total || 0 : 0));
        }),
        hardestLab: new Promise((resolve) => {
            platformDB.get('SELECT lab_id, ROUND(AVG(final_score), 0) AS avg_score FROM completed_labs GROUP BY lab_id ORDER BY avg_score ASC LIMIT 1', (err, row) => resolve(row || null));
        })
    };

    Promise.all(Object.values(queries))
        .then(([activeStudents, globalCompletions, avgScore, totalInlabTokens, totalPostlabTokens, hardestLab]) => {
            res.json({
                success: true,
                active_students: activeStudents,
                global_completions: globalCompletions,
                avg_platform_score: avgScore,
                total_inlab_tokens: totalInlabTokens,
                total_postlab_tokens: totalPostlabTokens,
                hardest_lab: hardestLab,
                status: 'Healthy'
            });
        })
        .catch(() => res.status(500).json({ error: 'Error fetching stats' }));
});

// GET /api/admin/users
// Returns a ranked leaderboard of all non-admin users with full telemetry
router.get('/users', (req, res) => {
    const query = `
        SELECT 
            u.id, 
            u.username, 
            u.created_at,
            u.inlab_tokens_used,
            u.postlab_tokens_used,
            COUNT(cl.lab_id) AS completed_count,
            COALESCE(SUM(cl.final_score), 0) AS total_score,
            COALESCE(SUM(cl.time_taken_seconds), 0) AS total_time,
            COALESCE(SUM(cl.hints_used), 0) AS total_hints,
            COALESCE(SUM(cl.revelation_score), 0) AS total_revelation
        FROM users u
        LEFT JOIN completed_labs cl ON u.id = cl.user_id
        WHERE u.isAdmin = 0
        GROUP BY u.id
        ORDER BY total_score DESC, completed_count DESC
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
