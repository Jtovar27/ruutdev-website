// api/contact.js — Web3Forms proxy
// Receives contact form POSTs from ruutdev.com, forwards to Web3Forms
// server-side using WEB3FORMS_KEY from env vars.
// SECURITY: API key never exposed to client-side JS.

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
      return res.status(200).json({ success: true });
    }
    return res.status(502).json({ error: 'Upstream error' });
  } catch (err) {
    clearTimeout(timeout);
    if (err.name === 'AbortError') {
      return res.status(504).json({ error: 'Request timeout' });
    }
    return res.status(500).json({ error: 'Request failed' });
  }
}
