(() => {
  const body = document.body, html = document.documentElement, g = window.gsap, st = window.ScrollTrigger;
  if (!body || body.dataset.motionEngine) return;
  body.dataset.motionEngine = 'gsap-scrolltrigger-v2';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const clearProps = 'transform,opacity,visibility,willChange,transition,strokeDasharray,strokeDashoffset';
  const changed = new Set(), scenes = [], roots = new Map();
  const overlay = document.querySelector('.site-intro');
  let intro, heroScene, introActive = html.classList.contains('motion-intro');
  const skipEvents = ['wheel', 'touchstart', 'keydown', 'pointerdown'];
  function clear(nodes) {
    if (!nodes.length) return;
    try { g?.set(nodes, { clearProps }); } catch {}
    nodes.forEach(node => {
      ['transform', 'opacity', 'visibility', 'will-change', 'transition', 'stroke-dasharray', 'stroke-dashoffset'].forEach(prop => node.style.removeProperty(prop));
      changed.delete(node);
    });
  }
  function finish(scene) {
    scene.done = true;
    scene.trigger?.kill();
    try { scene.timeline?.kill(); } catch {}
    scene.timeline = null;
    clear(scene.targets);
  }
  function dismissIntro(skipHero = false) {
    if (!introActive) return;
    introActive = false;
    try { intro?.kill(); } catch {}
    clearTimeout(window.__snabMotionFallback);
    html.classList.remove('motion-intro');
    clear(overlay ? [overlay, ...overlay.querySelectorAll('svg,path,.site-intro-mark')] : []);
    try { sessionStorage.setItem('snabmebel-intro-v1', '1'); } catch {}
    skipEvents.forEach(type => window.removeEventListener(type, skipIntro, true));
    if (skipHero && heroScene) finish(heroScene);
  }
  function skipIntro() { dismissIntro(true); }
  function stopAll(state) {
    scenes.forEach(finish);
    dismissIntro(true);
    html.classList.remove('motion-intro');
    clearTimeout(window.__snabMotionFallback);
    clear([...changed]);
    body.dataset.motionState = state;
  }
  window.addEventListener('pageshow', event => { if (event.persisted) stopAll('restored'); });
  reduce.addEventListener('change', () => { if (reduce.matches) stopAll('reduced'); });
  if (!g || !st || reduce.matches) { stopAll(reduce.matches ? 'reduced' : 'fallback'); return; }
  try {
    g.registerPlugin(st);
    const main = document.querySelector('main');
    if (!main) { stopAll('fallback'); return; }
    const hero = main.querySelector('.hero,.service-hero,.page-intro');
    const sceneSelector = 'main section,main article,main figure,main details,main .section-head,main .intro,main .entry,main .builder-visual,main .controls,main .materials,main .example-row,main .detail-hero,main .detail-copy,main .detail-empty,main .page-columns>div,main .form-heading,.site-footer-callout,.site-footer-brand,.site-footer-catalog,.site-footer-services,.site-footer-contact';
    const leafSelector = 'h1,h2,h3,p,li,img,summary,.sample-plate,.model-spec,.btn,.text-button,.detail-related>a,.related>a,.company-related>a,.contact-related>a,.contact-channel-link,.site-footer-nav>a,.site-footer-phone,.site-telegram';
    function allowed(node) {
      if (node.closest('header,.mobile-bar,.site-intro,dialog,[hidden],#wall,#summary-rows,.stats,.form-result,.plan-note,.crumbs')) return false;
      if (node.matches('img') && node.closest('.site-logo,.contact-icon,.detail-contact-icon')) return false;
      if (node.closest('.lead-form') && !node.closest('.form-heading')) return false;
      if (node.closest('.controls') && !node.matches('h3')) return false;
      const closed = node.closest('details:not([open])');
      return (!closed || node.matches('summary')) && node.getClientRects().length > 0;
    }
    const footer = document.querySelector('.site-footer');
    const pool = [...new Set([...main.querySelectorAll(leafSelector), ...(footer ? footer.querySelectorAll(leafSelector) : [])])].filter(allowed);
    const ancestors = new Set();
    pool.forEach(node => { for (let parent = node.parentElement; parent; parent = parent.parentElement) ancestors.add(parent); });
    pool.filter(node => !ancestors.has(node)).forEach(node => {
      const root = hero?.contains(node) ? hero : node.closest(sceneSelector);
      if (!root) return;
      let scene = roots.get(root);
      if (!scene) { scene = { root, targets: [], done: false }; roots.set(root, scene); scenes.push(scene); }
      scene.targets.push(node);
    });
    heroScene = roots.get(hero);
    body.dataset.motionScenes = String(scenes.length);
    body.dataset.motionTargets = String(scenes.reduce((count, scene) => count + scene.targets.length, 0));
    function reveal(scene) {
      if (scene.done || scene.timeline) return;
      if (reduce.matches || scene.root.contains(document.activeElement)) { finish(scene); return; }
      // Late callbacks must never move content the visitor is already reading.
      if (scene !== heroScene && scene.root.getBoundingClientRect().top < window.innerHeight - 40) { finish(scene); return; }
      const targets = scene.targets.filter(node => allowed(node) && node.getBoundingClientRect().bottom > 0);
      if (!targets.length) { finish(scene); return; }
      const headings = targets.filter(node => node.matches('h1'));
      const media = targets.filter(node => node.matches('img,.sample-plate'));
      const copy = targets.filter(node => !headings.includes(node) && !media.includes(node));
      const coveredHero = scene === heroScene && introActive;
      targets.forEach(node => changed.add(node));
      // Scroll reveals keep opacity untouched; only the loader may cover a fade.
      g.set(targets, { transition: 'none', y: 10, force3D: false, ...(coveredHero ? { opacity: 0 } : {}) });
      const end = { y: 0, duration: .5, force3D: false, ...(coveredHero ? { opacity: 1 } : {}) };
      const tl = scene.timeline = g.timeline({ paused: true, defaults: { ease: 'power3.out' }, onComplete: () => finish(scene) });
      if (headings.length) tl.to(headings, end, 0);
      if (copy.length) tl.to(copy, { ...end, stagger: { amount: Math.min(.1, Math.max(0, copy.length - 1) * .03) } }, headings.length ? .04 : 0);
      if (media.length) tl.to(media, end, .04);
      tl.play();
    }
    function finishWithin(node) {
      if (!node?.contains) return;
      scenes.forEach(scene => { if (scene.root.contains(node) || node.contains(scene.root)) finish(scene); });
    }
    ['focusin', 'pointerdown', 'input', 'change', 'reset'].forEach(type => document.addEventListener(type, event => {
      if (introActive) skipIntro();
      const target = event.target;
      finishWithin(target?.closest?.('.lead-form,.builder,#catalog-filters') || target);
      if (target?.closest?.('#catalog-filters')) scenes.forEach(scene => { if (scene.root.matches('.model-card')) finish(scene); });
    }, true));
    document.addEventListener('click', event => {
      const link = event.target?.closest?.('a[href^="#"]');
      if (!link) return;
      const target = document.getElementById(link.getAttribute('href').slice(1));
      finishWithin(target);
    }, true);
    window.addEventListener('hashchange', () => { dismissIntro(true); finishWithin(document.getElementById(location.hash.slice(1))); });
    scenes.forEach(scene => {
      if (scene === heroScene) return;
      if (scene.root.getBoundingClientRect().top < window.innerHeight) { finish(scene); return; }
      scene.trigger = st.create({
        trigger: scene.root, start: 'top bottom+=80', once: true,
        onEnter: () => { try { reveal(scene); } catch { stopAll('fallback'); } }
      });
      if (scene.done) scene.trigger.kill();
    });
    document.fonts?.ready.then(() => st.refresh());
    window.addEventListener('load', () => st.refresh(), { once: true });
    document.addEventListener('toggle', event => { if (event.target.matches('main details')) st.refresh(); }, true);
    document.getElementById('catalog-filters')?.addEventListener('change', () => st.refresh());
    document.getElementById('catalog-filters')?.addEventListener('reset', () => requestAnimationFrame(() => st.refresh()));
    if (location.hash) finishWithin(document.getElementById(location.hash.slice(1)));
    const showHero = heroScene && !heroScene.done && hero.getBoundingClientRect().bottom > 0 && window.scrollY < 4;
    if (!showHero && heroScene) finish(heroScene);
    if (introActive && overlay && !location.hash && showHero) {
      const paths = [...overlay.querySelectorAll('.site-intro-outline path')];
      const outline = overlay.querySelector('.site-intro-outline');
      const logo = overlay.querySelector('.site-intro-logo');
      changed.add(overlay); paths.forEach(node => changed.add(node)); if (outline) changed.add(outline); if (logo) changed.add(logo);
      g.set([overlay, ...paths, ...(outline ? [outline] : []), ...(logo ? [logo] : [])], { transition: 'none', willChange: 'transform,opacity' });
      intro = g.timeline({ onComplete: () => dismissIntro(false) });
      if (paths.length) intro.fromTo(paths, { strokeDasharray: 1, strokeDashoffset: 1 }, { strokeDashoffset: 0, autoRound: false, duration: .65, stagger: { amount: Math.min(.15, Math.max(0, paths.length - 1) * .05) }, ease: 'power2.inOut' }, 0);
      if (outline) intro.to(outline, { opacity: 0, duration: .2, ease: 'power2.out' }, .66);
      if (logo) intro.fromTo(logo, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: .35, ease: 'power3.out' }, .72);
      intro.to(overlay, { yPercent: -100, duration: .55, ease: 'power3.inOut' }, .98);
      intro.call(() => { try { if (heroScene && !heroScene.done) reveal(heroScene); } catch { stopAll('fallback'); } }, [], 1.02);
      skipEvents.forEach(type => window.addEventListener(type, skipIntro, { capture: true, passive: true }));
    } else {
      dismissIntro(false);
      if (showHero) reveal(heroScene);
    }
    body.dataset.motionState = 'ready';
  } catch { stopAll('fallback'); }
})();
