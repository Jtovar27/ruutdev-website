// api/contact.js — Web3Forms proxy + persistence to public.leads
//
// Receives contact form POSTs from ruutdev.com:
//   1) Forwards to Web3Forms server-side using WEB3FORMS_KEY (email arrives in inbox)
//   2) Inserts a row into public.leads (Supabase) for the admin dashboard
//
// Web3Forms is the source-of-truth for "did the lead reach a human"; Supabase
// is the source-of-truth for the admin workflow (filter, search, archive).
// Both run IN PARALLEL so total latency is max(web3forms, supabase), not sum.
// Persistence is best-effort — if Supabase write fails or the table doesn't
// exist yet we still return 200 to the client because the email already went out.
//
// SECURITY: API key never exposed to client-side JS.

// Lazy-import Supabase so a missing env var (or the table not existing yet)
// can never crash the contact endpoint at module-load time.
async function getSupabase() {
  try {
    const mod = await import('./_supabase.js');
    return mod.supabase;
  } catch (err) {
    console.error('Supabase client unavailable:', err?.message || err);
    return null;
  }
}

const recentRequests = new Map();

function extractLeadFields({ name, email, business, type, message }) {
  return {
    name: name?.slice(0, 200) || '',
    email: email?.slice(0, 200) || '',
    business: business?.slice(0, 200) || null,
    industry: null,
    message: (message || '').slice(0, 4000) || null,
    source: type || 'website',
    landing_page: null,
    page_url: null,
    referrer: null,
    utm_source: null,
    utm_medium: null,
    utm_campaign: null,
    utm_term: null,
    utm_content: null
  };
}

async function persistLead(payload) {
  // Returns true if the row landed in public.leads, false otherwise.
  try {
    const row = extractLeadFields(payload);
    if (!row.name || !row.email) return false;
    const supabase = await getSupabase();
    if (!supabase) return false;
    const { error } = await supabase.from('leads').insert(row);
    if (error) {
      // Common cause when first deploying: table doesn't exist yet (run the migration).
      console.error('Lead persistence failed:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Lead persistence threw:', err);
    return false;
  }
}

async function sendToWeb3Forms({ name, email, business, type, message }) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      signal: controller.signal,
      body: JSON.stringify({
        access_key: process.env.WEB3FORMS_KEY,
        name,
        email,
        business: business || '',
        type: type || '',
        message: message || ''
      })
    });
    return { ok: response.ok, status: response.status };
  } catch (err) {
    return { ok: false, error: err };
  } finally {
    clearTimeout(timeout);
  }
}

export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', 'https://www.ruutdev.com');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, business = '', type = '', message = '', consent, website } = req.body || {};

  // Honeypot: return a generic success without forwarding or persisting spam.
  if (typeof website === 'string' && website.trim()) {
    return res.status(200).json({ success: true });
  }

  if (typeof name !== 'string' || typeof email !== 'string' ||
      typeof business !== 'string' || typeof type !== 'string' || typeof message !== 'string') {
    return res.status(400).json({ error: 'Invalid field types' });
  }

  const clean = (value) => value.trim().replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, ' ');
  const normalized = {
    name: clean(name), email: clean(email), business: clean(business),
    type: clean(type), message: clean(message)
  };

  // Per-instance burst protection with bounded memory. Persistent distributed
  // limiting remains an infrastructure follow-up for coordinated abuse.
  const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
  const now = Date.now();
  if (recentRequests.size > 1000) {
    for (const [key, times] of recentRequests) {
      if (!times.some((time) => now - time < 60_000)) recentRequests.delete(key);
    }
    if (recentRequests.size > 1000) recentRequests.delete(recentRequests.keys().next().value);
  }
  const recent = (recentRequests.get(ip) || []).filter((time) => now - time < 60_000);
  if (recent.length >= 5) return res.status(429).json({ error: 'Too many requests' });
  recent.push(now); recentRequests.set(ip, recent);

  // Basic field validation mirrors the commercial form in rebuild.js.
  if (!normalized.name || !normalized.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized.email) ||
      normalized.name.length > 120 || normalized.email.length > 200 ||
      normalized.business.length > 160 || normalized.type.length > 160 ||
      normalized.message.length > 6000) {
    return res.status(400).json({ error: 'name and email are required' });
  }

  if (consent !== true) {
    return res.status(400).json({ error: 'consent is required' });
  }

  // Run Web3Forms email and Supabase persistence in PARALLEL.
  // The lead is "captured" if EITHER channel succeeds:
  //   - Supabase insert ok → lead is in /admin/intakes (Leads tab)
  //   - Web3Forms ok       → email reached the inbox
  // Only return an error to the user if BOTH fail (real lead loss).
  const payload = normalized;
  const [emailResult, persisted] = await Promise.all([
    sendToWeb3Forms(payload),
    persistLead(payload).catch(err => {
      console.error('persistLead unhandled:', err);
      return false;
    })
  ]);

  if (emailResult.ok || persisted) {
    return res.status(200).json({
      success: true,
      delivered: true
    });
  }
  if (emailResult.error?.name === 'AbortError') {
    return res.status(504).json({ error: 'Request timeout' });
  }
  return res.status(502).json({ error: 'Upstream error' });
}
