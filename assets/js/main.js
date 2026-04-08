/* ─────────────────────────────────────────
   RuutDev — Shared JavaScript
   ───────────────────────────────────────── */

// Populate these with live Stripe Checkout or Payment Link URLs when ready.
// Example:
// window.RUUTDEV_CHECKOUT_LINKS = {
//   'monthly-simple-setup': 'https://buy.stripe.com/...',
//   'monthly-standard-setup': 'https://buy.stripe.com/...',
//   'monthly-growth-setup': 'https://buy.stripe.com/...'
// };
window.RUUTDEV_CHECKOUT_LINKS = window.RUUTDEV_CHECKOUT_LINKS || {};

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
  if (!mobile) return;
  mobile.classList.toggle('open');
}

/* ── Active Nav Link ── */
function markActiveNavLink() {
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a, #nav-mobile a').forEach(a => {
    const href = a.getAttribute('href') || '';
    if (href === path || (path === '' && href === 'index.html')) {
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
}, { threshold: 0.1 });

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
    el.innerHTML = lang === 'es' ? (el.dataset.es || el.dataset.en) : el.dataset.en;
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
  const source = params.get('source');
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

  // Close mobile menu when a nav link is clicked
  document.querySelectorAll('#nav-mobile a').forEach(link => {
    link.addEventListener('click', () => {
      const mobile = document.getElementById('nav-mobile');
      if (mobile) mobile.classList.remove('open');
    });
  });

  // Close mobile menu when clicking outside
  document.addEventListener('click', (e) => {
    const mobile = document.getElementById('nav-mobile');
    const hamburger = document.querySelector('.hamburger');
    if (mobile && mobile.classList.contains('open')) {
      if (!mobile.contains(e.target) && !hamburger.contains(e.target)) {
        mobile.classList.remove('open');
      }
    }
  });
});

/* ── Swiper Carousels ── */

function initSwipers() {
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

// Initialize after Swiper script loads
if (typeof Swiper !== 'undefined') {
  initSwipers();
} else {
  window.addEventListener('load', initSwipers);
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
