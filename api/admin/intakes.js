// api/admin/intakes.js — Protected admin endpoint to list and update
// project intake submissions.
//
// Requires:
//   1. A Supabase Auth JWT in the Authorization: Bearer header (issued via
//      magic link in /admin/intakes).
//   2. The authenticated user's email to be in the ADMIN_EMAILS env var
//      (comma-separated whitelist).
//
// Reads/writes happen with the service-role client (which bypasses RLS),
// so the table policies are enforced here in code rather than in Postgres.

import { createClient } from '@supabase/supabase-js';
import { supabase } from '../_supabase.js';

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '')
  .split(',')
  .map(s => s.trim().toLowerCase())
  .filter(Boolean);

const VALID_STATUSES = ['new', 'reviewed', 'archived'];

async function authenticate(req) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  if (!token) return null;

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) return null;

  // Use a fresh anon-key client just to verify who the JWT belongs to.
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
  res.setHeader('Access-Control-Allow-Methods', 'GET, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const user = await authenticate(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  if (req.method === 'GET') {
    const status = String(req.query?.status || '').trim();
    const limit  = Math.min(parseInt(req.query?.limit, 10) || 100, 200);

    let query = supabase
      .from('intakes')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (VALID_STATUSES.includes(status)) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Admin intakes select error:', error);
      return res.status(500).json({ error: 'Database error' });
    }
    return res.status(200).json({ intakes: data });
  }

  if (req.method === 'PATCH') {
    const { id, status, admin_notes } = req.body || {};
    if (!id || typeof id !== 'string') return res.status(400).json({ error: 'id is required' });

    const update = {};
    if (status !== undefined) {
      if (!VALID_STATUSES.includes(status)) return res.status(400).json({ error: 'invalid status' });
      update.status = status;
    }
    if (admin_notes !== undefined) {
      if (typeof admin_notes !== 'string') return res.status(400).json({ error: 'admin_notes must be a string' });
      const trimmed = admin_notes.slice(0, 5000);
      update.admin_notes = trimmed.trim() ? trimmed : null;
    }
    if (Object.keys(update).length === 0) return res.status(400).json({ error: 'no fields to update' });

    const { data, error } = await supabase
      .from('intakes')
      .update(update)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Admin intakes update error:', error);
      return res.status(500).json({ error: 'Database error' });
    }
    return res.status(200).json({ intake: data });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
