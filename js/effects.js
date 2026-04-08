/* ─────────────────────────────────────────
   RuutDev — Visual Effects & Animations
   effects.js — GSAP, fullpage swipe, cursor glow
   ───────────────────────────────────────── */

/* ── Reduced Motion Guard ── */
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ─────────────────────────────────────────
   2A — ANIMATED GRADIENT MESH BACKGROUND
   ───────────────────────────────────────── */

(function initBgMesh() {
  document.body.classList.add('bg-animated');
})();

/* ─────────────────────────────────────────
   2B — DESKTOP GSAP SCROLL ANIMATIONS
   ───────────────────────────────────────── */

(function initGsapAnimations() {
  if (prefersReducedMotion) return;
  if (window.innerWidth <= 768) return;
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
    // GSAP not yet loaded — retry after a short delay (deferred scripts)
    window.addEventListener('load', initGsapAnimations);
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  /* ── Hero entrance ── */
  const hero = document.querySelector('#hero');
  if (hero) {
    const badge    = hero.querySelector('.hero-badge');
    const headline = hero.querySelector('h1');
    const sub      = hero.querySelector('.hero-sub');
    const actions  = hero.querySelector('.hero-actions');
    const stats    = hero.querySelector('.hero-stats');

    const heroTl = gsap.timeline({ defaults: { ease: 'power2.out' } });

    if (badge)    heroTl.from(badge,    { opacity: 0, x: -24, duration: 0.6 }, 0);
    if (headline) heroTl.from(headline, { opacity: 0, y: 28, scale: 0.95, duration: 0.8 }, 0.1);
    if (sub)      heroTl.from(sub,      { opacity: 0, y: 20, duration: 0.7 }, 0.25);
    if (actions)  heroTl.from(actions,  { opacity: 0, y: 16, duration: 0.6 }, 0.35);
    if (stats)    heroTl.from(stats,    { opacity: 0, y: 16, duration: 0.6 }, 0.45);
  }

  /* ── Section labels slide in from left ── */
  gsap.utils.toArray('.section-label').forEach(label => {
    gsap.from(label, {
      scrollTrigger: {
        trigger: label,
        start: 'top 85%',
        once: true
      },
      opacity: 0,
      x: -20,
      duration: 0.55,
      ease: 'power2.out'
    });
  });

  /* ── Section headings word reveal ── */
  gsap.utils.toArray('section h2.section-title').forEach(heading => {
    // Split words and wrap in spans for stagger animation
    const words = heading.innerText.split(/\s+/);
    heading.innerHTML = words
      .map(w => `<span class="word-wrap"><span class="word">${w}</span></span>`)
      .join(' ');

    gsap.from(heading.querySelectorAll('.word'), {
      scrollTrigger: {
        trigger: heading,
        start: 'top 85%',
        once: true
      },
      y: '100%',
      opacity: 0,
      duration: 0.55,
      stagger: 0.06,
      ease: 'power2.out'
    });
  });

  /* ── Cards / grid items ── */
  const cardSelectors = [
    '.overview-card',
    '.process-step',
    '.service-card',
    '.pricing-card',
    '.why-card',
    '.value-card',
    '.testimonial-card',
    '.pricing-model-card',
    '.market-card'
  ];

  cardSelectors.forEach(sel => {
    const cards = gsap.utils.toArray(sel);
    if (!cards.length) return;

    // Group by parent to stagger siblings together
    const byParent = new Map();
    cards.forEach(card => {
      const key = card.parentElement;
      if (!byParent.has(key)) byParent.set(key, []);
      byParent.get(key).push(card);
    });

    byParent.forEach((group, parent) => {
      gsap.from(group, {
        scrollTrigger: {
          trigger: parent,
          start: 'top 80%',
          once: true
        },
        opacity: 0,
        y: 30,
        duration: 0.6,
        stagger: 0.12,
        ease: 'power2.out',
        willChange: 'transform, opacity'
      });
    });
  });

  /* ── Parallax on hero decorative blobs ── */
  gsap.utils.toArray('[data-speed]').forEach(el => {
    const speed = parseFloat(el.dataset.speed) || 0.5;
    gsap.to(el, {
      scrollTrigger: {
        trigger: el.closest('section') || el,
        start: 'top bottom',
        end: 'bottom top',
        scrub: true
      },
      y: () => (ScrollTrigger.maxScroll(window) * speed * 0.3),
      ease: 'none'
    });
  });

})();

/* ─────────────────────────────────────────
   2C — MOBILE FULLPAGE SWIPE
   ───────────────────────────────────────── */

