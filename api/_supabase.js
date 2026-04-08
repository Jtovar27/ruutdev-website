// api/_supabase.js — Shared Supabase client for serverless functions
// SERVER-SIDE ONLY — never imported by browser JS (no browser bundle)
// Uses service-role key which bypasses RLS — only safe in serverless context.
// For public READ operations in Phase 2, consider using SUPABASE_ANON_KEY instead.

import { createClient } from '@supabase/supabase-js';

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required');
}

export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
