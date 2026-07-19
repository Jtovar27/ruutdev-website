(() => {
  const root = document.documentElement;
  const GTM_ID = 'GTM-MGKZGHK7';
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const saved = localStorage.getItem('ruutdev_lang');
  const lang = saved === 'es' ? 'es' : 'en';

  function ensureGtm() {
    window.dataLayer = window.dataLayer || [];
    if (document.querySelector(`script[src*="${GTM_ID}"]`)) return;
    window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`;
    document.head.appendChild(script);
  }

  function splitHeroHeadlines() {
    document.querySelectorAll('[data-split-hero]').forEach((headline) => {
      const text = headline.dataset[root.lang] || headline.textContent.trim();
      headline.setAttribute('aria-label', text);
      headline.textContent = '';
      text.split(' ').forEach((word, index) => {
        const span = document.createElement('span');
        span.className = 'split-word';
        span.setAttribute('aria-hidden', 'true');
        span.style.setProperty('--i', String(index));
        span.textContent = word;
        headline.append(span, document.createTextNode(' '));
      });
    });
  }

  function applyLanguage(next) {
    root.lang = next;
    localStorage.setItem('ruutdev_lang', next);
    document.querySelectorAll('[data-en][data-es]').forEach((el) => {
      el.textContent = el.dataset[next];
    });
    document.querySelectorAll('[data-placeholder-en]').forEach((el) => {
      el.placeholder = el.dataset[`placeholder${next === 'es' ? 'Es' : 'En'}`];
    });
    document.querySelectorAll('[data-lang]').forEach((button) => {
      const explicit = button.dataset.lang === 'en' || button.dataset.lang === 'es';
      button.setAttribute('aria-pressed', String(explicit ? button.dataset.lang === next : next === 'es'));
      if (!explicit) button.textContent = next === 'en' ? 'ES' : 'EN';
    });
    splitHeroHeadlines();
    document.dispatchEvent(new CustomEvent('ruutdev:language', { detail: next }));
  }

  function track(event, properties = {}) {
    const safe = { event, page: location.pathname, ...properties };
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(safe);
  }
  window.ruutdevTrack = track;

  ensureGtm();

  document.querySelectorAll('[data-lang]').forEach((button) => button.addEventListener('click', () => {
    const explicit = button.dataset.lang === 'en' || button.dataset.lang === 'es';
    const next = explicit ? button.dataset.lang : (root.lang === 'en' ? 'es' : 'en');
    applyLanguage(next);
    track('language_switch', { language: next });
  }));
  applyLanguage(lang);

  if (!reducedMotion && 'IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -48px 0px' });
    document.querySelectorAll('[data-reveal]').forEach((el) => revealObserver.observe(el));
  } else {
    document.querySelectorAll('[data-reveal]').forEach((el) => el.classList.add('is-visible'));
  }

  const menu = document.querySelector('[data-menu]');
  const panel = document.getElementById('site-nav');
  let previousFocus;
  function closeMenu() {
    if (!menu || !panel) return;
    panel.classList.remove('open');
    menu.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    previousFocus?.focus();
  }
  menu?.addEventListener('click', () => {
    const opening = !panel.classList.contains('open');
    if (opening) previousFocus = document.activeElement;
    panel.classList.toggle('open', opening);
    menu.setAttribute('aria-expanded', String(opening));
    document.body.style.overflow = opening ? 'hidden' : '';
    if (opening) panel.querySelector('a')?.focus();
  });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeMenu(); });
  panel?.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));

  document.querySelectorAll('[data-track]').forEach((el) => el.addEventListener('click', () => track(el.dataset.track, { target: el.getAttribute('href') || '' })));

  const form = document.getElementById('contact-form');
  if (!form) return;
  let started = false;
  form.addEventListener('input', () => { if (!started) { started = true; track('contact_form_start'); } }, { once: true });
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const status = document.getElementById('form-status');
    const submit = form.querySelector('[type=submit]');
    form.querySelectorAll('.error').forEach((node) => node.textContent = '');
    if (!form.checkValidity()) {
      form.reportValidity();
      track('contact_form_error', { reason: 'validation' });
      return;
    }
    if (form.website.value) return;
    submit.disabled = true;
    submit.setAttribute('aria-busy', 'true');
    track('contact_form_submit');
    const data = new FormData(form);
    const details = ['Business type: ' + data.get('businessType'), 'Preferred language: ' + data.get('preferredLanguage'), 'Improvement: ' + data.get('improvement'), 'Current process: ' + data.get('currentProcess'), 'Timeline: ' + data.get('timeline'), 'Investment: ' + data.get('investment'), 'Phone: ' + (data.get('phone') || '-'), 'Website/profile: ' + (data.get('profile') || '-'), '', data.get('context') || ''].join('\n');
    try {
      const response = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: data.get('name'), email: data.get('email'), business: data.get('business'), type: data.get('improvement'), message: details, consent: data.get('consent') === 'on', website: data.get('website'), form_version: 'commercial-v3' }) });
      if (!response.ok) throw new Error('request_failed');
      form.reset(); status.classList.remove('hidden'); status.textContent = root.lang === 'es' ? 'Gracias. Tu solicitud fue recibida y RuutDev responderá con los próximos pasos.' : 'Thank you. Your request was received and RuutDev will reply with next steps.'; status.focus(); track('contact_form_success');
    } catch (_) {
      status.classList.remove('hidden'); status.textContent = root.lang === 'es' ? 'No pudimos enviar el formulario. Intenta de nuevo o usa WhatsApp.' : 'The form could not be sent. Try again or use WhatsApp.'; status.focus(); track('contact_form_error', { reason: 'network' });
    } finally { submit.disabled = false; submit.removeAttribute('aria-busy'); }
  });
})();
