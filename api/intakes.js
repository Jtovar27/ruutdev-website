// api/intakes.js — Project intake form receiver.
// Inserts a new row into public.intakes (Supabase) and fires a Web3Forms
// email notification so the admin gets pinged outside the dashboard.
// Files (logos / photos) are uploaded directly browser → Supabase Storage,
// so this endpoint only receives the resulting public URLs in the payload.

import { supabase } from './_supabase.js';

const VALID_OBJECTIVES = ['leads', 'sell_online', 'bookings', 'credibility', 'info', 'other'];
const VALID_LANGUAGES  = ['en', 'es', 'bilingual'];
const VALID_GBP        = ['yes', 'no', 'unsure'];

const REQUIRED_FIELDS = [
  'business_name', 'contact_name', 'email',
  'target_domain', 'main_objective', 'site_language',
  'google_business_profile', 'services_to_feature'
];

function trimOrNull(value, max) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, max);
}

function trimRequired(value, max) {
  return (typeof value === 'string' ? value : '').trim().slice(0, max);
}

function sanitizeFiles(arr) {
  if (!Array.isArray(arr)) return [];
  return arr
    .filter(f => f && typeof f === 'object' && typeof f.url === 'string')
    .slice(0, 50)
    .map(f => ({
      name: typeof f.name === 'string' ? f.name.slice(0, 200) : '',
      url:  f.url.slice(0, 500),
      size: Number.isFinite(f.size) ? f.size : 0,
      type: typeof f.type === 'string' ? f.type.slice(0, 100) : ''
    }));
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin',  'https://ruutdev.com');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')    return res.status(405).json({ error: 'Method not allowed' });

  const body = req.body || {};

  for (const field of REQUIRED_FIELDS) {
    if (!body[field] || typeof body[field] !== 'string' || !body[field].trim()) {
      return res.status(400).json({ error: `Field "${field}" is required` });
    }
  }

  const email = body.email.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  if (!VALID_OBJECTIVES.includes(body.main_objective))   return res.status(400).json({ error: 'Invalid main_objective' });
  if (!VALID_LANGUAGES.includes(body.site_language))     return res.status(400).json({ error: 'Invalid site_language' });
  if (!VALID_GBP.includes(body.google_business_profile)) return res.status(400).json({ error: 'Invalid google_business_profile' });

  const insertData = {
    business_name:           trimRequired(body.business_name, 120),
    contact_name:            trimRequired(body.contact_name, 80),
    email:                   email.slice(0, 120),
    phone:                   trimOrNull(body.phone, 40),
    current_site_url:        trimOrNull(body.current_site_url, 200),
    target_domain:           trimRequired(body.target_domain, 120),
    main_objective:          body.main_objective,
    site_language:           body.site_language,
    google_business_profile: body.google_business_profile,
    brand_colors:            trimOrNull(body.brand_colors, 200),
    services_to_feature:     trimRequired(body.services_to_feature, 1500),
    social_media_links:      trimOrNull(body.social_media_links, 600),
    inspiration:             trimOrNull(body.inspiration, 1000),
    notes:                   trimOrNull(body.notes, 1500),
    logo_files:              sanitizeFiles(body.logo_files),
    photo_files:             sanitizeFiles(body.photo_files),
    stage:                   trimOrNull(body.stage, 50),
    page_url:                trimOrNull(body.page_url, 500),
    referrer:                trimOrNull(body.referrer, 500)
  };

  const { data, error } = await supabase
    .from('intakes')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error('Intake insert error:', error);
    return res.status(500).json({ error: 'Could not save intake' });
  }

  // Best-effort email notification — don't fail the request if Web3Forms is down.
  if (process.env.WEB3FORMS_KEY) {
    fireEmailNotification(data).catch(err => {
      console.error('Web3Forms notification failed:', err?.message || err);
    });
  }

  return res.status(201).json({ success: true, id: data.id });
}

async function fireEmailNotification(intake) {
  const lines = [
    `Stage: ${intake.stage || 'direct visit'}`,
    '',
    `Business: ${intake.business_name}`,
    `Contact:  ${intake.contact_name}`,
    `Email:    ${intake.email}`,
    `Phone:    ${intake.phone || '(not provided)'}`,
    '',
    `Target domain:           ${intake.target_domain}`,
    `Current site:            ${intake.current_site_url || '(none)'}`,
    `Main objective:          ${intake.main_objective}`,
    `Site language:           ${intake.site_language}`,
    `Google Business Profile: ${intake.google_business_profile}`,
    '',
    `Brand colors: ${intake.brand_colors || '(not provided)'}`,
    '',
    'Services / products to feature:',
    intake.services_to_feature,
    '',
    `Social media: ${intake.social_media_links || '(not provided)'}`,
    '',
    `Logos uploaded:  ${intake.logo_files?.length || 0}`,
    `Photos uploaded: ${intake.photo_files?.length || 0}`,
    '',
    'Inspiration:',
    intake.inspiration || '(not provided)',
    '',
    'Notes:',
    intake.notes || '(none)',
    '',
    `Page URL: ${intake.page_url || '(unknown)'}`,
    `Referrer: ${intake.referrer || '(direct)'}`,
    '',
    `Submitted: ${intake.created_at}`,
    `Intake ID: ${intake.id}`
  ].join('\n');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        access_key: process.env.WEB3FORMS_KEY,
        name:       intake.contact_name,
        email:      intake.email,
        business:   intake.business_name,
        type:       'project_intake',
        subject:    `[RuutDev] New intake — ${intake.business_name}`,
        message:    lines
      })
    });
  } finally {
    clearTimeout(timeout);
  }
}
