/* ─────────────────────────────────────────
   RuutDev — Shared JavaScript
   ───────────────────────────────────────── */

// Live Stripe Payment Links for pricing.html "Choose Plan" CTAs.
// Each plan link is a Stripe subscription that bundles the one-time setup fee
// (charged on first invoice) with the recurring monthly care subscription.
window.RUUTDEV_CHECKOUT_LINKS = window.RUUTDEV_CHECKOUT_LINKS || {
  'monthly-simple-setup':   'https://buy.stripe.com/aFafZi9HF6FK7vBd0k4Vy00',
  'monthly-standard-setup': 'https://buy.stripe.com/6oU7sM8DB5BG5nt3pK4Vy01',
  'monthly-growth-setup':   'https://buy.stripe.com/eVq6oI2fd4xC5nt7G04Vy02'
};

/* ── Nav Partial Loader ── */
function initNav() {
  const placeholder = document.getElementById('nav-placeholder');
  if (!placeholder) return;

  fetch('/components/nav.html')
    .then(r => r.text())
    .then(html => {
      placeholder.outerHTML = html;
      // Run nav-dependent functions AFTER nav is in the DOM
      markActiveNavLink();
      const saved = localStorage.getItem('ruutdev_lang') || 'en';
      applyLang(saved);
    })
    .catch(() => {
      // Nav fetch failed — log silently, page still usable
      console.warn('RuutDev: nav partial failed to load');
    });
}

// Initialize nav immediately (before DOMContentLoaded)
// This starts the fetch early to minimize flash of missing nav
initNav();

/* ── Mobile Menu ── */
function toggleMenu() {
  const mobile = document.getElementById('nav-mobile');
  const overlay = document.getElementById('nav-mobile-overlay');
  const hamburger = document.querySelector('.hamburger');
  if (!mobile) return;
  const isOpen = mobile.classList.toggle('open');
  if (overlay) overlay.classList.toggle('open', isOpen);
  if (hamburger) {
    hamburger.classList.toggle('is-open', isOpen);
    hamburger.setAttribute('aria-expanded', isOpen);
  }
  document.body.style.overflow = isOpen ? 'hidden' : '';
}

/* ── Active Nav Link ── */
function markActiveNavLink() {
  const pathname = window.location.pathname;
  document.querySelectorAll('.nav-links a, #nav-mobile a').forEach(a => {
    const href = a.getAttribute('href') || '';
    const isHome = (pathname === '/' || pathname === '/index.html') && (href === '/' || href === '/index.html');
    if (isHome || (href !== '/' && pathname.startsWith(href))) {
      a.classList.add('active');
    }
  });
}

/* ── Scroll Reveal ── */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((e, i) => {
    if (e.isIntersecting) {
      setTimeout(() => e.target.classList.add('visible'), i * 80);
      revealObserver.unobserve(e.target);
    }
  });
}, { threshold: 0, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

/* ── FAQ Toggle ── */
document.querySelectorAll('.faq-item').forEach(item => {
  item.addEventListener('click', () => {
    const isOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item').forEach(f => f.classList.remove('open'));
    if (!isOpen) item.classList.add('open');
  });
});

// ── LANGUAGE SYSTEM ──
const LANG_KEY = 'ruutdev_lang';
const LEAD_PLAN_LABELS = {
  'simple-site': {
    en: 'Simple Site monthly plan',
    es: 'plan mensual Simple Site'
  },
  'standard-site': {
    en: 'Standard Site monthly plan',
    es: 'plan mensual Standard Site'
  },
  'growth-advanced': {
    en: 'Growth / Advanced monthly plan',
    es: 'plan mensual Growth / Advanced'
  },
  'starter-website': {
    en: 'Starter Website buyout project',
    es: 'proyecto Starter Website'
  },
  'business-website': {
    en: 'Business Website buyout project',
    es: 'proyecto Business Website'
  },
  'ecommerce-custom': {
    en: 'E-commerce / Advanced Custom build',
    es: 'proyecto E-commerce / Advanced Custom'
  },
  'software-ai': {
    en: 'Custom software / AI / automation project',
    es: 'proyecto de software / IA / automatizacion'
  }
};

function applyLang(lang) {
  document.documentElement.setAttribute('lang', lang === 'es' ? 'es' : 'en');
  document.querySelectorAll('[data-en]').forEach(el => {
    if (el.classList.contains('gsap-word-split')) return; // skip GSAP-animated headings
    const val = lang === 'es' ? (el.dataset.es || el.dataset.en) : el.dataset.en;
    // Use innerHTML only when value contains HTML tags (e.g. <em>, <br />)
    if (val && val.includes('<')) {
      el.innerHTML = val;
    } else {
      el.textContent = val;
    }
  });
  // Update toggle button state
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });
  localStorage.setItem(LANG_KEY, lang);
}

