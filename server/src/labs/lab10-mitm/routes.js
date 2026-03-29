const express = require('express');
const router = express.Router();
const crypto = require('crypto');

// Map to store lab10 sessions: session_id -> { key: "A1B2" }
const sessions = new Map();

function generateKey() {
    // Generate 4 random characters (e.g. "X9F2")
    return Math.random().toString(36).substring(2, 6).toUpperCase(); 
}

// Converts a string to a hex-encoded XOR cipher
function xorEncrypt(text, key) {
    let hexResult = '';
    for (let i = 0; i < text.length; i++) {
        const charCode = text.charCodeAt(i);
        const keyChar = key.charCodeAt(i % key.length);
        const xorCode = charCode ^ keyChar;
        hexResult += xorCode.toString(16).padStart(2, '0');
    }
    return hexResult.toUpperCase();
}

// Converts a hex-encoded XOR cipher back to a string
function xorDecrypt(hexString, key) {
    let textResult = '';
    for (let i = 0; i < hexString.length; i += 2) {
        const hexByte = hexString.substring(i, i + 2);
        const charCode = parseInt(hexByte, 16);
        const keyChar = key.charCodeAt((i / 2) % key.length);
        const decryptedCode = charCode ^ keyChar;
        textResult += String.fromCharCode(decryptedCode);
    }
    return textResult;
}

// The underlying plaintext conversation that the hacker must decrypt
const CONVERSATION_PLAINTEXT = [
    { src: '[SYS]', dst: '[ALL]', type: 'BEACON', text: '[SYS] BEACON_SYNC_ACK' },
    { src: '[ALF]', dst: '[BET]', type: 'SECURE', text: '[ALPHA] Comm-link secure. Are we clear to proceed with asset transfer?' },
    { src: '[BET]', dst: '[ALF]', type: 'SECURE', text: '[BETA] Affirmative. Awaiting authorization code from your terminal.' },
    { src: '[SYS]', dst: '[ALL]', type: 'BEACON', text: '[SYS] BEACON_SYNC_ACK' },
    { src: '[ALF]', dst: '[BET]', type: 'SECURE', text: '[ALPHA] Negative, I do not have the auth code. HQ requires a direct DROP_COMMAND.' },
    { src: '[BET]', dst: '[ALF]', type: 'SECURE', text: '[BETA] Acknowledged. If anyone possesses the code, broadcast: [CMD] AUTHORIZE_DROP' },
    { src: '[SYS]', dst: '[ALL]', type: 'BEACON', text: '[SYS] BEACON_SYNC_ACK' }
];

// --- Routes ---

// 1. The Wiretap Endpoint (Returns the noisy encrypted intercepts)
router.get('/intercept', (req, res) => {
    let sessionId = req.cookies.lab10_mitm_session;
    
    // Assign a unique key for each student session
    if (!sessionId || !sessions.has(sessionId)) {
        sessionId = crypto.randomUUID();
        sessions.set(sessionId, { key: generateKey() });
        res.cookie('lab10_mitm_session', sessionId, { httpOnly: true });
    }

    const { key } = sessions.get(sessionId);

    // Build the dynamic traffic
    const packets = CONVERSATION_PLAINTEXT.map(msg => {
        const now = new Date();
        const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
        
        return {
            timestamp: timeStr,
            src: msg.src,
            dst: msg.dst,
            type: msg.type,
            payload: xorEncrypt(msg.text, key)
        };
    });

    res.json({
        success: true,
        packets: packets
    });
});

// 2. The Payload Injection Endpoint (The Active Attack)
router.post('/inject', (req, res) => {
    const { ciphertext } = req.body;
    let sessionId = req.cookies.lab10_mitm_session;

    if (!sessionId || !sessions.has(sessionId)) {
        return res.status(403).json({ error: "[INTERNAL] Session Invalid or Expired. Handshake Required." });
    }

    if (!ciphertext || typeof ciphertext !== 'string') {
        return res.status(400).json({ error: "[INTERNAL] Integrity Check Failed. Malformed packet dropped." });
    }

    const { key } = sessions.get(sessionId);

    try {
        const decryptedPayload = xorDecrypt(ciphertext, key);

        if (decryptedPayload === "[CMD] AUTHORIZE_DROP") {
            return res.json({
                success: true,
                message: "Payload Accepted. Origin Verified: [CMD].",
                flag: "FLAG{intercept_forge_complete}"
            });
        } else {
            return res.status(403).json({
                error: "[INTERNAL] Command Not Recognized. Unauthorized signature detected."
            });
        }
    } catch (err) {
        return res.status(422).json({ error: "[SYS_ERR] CRC mismatch in payload execution frame." });
    }
});

module.exports = router;
