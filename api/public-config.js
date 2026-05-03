// api/public-config.js — Exposes Supabase URL + anon key to the browser
// for direct file uploads to Storage. The anon key is designed to be public;
// access control comes from RLS policies on tables and Storage buckets.
// The service-role key NEVER goes through this endpoint.

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin',  'https://ruutdev.com');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control',                'public, max-age=300, s-maxage=300');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET')     return res.status(405).json({ error: 'Method not allowed' });

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    return res.status(503).json({ error: 'Supabase not configured' });
  }

  return res.status(200).json({
    supabaseUrl:     process.env.SUPABASE_URL,
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY
  });
}