function toggleLang(lang) {
  applyLang(lang);
}

function initStripeReadyCtas() {
  document.querySelectorAll('[data-checkout-id]').forEach(link => {
    const checkoutId = link.dataset.checkoutId;
    const fallbackHref = link.dataset.fallbackHref || link.getAttribute('href') || '#';
    const liveHref = window.RUUTDEV_CHECKOUT_LINKS[checkoutId];

    link.setAttribute('href', liveHref || fallbackHref);
    link.dataset.checkoutState = liveHref ? 'live' : 'fallback';
  });
}

function getPlanLabel(plan, lang) {
  const labels = LEAD_PLAN_LABELS[plan];
  return labels ? (labels[lang] || labels.en) : '';
}

function getLeadType(intent, plan) {
  if (intent === 'monthly') return 'monthly_plan';
  if (plan === 'software-ai') return 'software_ai';
  if (plan === 'ecommerce-custom') return 'ecommerce_custom';
  if (intent === 'buyout') return 'buyout_project';
  if (intent === 'support') return 'support';
  return '';
}

function initContactPrefill() {
  const contactForm = document.getElementById('form-body');
  if (!contactForm) return;

  const params = new URLSearchParams(window.location.search);
  const intent = params.get('intent');
  const plan = params.get('plan');
  const ALLOWED_SOURCES = ['pricing', 'services', 'about', 'index'];
  const source = ALLOWED_SOURCES.includes(params.get('source')) ? params.get('source') : null;
  if (!intent && !plan && !source) return;

  const lang = document.documentElement.getAttribute('lang') === 'es' ? 'es' : 'en';
  const typeSelect = document.getElementById('ftype');
  const messageField = document.getElementById('fmessage');
  const contextBox = document.getElementById('contact-context');
  const leadType = getLeadType(intent, plan);
  const planLabel = getPlanLabel(plan, lang);
  const contextLines = [];

  if (typeSelect && leadType) {
    const optionExists = Array.from(typeSelect.options).some(option => option.value === leadType);
    if (optionExists) typeSelect.value = leadType;
  }

  if (planLabel) {
    contextLines.push(
      lang === 'es'
        ? `Estoy consultando por el ${planLabel}.`
        : `I am inquiring about the ${planLabel}.`
    );
  }

  if (source === 'pricing') {
    contextLines.push(
      lang === 'es'
        ? 'Vengo desde la pagina de precios y me gustaria confirmar alcance, tiempos y el siguiente paso.'
        : 'I am coming from the pricing page and would like to confirm scope, timeline, and next steps.'
    );
  }

  if (contextLines.length && messageField && !messageField.value.trim()) {
    messageField.value = `${contextLines.join(' ')}\n\n`;
  }

  if (contextBox && contextLines.length) {
    contextBox.hidden = false;
    contextBox.classList.add('visible');
    contextBox.textContent = contextLines.join(' ');
  }
}

// Init on page load
document.addEventListener('DOMContentLoaded', () => {
  // Apply saved language
  const saved = localStorage.getItem(LANG_KEY) || 'en';
  applyLang(saved);
  initStripeReadyCtas();
  initContactPrefill();
  initSwipers();

  // Close mobile menu when a nav link is clicked
  document.querySelectorAll('#nav-mobile a').forEach(link => {
    link.addEventListener('click', () => {
      const mobile = document.getElementById('nav-mobile');
      const overlay = document.getElementById('nav-mobile-overlay');
      const hamburger = document.querySelector('.hamburger');
      if (mobile) mobile.classList.remove('open');
      if (overlay) overlay.classList.remove('open');
      if (hamburger) { hamburger.classList.remove('is-open'); hamburger.setAttribute('aria-expanded', 'false'); }
      document.body.style.overflow = '';
    });
  });

  // Close mobile menu when clicking outside
  document.addEventListener('click', (e) => {
    const mobile = document.getElementById('nav-mobile');
    const overlay = document.getElementById('nav-mobile-overlay');
    const hamburger = document.querySelector('.hamburger');
    if (mobile && mobile.classList.contains('open')) {
      if (!mobile.contains(e.target) && hamburger && !hamburger.contains(e.target)) {
        mobile.classList.remove('open');
        if (overlay) overlay.classList.remove('open');
        hamburger.classList.remove('is-open');
        hamburger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      }
    }
  });
});

