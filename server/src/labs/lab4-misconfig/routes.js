const express = require('express');
const router = express.Router();
const { labsDB, platformDB } = require('../../database/connection');

// Example Endpoint: POST /api/labs/lab4-misconfig/user
router.post('/user', (req, res) => {
    // Expects { "id": "1" }
    const userId = req.body.id;

    if (userId === undefined) {
         return res.status(400).json({ error: "Missing 'id' parameter in JSON body." });
    }

    // VULNERABILITY 1: Direct SQL concatenation (SQLi)
    const sql = `SELECT id, name, email, role FROM beta_users WHERE id = '${userId}'`;

    labsDB.all(sql, (err, rows) => {
        if (err) {
            // VULNERABILITY 2: Verbose Error Handling in Production!
            // Passing the raw SQL error back to the client
            const errorObj = new Error(err.message);
            errorObj.stack = `Error: ${err.message}\n    at Database.all (/opt/cyberrange/server/src/labs/lab4-misconfig/routes.js:15:12)\n    at Query.execute (/opt/cyberrange/server/node_modules/sqlite3/lib/sqlite3.js:80:11)\n    [Raw Query Executed]: ${sql}\n    [Environment]: PRODUCTION\n    [Database]: sqlite3://internal-labs.db`;
            
            // Send back 500 with stack
            return res.status(500).json({
                error: true,
                message: "Internal Server Error",
                stack: errorObj.stack
            });
        }

        res.json({ success: true, count: rows.length, data: rows });
    });
});

module.exports = router;
