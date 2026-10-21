// Server-checked saves for Oranget. Needs the Blaze plan. See SETUP.md.
// The browser sends its whole save to saveBlob(); this function decides what is allowed before it is stored.
// Tune the numbers below if honest players ever get "corrected".
const { onCall, HttpsError } = require('firebase-functions/v2/https')
const admin = require('firebase-admin')
admin.initializeApp()
const db = admin.firestore()

const LIMITS = {
  maxBlobBytes: 900 * 1024,
  maxTokens: 5_000_000,        // nobody holds more than this
  baseGain: 300_000,           // tokens a save may gain with no time passing
  gainPerMinute: 20_000,       // plus this much for every minute since the last save
  maxGain: 2_000_000,          // hard ceiling for one save
  maxNewBlooks: 250,           // blooks a single save may add
  maxBlooks: 20_000,
}
const OWNER_ONLY = { yoshiking: ['devmaster', 'devdragon'], pinksmile: ['dxm'] } // blook id -> the only players allowed to own it

exports.saveBlob = onCall({ region: 'us-central1', enforceAppCheck: false, maxInstances: 20 }, async (req) => {
  if (!req.auth) throw new HttpsError('unauthenticated', 'Sign in first.')
  const raw = String((req.data && req.data.blob) || '')
  if (!raw || raw.length > LIMITS.maxBlobBytes) throw new HttpsError('invalid-argument', 'Bad save size.')
  let u
  try { u = JSON.parse(raw) } catch { throw new HttpsError('invalid-argument', 'Bad save.') }
  if (!u || typeof u !== 'object' || typeof u.name !== 'string' || !Array.isArray(u.inv)) throw new HttpsError('invalid-argument', 'Bad save.')

  const ref = db.doc('users/' + req.auth.uid)
  return db.runTransaction(async (t) => {
    const snap = await t.get(ref)
    if (!snap.exists) throw new HttpsError('not-found', 'No account.')
    const doc = snap.data()
    if (String(doc.nameLower) !== u.name.toLowerCase() && !(doc.nameLower === 'devdragon' && u.name === 'DEVMASTER')) throw new HttpsError('permission-denied', 'Name mismatch.')
    let prev = {}
    try { prev = JSON.parse(doc.blob || '{}') } catch {}
    let fixed = false
    // blooks only their owners may have
    const nl = String(doc.nameLower)
    const inv = u.inv.filter((id) => { const ok = !OWNER_ONLY[id] || OWNER_ONLY[id].includes(nl); if (!ok) fixed = true; return ok })
    // too many new blooks at once: keep the old ones plus the allowed number of new ones
    const before = Array.isArray(prev.inv) ? prev.inv.length : inv.length
    if (inv.length > before + LIMITS.maxNewBlooks) { inv.length = before + LIMITS.maxNewBlooks; fixed = true }
    if (inv.length > LIMITS.maxBlooks) { inv.length = LIMITS.maxBlooks; fixed = true }
    // tokens
    let tokens = Math.max(0, Math.floor(Number(u.tokens) || 0))
    const prevT = Math.max(0, Math.floor(Number(prev.tokens) || 0))
    const mins = Math.max(0, ((Date.now() - (doc.at && doc.at.toMillis ? doc.at.toMillis() : Date.now())) / 60000))
    const allow = Math.min(LIMITS.maxGain, LIMITS.baseGain + LIMITS.gainPerMinute * mins)
    if (tokens > prevT + allow) { tokens = prevT + Math.floor(allow); fixed = true }
    if (tokens > LIMITS.maxTokens) { tokens = LIMITS.maxTokens; fixed = true }
    const clean = { ...u, inv, tokens }
    const blob = JSON.stringify(clean)
    t.set(ref, { blob, saved: Number(u.saved) || Date.now(), dev: String(req.data.dev || '').slice(0, 64), at: admin.firestore.FieldValue.serverTimestamp() }, { merge: true })
    return { ok: true, fixed, blob: fixed ? blob : undefined }
  })
})