/* ── Swiper Carousels ── */

function initSwipers() {
  if (typeof Swiper === 'undefined') {
    console.warn('RuutDev: Swiper not loaded, skipping carousel init');
    return;
  }
  // Services swiper (index)
  if (document.querySelector('.services-swiper')) {
    new Swiper('.services-swiper', {
      slidesPerView: 1,
      spaceBetween: 24,
      centeredSlides: false,
      loop: false,
      pagination: { el: '.services-swiper .swiper-pagination', clickable: true },
      navigation: { nextEl: '.services-swiper .swiper-button-next', prevEl: '.services-swiper .swiper-button-prev' },
      breakpoints: {
        640: { slidesPerView: 2 },
        1024: { slidesPerView: 3 }
      }
    });
  }

  // Process swiper (index + about)
  if (document.querySelector('.process-swiper')) {
    new Swiper('.process-swiper', {
      slidesPerView: 1,
      spaceBetween: 24,
      loop: false,
      pagination: { el: '.process-swiper .swiper-pagination', clickable: true },
      navigation: { nextEl: '.process-swiper .swiper-button-next', prevEl: '.process-swiper .swiper-button-prev' },
      breakpoints: {
        640: { slidesPerView: 2 },
        1024: { slidesPerView: 4 }
      }
    });
  }

  // Pricing swiper (monthly plans)
  if (document.querySelector('.pricing-swiper')) {
    new Swiper('.pricing-swiper', {
      slidesPerView: 1,
      spaceBetween: 24,
      centeredSlides: true,
      loop: false,
      initialSlide: 1,
      pagination: { el: '.pricing-swiper .swiper-pagination', clickable: true },
      navigation: { nextEl: '.pricing-swiper .swiper-button-next', prevEl: '.pricing-swiper .swiper-button-prev' },
      breakpoints: {
        768: { slidesPerView: 2, centeredSlides: false },
        1100: { slidesPerView: 3, centeredSlides: false }
      }
    });
  }

  // Portfolio swiper (index + portfolio page)
  if (document.querySelector('.portfolio-swiper')) {
    new Swiper('.portfolio-swiper', {
      slidesPerView: 1,
      spaceBetween: 24,
      loop: false,
      pagination: { el: '.portfolio-swiper .swiper-pagination', clickable: true },
      navigation: { nextEl: '.portfolio-swiper .swiper-button-next', prevEl: '.portfolio-swiper .swiper-button-prev' },
      breakpoints: { 640: { slidesPerView: 2 }, 1024: { slidesPerView: 3 } }
    });
  }

  // Reviews swiper (index)
  if (document.querySelector('.reviews-swiper')) {
    new Swiper('.reviews-swiper', {
      slidesPerView: 1,
      spaceBetween: 24,
      loop: true,
      autoplay: { delay: 4000, disableOnInteraction: false, pauseOnMouseEnter: true },
      pagination: { el: '.reviews-swiper .swiper-pagination', clickable: true },
      breakpoints: { 640: { slidesPerView: 2 }, 1024: { slidesPerView: 3 } }
    });
  }

  // Generic swipers for other pages
  ['about-swiper', 'buyout-swiper'].forEach(cls => {
    const el = document.querySelector('.' + cls);
    if (el) {
      new Swiper('.' + cls, {
        slidesPerView: 1,
        spaceBetween: 24,
        loop: false,
        pagination: { el: '.' + cls + ' .swiper-pagination', clickable: true },
        navigation: { nextEl: '.' + cls + ' .swiper-button-next', prevEl: '.' + cls + ' .swiper-button-prev' },
        breakpoints: { 640: { slidesPerView: 2 }, 1024: { slidesPerView: 3 } }
      });
    }
  });
}