(function initFullpageSwipe() {
  if (window.innerWidth > 768) return;

  // Only run on index.html (has #hero)
  if (!document.querySelector('#hero')) return;

  const slides = Array.from(
    document.querySelectorAll('section, footer.site-footer')
  ).filter(el => el.offsetParent !== null || el.tagName === 'FOOTER');

  if (slides.length < 2) return;

  /* Build container */
  const container = document.createElement('div');
  container.id = 'fullpage-container';

  /* Move all slides into container */
  const firstSlide = slides[0];
  firstSlide.parentNode.insertBefore(container, firstSlide);
  slides.forEach(slide => {
    slide.classList.add('fp-slide');
    container.appendChild(slide);
  });

  /* Styles applied via JS (complement to CSS) */
  container.style.cssText = `
    position: fixed;
    top: 0; left: 0;
    width: 100%; height: 100vh;
    overflow: hidden;
    z-index: 1;
    transition: transform 0.6s cubic-bezier(0.77,0,0.175,1);
  `;

  slides.forEach(slide => {
    slide.style.cssText = `
      position: absolute;
      width: 100%;
      height: 100vh;
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
    `;
  });

  /* Position each slide */
  function positionSlides() {
    slides.forEach((slide, i) => {
      slide.style.top = `${i * 100}vh`;
    });
  }
  positionSlides();

  /* Ensure nav stays above fullpage */
  const nav = document.querySelector('nav');
  const navMobile = document.getElementById('nav-mobile');
  if (nav) nav.style.zIndex = '9999';
  if (navMobile) navMobile.style.zIndex = '9998';

  /* State */
  let currentSlide = 0;
  let isAnimating = false;

  /* Navigation dots */
  const dotsContainer = document.createElement('div');
  dotsContainer.id = 'slide-dots';
  document.body.appendChild(dotsContainer);

  const dots = slides.map((_, i) => {
    const dot = document.createElement('button');
    dot.className = 'dot' + (i === 0 ? ' active' : '');
    dot.setAttribute('aria-label', `Go to section ${i + 1}`);
    dot.addEventListener('click', () => goToSlide(i));
    dotsContainer.appendChild(dot);
    return dot;
  });

  function goToSlide(index) {
    if (index < 0 || index >= slides.length || isAnimating) return;
    isAnimating = true;
    currentSlide = index;

    container.style.transform = `translateY(-${index * 100}vh)`;

    dots.forEach((d, i) => d.classList.toggle('active', i === index));

    setTimeout(() => { isAnimating = false; }, 650);
  }

  /* Touch swipe detection */
  let touchStartY = 0;
  let touchStartTime = 0;

  document.addEventListener('touchstart', e => {
    touchStartY = e.touches[0].clientY;
    touchStartTime = Date.now();
  }, { passive: true });

  document.addEventListener('touchend', e => {
    const deltaY = touchStartY - e.changedTouches[0].clientY;
    const deltaTime = Date.now() - touchStartTime;

    // Require at least 50px swipe within 400ms
    if (Math.abs(deltaY) < 50 || deltaTime > 400) return;

    // Check if the current slide's content is scrolled — allow internal scroll first
    const activeSlide = slides[currentSlide];
    const scrollTop = activeSlide.scrollTop;
    const maxScroll = activeSlide.scrollHeight - activeSlide.clientHeight;

    if (deltaY > 0) {
      // Swipe up — go to next slide only if at bottom of current slide
      if (scrollTop < maxScroll - 2) return;
      goToSlide(currentSlide + 1);
    } else {
      // Swipe down — go to prev slide only if at top of current slide
      if (scrollTop > 2) return;
      goToSlide(currentSlide - 1);
    }
  }, { passive: true });

  /* Keyboard navigation */
  document.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown') { e.preventDefault(); goToSlide(currentSlide + 1); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); goToSlide(currentSlide - 1); }
  });

  /* Restore normal flow on desktop resize */
  window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
      container.style.cssText = '';
      slides.forEach(slide => {
        slide.style.cssText = '';
        slide.classList.remove('fp-slide');
        container.parentNode.insertBefore(slide, container);
      });
      container.remove();
      dotsContainer.remove();
    }
  });

})();

/* ─────────────────────────────────────────
   2E — CURSOR GLOW (DESKTOP ONLY)
   ───────────────────────────────────────── */

(function initCursorGlow() {
  if (prefersReducedMotion) return;
  if (!window.matchMedia('(hover: hover)').matches) return;

  const glow = document.createElement('div');
  glow.id = 'cursor-glow';
  document.body.appendChild(glow);

  let mouseX = -500;
  let mouseY = -500;
  let currentX = -500;
  let currentY = -500;
  let rafId;

  document.addEventListener('mousemove', e => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  function animateGlow() {
    // Lag factor — smooth follow
    currentX += (mouseX - currentX) * 0.08;
    currentY += (mouseY - currentY) * 0.08;
    glow.style.transform = `translate(${currentX - 150}px, ${currentY - 150}px)`;
    rafId = requestAnimationFrame(animateGlow);
  }

  animateGlow();

  // Pause when tab is hidden
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(rafId);
    } else {
      animateGlow();
    }
  });

})();
