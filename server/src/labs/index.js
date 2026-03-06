const express = require('express');
const fs = require('fs');
const path = require('path');

function registerLabs(app) {
    const labsDir = __dirname;
    const labs = fs.readdirSync(labsDir).filter(file => {
        return fs.statSync(path.join(labsDir, file)).isDirectory();
    });

    console.log(`[Lab Registry] Found ${labs.length} labs.`);

    labs.forEach(labName => {
        const labRoutesPath = path.join(labsDir, labName, 'routes.js');
        if (fs.existsSync(labRoutesPath)) {
            const labRouter = require(labRoutesPath);
            // Mount routes: /api/labs/{labName}/...
            // e.g. /api/labs/lab1-sqli/login
            const mountPath = `/api/labs/${labName}`;
            app.use(mountPath, labRouter);
            console.log(`  -> Registered: ${mountPath}`);
        }
    });
}

module.exports = { registerLabs };