/* ── Contact Form (shared) ── */
window.submitContactForm = async function() {
  const name     = document.getElementById('fname')?.value;
  const email    = document.getElementById('femail')?.value;
  const business = document.getElementById('fbusiness')?.value;
  const type     = document.getElementById('ftype')?.value;
  const message  = document.getElementById('fmessage')?.value;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!name || !email) {
    alert('Please fill in your name and email.');
    return;
  }
  if (!emailRegex.test(email)) {
    alert('Please enter a valid email address.');
    return;
  }

  const btn = document.querySelector('#form-body .btn-primary.form-submit');
  if (btn) { btn.textContent = 'Sending…'; btn.disabled = true; }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        name, email, business, type, message
      })
    });
    clearTimeout(timeout);
    if (res.ok) {
      document.getElementById('form-body').style.display = 'none';
      document.getElementById('form-success').style.display = 'block';
    } else {
      throw new Error('Server error');
    }
  } catch {
    clearTimeout(timeout);
    alert('There was an error. Please try via WhatsApp.');
    if (btn) { btn.textContent = 'Send Message'; btn.disabled = false; }
  }
};

/* ── Live Reviews ── */

let _selectedRating = 0;

function initLiveReviews() {
  const feed = document.getElementById('reviews-feed');
  if (!feed) return;

  // Star input interaction
  const stars = document.querySelectorAll('#star-input i');
  stars.forEach(star => {
    star.addEventListener('mouseenter', () => {
      const val = +star.dataset.val;
      stars.forEach(s => s.classList.toggle('hovered', +s.dataset.val <= val));
    });
    star.addEventListener('mouseleave', () => {
      stars.forEach(s => s.classList.remove('hovered'));
    });
    star.addEventListener('click', () => {
      _selectedRating = +star.dataset.val;
      document.getElementById('rv-rating').value = _selectedRating;
      stars.forEach(s => {
        const v = +s.dataset.val;
        s.className = v <= _selectedRating ? 'fa-solid fa-star selected' : 'fa-regular fa-star';
      });
    });
  });

  // Fetch reviews
  fetch('/api/reviews')
    .then(r => r.json())
    .then(({ reviews }) => {
      const loading = document.getElementById('reviews-loading');
      const empty   = document.getElementById('reviews-empty');
      if (loading) loading.style.display = 'none';
      if (!reviews || reviews.length === 0) {
        if (empty) empty.style.display = 'flex';
        return;
      }
      reviews.forEach((rv, i) => prependReviewCard(rv, i * 60));
    })
    .catch(() => {
      const loading = document.getElementById('reviews-loading');
      if (loading) loading.style.display = 'none';
    });
}

function prependReviewCard(rv, delayMs) {
  const feed = document.getElementById('reviews-feed');
  if (!feed) return;
  const initials = (rv.name || '?').split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();
  const stars    = '★'.repeat(rv.rating || 5) + '☆'.repeat(5 - (rv.rating || 5));
  const ago      = timeAgo(rv.created_at);
  const card = document.createElement('div');
  card.className = 'lr-card';
  card.style.animationDelay = delayMs + 'ms';
  card.innerHTML = `
    <div class="lr-stars">${stars}</div>
    <p class="lr-text">&ldquo;${escHtml(rv.review)}&rdquo;</p>
    <div class="lr-meta">
      <div class="lr-avatar">${initials}</div>
      <div class="lr-info">
        <span class="lr-name">${escHtml(rv.name)}</span>
        ${rv.business ? `<span class="lr-biz">${escHtml(rv.business)}</span>` : ''}
      </div>
      <span class="lr-date">${ago}</span>
    </div>`;
  feed.insertBefore(card, feed.firstChild);
  const empty = document.getElementById('reviews-empty');
  if (empty) empty.style.display = 'none';
}

