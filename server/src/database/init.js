const { platformDB, labsDB, playgroundDB } = require('./connection');

function initDatabases() {
    initPlatformDB();
    initLabsDB();
    initPlaygroundDB();
}

// 1. Platform DB - Real Student Data
function initPlatformDB() {
    platformDB.serialize(() => {
        platformDB.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password TEXT,
            isAdmin INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, () => {
            // LLM Token Consumption Migrations
            platformDB.run(`ALTER TABLE users ADD COLUMN inlab_tokens_used INTEGER DEFAULT 0`, () => {});
            platformDB.run(`ALTER TABLE users ADD COLUMN postlab_tokens_used INTEGER DEFAULT 0`, () => {});
        });

        platformDB.run(`CREATE TABLE IF NOT EXISTS completed_labs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            lab_id INTEGER,
            completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, lab_id)
        )`, () => {
            // Safe Migrations for scoring telemetry
            const telemetrics = ['time_taken_seconds', 'hints_used', 'revelation_score', 'tokens_consumed', 'final_score'];
            telemetrics.forEach(col => {
                platformDB.run(`ALTER TABLE completed_labs ADD COLUMN ${col} INTEGER DEFAULT 0`, (err) => {
                    // Ignore "duplicate column name" errors on nodemon restarts
                });
            });
        });

        platformDB.run(`CREATE TABLE IF NOT EXISTS lab_starts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            lab_id INTEGER,
            started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, lab_id)
        )`);

        // Seed default admin account
        platformDB.get("SELECT count(*) as count FROM users WHERE username = 'admin'", (err, row) => {
            if (row && row.count === 0) {
                console.log("[Platform DB] Seeding default Admin account...");
                platformDB.run(`INSERT INTO users (username, password, isAdmin) VALUES ('admin', 'admin123', 1)`);
            }
        });
    });
}

// 2. Labs DB - Vulnerable Dummy Data
function initLabsDB() {
    labsDB.serialize(() => {
        labsDB.run(`CREATE TABLE IF NOT EXISTS lab_users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT,
            password TEXT,
            isAdmin INTEGER DEFAULT 0
        )`);

        labsDB.run(`CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            description TEXT,
            price REAL
        )`);

        labsDB.run(`CREATE TABLE IF NOT EXISTS beta_users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            email TEXT,
            role TEXT,
            secret_key TEXT
        )`);

        labsDB.get("SELECT count(*) as count FROM lab_users", (err, row) => {
            if (row && row.count === 0) {
                console.log("[Labs DB] Seeding initial data...");

                labsDB.run(`INSERT INTO lab_users (username, password, isAdmin) VALUES 
                    ('admin', 'admin123', 1),
                    ('alice', 'wonderland', 0),
                    ('bob', 'builder', 0)
                `);

                labsDB.run(`INSERT INTO products (name, description, price) VALUES 
                    ('Firewall License', 'Enterprise grade firewall license key', 999.00),
                    ('Antivirus 1-Year', 'Standard malware protection', 49.99),
                    ('VPN Subscription', 'Secure tunnel for remote access', 5.00),
                    ('Debug Tool', 'Internal tool for developers', 0.00)
                `);
            }
        });

        // Independent Seeding: Lab 4 Beta Users
        labsDB.get("SELECT count(*) as count FROM beta_users", (err, row) => {
            if (row && row.count === 0) {
                console.log("[Labs DB] Seeding Lab 4 Misconfig Users...");
                labsDB.run(`INSERT INTO beta_users (name, email, role, secret_key) VALUES 
                    ('Dev Team', 'devs@cyberrange.internal', 'developer', 'DEV_NULL'),
                    ('Tester Bob', 'bob@cyberrange.internal', 'tester', 'TEST_MODE_ACTIVE'),
                    ('Admin Service', 'admin@cyberrange.internal', 'admin', 'FLAG{stack_trace_sqli_master}')
                `);
            }
        });
    });
}

