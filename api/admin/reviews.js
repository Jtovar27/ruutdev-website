// api/admin/reviews.js — Protected admin endpoint to list, approve,
// unapprove, and delete site reviews.
//
// Same auth pattern as /api/admin/intakes:
//   1. Supabase Auth JWT in Authorization: Bearer header
//   2. Authenticated user's email must be in ADMIN_EMAILS env var

import { createClient } from '@supabase/supabase-js';
import { supabase } from '../_supabase.js';

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '')
  .split(',')
  .map(s => s.trim().toLowerCase())
  .filter(Boolean);

async function authenticate(req) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  if (!token) return null;

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) return null;

  const verifyClient = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );

  const { data, error } = await verifyClient.auth.getUser(token);
  if (error || !data?.user) return null;

  const email = (data.user.email || '').toLowerCase();
  if (!ADMIN_EMAILS.length || !ADMIN_EMAILS.includes(email)) return null;

  return data.user;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin',  'https://ruutdev.com');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const user = await authenticate(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  if (req.method === 'GET') {
    const status = String(req.query?.status || 'all').trim();
    const limit  = Math.min(parseInt(req.query?.limit, 10) || 100, 200);

    let query = supabase
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (status === 'pending')  query = query.eq('is_approved', false);
    if (status === 'approved') query = query.eq('is_approved', true);

    const { data, error } = await query;
    if (error) {
      console.error('Admin reviews select error:', error);
      return res.status(500).json({ error: 'Database error' });
    }
    return res.status(200).json({ reviews: data });
  }

  if (req.method === 'PATCH') {
    const { id, is_approved } = req.body || {};
    if (!id || typeof id !== 'string') return res.status(400).json({ error: 'id is required' });
    if (typeof is_approved !== 'boolean') return res.status(400).json({ error: 'is_approved must be boolean' });

    const { data, error } = await supabase
      .from('reviews')
      .update({ is_approved })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Admin reviews update error:', error);
      return res.status(500).json({ error: 'Database error' });
    }
    return res.status(200).json({ review: data });
  }

  if (req.method === 'DELETE') {
    const { id } = req.body || {};
    if (!id || typeof id !== 'string') return res.status(400).json({ error: 'id is required' });

    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Admin reviews delete error:', error);
      return res.status(500).json({ error: 'Database error' });
    }
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
