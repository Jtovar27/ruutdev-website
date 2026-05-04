// api/contact.js — Web3Forms proxy + persistence to public.leads
//
// Receives contact form POSTs from ruutdev.com:
//   1) Forwards to Web3Forms server-side using WEB3FORMS_KEY (email arrives in inbox)
//   2) Inserts a row into public.leads (Supabase) for the admin dashboard
//
// Web3Forms is the source-of-truth for "did the lead reach a human"; Supabase
// is the source-of-truth for the admin workflow (filter, search, archive).
// Persistence is best-effort — if Supabase write fails we still return 200 to
// the client because the email already went out.
//
// SECURITY: API key never exposed to client-side JS.

import { supabase } from './_supabase.js';

const LP_MARKER = '── Google Ads LP';

function pick(text, label) {
  // Extracts "Label: value" lines from the LP-formatted message body.
  const re = new RegExp(`^${label}:\\s*(.*?)\\s*$`, 'mi');
  const m = (text || '').match(re);
  if (!m) return null;
  const v = (m[1] || '').trim();
  if (!v || v === '-' || v === '(not specified)' || v === '(not provided)') return null;
  return v;
}

function pickUtm(text, key) {
  // The LP packs UTMs as: `UTM source/medium/campaign: a / b / c` and `UTM term/content: x / y`
  if (!text) return null;
  const m1 = text.match(/UTM source\/medium\/campaign:\s*([^\n]+)/i);
  const m2 = text.match(/UTM term\/content:\s*([^\n]+)/i);
  let source = null, medium = null, campaign = null, term = null, content = null;
  if (m1) {
    const parts = m1[1].split('/').map(s => s.trim());
    [source, medium, campaign] = parts;
  }
  if (m2) {
    const parts = m2[1].split('/').map(s => s.trim());
    [term, content] = parts;
  }
  const map = { source, medium, campaign, term, content };
  const v = map[key];
  if (!v || v === '-') return null;
  return v;
}

function extractLeadFields({ name, email, business, type, message }) {
  const isLpLead = typeof message === 'string' && message.includes(LP_MARKER);

  if (!isLpLead) {
    // Generic /contact submission — store the bare minimum so it still shows up.
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

  return {
    name: name?.slice(0, 200) || '',
    email: email?.slice(0, 200) || '',
    business: business?.slice(0, 200) || null,
    industry: pick(message, 'Industry'),
    message: pick(message, 'What the business needs'),
    source: 'google_ads_lp',
    landing_page: pick(message, 'Landing page'),
    page_url: pick(message, 'Page URL'),
    referrer: pick(message, 'Referrer'),
    utm_source: pickUtm(message, 'source'),
    utm_medium: pickUtm(message, 'medium'),
    utm_campaign: pickUtm(message, 'campaign'),
    utm_term: pickUtm(message, 'term'),
    utm_content: pickUtm(message, 'content')
  };
}

async function persistLead(payload) {
  try {
    const row = extractLeadFields(payload);
    if (!row.name || !row.email) return; // Already validated upstream, but be safe.
    const { error } = await supabase.from('leads').insert(row);
    if (error) {
      // Don't throw — email already sent, persistence is best-effort.
      console.error('Lead persistence failed:', error);
    }
  } catch (err) {
    console.error('Lead persistence threw:', err);
  }
}

export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', 'https://ruutdev.com');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, business, type, message } = req.body || {};

  // Basic field validation — mirrors client-side validation in main.js
  if (!name || !email) {
    return res.status(400).json({ error: 'name and email are required' });
  }

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
    clearTimeout(timeout);

    if (response.ok) {
      // Fire-and-forget the Supabase insert (await so the function doesn't end
      // before the request completes on Vercel, but never let it 500 the response).
      await persistLead({ name, email, business, type, message });
      return res.status(200).json({ success: true });
    }
    // Even if Web3Forms had a hiccup, try to persist so the lead isn't lost.
    await persistLead({ name, email, business, type, message });
    return res.status(502).json({ error: 'Upstream error' });
  } catch (err) {
    clearTimeout(timeout);
    // Web3Forms timeout / network error — still try to save the lead.
    await persistLead({ name, email, business, type, message });
    if (err.name === 'AbortError') {
      return res.status(504).json({ error: 'Request timeout' });
    }
    return res.status(500).json({ error: 'Request failed' });
  }
}
