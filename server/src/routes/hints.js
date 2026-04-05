const express = require('express');
const router = express.Router();

const MASTER_HINTS = {
  1: [
    "SQL queries use single quotes (') to define strings. What happens if you inject your own single quote?",
    "The backend query looks like: SELECT * FROM users WHERE username = '[YOUR_INPUT]'",
    "Try injecting boolean logic that is always true, such as OR 1=1",
    "Don't forget to comment out the rest of the query! In SQLite, a comment is --."
  ],
  2: [
    "When you type a standard word and press search, where exactly does that word appear on the screen?",
    "If the application just pastes your text directly into the DOM, what happens if your text IS HTML?",
    "Try wrapping your search term in basic HTML tags, like <h1>test</h1>. Does the text get bigger? If so, you have HTML Injection.",
    "If HTML works, JavaScript (XSS) will work. Try an active payload like: <script>alert(1)</script> or <img src=x onerror=alert(1)>"
  ],
  3: [
    "When you submit a wrong OTP, the server replies with a JSON object saying { success: false }.",
    "The frontend React application blindly trusts whatever that JSON object says.",
    "Turn the Interceptor ON. Submit a fake OTP. The request will pause.",
    "Look at the JSON response in the inspector. Change the word 'false' to 'true' and click Forward!"
  ],
  4: [
    "Run the FFUF scan. Look for a result that returned [Status: 200]. That means the endpoint exists and is accessible.",
    "Paste that exact path (e.g., /api/labs/...) into the API Sandbox below.",
    "Try sending an unescaped single quote `'` in the ID field to break the SQL query.",
    "Analyze the massive error trace. What is the SQL statement? What is the backend table name?",
    "Craft a UNION-based payload matching the 4 selected columns. e.g., `' UNION SELECT 1, 2, 3, secret_key FROM beta_users--`"
  ],
  5: [
    "The front door (viewing documents in the UI) is perfectly locked. But what about the 'Export' feature?",
    "Click the 'Export My Data Archive' button. Does it download a file?",
    "Open Developer Tools (F12) -> Network Tab. Click Export again. Look closely at the API request URL.",
    "The URL likely says `?user_id=...`. What happens if you copy that exact URL into a new tab, but change the ID to something else? Find the hidden FLAG in the leaked JSON!"
  ],
  6: [
    "First, click 'Run System Backup'. This will download a JSON file containing the backup database dump.",
    "Look inside the JSON file. You will see the admin's password hash. Unfortunately, you can't reverse a hash without knowing the algorithm and the salt.",
    "Open Developer Tools (F12) -> Network tab. Refresh the page. Look for a leaked javascript file (like config.js) that exposes the weak algorithm and the hardcoded salt.",
    "Once you know the salt ('CyberRange2024!') and algorithm (md5), you can write a simple Python or NodeJS script to hash a dictionary of common passwords until you find the exact match!"
  ],
  7: [
    "The 'Import Profile' button makes a request FROM the server — not your browser. What if you pointed it at the server itself instead of LinkedIn?",
    "Try entering http://127.0.0.1:4000/api/internal/ as the URL. Servers often expose internal APIs on localhost that aren't reachable from the internet.",
    "You found the internal API index. Read the available_routes carefully — one of them hints at where production config is stored.",
    "Fetch http://127.0.0.1:4000/api/internal/server-config — look for the 'flag' field in the JSON response, then submit it in the flag box below."
  ],
  8: [
    "A human clicking the 'CLAIM' button fast is not fast enough. You need the speed of a machine.",
    "Open the Developer Tools (F12) and navigate to the 'Console' tab.",
    "Write a JavaScript loop that executes `fetch('/api/labs/lab8-race/claim', { method: 'POST' })` 30-50 times instantly.",
    "Example exploit script: `for(let i=0; i<50; i++) fetch('/api/labs/lab8-race/claim', { method: 'POST' });` Paste it, hit Enter, and then click 'Reset Lab' if you need to try again!"
  ],
  9: [
    "A human cannot guess a 3-digit PIN in 3 tries. You need to write a script that guesses all 1,000 possibilities.",
    "The WAF blocks your IP after 3 tries. But how does it know your IP? It looks at the `X-Forwarded-For` HTTP header.",
    "If you spoof that header with a random IP on every single fetch request, the WAF will think every guess is coming from a brand new computer!",
    "Example exploit: `for(let i=0; i<1000; i++){ let pin=i.toString().padStart(3,'0'); fetch('/api/labs/lab9-waf/verify', { method: 'POST', headers: {'Content-Type': 'application/json', 'X-Forwarded-For': Math.random().toString()}, body: JSON.stringify({pin}) }) }`"
  ],
  10: [
    "The beacon messages occur on a strict, continuous interval. They are your baseline.",
    "Since the stream cipher uses a repeating 4-character pattern, the beacon acts as a known-plaintext.",
    "If you XOR the known plaintext beacon against the ciphertext beacon, you will derive the exact 4-character key.",
    "Use the derived key to XOR your own forged payload. Submit it in pure HEX format to hijack the feed!"
  ]
};

// GET /api/hints/:labId/count
// Utility route for AI Chatbot internally, or to retrieve hint count
router.get('/:labId/count', (req, res) => {
    const labId = parseInt(req.params.labId, 10);
    const labHints = MASTER_HINTS[labId];
    if (!labHints) return res.status(404).json({ count: 0 });
    res.json({ count: labHints.length });
});

// GET /api/hints/:labId/:hintId
// Securely fetch a hint matching the lab ID and sequential index
router.get('/:labId/:hintId', (req, res) => {
    const labId = parseInt(req.params.labId, 10);
    const hintId = parseInt(req.params.hintId, 10); // 0-indexed index

    if (isNaN(hintId)) return res.status(400).json({ error: 'hintId must be a number' });

    const labHints = MASTER_HINTS[labId];
    if (!labHints || !labHints[hintId]) {
        return res.status(404).json({ error: 'Hint not found' });
    }

    res.json({ success: true, hint: labHints[hintId] });
});

module.exports = { router, MASTER_HINTS };
