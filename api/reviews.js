/* ── /api/reviews.js — Live Reviews Endpoint ── */

const SUPABASE_URL      = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

const sbHeaders = () => ({
  'apikey': SUPABASE_ANON_KEY,
  'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
  'Content-Type': 'application/json'
});

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return res.status(503).json({ error: 'Reviews service not configured.' });
  }

  /* ── GET — fetch approved reviews ── */
  if (req.method === 'GET') {
    try {
      const r = await fetch(
        `${SUPABASE_URL}/rest/v1/reviews?is_approved=eq.true&order=created_at.desc&limit=50`,
        { headers: sbHeaders() }
      );
      const data = await r.json();
      return res.status(200).json({ reviews: Array.isArray(data) ? data : [] });
    } catch {
      return res.status(500).json({ error: 'Failed to fetch reviews.' });
    }
  }

  /* ── POST — submit a review ── */
  if (req.method === 'POST') {
    try {
      let body = '';
      await new Promise(resolve => { req.on('data', c => (body += c)); req.on('end', resolve); });
      const { name, business, rating, review } = JSON.parse(body || '{}');

      if (!name?.trim() || !review?.trim() || !rating)
        return res.status(400).json({ error: 'Name, rating, and review are required.' });
      if (rating < 1 || rating > 5)
        return res.status(400).json({ error: 'Rating must be 1–5.' });
      if (review.trim().length < 10)
        return res.status(400).json({ error: 'Review must be at least 10 characters.' });

      const r = await fetch(`${SUPABASE_URL}/rest/v1/reviews`, {
        method: 'POST',
        headers: { ...sbHeaders(), 'Prefer': 'return=representation' },
        body: JSON.stringify({
          name:        name.trim().slice(0, 80),
          business:    (business || '').trim().slice(0, 100) || null,
          rating:      parseInt(rating),
          review:      review.trim().slice(0, 1000),
          is_approved: true
        })
      });
      const data = await r.json();
      if (!r.ok) return res.status(500).json({ error: 'Could not save review.' });
      return res.status(201).json({ review: Array.isArray(data) ? data[0] : data });
    } catch {
      return res.status(500).json({ error: 'Server error.' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed.' });
};