// 3. Playground DB - CyberStore (Juice Shop Style CTF Arena)
function initPlaygroundDB() {
    playgroundDB.serialize(() => {
        // Users (Simulated store customers)
        playgroundDB.run(`CREATE TABLE IF NOT EXISTS pg_users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password TEXT,
            isAdmin INTEGER DEFAULT 0,
            balance REAL DEFAULT 1000.00
        )`);

        // Products
        playgroundDB.run(`CREATE TABLE IF NOT EXISTS pg_products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            description TEXT,
            price REAL,
            image TEXT,
            category TEXT,
            rating REAL,
            is_prime INTEGER DEFAULT 0
        )`);

        // Reviews (Vulnerable to Stored XSS)
        playgroundDB.run(`CREATE TABLE IF NOT EXISTS pg_reviews (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            product_id INTEGER,
            user_id INTEGER,
            username TEXT,
            rating INTEGER,
            comment TEXT,
            date TEXT
        )`);

        // Orders (Vulnerable to IDOR)
        playgroundDB.run(`CREATE TABLE IF NOT EXISTS pg_orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            total_amount REAL,
            items TEXT,
            status TEXT DEFAULT 'Processing',
            date TEXT,
            flag TEXT,
            flagMessage TEXT
        )`);

        // Lab 5 - IDOR Documents
        playgroundDB.run(`CREATE TABLE IF NOT EXISTS lab5_documents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            title TEXT,
            content TEXT,
            is_secret BOOLEAN DEFAULT 0
        )`);

        // Lab 6 - Cryptographic Failures (Users with weak hashes)
        playgroundDB.run(`CREATE TABLE IF NOT EXISTS lab6_users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT,
            role TEXT,
            password_hash TEXT,
            last_login TEXT
        )`);

        // CTF Flags
        playgroundDB.run(`CREATE TABLE IF NOT EXISTS pg_flags(
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                challenge_id TEXT UNIQUE,
                name TEXT,
                description TEXT,
                flag_code TEXT,
                points INTEGER,
                category TEXT DEFAULT 'Web'
            )`);

        // User Solves
        playgroundDB.run(`CREATE TABLE IF NOT EXISTS pg_user_solves(
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                flag_id INTEGER,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )`);

        // Per-user flags (generated at registration, unique per user)
        playgroundDB.run(`CREATE TABLE IF NOT EXISTS pg_user_flags(
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                challenge_id TEXT,
                flag_code TEXT,
                UNIQUE(user_id, challenge_id)
            )`);

        // Seed Data
        playgroundDB.get("SELECT count(*) as count FROM pg_products", (err, row) => {
            if (row && row.count === 0) {
                console.log("[Playground DB] Seeding CyberStore...");

                // 1. Users
                playgroundDB.run(`INSERT INTO pg_users(username, password, isAdmin, balance) VALUES
        ('guest', 'guest', 0, 100.00),
        ('admin', 'sup3r_s3cur3_p@ss!', 1, 999999.00),
        ('john_doe', 'password123', 0, 500.00),
        ('jane_smith', 'qwerty', 0, 250.00)
            `);

                // 2. Products (Rich catalog)
                const products = [
                    ['Ultrabook Pro X1', 'Latest Gen Intel i9, 32GB RAM, 1TB SSD. Ultra-thin aluminum chassis with 14" 2.8K OLED display. All-day battery life.', 1299.99, '💻', 'Laptops', 4.8, 1],
                    ['Gaming Beast 5000', 'RTX 4090, 64GB RAM, RGB Lighting everywhere. 17.3" 240Hz display. Built for domination.', 2499.00, '🎮', 'Gaming', 4.5, 1],
                    ['SmartPhone 15 Pro', 'Titanium finish, 50MP triple camera system. A17 Pro chip. All-day battery. USB-C.', 999.00, '📱', 'Phones', 4.7, 1],
                    ['Wireless NC Headphones', 'Industry-leading noise cancellation. 30-hour battery. Hi-Res Audio certified. Speak-to-chat.', 349.50, '🎧', 'Audio', 4.6, 0],
                    ['4K Monitor 27"', 'IPS Panel, 144Hz Refresh Rate, HDR10, USB-C PD 90W. Factory calibrated sRGB 99%.', 450.00, '🖥️', 'Monitors', 4.3, 1],
                    ['Mechanical Keyboard RGB', 'Cherry MX Blue switches, PBT double-shot keycaps. USB-C detachable. Aluminum frame.', 89.99, '⌨️', 'Accessories', 4.2, 0],
                    ['USB-C Hub 7-in-1', 'HDMI 4K@60Hz, Gigabit Ethernet, SD/microSD, USB-A 3.0 x2, USB-C PD 100W.', 29.99, '🔌', 'Accessories', 4.0, 1],
                    ['Hacker Hoodie', 'Black, anonymous, comfortable. 100% organic cotton. Embroidered skull & crossbones.', 49.99, '🧥', 'Apparel', 4.9, 0],
                    ['Cybersecurity Toolkit', 'Complete penetration testing USB toolkit. Includes Kali Linux bootable + hardware tools.', 199.99, '🔐', 'Security', 4.8, 1],
                    ['Smart Watch Ultra', 'GPS, heart rate, SpO2, temperature sensor. Titanium case. 72h battery life.', 799.00, '⌚', 'Wearables', 4.4, 1],
                    ['Drone Pro 4K', 'Obstacle avoidance, 48MP photos, 4K/120fps video. 40-min flight time. Folds compact.', 1599.00, '🚁', 'Electronics', 4.6, 1],
                    ['VR Headset Pro', 'Mixed reality, eye tracking, 4K per eye. Pancake lenses. 2-hour battery.', 499.99, '🥽', 'Gaming', 4.3, 0]
                ];

                const stmt = playgroundDB.prepare("INSERT INTO pg_products (name, description, price, image, category, rating, is_prime) VALUES (?, ?, ?, ?, ?, ?, ?)");
                products.forEach(p => stmt.run(p));
                stmt.finalize();

                // 3. Seed Reviews
                const reviews = [
                    [1, 1, 'TechReviewer', 5, 'Best laptop I have ever used! Blazing fast performance.', '2025-10-15'],
                    [1, 3, 'john_doe', 4, 'Great machine but wish it had more ports.', '2025-11-02'],
                    [2, 4, 'GamerGirl', 5, 'This thing handles everything at max settings!', '2025-09-20'],
                    [3, 1, 'PhoneFanatic', 4, 'Good phone but battery drains fast with camera use.', '2025-12-10'],
                    [4, 3, 'AudioNerd', 5, 'The noise cancellation is unreal. Best purchase ever.', '2025-08-05'],
                    [8, 2, 'AnonUser', 5, 'Perfect for late night coding sessions. Very comfy.', '2025-11-15'],
                    [9, 1, 'PenTester', 5, 'Has everything you need to get started with security testing.', '2025-07-22'],
                    [5, 4, 'DesignerPro', 4, 'Colors are stunning. USB-C charging is a game changer.', '2025-10-01']
                ];

                const rstmt = playgroundDB.prepare("INSERT INTO pg_reviews (product_id, user_id, username, rating, comment, date) VALUES (?, ?, ?, ?, ?, ?)");
                reviews.forEach(r => rstmt.run(r));
                rstmt.finalize();

                // 4. Seed admin orders (for IDOR exploitation)
                playgroundDB.run(`INSERT INTO pg_orders(user_id, total_amount, items, status, date) VALUES
        (2, 4798.99, '[{"name":"Ultrabook Pro X1","qty":1,"price":1299.99},{"name":"Gaming Beast 5000","qty":1,"price":2499.00},{"name":"SmartPhone 15 Pro","qty":1,"price":999.00}]', 'Delivered', '2025-01-15T10:30:00Z'),
        (2, 199.99, '[{"name":"Cybersecurity Toolkit","qty":1,"price":199.99}]', 'Shipped', '2025-02-01T14:00:00Z'),
        (3, 89.99, '[{"name":"Mechanical Keyboard RGB","qty":1,"price":89.99}]', 'Processing', '2025-02-10T09:00:00Z')
            `);

            }
        });

        // Independent Seeding: CTF Flags
        playgroundDB.run('DROP TABLE IF EXISTS pg_flags', () => {
            playgroundDB.run(`CREATE TABLE IF NOT EXISTS pg_flags(
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                challenge_id TEXT UNIQUE,
                name TEXT,
                description TEXT,
                flag_code TEXT,
                points INTEGER,
                category TEXT DEFAULT 'Web'
            )`, () => {
                playgroundDB.get("SELECT count(*) as count FROM pg_flags", (err, row) => {
            if (row && row.count === 0) {
                console.log("[Playground DB] Seeding CTF Flags...");
                const flags = [
                    ['STORED_XSS',     'Stored XSS',           'Execute a persistent JavaScript payload via a product review',                                    '', 100, 'XSS'],
                    ['IDOR_ORDER',     'Order Snooping',       'Access another customer\'s order details by manipulating the order ID in the API',              '', 150, 'IDOR'],
                    ['LOGIC_PRICE',    'Free Shopping',        'Purchase items without paying full price by manipulating the checkout request',                  '', 200, 'Logic'],
                    ['SQLI_LOGIN',     'SQL Injection',        'Exploit a SQL injection vulnerability in the product search to extract data',                   '', 150, 'SQLi'],
                    ['ADMIN_ACCESS',   'Admin Panel Discovery','Access the store\'s admin API without any authorization credentials',                           '', 100, 'Access Control'],
                    ['BROKEN_AUTH_JWT','VIP Escalation',       'Forge a weak JWT token to elevate your role and access the VIP product catalogue',             '', 200, 'Auth'],
                    ['MISCONFIG_DEBUG','Hidden Endpoints',     'Discover a leftover debug route that exposes environment variables and credentials',             '', 100, 'Misconfig'],
                    ['CRYPTO_COUPONS', 'Discount Forgery',     'Reverse-engineer the coupon encoding scheme to forge a 100% discount coupon',                  '', 150, 'Crypto'],
                    ['SSRF_AVATAR',    'Internal Recon',       'Abuse the avatar fetcher to make the server request your target internal URLs',                '', 250, 'SSRF'],
                    ['RACE_CASHBACK',  'Double Cashback',      'Race the cashback redemption endpoint to redeem more than your available balance',             '', 300, 'Race Condition'],
                    ['WAF_RATE',       'Rate Limit Bypass',    'Spoof your IP address to bypass the WAF rate limiter and brute-force the gift card PIN',       '', 250, 'Rate Limit'],
                    ['LAB5_IDOR',      'IDOR Document Access', 'Access a confidential document belonging to another user by manipulating the document ID',     '', 150, 'IDOR'],
                    ['LAB6_CRYPTO',    'Cryptographic Failure','Crack a weakly hashed password using a rainbow table or dictionary attack',                    '', 200, 'Crypto']
                ];

                const fstmt = playgroundDB.prepare("INSERT INTO pg_flags (challenge_id, name, description, flag_code, points, category) VALUES (?, ?, ?, ?, ?, ?)");
                flags.forEach(f => fstmt.run(f));
                fstmt.finalize();

                // Seed per-user flags for the 4 pre-seeded accounts (IDs 1–4)
                setTimeout(() => {
                    try {
                        const { seedUserFlags } = require('../labs/playground/routes');
                        [1, 2, 3, 4].forEach(uid => seedUserFlags(uid));
                        console.log('[Playground DB] Per-user flags seeded for existing accounts.');
                    } catch(e) {
                        console.error('[Playground DB] Could not seed user flags:', e.message);
                    }
                }, 500); // wait 500ms for pg_flags insert to complete
            }
        });
        });
        });

        // Independent Seeding: Lab 5 Documents
        playgroundDB.get("SELECT count(*) as count FROM lab5_documents", (err, row) => {
            if (row && row.count === 0) {
                console.log("[Playground DB] Seeding Lab 5 Documents...");
                playgroundDB.run(`INSERT INTO lab5_documents (id, user_id, title, content, is_secret) VALUES 
                    (1, 1, 'Welcome to CyberStore', 'Welcome to the team! Here are your onboarding documents.', 0),
                    (2, 1, 'Weekly Timesheet', 'Please remember to submit your timesheet by Friday 5PM.', 0),
                    (3, 1, 'Project Alpha Guidelines', 'Codename Alpha is our new security initiative. Keep this confidential.', 0),
                    (99, 2, 'Project Titan (TechNova Acquisition)', 'CRITICAL: We are finalizing the acquisition of TechNova for $500M cash. This must absolutely NOT leak before the SEC filing on Thursday. If competitors find out, this deal falls through. - CEO', 1)
                `);
            }
        });

        // Independent Seeding: Lab 6 Users (Weak hashes)
        playgroundDB.get("SELECT count(*) as count FROM lab6_users", (err, row) => {
            if (row && row.count === 0) {
                console.log("[Playground DB] Seeding Lab 6 Users...");
                // Passwords hashed with MD5(password + 'CyberRange2024!')
                // guest = 'welcome', operator = 'qwerty', admin = 'shadow'
                playgroundDB.run(`INSERT INTO lab6_users (username, role, password_hash, last_login) VALUES 
                    ('guest_user', 'viewer', '8f3a484a8bcd793cc451c22716f990a1', '2025-12-14T09:30:00Z'),
                    ('operator', 'editor', 'a0e544ac1504d609a815eb2d1b3ed83b', '2025-12-14T15:20:00Z'),
                    ('admin', 'admin', '31fb61e2cc8214a139c51c9538c0f6b8', '2025-12-15T01:45:00Z')
                `);
            }
        });
    });
}

module.exports = { initDatabases, initLabsDB, initPlaygroundDB };
