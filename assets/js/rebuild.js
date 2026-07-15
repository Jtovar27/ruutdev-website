(() => {
  const root = document.documentElement;
  const config = window.RUUTDEV;
  const requested = new URLSearchParams(window.location.search).get('lang');
  const saved = localStorage.getItem('ruutdev_lang');
  const initialLanguage = requested === 'es' || (requested !== 'en' && saved === 'es') ? 'es' : 'en';

  function chromeMarkup() {
    const navigation = (config?.navigation || []).map((item) => `<a href="${item.href}" data-en="${item.en}" data-es="${item.es}">${item.en}</a>`).join('');
    return `<a class="skip" href="#main" data-en="Skip to content" data-es="Saltar al contenido">Skip to content</a>
      <header class="site-header"><nav class="nav container" aria-label="Primary navigation"><a class="logo" href="/" aria-label="RuutDev home">Ruut<span>Dev</span></a><button class="menu" type="button" data-menu aria-expanded="false" aria-controls="site-nav"><span data-en="Menu" data-es="Menú">Menu</span></button><div class="nav-links" id="site-nav">${navigation}</div><button class="lang" type="button" data-lang aria-label="ES — Switch to Spanish" aria-pressed="false">ES</button><a class="btn btn-primary" href="/contact" data-track="primary_cta_click" data-en="Start a Project" data-es="Iniciar un proyecto">Start a Project</a></nav></header>`;
  }

  function footerMarkup() {
    const email = config?.business?.email || '';
    const phone = config?.business?.phoneDisplay || '';
    const phoneHref = config?.business?.phone || '';
    return `<footer class="footer"><div class="container footer-grid"><div class="footer-summary"><a class="logo" href="/">Ruut<span>Dev</span></a><p data-en="Bilingual websites, business systems, and practical automation for service businesses." data-es="Websites bilingües, sistemas empresariales y automatización práctica para negocios de servicios.">Bilingual websites, business systems, and practical automation for service businesses.</p></div><div><h2 data-en="Explore" data-es="Explorar">Explore</h2><a href="/solutions" data-en="Solutions" data-es="Soluciones">Solutions</a><a href="/work" data-en="Work" data-es="Proyectos">Work</a><a href="/process" data-en="Process" data-es="Proceso">Process</a><a href="/pricing" data-en="Pricing" data-es="Precios">Pricing</a></div><div><h2 data-en="Contact" data-es="Contacto">Contact</h2>${email ? `<a href="mailto:${email}" data-track="email_click">${email}</a>` : ''}${phone && phoneHref ? `<a href="tel:${phoneHref}" data-track="phone_click">${phone}</a>` : ''}<a href="/contact" data-en="Start a Project" data-es="Iniciar un proyecto">Start a Project</a></div><div><h2 data-en="Legal" data-es="Legal">Legal</h2><a href="/privacy" data-en="Privacy" data-es="Privacidad">Privacy</a><a href="/terms" data-en="Terms" data-es="Términos">Terms</a><p class="legal">© <span data-current-year></span> RuutDev · Florida, USA</p></div></div></footer>`;
  }

  function renderChrome() {
    document.querySelectorAll('.skip, header.site-header, #nav-placeholder').forEach((node) => node.remove());
    document.body.insertAdjacentHTML('afterbegin', chromeMarkup());
    document.querySelectorAll('footer.footer, footer.site-footer').forEach((node) => node.remove());
    document.body.insertAdjacentHTML('beforeend', footerMarkup());
    if (!document.querySelector('main')) {
      const primary = document.querySelector('[role="main"]');
      if (primary) primary.id = 'main';
    } else if (!document.querySelector('main').id) document.querySelector('main').id = 'main';
    document.querySelectorAll('[data-current-year]').forEach((node) => { node.textContent = String(new Date().getFullYear()); });
    const current = location.pathname.replace(/\/$/, '') || '/';
    document.querySelectorAll('#site-nav a').forEach((link) => {
      const href = link.getAttribute('href');
      if (href === current || (href !== '/' && current.startsWith(href + '/'))) link.setAttribute('aria-current', 'page');
    });
  }

  function applyLanguage(next) {
    root.lang = next;
    localStorage.setItem('ruutdev_lang', next);
    document.querySelectorAll('[data-en][data-es]').forEach((el) => { el.textContent = el.dataset[next]; });
    document.querySelectorAll('[data-placeholder-en]').forEach((el) => { el.placeholder = el.dataset[`placeholder${next === 'es' ? 'Es' : 'En'}`]; });
    document.querySelectorAll('[data-lang]').forEach((button) => {
      button.setAttribute('aria-pressed', String(next === 'es'));
      button.setAttribute('aria-label', next === 'en' ? 'ES — Switch to Spanish' : 'EN — Cambiar a inglés');
      button.textContent = next === 'en' ? 'ES' : 'EN';
    });
    const localizedTitle = document.body.dataset[`title${next === 'es' ? 'Es' : 'En'}`];
    const localizedDescription = document.body.dataset[`description${next === 'es' ? 'Es' : 'En'}`];
    if (localizedTitle) document.title = localizedTitle;
    if (localizedDescription) {
      document.querySelector('meta[name="description"]')?.setAttribute('content', localizedDescription);
      document.querySelector('meta[property="og:description"]')?.setAttribute('content', localizedDescription);
      document.querySelector('meta[name="twitter:description"]')?.setAttribute('content', localizedDescription);
    }
    if (localizedTitle) {
      document.querySelector('meta[property="og:title"]')?.setAttribute('content', localizedTitle);
      document.querySelector('meta[name="twitter:title"]')?.setAttribute('content', localizedTitle);
    }
    const preferredLanguage = document.getElementById('preferredLanguage');
    if (preferredLanguage) preferredLanguage.value = next === 'es' ? 'Español' : 'English';
    document.dispatchEvent(new CustomEvent('ruutdev:language', { detail: next }));
  }

  function track(event, properties = {}) {
    const safe = { event, page: location.pathname, ...properties };
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(safe);
  }
  window.ruutdevTrack = track;

  renderChrome();
  applyLanguage(initialLanguage);

  document.querySelectorAll('[data-lang]').forEach((button) => button.addEventListener('click', () => {
    const next = root.lang === 'en' ? 'es' : 'en';
    applyLanguage(next);
    track('language_switch', { language: next });
  }));

  const menu = document.querySelector('[data-menu]');
  const panel = document.getElementById('site-nav');
  let previousFocus;
  function focusableInPanel() { return [...panel.querySelectorAll('a,button')].filter((node) => !node.hasAttribute('disabled')); }
  function closeMenu() {
    if (!menu || !panel || !panel.classList.contains('open')) return;
    panel.classList.remove('open');
    menu.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    previousFocus?.focus();
  }
  menu?.addEventListener('click', () => {
    const opening = !panel.classList.contains('open');
    if (!opening) return closeMenu();
    previousFocus = document.activeElement;
    panel.classList.add('open');
    menu.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    focusableInPanel()[0]?.focus();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') return closeMenu();
    if (event.key !== 'Tab' || !panel?.classList.contains('open')) return;
    const items = focusableInPanel();
    const first = items[0]; const last = items.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
  panel?.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
  document.querySelectorAll('[data-track]').forEach((el) => el.addEventListener('click', () => track(el.dataset.track, { target: el.getAttribute('href') || '' })));
  document.querySelectorAll('[data-business-address]').forEach((node) => { node.textContent = config?.legal?.businessMailingAddress || ''; });
  document.querySelectorAll('[data-checkout-id]').forEach((link) => {
    const plan = config?.pricing?.websitePlans?.find((item) => item.checkoutId === link.dataset.checkoutId);
    if (plan?.checkoutUrl) {
      link.href = plan.checkoutUrl;
      link.rel = 'noopener noreferrer';
      link.addEventListener('click', () => track('pricing_checkout_click', { plan: plan.id }));
    }
  });
  document.querySelectorAll('[data-deposit-kind]').forEach((link) => {
    const deposit = config?.pricing?.deposits?.[link.dataset.depositKind];
    if (deposit?.checkoutUrl) {
      link.href = deposit.checkoutUrl;
      link.rel = 'noopener noreferrer';
      link.addEventListener('click', () => track('payment_checkout_click', { kind: link.dataset.depositKind }));
    }
  });
  if (location.pathname === '/pricing') track('pricing_view');
  if (location.pathname === '/solutions' || location.pathname.startsWith('/solutions/')) track('solution_view', { solution: location.pathname.split('/').filter(Boolean).at(-1) || 'overview' });
  if (location.pathname === '/pay') track('payment_page_view');

  const form = document.getElementById('contact-form');
  if (!form) return;
  const fieldError = (field, message = '') => {
    const error = document.getElementById(`${field.name}-error`);
    field.setAttribute('aria-invalid', String(Boolean(message)));
    if (!error) return;
    error.textContent = message;
    error.classList.toggle('hidden', !message);
  };
  function validateForm() {
    let firstInvalid = null;
    [...form.elements].forEach((field) => {
      if (!field.name || field.name === 'website' || !field.willValidate) return;
      let message = '';
      if (field.validity.valueMissing) message = root.lang === 'es' ? 'Este campo es obligatorio.' : 'This field is required.';
      else if (field.validity.typeMismatch) message = root.lang === 'es' ? 'Ingresa un formato válido.' : 'Enter a valid format.';
      fieldError(field, message);
      if (message && !firstInvalid) firstInvalid = field;
    });
    firstInvalid?.focus();
    return !firstInvalid;
  }
  form.addEventListener('input', (event) => { if (event.target?.name) fieldError(event.target); });
  form.addEventListener('input', () => track('contact_form_start'), { once: true });
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const status = document.getElementById('form-status');
    const submit = form.querySelector('[type=submit]');
    status?.classList.add('hidden');
    if (!validateForm()) { track('contact_form_error', { reason: 'validation' }); return; }
    if (form.website.value) return;
    submit.disabled = true; submit.setAttribute('aria-busy', 'true');
    track('contact_form_submit');
    const data = new FormData(form);
    const details = ['Business type: ' + data.get('businessType'), 'Preferred language: ' + data.get('preferredLanguage'), 'Improvement: ' + data.get('improvement'), 'Current process: ' + data.get('currentProcess'), 'Timeline: ' + data.get('timeline'), 'Investment: ' + data.get('investment'), 'Phone: ' + (data.get('phone') || '-'), 'Website/profile: ' + (data.get('profile') || '-'), '', data.get('context') || ''].join('\n');
    const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), 12000);
    try {
      const response = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: controller.signal, body: JSON.stringify({ name: data.get('name'), email: data.get('email'), business: data.get('business'), type: data.get('improvement'), message: details, consent: data.get('consent') === 'on', website: data.get('website') }) });
      if (!response.ok) throw new Error('request_failed');
      form.reset(); status.classList.remove('hidden'); status.textContent = root.lang === 'es' ? 'Gracias. Recibimos tu solicitud y responderemos con los próximos pasos.' : 'Thank you. Your request was received and RuutDev will reply with next steps.'; status.focus(); track('contact_form_success');
    } catch (_) {
      status.classList.remove('hidden'); status.innerHTML = root.lang === 'es' ? `No pudimos enviar el formulario. Intenta de nuevo o escribe a <a href="mailto:${config.business.email}">${config.business.email}</a>.` : `The form could not be sent. Try again or email <a href="mailto:${config.business.email}">${config.business.email}</a>.`; status.focus(); track('contact_form_error', { reason: 'network' });
    } finally { clearTimeout(timeout); submit.disabled = false; submit.removeAttribute('aria-busy'); }
  });
})();
