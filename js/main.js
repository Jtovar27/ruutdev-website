/* ─────────────────────────────────────────
   RuutDev — Shared JavaScript
   ───────────────────────────────────────── */

/* ── Mobile Menu ── */
function toggleMenu() {
  const mobile = document.getElementById('nav-mobile');
  if (!mobile) return;
  mobile.classList.toggle('open');
}

/* ── Active Nav Link ── */
(function markActiveLink() {
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a, #nav-mobile a').forEach(a => {
    const href = a.getAttribute('href') || '';
    if (href === path || (path === '' && href === 'index.html')) {
      a.classList.add('active');
    }
  });
})();

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

// Apply saved language on every page load
document.addEventListener('DOMContentLoaded', () => {
  const saved = localStorage.getItem(LANG_KEY) || 'en';
  applyLang(saved);
});

/* ── Contact Form (shared) ── */
window.submitContactForm = async function() {
  const name     = document.getElementById('fname')?.value;
  const email    = document.getElementById('femail')?.value;
  const business = document.getElementById('fbusiness')?.value;
  const type     = document.getElementById('ftype')?.value;
  const message  = document.getElementById('fmessage')?.value;

  if (!name || !email) {
    alert('Please fill in your name and email.');
    return;
  }

  const btn = document.querySelector('#form-body .btn-primary.form-submit');
  if (btn) { btn.textContent = 'Sending…'; btn.disabled = true; }

  try {
    const res = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        access_key: '337075f5-4f51-4287-85f9-71d03aee9283',
        name, email, business, type, message
      })
    });
    if (res.ok) {
      document.getElementById('form-body').style.display = 'none';
      document.getElementById('form-success').style.display = 'block';
    } else {
      throw new Error('Server error');
    }
  } catch {
    alert('There was an error. Please try via WhatsApp.');
    if (btn) { btn.textContent = 'Send Message'; btn.disabled = false; }
  }
};
