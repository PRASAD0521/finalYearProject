const express = require('express');
const router = express.Router();
const crypto = require('crypto');

// Map to store lab10 sessions: sessionId → { key, failCount }
const sessions = new Map();

function generateKey() {
    return Math.random().toString(36).substring(2, 6).toUpperCase();
}

function xorEncrypt(text, key) {
    let hexResult = '';
    for (let i = 0; i < text.length; i++) {
        const xorCode = text.charCodeAt(i) ^ key.charCodeAt(i % key.length);
        hexResult += xorCode.toString(16).padStart(2, '0');
    }
    return hexResult.toUpperCase();
}

function xorDecrypt(hexString, key) {
    let textResult = '';
    for (let i = 0; i < hexString.length; i += 2) {
        const charCode = parseInt(hexString.substring(i, i + 2), 16);
        const decryptedCode = charCode ^ key.charCodeAt((i / 2) % key.length);
        textResult += String.fromCharCode(decryptedCode);
    }
    return textResult;
}

const CONVERSATION_PLAINTEXT = [
    { src: '[SYS]', dst: '[ALL]',  type: 'BEACON', text: '[SYS] BEACON_SYNC_ACK' },
    { src: '[ALF]', dst: '[BET]',  type: 'SECURE', text: '[ALPHA] Comm-link secure. Are we clear to proceed with asset transfer?' },
    { src: '[BET]', dst: '[ALF]',  type: 'SECURE', text: '[BETA] Affirmative. Awaiting authorization code from your terminal.' },
    { src: '[SYS]', dst: '[ALL]',  type: 'BEACON', text: '[SYS] BEACON_SYNC_ACK' },
    { src: '[ALF]', dst: '[BET]',  type: 'SECURE', text: '[ALPHA] Negative, I do not have the auth code. HQ requires a direct DROP_COMMAND.' },
    { src: '[BET]', dst: '[ALF]',  type: 'SECURE', text: '[BETA] Acknowledged. If anyone possesses the code, broadcast: [CMD] AUTHORIZE_DROP' },
    { src: '[SYS]', dst: '[ALL]',  type: 'BEACON', text: '[SYS] BEACON_SYNC_ACK' }
];

// ─── GET /intercept ──────────────────────────────────────────────────────────
router.get('/intercept', (req, res) => {
    let sessionId = req.cookies.lab10_mitm_session;

    if (!sessionId || !sessions.has(sessionId)) {
        sessionId = crypto.randomUUID();
        sessions.set(sessionId, { key: generateKey(), failCount: 0 });
        res.cookie('lab10_mitm_session', sessionId, { httpOnly: true });
    }

    const { key } = sessions.get(sessionId);

    const packets = CONVERSATION_PLAINTEXT.map(msg => ({
        src: msg.src,
        dst: msg.dst,
        type: msg.type,
        payload: xorEncrypt(msg.text, key)
    }));

    res.json({ success: true, packets });
});

// ─── POST /inject ────────────────────────────────────────────────────────────
router.post('/inject', (req, res) => {
    const { ciphertext } = req.body;
    let sessionId = req.cookies.lab10_mitm_session;

    if (!sessionId || !sessions.has(sessionId)) {
        return res.status(403).json({ error: '[INTERNAL] Session Invalid or Expired. Handshake Required.' });
    }
    if (!ciphertext || typeof ciphertext !== 'string') {
        return res.status(400).json({ error: '[INTERNAL] Malformed packet dropped.' });
    }

    const session = sessions.get(sessionId);
    const { key } = session;

    try {
        const decryptedPayload = xorDecrypt(ciphertext, key);

        // ── Correct command ──────────────────────────────────────────────────
        if (decryptedPayload === '[CMD] AUTHORIZE_DROP') {
            session.failCount = 0;

            const responsePacket = {
                src: '[SYS]',
                dst: '[YOU]',
                type: 'RESPONSE',
                payload: xorEncrypt('[SYS] COMMAND_ACCEPTED :: FLAG{intercept_forge_complete}', key)
            };

            return res.json({
                success: true,
                message: 'Payload Accepted. Origin Verified: [CMD].',
                responsePacket
            });
        }

        // ── Wrong command ────────────────────────────────────────────────────
        session.failCount = (session.failCount || 0) + 1;

        const wrongResponsePacket = {
            src: '[SYS]',
            dst: '[ALL]',
            type: 'RESPONSE',
            payload: xorEncrypt('[SYS] COMMAND_UNCLEAR', key)
        };

        // Key rotation after 3 fails
        if (session.failCount >= 3) {
            const newKey = generateKey();
            session.key = newKey;
            session.failCount = 0;

            const rekeyPacket = {
                src: '[SYS]',
                dst: '[ALL]',
                type: 'REKEY',
                payload: xorEncrypt('[SYS] CHANNEL_REKEY_INITIATED', newKey)
            };

            const newBeacons = [
                { src: '[SYS]', dst: '[ALL]', type: 'BEACON', payload: xorEncrypt('[SYS] BEACON_SYNC_ACK', newKey) },
                { src: '[SYS]', dst: '[ALL]', type: 'BEACON', payload: xorEncrypt('[SYS] BEACON_SYNC_ACK', newKey) }
            ];

            return res.status(403).json({
                error: '[INTERNAL] Command Not Recognized. Unauthorized signature detected.',
                responsePacket: wrongResponsePacket,
                keyRotated: true,
                rekeyPacket,
                newBeacons
            });
        }

        return res.status(403).json({
            error: '[INTERNAL] Command Not Recognized. Unauthorized signature detected.',
            failCount: session.failCount,
            attemptsLeft: 3 - session.failCount,
            responsePacket: wrongResponsePacket
        });

    } catch (err) {
        return res.status(422).json({ error: '[SYS_ERR] CRC mismatch in payload execution frame.' });
    }
});

// ─── POST /verify-flag ───────────────────────────────────────────────────────
router.post('/verify-flag', (req, res) => {
    const { flag } = req.body;
    if (flag === 'FLAG{intercept_forge_complete}') {
        return res.json({ success: true, message: 'Valid flag.' });
    }
    return res.status(403).json({ success: false, message: 'Invalid flag.' });
});

module.exports = router;