window.submitLiveReview = async function() {
  const name   = document.getElementById('rv-name')?.value.trim();
  const biz    = document.getElementById('rv-business')?.value.trim();
  const text   = document.getElementById('rv-text')?.value.trim();
  const rating = _selectedRating;
  const btn    = document.querySelector('.rv-submit');

  if (!name)   return alert('Please enter your name.');
  if (!rating) return alert('Please select a star rating.');
  if (!text || text.length < 10) return alert('Please write at least 10 characters.');

  const btnSpan = btn ? btn.querySelector('span') : null;
  if (btn) btn.disabled = true;
  if (btnSpan) btnSpan.textContent = 'Sending…';

  try {
    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, business: biz, rating, review: text })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error');

    prependReviewCard(data.review, 0);
    document.getElementById('rv-form-body').style.display = 'none';
    document.getElementById('rv-success').style.display = 'block';
  } catch (err) {
    alert(err.message || 'Could not submit. Please try again.');
    if (btn) { btn.disabled = false; if (btnSpan) btnSpan.textContent = 'Submit Review'; }
  }
};

function timeAgo(iso) {
  if (!iso) return '';
  const secs = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (secs < 60)   return 'Just now';
  if (secs < 3600) return Math.floor(secs / 60) + 'm ago';
  if (secs < 86400) return Math.floor(secs / 3600) + 'h ago';
  return Math.floor(secs / 86400) + 'd ago';
}

function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

document.addEventListener('DOMContentLoaded', initLiveReviews);

/* ─────────────────────────────────────────────────────────────
   GOOGLE ADS LANDING PAGE (AI Business OS)
   Self-contained init; only runs on body#page-google-ads-lp.
   - Captures UTM params into hidden form inputs.
   - Submits demo form via existing /api/contact endpoint.
   - Fires conversion events ONLY when window.RUUTDEV_TRACKING
     is configured. No external scripts loaded by default.
   See docs/GOOGLE_ADS_LANDING_PAGE.md for setup.
   ───────────────────────────────────────────────────────────── */

window.RUUTDEV_TRACKING = window.RUUTDEV_TRACKING || {};

function gadTrackEvent(eventName, params) {
  try {
    const cfg = window.RUUTDEV_TRACKING || {};
    const payload = Object.assign({ event: eventName }, params || {});
    if (typeof window.dataLayer !== 'undefined' && Array.isArray(window.dataLayer)) {
      window.dataLayer.push(payload);
    }
    if (typeof window.gtag === 'function') {
      window.gtag('event', eventName, params || {});
    }
    if (cfg.googleAdsId && cfg.conversionLabels && typeof window.gtag === 'function') {
      const label = cfg.conversionLabels[eventName];
      if (label) {
        window.gtag('event', 'conversion', {
          send_to: `${cfg.googleAdsId}/${label}`
        });
      }
    }
  } catch (err) {
    // Tracking must never break the page
  }
}

function gadCaptureUtm() {
  const params = new URLSearchParams(window.location.search);
  ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach(key => {
    const input = document.getElementById('gad-' + key);
    const value = params.get(key);
    if (input && value) input.value = value.slice(0, 200);
  });
}

function gadValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function gadShowFormError(msgEn, msgEs) {
  const box = document.getElementById('gad-form-error');
  if (!box) return;
  const lang = document.documentElement.getAttribute('lang') === 'es' ? 'es' : 'en';
  box.textContent = (lang === 'es' && msgEs) ? msgEs : msgEn;
  box.classList.add('visible');
}

function gadClearFormError() {
  const box = document.getElementById('gad-form-error');
  if (!box) return;
  box.classList.remove('visible');
  box.textContent = '';
}

