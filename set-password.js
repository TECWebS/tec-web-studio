// ============================================================================
//  TEC Web Studio — admin password setup (Vercel serverless function)
//
//  Put this file in your tec-api project as:   /api/set-password.js
//
//  Lets an admin who is ALREADY signed in (via the normal email link) set a
//  password on their own account, so future sign-ins can skip the email step.
//  This never lets anyone set a password for someone else's account — the
//  target is always whoever the login token belongs to, and that account
//  must already be listed in Firestore's "admins" collection.
//
//  Uses the SAME environment variable you already have set:
//    FIREBASE_SERVICE_ACCOUNT
// ============================================================================
const admin = require('firebase-admin');

const ORIGINS = (process.env.ALLOWED_ORIGINS || 'https://www.tecwebstudio.com,https://tecwebstudio.com').split(',').map(s => s.trim()).filter(Boolean);

function app() {
  if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
  return admin;
}

module.exports = async (req, res) => {
  const origin = req.headers.origin || '';
  if (ORIGINS.includes(origin)) { res.setHeader('Access-Control-Allow-Origin', origin); res.setHeader('Vary', 'Origin'); }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false });
  if (origin && !ORIGINS.includes(origin)) return res.status(403).json({ ok: false });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  body = body || {};

  try {
    if (!process.env.FIREBASE_SERVICE_ACCOUNT) return res.status(500).json({ ok: false, error: 'not-configured' });

    const newPassword = String(body.newPassword || '');
    if (newPassword.length < 8) return res.status(400).json({ ok: false, error: 'password-too-short' });

    const a = app();
    let decoded;
    try { decoded = await a.auth().verifyIdToken(String(body.idToken || '')); } catch (e) { return res.status(403).json({ ok: false, error: 'forbidden' }); }
    const email = String(decoded.email || '').toLowerCase();
    if (!decoded.email_verified) return res.status(403).json({ ok: false, error: 'forbidden' });

    const db = a.firestore();
    const isAdmin = (await db.collection('admins').doc(email).get()).exists;
    if (!isAdmin) return res.status(403).json({ ok: false, error: 'forbidden' });

    // decoded.uid is the token's own subject — never taken from the request body,
    // so this can only ever change the password of whoever is actually signed in.
    await a.auth().updateUser(decoded.uid, { password: newPassword });
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('set-password error:', err && err.message);
    return res.status(500).json({ ok: false, error: 'server-error' });
  }
};
