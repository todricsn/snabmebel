(() => {
  const header = document.querySelector('header');
  if (!header) return;
  const measureHeader = () => document.documentElement.style.setProperty('--header-height', `${header.offsetHeight}px`);
  measureHeader();
  new ResizeObserver(measureHeader).observe(header);
  const sentinel = document.createElement('span');
  sentinel.className = 'header-sentinel';
  sentinel.setAttribute('aria-hidden', 'true');
  header.before(sentinel);
  new IntersectionObserver(([entry]) => header.classList.toggle('is-scrolled', !entry.isIntersecting)).observe(sentinel);

  if (!window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);
  gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
    const progress = document.createElement('div');
    progress.className = 'scroll-progress';
    progress.setAttribute('aria-hidden', 'true');
    header.append(progress);
    ScrollTrigger.create({ start: 0, end: 'max', onUpdate: self => { progress.style.transform = `scaleX(${self.progress})`; } });
    const hero = document.querySelector('.hero');
    if (hero) {
      gsap.from(hero.querySelectorAll('.hero-copy > *, .hero-media'), {
        y: 22, opacity: .65, duration: .9, stagger: .09, ease: 'power3.out', clearProps: 'transform,opacity'
      });
    }
    // Keep scrolled content opaque: a loading or script failure must never conceal it.
    document.querySelectorAll('main > section').forEach(section => {
      const targets = section.querySelectorAll(':scope > h2, :scope > p, .card > .photo, .card > h3, .facts > div, .gallery > .photo, :scope > form');
      if (!targets.length) return;
      gsap.from(targets, {
        y: 24, duration: .85, stagger: { amount: .22 }, ease: 'power3.out', clearProps: 'transform',
        scrollTrigger: { trigger: section, start: 'top 88%', once: true }
      });
    });
    const refresh = () => ScrollTrigger.refresh();
    document.fonts.ready.then(refresh);
    window.addEventListener('load', refresh, { once: true });
    return () => { progress.remove(); window.removeEventListener('load', refresh); };
  });
})();
