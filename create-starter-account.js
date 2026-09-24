// ============================================================================
//  TEC Web Studio — Site Starter checkout fulfillment (Vercel serverless function)
//
//  Put this file in your tec-api project as:   /api/create-starter-account.js
//  Called by starter-checkout.html right after Stripe confirms payment.
//
//  What it does, and why the order matters:
//   1. Re-checks the payment with Stripe itself (never trusts the browser for
//      the amount or whether it actually succeeded).
//   2. Creates the customer's account in Firestore, so they can sign in and
//      start building immediately, without you adding them by hand.
//   3. Emails the customer their sign-in link (via /api/site-mail).
//   4. Tells you it happened (via your existing Apps Script).
//
//  Every step after the Stripe check is wrapped so a failure in one (say, the
//  email) never causes a paying customer to be charged with no account made.
//
//  Uses the SAME Vercel environment variables you already have set:
//    STRIPE_SECRET_KEY, FIREBASE_SERVICE_ACCOUNT
//  Optional (falls back to sensible defaults if unset):
//    MAIL_ENDPOINT, APPS_SCRIPT_URL, ALLOWED_ORIGINS
// ============================================================================
const admin = require('firebase-admin');
const Stripe = require('stripe');

const cfg = () => ({
  mailEndpoint: process.env.MAIL_ENDPOINT || 'https://tec-api.vercel.app/api/site-mail',
  appsScriptUrl: process.env.APPS_SCRIPT_URL || 'https://script.google.com/macros/s/AKfycbwNbHQU-dH96BhmDKglulagFgnjSP24yZ5mGJqd9npe09CM45Ur6L77pHSQGBAUqoOM/exec',
  origins: (process.env.ALLOWED_ORIGINS || 'https://www.tecwebstudio.com,https://tecwebstudio.com').split(',').map(s => s.trim()).filter(Boolean)
});

// Server-authoritative prices, in cents. The browser's price is never trusted —
// only what Stripe actually charged, compared against this table.
const PLANS = { 1: { cents: 5000, label: '1 year — $50' }, 2: { cents: 8000, label: '2 years — $80' }, 3: { cents: 11000, label: '3 years — $110' } };

const normEmail = (e) => { e = String(e || '').trim().toLowerCase(); return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) && e.length <= 200 ? e : ''; };
const cleanStr = (s, max) => String(s == null ? '' : s).slice(0, max).trim();

function app() {
  if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
  return admin;
}

function addYears(d, n) { const x = new Date(d.getTime()); x.setFullYear(x.getFullYear() + n); return x; }

async function notifyOwner(payload) {
  await fetch(cfg().appsScriptUrl, { method: 'POST', body: JSON.stringify(Object.assign({ formType: 'Site Starter Order' }, payload)) }).catch(() => {});
}

module.exports = async (req, res) => {
  const c = cfg();
  const origin = req.headers.origin || '';
  if (c.origins.includes(origin)) { res.setHeader('Access-Control-Allow-Origin', origin); res.setHeader('Vary', 'Origin'); }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false });
  if (origin && !c.origins.includes(origin)) return res.status(403).json({ ok: false });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  body = body || {};

  try {
    if (!process.env.STRIPE_SECRET_KEY || !process.env.FIREBASE_SERVICE_ACCOUNT) return res.status(500).json({ ok: false, error: 'not-configured' });

    const paymentIntentId = cleanStr(body.paymentIntentId, 100);
    const email = normEmail(body.email);
    const years = [1, 2, 3].includes(Number(body.years)) ? Number(body.years) : 0;
    if (!paymentIntentId || !email || !years) return res.status(400).json({ ok: false, error: 'bad-input' });

    const businessName = cleanStr(body.businessName, 80);
    const fullName = cleanStr(body.fullName, 80);
    const phone = cleanStr(body.phone, 40);
    const domainFirst = cleanStr(body.domainFirst, 80);
    const domainSecond = cleanStr(body.domainSecond, 80);

    // 1. Verify the payment with Stripe itself — status AND amount, never the browser's word for it.
    const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
    let pi;
    try { pi = await stripe.paymentIntents.retrieve(paymentIntentId); } catch (e) { return res.status(400).json({ ok: false, error: 'payment-not-found' }); }
    const plan = PLANS[years];
    if (pi.status !== 'succeeded' || pi.currency !== 'usd' || pi.amount !== plan.cents) {
      return res.status(402).json({ ok: false, error: 'payment-not-verified' });
    }

    const a = app(), db = a.firestore();

    // 2. Idempotent: if this exact payment was already processed (page refresh, retry), don't redo the side effects.
    const orderRef = db.collection('starterOrders').doc(paymentIntentId);
    if ((await orderRef.get()).exists) return res.status(200).json({ ok: true, alreadyProcessed: true });
    await orderRef.set({ email, years, createdAt: a.firestore.FieldValue.serverTimestamp() });

    // 3. Create or extend the account. A renewal extends from whichever is later: today, or their current end date.
    const acctRef = db.collection('accounts').doc(email);
    const now = new Date();
    const existing = await acctRef.get();
    const prevEnd = existing.exists && existing.data().active === true && existing.data().termEnd && existing.data().termEnd.toDate() > now ? existing.data().termEnd.toDate() : now;
    const termEnd = addYears(prevEnd, years);
    await acctRef.set({
      active: true,
      years,
      businessName: businessName || (existing.exists ? existing.data().businessName || '' : ''),
      fullName, phone,
      termStart: existing.exists && existing.data().termStart ? existing.data().termStart : a.firestore.Timestamp.fromDate(now),
      termEnd: a.firestore.Timestamp.fromDate(termEnd),
      createdAt: existing.exists && existing.data().createdAt ? existing.data().createdAt : a.firestore.Timestamp.fromDate(now),
      lastOrder: { paymentIntentId, years, amountCents: pi.amount, at: a.firestore.FieldValue.serverTimestamp() },
      agreementAcceptedAt: a.firestore.FieldValue.serverTimestamp(),
      agreementVersion: cleanStr(body.agreementVersion, 20) || '0.1',
      domainWish: { first: domainFirst, second: domainSecond }
    }, { merge: true });

    const planEndsStr = termEnd.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

    // 4. Email the customer their sign-in link. If this fails, the account still exists —
    //    you (or they, via "forgot sign-in link") can still get them in.
    let mailOk = true;
    try {
      const r = await fetch(c.mailEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'login', email }) });
      mailOk = r.ok;
    } catch (e) { mailOk = false; }

    // 5. Let the owner know — never let this block the response to the customer.
    await notifyOwner({
      email, businessName, fullName, phone,
      plan: plan.label, amountPaid: '$' + (pi.amount / 100).toFixed(2),
      domainFirst, domainSecond, planEnds: planEndsStr
    });

    return res.status(200).json({ ok: true, planEnds: planEndsStr, mailSent: mailOk });
  } catch (err) {
    console.error('create-starter-account error:', err && err.message);
    return res.status(500).json({ ok: false, error: 'server-error' });
  }
};