function gadInitDemoForm() {
  const form = document.getElementById('gad-demo-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    gadClearFormError();

    const name         = document.getElementById('gad-name').value.trim();
    const email        = document.getElementById('gad-email').value.trim();
    const business     = document.getElementById('gad-business').value.trim();
    const industry     = document.getElementById('gad-industry').value;
    const projectType  = (document.getElementById('gad-project-type') || {}).value || '';
    const phone        = document.getElementById('gad-phone').value.trim();
    const contact      = document.getElementById('gad-contact-pref').value;
    const challenge    = document.getElementById('gad-challenge').value.trim();
    const saasWaitlist = !!(document.getElementById('gad-saas-waitlist') || {}).checked;
    const consent      = document.getElementById('gad-consent').checked;

    const utm = {
      source:   document.getElementById('gad-utm_source').value,
      medium:   document.getElementById('gad-utm_medium').value,
      campaign: document.getElementById('gad-utm_campaign').value,
      term:     document.getElementById('gad-utm_term').value,
      content:  document.getElementById('gad-utm_content').value
    };
    const landing = document.getElementById('gad-landing_page').value;

    if (!name || !email) {
      gadShowFormError(
        'Please fill in your name and email.',
        'Por favor completa tu nombre y correo.'
      );
      return;
    }
    if (!gadValidEmail(email)) {
      gadShowFormError(
        'Please enter a valid email address.',
        'Por favor ingresa un correo válido.'
      );
      return;
    }
    if (!consent) {
      gadShowFormError(
        'Please accept the privacy notice to continue.',
        'Por favor acepta el aviso de privacidad para continuar.'
      );
      return;
    }

    const submitBtn = document.getElementById('gad-submit');
    const submitSpan = submitBtn ? submitBtn.querySelector('span') : null;
    const originalLabel = submitSpan ? submitSpan.textContent : '';
    if (submitBtn) submitBtn.disabled = true;
    if (submitSpan) submitSpan.textContent = '…';

    // Pack landing-page-specific fields into the message body so the existing
    // /api/contact endpoint contract stays unchanged (Web3Forms proxy).
    const messageLines = [
      '── Google Ads LP · Project Call Request ──',
      `Looking for: ${projectType || '(not specified)'}`,
      `Industry: ${industry || '(not provided)'}`,
      `Phone: ${phone || '(not provided)'}`,
      `Preferred contact: ${contact || 'email'}`,
      `What the business needs: ${challenge || '(not provided)'}`,
      `BUOS waitlist opt-in: ${saasWaitlist ? 'YES — add to early access list' : 'no'}`,
      '',
      `Landing page: ${landing}`,
      `UTM source/medium/campaign: ${utm.source || '-'} / ${utm.medium || '-'} / ${utm.campaign || '-'}`,
      `UTM term/content: ${utm.term || '-'} / ${utm.content || '-'}`,
      `Page URL: ${window.location.href}`,
      `Referrer: ${document.referrer || '(direct)'}`
    ];

    const controller = new AbortController();
    // 12s — gives the serverless function room for Web3Forms (max 8s) plus
    // any cold-start latency without aborting the user's request.
    const timeout = setTimeout(() => controller.abort(), 12000);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          name,
          email,
          business,
          type: projectType || 'gad_project_call',
          message: messageLines.join('\n')
        })
      });
      clearTimeout(timeout);
      if (!res.ok) throw new Error('Upstream error');

      // Pushed BEFORE UI updates so the GTM tag fires reliably even if the
      // user navigates away during the success transition.
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: 'mockup_form_submit',
        conversionValue: 75,
        currency: 'USD'
      });

      const formBody    = document.getElementById('gad-form-body');
      const formSuccess = document.getElementById('gad-form-success');
      if (formBody)    formBody.style.display = 'none';
      if (formSuccess) formSuccess.classList.add('visible');

      gadTrackEvent('project_call_submit', {
        project_type:  projectType || 'unspecified',
        industry:      industry || 'unknown',
        contact_pref:  contact || 'email',
        saas_waitlist: saasWaitlist ? 'yes' : 'no',
        utm_source:    utm.source || '',
        utm_medium:    utm.medium || '',
        utm_campaign:  utm.campaign || ''
      });
      if (saasWaitlist) {
        gadTrackEvent('buos_waitlist_optin', {
          industry: industry || 'unknown'
        });
      }
    } catch (err) {
      clearTimeout(timeout);
      gadShowFormError(
        'Something went wrong. Please try again or message us on WhatsApp.',
        'Algo salió mal. Inténtalo de nuevo o escríbenos por WhatsApp.'
      );
      if (submitBtn)  submitBtn.disabled = false;
      if (submitSpan) submitSpan.textContent = originalLabel;
    }
  });
}

function gadInitCtaTracking() {
  document.querySelectorAll('[data-gad-cta]').forEach(el => {
    el.addEventListener('click', () => {
      const role = el.getAttribute('data-gad-cta') || 'unknown';
      const eventName = role.startsWith('pricing') ? 'pricing_click' : 'primary_cta_click';
      gadTrackEvent(eventName, { cta_role: role });
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.body.id !== 'page-google-ads-lp') return;
  gadCaptureUtm();
  gadInitDemoForm();
  gadInitCtaTracking();
  gadTrackEvent('landing_page_view', {
    page: '/google-ads/ai-business-os'
  });
});
